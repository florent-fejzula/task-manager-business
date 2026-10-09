import { useState } from "react";

// Firestore only confirms a save once the server has it, so a save that is
// still pending after this long usually means the connection dropped
const SLOW_SAVE_MS = 8000;

function saveErrorMessage(err) {
  if (err?.code === "permission-denied") {
    return "Not saved: you don't have permission to add this task.";
  }
  if (err?.code === "unavailable" || !navigator.onLine) {
    return "Not saved: no connection. Check your internet and try again.";
  }
  return `Not saved: ${err?.message || "something went wrong"}. Please try again.`;
}

function AddTaskForm({ onAdd, users = [], userData }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState("one-time");
  const [saving, setSaving] = useState(false);
  const [slowSave, setSlowSave] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !title.trim()) return;

    setSaving(true);
    setError("");
    const slowTimer = setTimeout(() => setSlowSave(true), SLOW_SAVE_MS);
    try {
      await onAdd(title, status, assignedTo || null, comment.trim() || null, type);
      // Cleared only once it is really saved, so a failed save keeps what was typed
      setTitle("");
      setStatus("todo");
      setAssignedTo("");
      setComment("");
    } catch (err) {
      setError(saveErrorMessage(err));
    } finally {
      clearTimeout(slowTimer);
      setSaving(false);
      setSlowSave(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 max-w-md mx-auto">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
      />

      <div className="grid grid-cols-2 gap-1 rounded-md bg-gray-100 p-1 text-sm">
        {[
          ["one-time", "One-time"],
          ["fixed", "Fixed (always do)"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`rounded py-1.5 ${
              type === value ? "bg-white shadow-sm font-medium" : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {type === "one-time" && (
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
      )}

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

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-dark transition disabled:opacity-60 disabled:cursor-wait"
      >
        {saving ? "Saving..." : "Add Task"}
      </button>

      {slowSave && (
        <p role="status" className="text-sm text-amber-700">
          Still saving... check your connection and keep the app open until
          this finishes.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}
    </form>
  );
}

export default AddTaskForm;
