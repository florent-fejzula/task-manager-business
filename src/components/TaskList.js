import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";
import { isFixedTask } from "../utils/taskType";

function TaskList({
  triggerFetch,
  filterToMyTasks = false,
  overrideUserId = null,
}) {
  const { currentUser, userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  // The manager's everyone-view would otherwise open with every employee's
  // standing tasks, burying the one-time work
  const [showFixed, setShowFixed] = useState(
    !(userData?.role === "manager" && !filterToMyTasks && !overrideUserId)
  );
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({});
  const [userList, setUserList] = useState([]);
  const [notice, setNotice] = useState("");
  const userMap = Object.fromEntries(userList.map((u) => [u.uid, u.name]));

  // Whose tasks this page shows; null for the manager's everyone-view
  const viewUserId =
    userData?.role === "manager"
      ? overrideUserId || (filterToMyTasks ? currentUser.uid : null)
      : currentUser.uid;

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const grouped = {
    todo: [],
    "in-progress": [],
    "on-hold": [],
    done: [],
  };

  const statusLabels = {
    todo: "To Do",
    "in-progress": "In Progress",
    "on-hold": "On Hold",
    done: "Closed",
  };

  const getWeight = (priority) =>
    priority === "high" ? 0 : priority === "medium" ? 1 : 2;
  const byPriority = (a, b) =>
    getWeight(a.priority || "medium") - getWeight(b.priority || "medium");

  const fixedTasks = tasks.filter(isFixedTask).sort(byPriority);
  tasks.forEach((task) => {
    if (!isFixedTask(task)) grouped[task.status]?.push(task);
  });

  const handleAddTask = async (
    newTaskTitle,
    newTaskStatus,
    assignedTo,
    comment,
    type = "one-time"
  ) => {
    // Fixed tasks are a standing list, so they never move through statuses
    const status = type === "fixed" ? "todo" : newTaskStatus;
    const assignee = assignedTo || currentUser.uid;
    let docRef;
    try {
      docRef = await addDoc(collection(db, "tasks"), {
        title: newTaskTitle,
        status,
        type,
        priority: "medium",
        createdAt: serverTimestamp(),
        subTasks: [],
        assignedTo: assignee,
        createdBy: currentUser.uid,
        comment: comment || "", // add comment field here
      });
    } catch (err) {
      console.error("Error adding task:", err);
      throw err; // AddTaskForm shows the error and keeps what was typed
    }

    console.log("🔥 Task added to Firestore with ID:", docRef.id);

    // Only list it here if it belongs on this page (My Tasks or one
    // employee's page only show that person's tasks)
    if (!viewUserId || assignee === viewUserId) {
      setTasks((prev) => [
        {
          id: docRef.id,
          title: newTaskTitle,
          status,
          type,
          priority: "medium",
          subTasks: [],
          assignedTo: assignee,
          createdBy: currentUser.uid,
          createdAt: new Date(),
          comment: comment || "", // add to local state too
        },
        ...prev,
      ]);
    }
    // A collapsed Fixed section would hide the task that was just added
    if (type === "fixed") setShowFixed(true);

    const forWhom =
      assignee === currentUser.uid ? "you" : userMap[assignee] || "them";
    setNotice(
      `Task "${newTaskTitle}" added for ${forWhom}${
        type === "fixed" ? " under Fixed tasks" : ""
      }.`
    );
    setShowAddTask(false);
  };

  const sortedStatuses = ["in-progress", "todo", "on-hold", "done"];

  useEffect(() => {
    const fetchTasksAndSettings = async () => {
      try {
        setLoading(true);

        let q;
        const tasksRef = collection(db, "tasks");

        if (userData?.role === "manager") {
          if (overrideUserId) {
            q = query(tasksRef, where("assignedTo", "==", overrideUserId));
          } else if (filterToMyTasks) {
            q = query(tasksRef, where("assignedTo", "==", currentUser.uid));
          } else {
            q = query(tasksRef, orderBy("createdAt", "desc"));
          }
        } else {
          q = query(tasksRef, where("assignedTo", "==", currentUser.uid));
        }

        const snapshot = await getDocs(q);
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksData);

        // Fetch user settings
        const settingsRef = doc(
          db,
          "users",
          currentUser.uid,
          "settings",
          "preferences"
        );
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setUserSettings(settingsSnap.data());
        } else {
          setUserSettings({});
        }

        // Fetch all users (for assignment dropdown)
        if (userData?.role === "manager") {
          const usersSnap = await getDocs(collection(db, "users"));
          const users = usersSnap.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));
          setUserList(users);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks or settings:", err);
        setLoading(false);
      }
    };

    if (currentUser?.uid && userData?.role) {
      fetchTasksAndSettings();
    }
  }, [
    triggerFetch,
    currentUser.uid,
    userData,
    filterToMyTasks,
    overrideUserId,
  ]);

  const renderCard = (task) => (
    <TaskCard
      key={task.id}
      task={task}
      currentUser={currentUser}
      userData={userData}
      userMap={userMap}
      hideStatus={isFixedTask(task)}
      collapseSubtasks={userSettings?.collapseCompletedSubtasks}
      onStatusChange={(taskId, newStatus) =>
        setTasks((prev) =>
          prev.map((t) =>
            // moving through statuses makes it a one-time task for good
            t.id === taskId ? { ...t, status: newStatus, type: "one-time" } : t
          )
        )
      }
      onSubTaskUpdate={(taskId, updatedSubTasks) =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t
          )
        )
      }
    />
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-3">
        {notice && (
          <p
            role="status"
            className="mb-2 max-w-md mx-auto text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2"
          >
            ✓ {notice}
          </p>
        )}
        {!showAddTask && (
          <button
            onClick={() => {
              setNotice("");
              setShowAddTask(true);
            }}
            className="text-sm text-accent underline"
          >
            + Add New Task
          </button>
        )}
        {showAddTask && (
          <AddTaskForm
            onAdd={handleAddTask}
            users={userList}
            userData={userData}
          />
        )}
      </div>

      {tasks.length === 0 && (
        <p className="text-center text-sm text-gray-500 mt-6">No tasks yet.</p>
      )}

      {fixedTasks.length > 0 && (
        <div className="mb-4">
          <div
            className="text-accent font-serif italic text-base mb-1.5 border-b border-gray-200 pb-1 flex justify-between items-center cursor-pointer hover:opacity-80"
            onClick={() => setShowFixed((prev) => !prev)}
          >
            <span>Fixed tasks ({fixedTasks.length})</span>
            {showFixed ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
          {showFixed && (
            <ul className="space-y-2.5">{fixedTasks.map(renderCard)}</ul>
          )}
        </div>
      )}

      {sortedStatuses.map((taskStatus) => {
        let group = grouped[taskStatus];
        const displayStatus = statusLabels[taskStatus] || taskStatus;

        group = [...group].sort(byPriority);

        const isClosed = taskStatus === "done";

        // Empty sections only add dead space above the real content
        if (group.length === 0) return null;

        return (
          <div key={taskStatus} className="mb-4">
            <div
              className={`text-accent font-serif italic text-base mb-1.5 border-b border-gray-200 pb-1 flex justify-between items-center cursor-pointer ${
                isClosed ? "hover:opacity-80" : ""
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
              <ul className="space-y-2.5">
                {group.map(renderCard)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
