import React, { useState, useContext } from "react";
import { FiSend, FiSearch } from "react-icons/fi";
import { FaHeart, FaUser, FaComment, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MessageContext } from "../context/MessageContext";
import { useNotifications } from "../context/NotificationContext";

// Responsive top navigation: logo, search input, icons
const Navbar = () => {
  return (
    <nav
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      // show navbar only on small screens; hide on md and larger
      className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur-sm md:hidden"
    >
      <div className="container-md flex items-center gap-4 h-14">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold">SnapGram</span>
        </div>

        {/* search - hidden on xs; show icon on xs */}
        <div className="flex-1 hidden sm:block">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search"
              className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm"
            />
          </div>
        </div>
        <div className="sm:hidden">
          <SearchToggle />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <ActivityButton />
          <MessageButton />
        </div>
      </div>
    </nav>
  );
};
function SearchToggle() {}

function SearchOverlay({ onClose } = {}) {
  // overlay used for mobile search; if onClose is undefined, it's the persistent overlay placeholder
  const [visible, setVisible] = useState(true);
  if (!visible && typeof onClose === "undefined") return null;
  return (
    <div className="fixed inset-0 z-60 bg-black/40 flex items-start">
      <div className="w-full p-4 bg-white">
        <div className="relative max-w-3xl mx-auto">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input
            autoFocus
            placeholder="Search"
            className="w-full pl-10 pr-12 py-3 border rounded-lg"
          />
          <button
            className="absolute right-3 top-3 text-slate-600"
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityButton() {
  const navigate = useNavigate();
  const { clearActivity, hasUnreadNotifications, activity } =
    useNotifications() || {};
  const counts = activity || {
    likes: 0,
    mentions: 0,
    comments: 0,
    views: 0,
    follow_requests: 0,
  };
  const total = Object.values(counts).reduce((s, v) => s + (Number(v) || 0), 0);

  const fmt = (n) => {
    if (!n) return "";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const parts = [];
  if ((counts.mentions || 0) > 0)
    parts.push({ icon: <FaUser size={12} />, n: counts.mentions });
  if ((counts.follow_requests || 0) > 0)
    parts.push({ icon: <FaUser size={12} />, n: counts.follow_requests });
  if ((counts.likes || 0) > 0)
    parts.push({ icon: <FaHeart size={12} />, n: counts.likes });
  if ((counts.comments || 0) > 0)
    parts.push({ icon: <FaComment size={12} />, n: counts.comments });
  if ((counts.views || 0) > 0)
    parts.push({ icon: <FaEye size={12} />, n: counts.views });

  const handleClick = () => {
    try {
      clearActivity && clearActivity();
    } catch (e) {
      console.warn(e);
    }
    navigate("/notifications");
  };

  return (
    <button
      aria-label="activity"
      className="relative text-slate-600 hover:text-primary-700"
      onClick={handleClick}
    >
      <FaHeart size={18} />
      {hasUnreadNotifications && total > 0 && (
        <div
          className="absolute -top-2 -right-3 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1"
          role="status"
          aria-live="polite"
        >
          {parts.length <= 1 ? (
            <>
              <span className="sr-only">{total} new notifications</span>
              <span>{fmt(total)}</span>
            </>
          ) : (
            <div className="flex items-center gap-1">
              {parts.slice(0, 3).map((p, i) => (
                <span key={i} className="flex items-center gap-1 px-1">
                  {p.icon}
                  <span className="text-[11px]">{p.n > 99 ? "99+" : p.n}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function MessageButton() {
  const navigate = useNavigate();
  const { conversations, markAllRead } = useContext(MessageContext);
  const unread = Array.isArray(conversations)
    ? conversations.reduce((s, c) => s + (Number(c.unread) || 0), 0)
    : 0;

  return (
    <button
      aria-label="messages"
      className="relative text-slate-600 hover:text-primary-700"
      onClick={() => {
        // navigate to messages and mark them read for now
        try {
          markAllRead && markAllRead();
        } catch (e) {
          console.warn(e);
        }
        navigate("/messages");
      }}
    >
      <FiSend size={20} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

export default Navbar;
