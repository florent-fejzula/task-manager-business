/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// Firebase core + messaging compat imports
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyBgVhtsbi_jAtcehmXSK5xUccQYKv8Qy_o",
  authDomain: "task-manager-business.firebaseapp.com",
  projectId: "task-manager-business",
  storageBucket: "task-manager-business.appspot.com",
  messagingSenderId: "427957473188",
  appId: "1:427957473188:web:a8f7da85df7e3265dd3b31",
});

// Init messaging
const messaging = firebase.messaging();

// Handle Firebase background messages
messaging.onBackgroundMessage(({ notification }) => {
  if (!notification) return;
  self.registration.showNotification(notification.title || "📌 Task Manager", {
    body: notification.body || "",
    icon: "/icon-192.png",
  });
});

// Fallback for generic push events (non-Firebase or malformed)
self.addEventListener("push", (event) => {
  let title = "📌 Task Manager";
  let options = {
    body: "New notification",
    icon: "/icon-192.png",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.notification) {
        title = data.notification.title || title;
        options.body = data.notification.body || options.body;
      }
    } catch (_) {
      // silently skip
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Lifecycle
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
