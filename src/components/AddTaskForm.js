import { useState } from "react";

function AddTaskForm({ onAdd, users = [], userData }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, status, assignedTo || null, comment.trim() || null);
    setTitle("");
    setStatus("todo");
    setAssignedTo("");
    setComment("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 max-w-md mx-auto"
    >
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
