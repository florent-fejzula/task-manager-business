// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgVhtsbi_jAtcehmXSK5xUccQYKv8Qy_o",
  authDomain: "task-manager-business.firebaseapp.com",
  projectId: "task-manager-business",
  storageBucket: "task-manager-business.firebasestorage.app",
  messagingSenderId: "427957473188",
  appId: "1:427957473188:web:a8f7da85df7e3265dd3b31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Export
export { db, auth, messaging };
