/* eslint-disable comma-dangle */
/* eslint-disable object-curly-spacing */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */
/* eslint-disable max-len */

const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { fetchUserTokens } = require("./utils/fetchUserTokens");

// ✅ Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// ✅ Manual test push (call via ?userId=UID)
exports.testPush = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).send("❌ Missing userId");

    const tokens = await fetchUserTokens(userId);
    if (tokens.length === 0) return res.status(404).send("❌ No tokens found");

    const payload = {
      notification: {
        title: "🚀 Test Push",
        body: `Test push notification for user ${userId}`,
      },
    };

    await messaging.sendEachForMulticast({ tokens, ...payload });
    return res.status(200).send("✅ Notification sent!");
  } catch (error) {
    return res.status(500).send(`🔥 Error: ${error.message}`);
  }
});

exports.send15MinuteNotification = onSchedule("every 1 minutes", async () => {
  const now = Date.now();
  const snapshot = await db.collectionGroup("tasks").get();
  const promises = [];

  snapshot.forEach((doc) => {
    const task = doc.data();
    const { timerStart, timerDuration, notified15min } = task;

    if (!timerStart || !timerDuration || notified15min) return;

    const timeLeft = timerStart + timerDuration - now;

    if (timeLeft < 15 * 60 * 1000 && timeLeft > 13 * 60 * 1000) {
      const parentPath = doc.ref.parent.parent;
      if (!parentPath) return;

      const userId = parentPath.id;

      promises.push(
        db
          .collection("users")
          .doc(userId)
          .collection("tokens")
          .get()
          .then((tokenSnap) => {
            const tokens = tokenSnap.docs
              .map((t) => t.id.split(":")[1])
              .filter(Boolean);

            if (tokens.length === 0) return;

            const message = {
              tokens,
              notification: {
                title: "⏰ 15 Minutes Left!",
                body: `Your task "${task.title}" is running out of time.`,
              },
            };

            return messaging
              .sendEachForMulticast(message)
              .then(() => doc.ref.update({ notified15min: true }));
          })
      );
    }
  });

  await Promise.all(promises);
  return null;
});

// ✅ Task assignment notification
exports.notifyTaskAssignment = onDocumentWritten(
  {
    document: "tasks/{taskId}",
    region: "us-central1",
  },
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after) return null;

    const assignedNow = after.assignedTo;
    const assignedBefore = before?.assignedTo;

    if (!assignedNow || assignedNow === assignedBefore) return null;

    const tokens = await fetchUserTokens(assignedNow);
    if (tokens.length === 0) return null;

    const message = {
      tokens,
      notification: {
        title: "📌 New Task Assigned",
        body: `You've been assigned: "${after.title || "New Task"}"`,
      },
    };

    try {
      await messaging.sendEachForMulticast(message);
    } catch (err) {
      console.error("🔥 Error sending notification:", err);
    }

    return null;
  }
);

// ✅ Scheduled cleanup of invalid FCM tokens
exports.cleanupInvalidTokens = onSchedule("every 5 minutes", async () => {
  const usersSnap = await db.collection("users").get();
  const promises = [];

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const tokensSnap = await db
      .collection("users")
      .doc(userId)
      .collection("tokens")
      .get();

    for (const tokenDoc of tokensSnap.docs) {
      const token = tokenDoc.id;
      const message = {
        tokens: [token],
        notification: { ping: "1" },
      };

      promises.push(
        messaging.sendEachForMulticast(message).then((res) => {
          const result = res.responses[0];
          if (!result.success) {
            // Token is invalid or unregistered — delete it
            return tokenDoc.ref.delete();
          }
        })
      );
    }
  }

  await Promise.all(promises);
  return null;
});
