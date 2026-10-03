import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { useAuth } from "./context/AuthContext";

import SideMenu from "./pages/sideMenu";
import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail/TaskDetail";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import EmployeeList from "./pages/EmployeeList";
import EmployeeTasks from "./pages/EmployeeTasks";
import PageHeader from "./components/PageHeader";

function TaskDetailWithSettings({ userId }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const ref = doc(db, "users", userId, "settings", "preferences");
      const snap = await getDoc(ref);
      setSettings(snap.exists() ? snap.data() : {});
      setLoading(false);
    };
    fetchSettings();
  }, [userId]);

  if (loading) {
    return (
      <p className="text-center mt-8 text-sm text-gray-500">
        Loading task settings...
      </p>
    );
  }

  return <TaskDetail collapseSubtasks={settings?.collapseCompletedSubtasks} />;
}

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);
  const { currentUser, userData } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-soft text-primary font-sans px-3 py-3 sm:px-4 sm:py-6">
        <SideMenu />
        <div className="max-w-2xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? (
                  <>
                    <PageHeader
                      title="Task Manager B1.2"
                      subtitle="Stay on top of your goals, one task at a time."
                    >
                      {userData?.role === "manager" && (
                        <div className="mt-1.5 flex items-center justify-center gap-4">
                          <Link
                            to="/my-tasks"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            My Tasks
                          </Link>
                          <Link
                            to="/employees"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Employees
                          </Link>
                        </div>
                      )}
                    </PageHeader>

                    <div>
                      <TaskList
                        triggerFetch={triggerFetch}
                        setTriggerFetch={setTriggerFetch}
                        userId={currentUser.uid}
                      />
                    </div>
                  </>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/my-tasks"
              element={
                currentUser && userData?.role === "manager" ? (
                  <>
                    <PageHeader
                      title="My Tasks"
                      backTo="/"
                      backLabel="← Back to All Tasks"
                    />
                    <TaskList
                      triggerFetch={triggerFetch}
                      setTriggerFetch={setTriggerFetch}
                      userId={currentUser.uid}
                      filterToMyTasks={true}
                    />
                  </>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/employees"
              element={
                currentUser ? <EmployeeList /> : <Navigate to="/login" />
              }
            />

            <Route
              path="/employees/:id"
              element={
                currentUser ? <EmployeeTasks /> : <Navigate to="/login" />
              }
            />

            <Route
              path="/task/:id"
              element={
                currentUser ? (
                  <TaskDetailWithSettings userId={currentUser.uid} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/settings"
              element={currentUser ? <Settings /> : <Navigate to="/login" />}
            />
            <Route path="/schedule" element={<Schedule />} />
            <Route
              path="/login"
              element={!currentUser ? <Login /> : <Navigate to="/" />}
            />
            <Route
              path="/signup"
              element={!currentUser ? <SignUp /> : <Navigate to="/" />}
            />
            <Route
              path="/forgot-password"
              element={!currentUser ? <ForgotPassword /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
