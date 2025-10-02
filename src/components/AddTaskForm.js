import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

function AddTaskForm({ users = [], userData, onClose }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 Recurring fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState(7);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        status,
        priority: "medium",
        createdAt: serverTimestamp(),
        subTasks: [],
        assignedTo: assignedTo || currentUser.uid,
        createdBy: currentUser.uid,
        comment: comment.trim() || "",
        // 🔁 Recurring fields
        recurring: isRecurring,
        recurringInterval: isRecurring ? intervalDays : null,
        lastOccurrence: isRecurring ? Date.now() : null,
      });

      // Reset form
      setTitle("");
      setStatus("todo");
      setAssignedTo("");
      setComment("");
      setIsRecurring(false);
      setIntervalDays(7);

      // Optional: close form after success
      if (onClose) onClose();
    } catch (err) {
      console.error("Error adding task:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 max-w-md mx-auto">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="on-hold">On Hold</option>
        <option value="done">Closed</option>
      </select>

      {userData?.role === "manager" && (
        <>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
            required
          >
            <option value="">Assign to...</option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name}
              </option>
            ))}
          </select>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment for this task (visible to assignee)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
            rows={3}
          />
        </>
      )}

      {/* 🔁 Recurring UI */}
      <div className="border p-3 rounded-md">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <span className="text-sm font-medium">Make this task recurring</span>
        </label>

        {isRecurring && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm">Every</span>
            <input
              type="number"
              min="1"
              className="w-20 border px-2 py-1 rounded text-sm"
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
            />
            <span className="text-sm">days</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-dark transition disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

export default AddTaskForm;
