import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import UpdateBanner from "./components/UpdateBanner";
import "./index.css";

// ✅ Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js") // register as classic script, not module
      .then((registration) => {
        console.log("🔧 Custom SW registered");
        registration.update();
      })
      .catch((err) => {
        console.error("❌ SW registration failed:", err);
      });
  });
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
