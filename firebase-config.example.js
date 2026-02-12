// Firebase Configuration
// Replace these values with your Firebase project credentials
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    console.log("[ZohoIDE] Firebase Initialized");
} else {
    console.error("[ZohoIDE] Firebase SDK not found");
}
