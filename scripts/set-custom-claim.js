/*
  Usage:
    - Install dependencies: `npm install firebase-admin`
    - Run with environment credentials (service account or ADC):
        node scripts/set-custom-claim.js <UID> <role>
    - Example: `node scripts/set-custom-claim.js XyzUid admin`

  This script sets the custom claim `role` on the specified user.
  It requires admin privileges: run it with a service account JSON set in
  the environment variable GOOGLE_APPLICATION_CREDENTIALS, or run on a host
  with gcloud auth application-default login configured.
*/

const admin = require('firebase-admin');
const path = require('path');

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node set-custom-claim.js <uid> <role>');
        process.exit(1);
    }
    const [uid, role] = args;

    // Initialize admin SDK. It will use ADC or GOOGLE_APPLICATION_CREDENTIALS.
    try {
        if (!admin.apps.length) admin.initializeApp();
    } catch (e) {
        console.error('Failed to initialize firebase-admin:', e);
        process.exit(1);
    }

    try {
        console.log(`Setting custom claim role=${role} for uid=${uid}`);
        await admin.auth().setCustomUserClaims(uid, { role });
        console.log('Custom claim set successfully. Note: users must refresh tokens (sign out/in) to see the new claim.');
    } catch (err) {
        console.error('Error setting custom claim:', err);
        process.exit(1);
    }
}

main();
