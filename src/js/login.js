
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    } else {
        console.error("Firebase or firebaseConfig is not defined. Make sure firebase-app.js and firebase-config.js are loaded.");
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');
    const loginBtn = document.getElementById('loginBtn');

    // Redirect if user is already logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'index.html';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Hide error message
            errorMessage.classList.remove('show');
            
            // Show loading
            loading.style.display = 'block';
            loginBtn.disabled = true;

            try {
                // Sign in with Firebase
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                
                console.log('Login successful:', userCredential.user.email);
                
                // Redirect to admin dashboard
                window.location.href = 'index.html';
                
            } catch (error) {
                // Hide loading
                loading.style.display = 'none';
                loginBtn.disabled = false;

                // Show error message
                let errorMsg = 'Login failed. Please try again.';
                
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    errorMsg = 'No account found with this email or incorrect password.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMsg = 'Incorrect password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = 'Invalid email format.';
                }

                errorMessage.textContent = errorMsg;
                errorMessage.classList.add('show');
            }
        });
    }
});
