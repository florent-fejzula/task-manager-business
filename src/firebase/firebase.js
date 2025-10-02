// src/firebase/firebase.js

// Core
import { initializeApp } from "firebase/app";

// Firestore
import {
  getFirestore,
  enableIndexedDbPersistence, // or enableMultiTabIndexedDbPersistence
} from "firebase/firestore";

// Auth
import { getAuth } from "firebase/auth";

// Messaging (PWA push)
import { getMessaging } from "firebase/messaging";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBgVhtsbi_jAtcehmXSK5xUccQYKv8Qy_o",
  authDomain: "task-manager-business.firebaseapp.com",
  projectId: "task-manager-business",
  storageBucket: "task-manager-business.firebasestorage.app",
  messagingSenderId: "427957473188",
  appId: "1:427957473188:web:a8f7da85df7e3265dd3b31",
};

// --- Initialize ---
const app = initializeApp(firebaseConfig);

// Services
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// --- Firestore Offline Persistence (cache) ---
// This makes reads instant from local cache and syncs in background.
enableIndexedDbPersistence(db).catch((e) => {
  if (e?.code === "failed-precondition") {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a time.
    console.warn("Firestore persistence not enabled: another tab is open.");
  } else if (e?.code === "unimplemented") {
    // The current browser does not support persistence
    console.warn("Firestore persistence not supported in this browser.");
  } else {
    console.warn("Firestore persistence error:", e);
  }
});

// Export
export { db, auth, messaging };
