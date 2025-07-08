import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logout from "./Logout";

function SideMenu() {
  const [open, setOpen] = useState(false);
  const { userData } = useAuth();

  return (
    <>
      {/* Always Visible Hamburger Button */}
      <div className="flex mb-4">
        <button
          className="text-2xl px-2 py-1 rounded hover:bg-gray-200"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Overlay + Panel */}
      <div className={`fixed inset-0 z-50 pointer-events-none ${open ? "pointer-events-auto" : ""}`}>
        {/* Overlay with fade animation */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${open ? "opacity-30" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        ></div>

        {/* Side Panel with slide animation */}
        <div
          className={`absolute left-0 top-0 h-full w-60 bg-white shadow-lg px-4 py-8 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            className="text-gray-600 text-xl absolute top-2 right-3"
          >
            ✕
          </button>
          <nav className="flex flex-col gap-6 mt-6">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="text-blue-600 hover:underline"
            >
              Home
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="text-blue-600 hover:underline"
            >
              ⚙️ Settings
            </Link>
            <Logout />
          </nav>
        </div>
      </div>
    </>
  );
}

export default SideMenu;
