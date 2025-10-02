import { useEffect, useState } from "react";
import { updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function TaskMetaControls({ task, taskRef, onUpdate }) {
  const { userData } = useAuth();
  const isManager = userData?.role === "manager";

  const [timeLeft, setTimeLeft] = useState(null);

  // --- Custom timer UI state ---
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [timerError, setTimerError] = useState("");

  useEffect(() => {
    if (!task.timerStart || !task.timerDuration) {
      setTimeLeft(null);
      return;
    }

    const start =
      typeof task.timerStart?.toMillis === "function"
        ? task.timerStart.toMillis()
        : new Date(task.timerStart).getTime();
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
    const days = Math.floor(totalMins / (60 * 24));
    const hrs = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;

    if (days > 0) return `${days}d ${hrs}h`;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}`;
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
    onUpdate({
      timerStart: now,
      timerDuration: durationMs,
      notified15min: false,
    });
    setTimerError("");
  };

  const handleCancelTimer = async () => {
    await updateDoc(taskRef, {
      timerStart: null,
      timerDuration: null,
    });
    onUpdate({ timerStart: null, timerDuration: null });
    setTimeLeft(null);
    setTimerError("");
  };

  // --- Custom timer logic ---
  const MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const MIN_MS = 60 * 1000; // 1 minute

  const setCustomTimer = async () => {
    const d = Math.max(0, Number(customDays) || 0);
    const h = Math.max(0, Number(customHours) || 0);
    const m = Math.max(0, Number(customMinutes) || 0);

    const totalMs = ((d * 24 + h) * 60 + m) * 60 * 1000;

    if (totalMs < MIN_MS) {
      setTimerError("Please set at least 1 minute.");
      return;
    }
    if (totalMs > MAX_MS) {
      setTimerError("Maximum allowed is 30 days.");
      return;
    }

    await handleSetTimer(totalMs);
    setShowCustom(false);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Status + Priority row */}
      <div className="flex gap-4 flex-wrap">
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
      </div>

      {/* Timer display */}
      {timeLeft && (
        <div className="text-sm text-orange-600 font-medium italic">
          ⏳ {formatTimeLeft(timeLeft)} left
        </div>
      )}

      {/* Timer dropdown + custom */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium">Set Timer:</label>
          <select
            disabled={!isManager}
            onChange={(e) => {
              if (!isManager) return;
              const val = e.target.value;
              if (val === "custom") {
                setShowCustom(true);
                setTimerError("");
                return;
              }
              const parsed = parseInt(val, 10);
              if (parsed) {
                setShowCustom(false);
                setTimerError("");
                handleSetTimer(parsed);
                e.target.value = ""; // reset selection
              }
            }}
            className={`border rounded px-2 py-1 text-sm ${
              isManager
                ? "border-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            defaultValue=""
          >
            <option value="">-- Choose --</option>
            <option value="1800000">30 min</option>
            <option value="3600000">1 hour</option>
            <option value="7200000">2 hours</option>
            <option value="18000000">5 hours</option>
            <option value="28800000">8 hours</option>
            <option value="86400000">1 day</option>
            <option value="259200000">3 days</option>
            <option value="custom">Custom…</option>
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

        {showCustom && (
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Days</label>
              <input
                type="number"
                min={0}
                className="w-20 border border-gray-300 rounded px-2 py-1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hours</label>
              <input
                type="number"
                min={0}
                max={23}
                className="w-20 border border-gray-300 rounded px-2 py-1"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Minutes
              </label>
              <input
                type="number"
                min={0}
                max={59}
                className="w-20 border border-gray-300 rounded px-2 py-1"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
              />
            </div>

            <button
              onClick={setCustomTimer}
              className="ml-1 px-3 py-1.5 rounded bg-neutral-800 text-white hover:opacity-90"
            >
              Set Custom Timer
            </button>

            <button
              onClick={() => {
                setShowCustom(false);
                setTimerError("");
              }}
              className="text-xs text-gray-600 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {timerError && <div className="text-xs text-red-600">{timerError}</div>}
      </div>
    </div>
  );
}

export default TaskMetaControls;
