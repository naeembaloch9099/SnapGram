import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiVideo,
  FiUser,
} from "react-icons/fi";

const items = [
  { to: "/", icon: <FiHome />, label: "Home" },
  { to: "/explore", icon: <FiSearch />, label: "Search" },
  { to: "/create", icon: <FiPlusSquare />, label: "Create" },
  { to: "/reels", icon: <FiVideo />, label: "Reels" },
  { to: "/profile/me", icon: <FiUser />, label: "Profile" },
];

const BottomNav = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onComments = (e) => {
      try {
        setHidden(Boolean(e?.detail?.open));
      } catch (err) {
        console.warn(err);
      }
    };
    window.addEventListener("snapgram:comments", onComments);
    return () => window.removeEventListener("snapgram:comments", onComments);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden z-50 ${
        hidden ? "hidden" : ""
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden={hidden}
    >
      <div className="max-w-5xl mx-auto flex justify-around text-slate-600">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-primary-700" : "text-slate-600"
              }`
            }
          >
            <div className="text-2xl">{it.icon}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
