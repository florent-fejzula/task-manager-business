import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

function EmployeeList() {
  const { userData } = useAuth();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["employee", "manager"])
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(list);
    };

    if (userData?.role === "manager") {
      fetchEmployees();
    }
  }, [userData]);

  if (userData?.role !== "manager") {
    return <p className="text-center text-gray-500 mt-10">Access denied.</p>;
  }

  return (
    <div className="max-w-xl text-center mx-auto">
      <PageHeader
        title="👥 Employee Profiles"
        backTo="/"
        backLabel="← Back to All Tasks"
      />
      <ul className="space-y-2">
        {employees.map((emp) => (
          <li key={emp.id}>
            <Link
              to={`/employees/${emp.id}`}
              className="block border p-3 rounded shadow-sm hover:bg-gray-100 transition"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{emp.name || emp.email}</span>
                <span className="text-blue-600 text-sm">View Tasks →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EmployeeList;
