import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import UpdateBanner from "./components/UpdateBanner";
import "./index.css";

// The service worker only existed for push notifications, which were removed.
// Clear it from devices that still have it registered. This can be deleted
// once everyone has opened the app on this version.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((r) => r.unregister()))
    .catch(() => {});
}

// ✅ React Root Rendering
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <UpdateBanner />
  </React.StrictMode>
);
