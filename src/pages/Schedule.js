// Schedule.js
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const labels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function Schedule() {
  const { userData } = useAuth();
  const { schedule } = useData(); // 🔑 use cached schedule
  const currentUserName = userData?.name || userData?.email || "";
  const [saving, setSaving] = useState(false);

  const handleChange = (day, slot, value) => {
    // local edit
    schedule[`${day}${slot}`] = value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "schedule", "current"), schedule, { merge: true });
      alert("Schedule saved!");
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset the schedule?")) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "schedule", "current"), {});
      alert("Schedule reset successfully!");
    } catch (err) {
      console.error("Error resetting schedule:", err);
      alert("Failed to reset schedule.");
    } finally {
      setSaving(false);
    }
  };

  const highlightUser = (text) => {
    if (!text || !currentUserName) return text;
    return text.split(/,\s*/).map((name, i) => {
      const isCurrent = name
        .trim()
        .toLowerCase()
        .includes(currentUserName.toLowerCase());
      return (
        <span key={i} className={isCurrent ? "font-bold text-black" : ""}>
          {name.trim()}
          {i < text.split(/,\s*/).length - 1 ? ", " : ""}
        </span>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📅 Weekly Schedule
        <div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← Back to All Tasks
          </Link>
        </div>
      </h1>

      {/* Show schedule instantly, no spinner */}
      <div className="space-y-6 mb-10">
        {days.map((day) => (
          <div key={day}>
            <h2 className="font-semibold mb-1" style={{ color: "#442ad7" }}>
              {labels[day]}:
            </h2>
            <ul className="text-sm text-gray-800 ml-2 list-disc pl-4">
              {day === "sunday" ? (
                schedule[day] && <li>{highlightUser(schedule[day])}</li>
              ) : (
                <>
                  {schedule[`${day}1`] && (
                    <li>1: {highlightUser(schedule[`${day}1`])}</li>
                  )}
                  {schedule[`${day}Mid`] && (
                    <li>- {highlightUser(schedule[`${day}Mid`])}</li>
                  )}
                  {schedule[`${day}2`] && (
                    <li>2: {highlightUser(schedule[`${day}2`])}</li>
                  )}
                </>
              )}
            </ul>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-xl font-semibold text-center mb-4">
          ✏️ Edit Schedule
        </h2>
        {days.map((day) => (
          <div key={day}>
            <label className="block font-medium mb-1">{labels[day]}</label>
            {day === "sunday" ? (
              <input
                type="text"
                defaultValue={schedule[day] || ""}
                onChange={(e) => handleChange(day, "", e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  defaultValue={schedule[`${day}1`] || ""}
                  onChange={(e) => handleChange(day, "1", e.target.value)}
                  className="border px-3 py-2 rounded text-sm"
                />
                <input
                  type="text"
                  defaultValue={schedule[`${day}Mid`] || ""}
                  onChange={(e) => handleChange(day, "Mid", e.target.value)}
                  className="border px-3 py-2 rounded text-sm"
                />
                <input
                  type="text"
                  defaultValue={schedule[`${day}2`] || ""}
                  onChange={(e) => handleChange(day, "2", e.target.value)}
                  className="border px-3 py-2 rounded text-sm"
                />
              </div>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-4"
        >
          Reset Schedule
        </button>
      </form>
    </div>
  );
}

export default Schedule;
