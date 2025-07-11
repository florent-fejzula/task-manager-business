import { useEffect, useState } from "react";
import { updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function TaskMetaControls({ task, taskRef, onUpdate }) {
  const { userData } = useAuth();
  const isManager = userData?.role === "manager";

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!task.timerStart || !task.timerDuration) {
      setTimeLeft(null);
      return;
    }

    const start =
      task.timerStart.toMillis?.() || new Date(task.timerStart).getTime();
    const duration = task.timerDuration;

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = start + duration - now;
      setTimeLeft(remaining > 0 ? remaining : null);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
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
    await updateDoc(taskRef, { status: newStatus });
    onUpdate({ status: newStatus });
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    await updateDoc(taskRef, { priority: newPriority });
    onUpdate({ priority: newPriority });
  };

  const handleSetTimer = async (durationMs) => {
    const now = Date.now();
    await updateDoc(taskRef, {
      timerStart: now,
      timerDuration: durationMs,
      notified15min: false,
    });
    onUpdate({ timerStart: now, timerDuration: durationMs });
  };

  const handleCancelTimer = async () => {
    await updateDoc(taskRef, {
      timerStart: null,
      timerDuration: null,
    });
    onUpdate({ timerStart: null, timerDuration: null });
    setTimeLeft(null);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {timeLeft && (
        <div className="text-sm text-orange-600 font-medium italic">
          ⏳ {formatTimeLeft(timeLeft)} left
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="done">Closed</option>
        </select>

        <select
          value={task.priority || "medium"}
          onChange={handlePriorityChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val && isManager) handleSetTimer(val);
          }}
          className={`border rounded px-2 py-1 text-sm ${
            isManager
              ? "border-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          disabled={!isManager}
          defaultValue=""
        >
          <option value="">-- No Timer --</option>
          <option value="1800000">30 min</option>
          <option value="3600000">1 hour</option>
          <option value="7200000">2 hours</option>
          <option value="18000000">5 hours</option>
          <option value="28800000">8 hours</option>
          <option value="86400000">1 day</option>
          <option value="172800000">2 days</option>
          <option value="259200000">3 days</option>
          <option value="432000000">5 days</option>
        </select>

        {task.timerStart && task.timerDuration && isManager && (
          <button
            onClick={handleCancelTimer}
            className="text-xs text-red-600 underline"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskMetaControls;
