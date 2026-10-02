import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";

function TaskCard({
  task,
  userData,
  userMap,
  onStatusChange,
  onSubTaskUpdate,
  collapseSubtasks,
  hideStatus = false,
}) {
  const [showDoneSubTasks, setShowDoneSubTasks] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubForm, setShowSubForm] = useState(false);

  useEffect(() => {
    if (typeof collapseSubtasks === "boolean") {
      setShowDoneSubTasks(collapseSubtasks);
    }
  }, [collapseSubtasks]);

  useEffect(() => {
    if (!task.timerStart || !task.timerDuration) {
      setTimeLeft(null);
      return;
    }

    const start =
      task.timerStart.toMillis?.() || new Date(task.timerStart).getTime();
    const duration = task.timerDuration;
    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = start + duration - now;
      setTimeLeft(remaining > 0 ? remaining : null);
    };

    updateRemainingTime(); // initial
    const interval = setInterval(updateRemainingTime, 60000); // every minute

    return () => clearInterval(interval);
  }, [task.timerStart, task.timerDuration]);

  const formatTimeLeft = (ms) => {
    const totalMins = Math.floor(ms / 60000);
    const days = Math.floor(totalMins / 1440); // 1440 mins in a day
    const hrs = Math.floor((totalMins % 1440) / 60);
    const mins = totalMins % 60;

    if (days > 0) {
      return `${days}d ${hrs}h`;
    } else if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
    } else {
      return `${mins}m`;
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { status: newStatus, type: "one-time" });
      onStatusChange(task.id, newStatus);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleToggleSubTask = async (index) => {
    const updated = [...(task.subTasks || [])];
    const sub = updated[index];

    if (!sub.done && !sub.inProgress) {
      sub.inProgress = true;
    } else if (!sub.done && sub.inProgress) {
      sub.done = true;
      sub.inProgress = false;
    } else {
      sub.done = false;
      sub.inProgress = false;
    }

    await updateDoc(doc(db, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
  };

  const handleDeleteSubTask = async (index) => {
    const updated = [...(task.subTasks || [])];
    updated.splice(index, 1);
    await updateDoc(doc(db, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
  };

  const handleAddSubTask = async (e) => {
    e.preventDefault();
    const input = e.target.elements[`sub-${task.id}`];
    const title = input.value.trim();
    if (!title) return;
    const updated = [
      ...(task.subTasks || []),
      { title, done: false, inProgress: false },
    ];
    await updateDoc(doc(db, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
    input.value = "";
  };

  return (
    <li
      className={`bg-white shadow-md rounded-xl p-3 border-2 ${
        task.priority === "high"
          ? "border-red-600 bg-red-50"
          : task.priority === "low"
          ? "border-green-500 bg-green-50"
          : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center gap-2 mb-1">
        <Link to={`/task/${task.id}`} className="hover:underline">
          <strong className="text-base font-semibold">{task.title}</strong>
        </Link>
        {!hideStatus && (
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="done">Closed</option>
          </select>
        )}
      </div>

      {task.recurring && task.recurringInterval ? (
        <div className="text-xs text-purple-700 font-medium mb-1 ml-1">
          🔁 Every {task.recurringInterval} day
          {Number(task.recurringInterval) === 1 ? "" : "s"}
        </div>
      ) : null}

      {userData?.role === "manager" && (
        <p className="text-xs italic text-gray-500 mb-1">
          ({userMap?.[task.assignedTo] || "Unknown"})
        </p>
      )}

      {/* Comment */}
      {task.comment && (
        <p className="text-sm text-gray-700 mb-2">• {task.comment}</p>
      )}

      {/* Timer display */}
      {timeLeft && (
        <div className="text-sm text-orange-600 mb-1.5 font-medium italic">
          ⏳ {formatTimeLeft(timeLeft)} left
        </div>
      )}

      {/* Subtasks */}
      {task.subTasks?.length > 0 && (
        <ul className="space-y-1">
          {task.subTasks.map((sub, index) =>
            !sub.done ? (
              <li
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center gap-2 flex-grow cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sub.done}
                    onChange={() => handleToggleSubTask(index)}
                  />
                  <span
                    className={
                      sub.inProgress ? "text-blue-600 italic" : "text-primary"
                    }
                  >
                    {sub.title}
                  </span>
                </label>
                <button
                  onClick={() => handleDeleteSubTask(index)}
                  className="text-gray-300 hover:text-red-400 text-lg"
                >
                  ×
                </button>
              </li>
            ) : null
          )}

          {task.subTasks.some((s) => s.done) && (
            <li
              className="flex justify-between items-center border-b border-gray-200 py-2 cursor-pointer select-none"
              onClick={() => setShowDoneSubTasks(!showDoneSubTasks)}
            >
              <span className="text-sm font-medium italic text-gray-700 font-serif tracking-wide">
                Completed Subtasks ({task.subTasks.filter((s) => s.done).length}
                )
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                  showDoneSubTasks ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </li>
          )}

          {showDoneSubTasks &&
            task.subTasks.map((sub, index) =>
              sub.done ? (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <label className="flex items-center gap-2 flex-grow">
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={() => handleToggleSubTask(index)}
                    />
                    <span className="line-through text-gray-400">
                      {sub.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubTask(index)}
                    className="text-gray-300 hover:text-red-400 text-lg"
                  >
                    ×
                  </button>
                </li>
              ) : null
            )}
        </ul>
      )}

      {showSubForm ? (
        <form
          onSubmit={handleAddSubTask}
          className="mt-2 flex items-center gap-2"
        >
          <input
            type="text"
            name={`sub-${task.id}`}
            placeholder="Add sub-task..."
            autoFocus
            onKeyDown={(e) => e.key === "Escape" && setShowSubForm(false)}
            className="flex-grow px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent text-sm"
          />
          <button
            type="submit"
            className="bg-accent text-white px-3 py-1.5 rounded-md text-sm hover:bg-accent-dark"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowSubForm(false)}
            aria-label="Close sub-task form"
            className="text-gray-400 hover:text-gray-600 text-lg px-1"
          >
            ×
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowSubForm(true)}
          className="mt-1.5 text-xs text-accent hover:underline"
        >
          + Add sub-task
        </button>
      )}
    </li>
  );
}

export default TaskCard;
