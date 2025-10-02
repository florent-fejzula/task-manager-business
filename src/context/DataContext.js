// DataContext.js
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "./AuthContext";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const DataCtx = createContext(null);

export function DataProvider({ children }) {
  const { currentUser, userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [taskMap, setTaskMap] = useState({});
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [schedule, setSchedule] = useState({}); // 🔑 add schedule
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setTaskMap({});
      setSettings(null);
      setUsers([]);
      setUserMap({});
      setSchedule({});
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;
    setLoading(true);

    // --- Subscribe to tasks ---
    let tasksQ;
    if (userData?.role === "manager") {
      tasksQ = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    } else {
      tasksQ = query(
        collection(db, "tasks"),
        where("assignedTo", "==", uid),
        orderBy("createdAt", "desc")
      );
    }
    const unsubTasks = onSnapshot(tasksQ, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const map = Object.fromEntries(arr.map((t) => [t.id, t]));
      setTasks(arr);
      setTaskMap(map);
      setLoading(false);
    });

    // --- Subscribe to settings ---
    const settingsRef = doc(db, "users", uid, "settings", "preferences");
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      setSettings(snap.exists() ? snap.data() : {});
    });

    // --- Subscribe to all users ---
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const arr = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const map = Object.fromEntries(arr.map((u) => [u.uid, u.name || ""]));
      setUsers(arr);
      setUserMap(map);
    });

    // --- Subscribe to schedule ---
    const scheduleRef = doc(db, "schedule", "current");
    const unsubSchedule = onSnapshot(scheduleRef, (snap) => {
      setSchedule(snap.exists() ? snap.data() : {});
    });

    return () => {
      unsubTasks();
      unsubSettings();
      unsubUsers();
      unsubSchedule();
    };
  }, [currentUser, userData?.role]);

  const value = useMemo(
    () => ({
      tasks,
      taskMap,
      settings,
      users,
      userMap,
      schedule, // 🔑 expose
      loading,
    }),
    [tasks, taskMap, settings, users, userMap, schedule, loading]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  return (
    useContext(DataCtx) || {
      tasks: [],
      taskMap: {},
      settings: null,
      users: [],
      userMap: {},
      schedule: {}, // 🔑 default
      loading: true,
    }
  );
}
