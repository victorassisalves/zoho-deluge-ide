// Firebase Configuration
var firebaseConfig = {
  apiKey: "AIzaSyAw7uHwBNip9AMCV0StlxdBs6iVsU7hgJo",
  authDomain: "draken-productivity-hub.firebaseapp.com",
  projectId: "draken-productivity-hub",
  storageBucket: "draken-productivity-hub.firebasestorage.app",
  messagingSenderId: "82588074929",
  appId: "1:82588074929:web:d66178d668f2df6b3e3390",
  measurementId: "G-RPCJN8Y1K9"
};

// Initialize Firebase
if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    console.log("[ZohoIDE] Firebase Initialized");
} else {
    console.error("[ZohoIDE] Firebase SDK not found");
}
