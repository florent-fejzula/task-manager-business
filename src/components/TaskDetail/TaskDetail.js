// TaskDetail.js (with assignment dropdown)
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, deleteDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import TaskHeader from "./TaskHeader";
import SubtaskList from "../SubtaskList";
import DeleteConfirmModal from "./DeleteConfirmModal";
import TaskControls from "./TaskControls";

function TaskDetail({ collapseSubtasks = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userList, setUserList] = useState([]);

  const taskRef = doc(db, "tasks", id);
  const isManager = userData?.role === "manager";

  useEffect(() => {
    const fetchTask = async () => {
      const snapshot = await getDoc(taskRef);
      if (snapshot.exists()) {
        setTask({ id: snapshot.id, ...snapshot.data() });
      }

      if (userData?.role === "manager") {
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setUserList(users);
      }

      setLoading(false);
    };
    fetchTask();
  }, [id, currentUser.uid, taskRef, userData?.role]);

  const handleUpdateTask = async (updates) => {
    setTask((prev) => ({ ...prev, ...updates }));
  };

  const handleDeleteTask = async () => {
    await deleteDoc(taskRef);
    navigate("/");
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (!task) return <p className="text-center">Task not found.</p>;

  const priorityClass =
    task.priority === "high"
      ? "border-red-500"
      : task.priority === "low"
      ? "border-green-500"
      : "border-gray-200";

  return (
    <div
      className={`bg-white shadow-md rounded-lg p-6 sm:p-8 max-w-xl mx-auto mt-8 border ${priorityClass}`}
    >
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
        <span className="text-xs text-gray-400">Task Detail</span>
      </div>

      <TaskHeader task={task} taskRef={taskRef} onUpdate={handleUpdateTask} />

      {/* Comment */}
      {task.comment && (
        <p className="text-sm text-gray-700 mb-3 ml-1">• {task.comment}</p>
      )}
      
      <TaskControls
        task={task}
        taskRef={taskRef}
        onUpdate={handleUpdateTask}
      />

      {/* Manager-only reassignment dropdown */}
      {isManager && (
        <div className="my-4">
          <label className="block text-sm font-medium mb-1">Reassign Task:</label>
          <select
            value={task.assignedTo}
            onChange={async (e) => {
              const newUid = e.target.value;
              await updateDoc(taskRef, { assignedTo: newUid });
              handleUpdateTask({ assignedTo: newUid });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
          >
            <option value="">Unassigned</option>
            {userList.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <SubtaskList
        task={task}
        taskRef={taskRef}
        onUpdate={handleUpdateTask}
        collapseSubtasks={collapseSubtasks}
      />

      {isManager && (
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 w-full"
        >
          Delete Task
        </button>
      )}

      {showConfirmDelete && isManager && (
        <DeleteConfirmModal
          onCancel={() => setShowConfirmDelete(false)}
          onConfirm={handleDeleteTask}
        />
      )}
    </div>
  );
}

export default TaskDetail;
