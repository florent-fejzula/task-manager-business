/* eslint-disable linebreak-style */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// ✅ Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Recurring tasks: spawn new occurrence every X days (title gets date)
exports.handleRecurringTasks = onSchedule("every day 00:05", async () => {
  const nowMs = Date.now();
  const nowDate = new Date();

  const formatTitleDate = (d) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }); // e.g. "Oct 3, 2025"

  // Only check tasks that are marked recurring
  const snap = await db
      .collection("tasks")
      .where("recurring", "==", true)
      .get();

  const jobs = [];

  for (const docSnap of snap.docs) {
    const task = docSnap.data();

    // Guard: only spawn if the template task was completed
    if (task.status !== "done") continue;

    const intervalDays = Number(task.recurringInterval) || 0;
    if (intervalDays <= 0) continue;

    // Get last occurrence time in ms
    const lastRaw =
      task.lastOccurrence ||
      (task.createdAt?.toMillis ? task.createdAt.toMillis() : task.createdAt);
    const lastMs = typeof lastRaw === "number" ? lastRaw : null;
    if (!lastMs) continue;

    const nextDueMs = lastMs + intervalDays * 24 * 60 * 60 * 1000;

    if (nowMs >= nextDueMs) {
      // Create a new occurrence (NOT recurring itself)
      const newDoc = {
        title: `${task.title} (${formatTitleDate(nowDate)})`,
        status: "todo",
        // each occurrence gets completed and closed, unlike a fixed task
        type: "one-time",
        priority: task.priority || "medium",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        subTasks: Array.isArray(task.subTasks) ?
          task.subTasks.map((s) => ({
            title: s.title,
            done: false,
            inProgress: false,
          })) :
          [],
        assignedTo: task.assignedTo || null,
        createdBy: task.createdBy || null,
        comment: task.comment || "",
        // timer defaults reset
        timerStart: null,
        timerDuration: null,
        // this occurrence is NOT a template
        recurring: false,
        recurringInterval: null,
        lastOccurrence: null,
      };

      jobs.push(db.collection("tasks").add(newDoc));
      jobs.push(
          docSnap.ref.update({
            lastOccurrence: nowMs, // move the schedule forward
          }),
      );
    }
  }

  await Promise.all(jobs);
  console.log(`✅ Recurring scheduler: processed ${jobs.length} writes.`);
  return null;
});
