/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */

// functions/utils/fetchUserTokens.js
const admin = require("firebase-admin");

// ✅ Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Fetch all FCM tokens for a given userId from Firestore.
 * @param {string} userId
 * @return {Promise<string[]>} Array of token strings
 */
async function fetchUserTokens(userId) {
  const tokenSnap = await db
      .collection("users")
      .doc(userId)
      .collection("tokens")
      .get();

  return tokenSnap.docs.map((doc) => doc.id).filter(Boolean);
}

module.exports = {fetchUserTokens};
