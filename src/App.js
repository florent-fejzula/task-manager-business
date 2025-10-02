import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { useAuth } from "./context/AuthContext";
import { requestNotificationPermission } from "./firebase/fcm";

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

  // ✅ Notifications
  useEffect(() => {
    if (!currentUser) return;

    requestNotificationPermission(currentUser.uid);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);

      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/icons/icon-192x192.png",
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Router>
      <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
        <SideMenu />
        <div className="max-w-2xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? (
                  <>
                    <header className="mb-6 text-center">
                      <h1 className="text-4xl font-bold tracking-tight mb-3 sm:mb-2">
                        Task Manager B1.2
                      </h1>
                      <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Stay on top of your goals, one task at a time.
                      </p>
                      <div className="text-right mt-4 flex items-center gap-4">
                        {userData?.role === "manager" && (
                          <>
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
                          </>
                        )}
                      </div>
                    </header>

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
                  <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
                    <div className="max-w-2xl mx-auto">
                      <header className="mb-10 text-center">
                        <h1 className="text-3xl font-bold tracking-tight mb-3 sm:mb-2">
                          My Tasks
                        </h1>
                        <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
                        <Link
                          to="/"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          ← Back to All Tasks
                        </Link>
                      </header>

                      <TaskList
                        triggerFetch={triggerFetch}
                        setTriggerFetch={setTriggerFetch}
                        userId={currentUser.uid}
                        filterToMyTasks={true}
                      />
                    </div>
                  </div>
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
