import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { db } from "../firebase/firebase";
import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";

function TaskList({ filterToMyTasks = false, overrideUserId = null }) {
  const { currentUser, userData } = useAuth();
  const { tasks, settings, loading } = useData();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const [userList, setUserList] = useState([]);
  const userMap = Object.fromEntries(userList.map((u) => [u.uid, u.name]));

  // 🔑 Fetch all users once (for managers)
  useEffect(() => {
    if (userData?.role === "manager") {
      const fetchUsers = async () => {
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setUserList(users);
      };
      fetchUsers();
    }
  }, [userData?.role]);

  // --- Group tasks by status ---
  const grouped = { todo: [], "in-progress": [], "on-hold": [], done: [] };
  const statusLabels = {
    todo: "To Do",
    "in-progress": "In Progress",
    "on-hold": "On Hold",
    done: "Closed",
  };

  let filtered = tasks;

  // Apply manager vs employee filter
  if (userData?.role !== "manager") {
    filtered = filtered.filter((t) => t.assignedTo === currentUser?.uid);
  } else {
    if (overrideUserId) {
      filtered = filtered.filter((t) => t.assignedTo === overrideUserId);
    } else if (filterToMyTasks) {
      filtered = filtered.filter((t) => t.assignedTo === currentUser?.uid);
    }
  }

  // Group by status
  filtered.forEach((task) => {
    grouped[task.status]?.push(task);
  });

  // Sort by priority within each status
  const sortByPriority = (a, b) => {
    const weight = (p) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
    return weight(a.priority || "medium") - weight(b.priority || "medium");
  };

  const sortedStatuses = ["in-progress", "todo", "on-hold", "done"];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-4">
        {!showAddTask && (
          <button
            onClick={() => setShowAddTask(true)}
            className="text-sm text-accent underline"
          >
            + Add New Task
          </button>
        )}
        {showAddTask && (
          <AddTaskForm
            onClose={() => setShowAddTask(false)} // ✅ new close callback
            users={userList}
            userData={userData}
          />
        )}
      </div>

      {sortedStatuses.map((taskStatus) => {
        let group = [...(grouped[taskStatus] || [])].sort(sortByPriority);
        const displayStatus = statusLabels[taskStatus] || taskStatus;
        const isClosed = taskStatus === "done";

        return (
          <div key={taskStatus} className="mb-10">
            <div
              className={`text-accent font-serif italic text-lg mb-2 border-b border-gray-200 pb-1 flex justify-between items-center ${
                isClosed ? "cursor-pointer hover:opacity-80" : ""
              }`}
              onClick={() => isClosed && setShowClosed((prev) => !prev)}
            >
              <span>
                {displayStatus}
                {isClosed && ` (${group.length})`}
              </span>
              {isClosed &&
                (showClosed ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ))}
            </div>

            {(!isClosed || showClosed) && (
              <ul className="space-y-4">
                {group.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUser={currentUser}
                    userData={userData}
                    userMap={userMap}
                    collapseSubtasks={settings?.collapseCompletedSubtasks}
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
