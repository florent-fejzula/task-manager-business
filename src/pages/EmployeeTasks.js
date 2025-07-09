import { useParams, Link } from "react-router-dom";
import TaskList from "../components/TaskList";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

function EmployeeTasks() {
  const { id } = useParams(); // employee ID from URL
  const { currentUser, userData } = useAuth();
  const [employeeName, setEmployeeName] = useState(null);

  useEffect(() => {
    const fetchEmployeeName = async () => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        setEmployeeName(snap.data().name || snap.data().email);
      } else {
        setEmployeeName("Unknown");
      }
    };

    fetchEmployeeName();
  }, [id]);

  if (!currentUser || userData?.role !== "manager") {
    return <p className="text-center text-gray-500 mt-10">Access denied.</p>;
  }

  return (
    <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-3 sm:mb-2">
            {employeeName ? `${employeeName}'s Tasks` : "Loading..."}
          </h1>
          <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
          <Link
            to="/employees"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Employee List
          </Link>
        </header>

        <TaskList
          overrideUserId={id}
          triggerFetch={false}
          setTriggerFetch={() => {}}
        />
      </div>
    </div>
  );
}

export default EmployeeTasks;
