/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// ✅ Firebase imports for background messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// ✅ Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyBgVhtsbi_jAtcehmXSK5xUccQYKv8Qy_o",
  authDomain: "task-manager-business.firebaseapp.com",
  projectId: "task-manager-business",
  storageBucket: "task-manager-business.firebasestorage.app",
  messagingSenderId: "427957473188",
  appId: "1:427957473188:web:a8f7da85df7e3265dd3b31"
});

// ✅ Initialize messaging
const messaging = firebase.messaging();

// ✅ Handle background FCM messages
messaging.onBackgroundMessage(function (payload) {
  console.log("[sw.js] Background message received:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192.png",
  };

  console.log("🎉 Showing notification popup");
  console.log("🔥 ACTIVE SERVICE WORKER: sw.js loaded");
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle service worker lifecycle events
self.addEventListener("install", (event) => {
  console.log("✅ SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ SW activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("⏭ SKIP_WAITING received");
    self.skipWaiting();
  }
});
