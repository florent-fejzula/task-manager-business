import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// ✅ Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js") // register as classic script, not module
      .then((registration) => {
        console.log("🔧 Custom SW registered");
        registration.update();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              const confirmed = window.confirm(
                "🔄 New version available. Refresh now?"
              );
              if (confirmed && registration.waiting) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("📦 SW controller changed, reloading...");
          window.location.reload();
        });
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
  </React.StrictMode>
);
