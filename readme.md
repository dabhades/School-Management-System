# Tuition/School Management System

A comprehensive, real-time web application to manage tuition center operations natively using HTML, CSS, JavaScript, and Firebase. This system enables administrators to effortlessly manage students, teachers, fees, attendance, and analytics.

## Features ✨
- **Dashboard & Analytics:** View real-time visual statistics of students, teachers, and total fees collected.
- **Student & Teacher Management:** Add, edit, bulk-import, and track data.
- **Attendance System:** Easy tracking of daily attendance with downloadable reports and a visual calendar.
- **Fees Management:** Handle fee structures, add payments, assign fees to classes, and identify unpaid/partial balances.
- **Authentication:** Secure admin login using Firebase Authentication.
- **Export & Import:** Export data tables to CSV across the system and import large batches of users.

## Tech Stack 🛠️
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+). No complex build processes or frameworks.
- **Backend & Database**: Firebase Firestore (NoSQL), Firebase Authentication, Firebase Cloud Functions.
- **Libraries**: Chart.js for analytics, html2pdf.js for receipts and reports.

## Setup Instructions 🚀

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (if running locally or deploying via Firebase CLI).
- A [Firebase Account](https://firebase.google.com/).

### 2. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database**, **Authentication** (Email/Password), and optionally **Cloud Functions** & **Hosting**.
3. In Authentication, add your Admin Email and Password manually through the Firebase console to use for login.
4. Go to **Project Settings** > **General** > **Your apps** and add a **Web App**.
5. Copy your Firebase config object and paste the actual values into `src/js/firebase-config.js`:
    ```javascript
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID",
        measurementId: "YOUR_MEASUREMENT_ID"
    };
    ```

### 3. Security Rules (Firestore)
Set up proper rules to restrict access. Example:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Only allow read/write IF the user is authenticated
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Running Locally
Simply open the `index.html` file using a local web server (such as VS Code Live Server). 
```bash
# Example using serve
npx serve .
```

### 5. Deployment (Firebase Hosting)
This project is configured out-of-the-box for Firebase Hosting.
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to your Firebase account: `firebase login`
3. Link your project ID: `firebase use YOUR_PROJECT_ID`
4. Deploy: `firebase deploy --only hosting`

## Security Practices Recommended 🛡️
- **Restrict API Key**: Make sure your Firebase `apiKey` is restricted in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) to only accept requests from your production URLs (e.g., `your-app.web.app` and `localhost`).
- **Do not commit API Keys**: If you are making this repository public, ensure you never commit your production API keys. The `firebase-config.js` should only contain placeholder values in the repository.

---

Developed with ❤️ by Sopan Dabhade 