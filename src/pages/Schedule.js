// Schedule.js
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

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
  const currentUserName = userData?.name || userData?.email || "";
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch schedule once (no DataContext)
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const snap = await getDoc(doc(db, "schedule", "current"));
        if (snap.exists()) {
          setSchedule(snap.data());
        } else {
          setSchedule({});
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleChange = (day, slot, value) => {
    setSchedule((prev) => ({
      ...prev,
      [`${day}${slot}`]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "schedule", "current"), schedule, { merge: true });
      alert("✅ Schedule saved!");
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("❌ Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset the schedule?")) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "schedule", "current"), {});
      setSchedule({});
      alert("✅ Schedule reset successfully!");
    } catch (err) {
      console.error("Error resetting schedule:", err);
      alert("❌ Failed to reset schedule.");
    } finally {
      setSaving(false);
    }
  };

  const highlightUser = (text) => {
    if (!text || !currentUserName) return text;
    const parts = text.split(/,\s*/);
    return parts.map((name, i) => {
      const isCurrent = name
        .trim()
        .toLowerCase()
        .includes(currentUserName.toLowerCase());
      return (
        <span key={i} className={isCurrent ? "font-bold text-black" : ""}>
          {name.trim()}
          {i < parts.length - 1 ? ", " : ""}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-500">Loading schedule...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="📅 Weekly Schedule"
        backTo="/"
        backLabel="← Back to All Tasks"
      />

      {/* Show schedule instantly, highlight current day */}
      <div className="space-y-1.5 mb-6">
        {days.map((day) => {
          const today = new Date()
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();
          const isToday = day === today;

          return (
            <div
              key={day}
              className={`rounded-lg p-2.5 transition ${
                isToday
                  ? "bg-indigo-50 border-l-4 border-indigo-600 shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <h2
                className={`font-semibold mb-1 ${
                  isToday ? "text-indigo-700 text-lg" : "text-[#442ad7]"
                }`}
              >
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
          );
        })}
      </div>

      {/* Editable form for managers */}
      {userData?.role === "manager" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            ✏️ Edit Schedule
          </h2>

          {days.map((day) => (
            <div key={day}>
              <label className="block font-medium mb-1">{labels[day]}</label>
              {day === "sunday" ? (
                <input
                  type="text"
                  value={schedule[day] || ""}
                  onChange={(e) => handleChange(day, "", e.target.value)}
                  className="w-full border px-3 py-2 rounded text-sm"
                  placeholder="e.g. Gresa Florent"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={schedule[`${day}1`] || ""}
                    onChange={(e) => handleChange(day, "1", e.target.value)}
                    className="border px-3 py-2 rounded text-sm"
                    placeholder="1st shift (10–16)"
                  />
                  <input
                    type="text"
                    value={schedule[`${day}Mid`] || ""}
                    onChange={(e) => handleChange(day, "Mid", e.target.value)}
                    className="border px-3 py-2 rounded text-sm"
                    placeholder="Mid shift (optional)"
                  />
                  <input
                    type="text"
                    value={schedule[`${day}2`] || ""}
                    onChange={(e) => handleChange(day, "2", e.target.value)}
                    className="border px-3 py-2 rounded text-sm"
                    placeholder="2nd shift (16–22)"
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
      )}
    </div>
  );
}

export default Schedule;
