import { useParams } from "react-router-dom";
import TaskList from "../components/TaskList";
import PageHeader from "../components/PageHeader";
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
    <>
      <PageHeader
        title={employeeName ? `${employeeName}'s Tasks` : "Loading..."}
        backTo="/employees"
        backLabel="← Back to Employee List"
      />
      <TaskList
        overrideUserId={id}
        triggerFetch={false}
        setTriggerFetch={() => {}}
      />
    </>
  );
}

export default EmployeeTasks;
