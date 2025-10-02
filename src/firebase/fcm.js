// src/firebase/fcm.js
import { messaging, db } from "./firebase";
import { getToken, deleteToken } from "firebase/messaging";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

const VAPID_KEY =
  "BJg9ixmBhfNrQB8zhAIXhRjOdRDkXRqpW6TjzV88ct4ovB8zrzLWB6r3cOMK7GxTC2eYGVOw9fhtO20SYkge1iA";

/**
 * Requests notification permission, gets the FCM token, and stores it in Firestore
 */
export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const swRegistration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) return;

    const tokensRef = collection(db, "users", userId, "tokens");
    const existing = await getDocs(tokensRef);
    const alreadyExists = existing.docs.some((docSnap) => docSnap.id === token);

    if (!alreadyExists) {
      await setDoc(doc(tokensRef, token), {
        createdAt: Date.now(),
        userAgent: navigator.userAgent,
      });
    }
  } catch (err) {
    console.error("🔥 Error during notification setup:", err);
  }
};

/**
 * Deletes the current device's token from both FCM and Firestore
 */
export const deleteCurrentToken = async (userId) => {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) return;

    await deleteToken(messaging);
    await deleteDoc(doc(db, "users", userId, "tokens", token));
  } catch (err) {
    console.error("🔥 Error deleting FCM token:", err);
  }
};

/**
 * Retrieves the current device token (if available)
 */
export const getCurrentDeviceToken = async () => {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    return await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
  } catch (err) {
    console.error("🔥 Error retrieving token:", err);
    return null;
  }
};
