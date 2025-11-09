import React from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiCompass,
  FiMessageCircle,
  FiBell,
  FiPlusSquare,
  FiUser,
} from "react-icons/fi";

const items = [
  { to: "/", label: "Home", icon: <FiHome /> },
  { to: "/explore", label: "Search", icon: <FiSearch /> },
  { to: "/explore", label: "Explore", icon: <FiCompass /> },
  { to: "/messages", label: "Messages", icon: <FiMessageCircle /> },
  { to: "/notifications", label: "Notifications", icon: <FiBell /> },
  { to: "/create", label: "Create", icon: <FiPlusSquare /> },
  { to: "/profile/me", label: "Profile", icon: <FiUser /> },
];

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    /* Make the aside itself sticky so it remains fixed during scroll on large screens */
    <aside className="hidden lg:block sticky top-6">
      <div className="px-4">
        <div className="mb-6 text-2xl font-extrabold">SnapGram</div>
        <nav className="space-y-3">
          {items.map((it) => {
            if (it.label === "Notifications") {
              return (
                <button
                  key={it.label}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/notifications");
                  }}
                  className={`w-full text-left flex items-center gap-3 py-2 px-3 rounded hover:bg-slate-100 text-slate-700`}
                >
                  <span className="text-lg">{it.icon}</span>
                  <span className="hidden lg:inline">{it.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={it.label}
                to={it.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2 px-3 rounded hover:bg-slate-100 ${
                    isActive ? "bg-slate-100 font-semibold" : "text-slate-700"
                  }`
                }
              >
                <span className="text-lg">{it.icon}</span>
                <span className="hidden lg:inline">{it.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
