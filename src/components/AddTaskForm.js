import { useState } from "react";

function AddTaskForm({ onAdd, users = [], userData }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [comment, setComment] = useState("");

  // 🔁 Recurring fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState(7);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, status, assignedTo || null, comment.trim() || null);
    setTitle("");
    setStatus("todo");
    setAssignedTo("");
    setComment("");
    setIsRecurring(false);
    setIntervalDays(7);
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
        className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-dark transition"
      >
        Add Task
      </button>
    </form>
  );
}

export default AddTaskForm;
