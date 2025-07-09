import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <div className="max-w-xl text-center mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        👥 Employee Profiles
      </h1>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to All Tasks
      </Link>
      <ul className="space-y-4 mt-6">
        {employees.map((emp) => (
          <li key={emp.id}>
            <Link
              to={`/employees/${emp.id}`}
              className="block border p-4 rounded shadow-sm hover:bg-gray-100 transition"
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
