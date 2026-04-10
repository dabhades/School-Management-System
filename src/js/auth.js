// Authentication related functions

let currentUser = null;
let currentUserRole = null; // e.g. 'admin' | 'cashier' | 'viewer'

// Safe toggle for admin-only UI elements
function toggleAuthUI(user, role) {
    // Show/hide elements that require admin role using CSS class 'requires-admin'
    document.querySelectorAll('.requires-admin').forEach(el => {
        if (role === 'admin') el.style.display = '';
        else el.style.display = 'none';
    });
}

async function initAuth() {
    const authButton = document.getElementById('authButton');

    function handleAuthButtonClick(e) {
        try { if (e && e.preventDefault) e.preventDefault(); } catch (_) { }

        // Custom Logout Modal Logic
        const logoutModal = document.getElementById('logoutModal');
        const confirmBtn = document.getElementById('confirmLogoutBtn');
        const cancelBtn = document.getElementById('cancelLogoutBtn');

        if (logoutModal) {
            logoutModal.style.display = 'block';

            // Handle confirm
            const handleConfirm = () => {
                if (firebase.auth().currentUser) {
                    firebase.auth().signOut()
                        .then(() => { window.location.href = 'login.html'; })
                        .catch(err => console.error("Logout failed:", err));
                }
                closeLogoutModal();
            };

            // Handle cancel
            const handleCancel = () => {
                closeLogoutModal();
            };

            // Close modal helper
            const closeLogoutModal = () => {
                logoutModal.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            // Close on outside click
            window.addEventListener('click', (event) => {
                if (event.target === logoutModal) {
                    closeLogoutModal();
                }
            });
        } else {
            // Fallback if modal not found
            const confirmed = window.confirm('Are you sure you want to log out?');
            if (!confirmed) return;

            if (firebase.auth().currentUser) {
                firebase.auth().signOut()
                    .then(() => { window.location.href = 'login.html'; })
                    .catch(err => console.error("Logout failed:", err));
            }
        }
    }

    if (authButton) {
        authButton.addEventListener('click', handleAuthButtonClick);
    } else {
        // Defensive fallback: delegate click events in case the button wasn't available
        console.warn('authButton not found during initAuth(); installing delegated handler');
        document.addEventListener('click', (e) => {
            const target = e.target || e.srcElement;
            if (!target) return;
            if (target.id === 'authButton' || target.matches && target.matches('#authButton')) {
                handleAuthButtonClick(e);
            }
        });
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            // Try to read role from custom claims first
            try {
                const idToken = await user.getIdTokenResult(true);
                currentUserRole = idToken.claims && idToken.claims.role ? idToken.claims.role : null;
            } catch (e) {
                console.warn('Failed to read id token claims', e);
            }

            // Fallback: read role from users collection
            if (!currentUserRole) {
                try {
                    if (typeof db !== 'undefined') {
                        const udoc = await db.collection('users').doc(user.uid).get();
                        if (udoc.exists) currentUserRole = udoc.data().role;
                    }
                } catch (e) { console.warn('Failed to read user role from Firestore', e); }
            }

            // Update UI
            if (authButton) authButton.textContent = 'Logout';
            toggleAuthUI(user, currentUserRole);

        } else {
            currentUser = null;
            currentUserRole = null;
            // User is not signed in. Redirect to the login page.
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });
}