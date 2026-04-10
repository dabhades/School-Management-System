const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// HTTP endpoint to scan overdue fees and write reminder records (mock sending)
exports.sendOverdueReminders = functions.https.onRequest(async (req, res) => {
    try {
        // Optional secret header to prevent public access. Set via `firebase functions:config:set reminders.secret="VALUE"`
        const secret = functions.config().reminders && functions.config().reminders.secret;
        if (secret) {
            const header = req.get('x-functions-secret');
            if (!header || header !== secret) {
                res.status(403).send('Forbidden');
                return;
            }
        }
        const today = new Date().toISOString().split('T')[0];
        // Find fees with balance > 0 and dueDate < today
        const feesSnap = await db.collection('fees').get();
        const reminders = [];
        for (const doc of feesSnap.docs) {
            const f = doc.data();
            const paid = f.paidAmount ? Number(f.paidAmount) : 0;
            const total = f.amount ? Number(f.amount) : 0;
            const balance = Math.max(0, total - paid);
            if (balance <= 0) continue;
            const dueDate = f.dueDate || f.date;
            if (!dueDate) continue;
            if (new Date(dueDate) < new Date(today)) {
                // Create a reminder record (could be queued for SMS/email)
                const reminderRef = db.collection('feeReminders').doc();
                await reminderRef.set({ feeId: doc.id, studentId: f.studentId, amount: balance, dueDate, createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'pending' });
                reminders.push({ feeId: doc.id, studentId: f.studentId, amount: balance });
            }
        }
        res.json({ sent: reminders.length, details: reminders });
    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).send(error.message);
    }
});

// Scheduled example (run daily at 8:00 UTC) - uncomment and deploy with schedule
// Scheduled example (run daily at 8:00 UTC)
exports.scheduledReminderJob = functions.pubsub.schedule('0 8 * * *').onRun(async (context) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Query fees where balance > 0 and dueDate < today using a simple scan - for production add indexes and filters
        const feesSnap = await db.collection('fees').get();
        const reminders = [];
        for (const doc of feesSnap.docs) {
            const f = doc.data();
            const paid = f.paidAmount ? Number(f.paidAmount) : 0;
            const total = f.amount ? Number(f.amount) : 0;
            const balance = Math.max(0, total - paid);
            if (balance <= 0) continue;
            const dueDate = f.dueDate || f.date;
            if (!dueDate) continue;
            if (new Date(dueDate) < new Date(today)) {
                const reminderRef = db.collection('feeReminders').doc();
                await reminderRef.set({ feeId: doc.id, studentId: f.studentId, amount: balance, dueDate, createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'pending' });
                reminders.push({ feeId: doc.id, studentId: f.studentId, amount: balance });
            }
        }

        // Optionally send emails via SendGrid if configured
        const sendgridApiKey = functions.config().sendgrid?.key;
        if (sendgridApiKey) {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(sendgridApiKey);
            for (const r of reminders) {
                try {
                    // Fetch student/contact info
                    const sDoc = await db.collection('students').doc(r.studentId).get();
                    const s = sDoc.exists ? sDoc.data() : null;
                    const toEmail = s && s.parentEmail ? s.parentEmail : null;
                    if (!toEmail) continue;
                    const msg = {
                        to: toEmail,
                        from: functions.config().sendgrid.from || 'no-reply@example.com',
                        subject: `Fee reminder: Outstanding ₹${r.amount}`,
                        text: `Dear Parent,\n\nThis is a reminder that fee ${r.feeId} for ${s.name || r.studentId} has an outstanding amount of ₹${r.amount} due since ${r.dueDate}.\n\nPlease pay as soon as possible.`,
                    };
                    await sgMail.send(msg);
                    await db.collection('feeReminders').doc().set({ feeId: r.feeId, sentAt: admin.firestore.FieldValue.serverTimestamp(), status: 'sent' }, { merge: true });
                } catch (e) {
                    console.warn('SendGrid send failed for reminder', r, e.message || e);
                }
            }
        }

        console.log(`scheduledReminderJob: created ${reminders.length} reminders`);
        return null;
    } catch (error) {
        console.error('Error in scheduledReminderJob:', error);
        return null;
    }
});

// Callable function to log audit events from authenticated clients. Server validates auth.uid and writes
exports.logAuditEvent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Request not authenticated');
    }
    try {
        const performedBy = context.auth.uid;
        const entry = Object.assign({}, data, { performedBy, performedAt: admin.firestore.FieldValue.serverTimestamp() });
        await db.collection('auditLogs').add(entry);
        return { success: true };
    } catch (error) {
        console.error('Error writing audit log:', error);
        throw new functions.https.HttpsError('internal', 'Failed to write audit log');
    }
});
