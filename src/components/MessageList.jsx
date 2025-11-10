import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCamera,
  FiSearch,
  FiChevronLeft,
  FiChevronDown,
  FiEdit2,
  FiHome,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { MessageContext } from "../context/MessageContext";
import MessageSkeleton from "./MessageSkeleton";
import MessageSearch from "./MessageSearch";

// 📅 Format time difference
const formatTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  // Format as date
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// 📝 Get last message preview text
const getLastMessageText = (conversation) => {
  if (!conversation) return "";

  const messages = conversation.messages || [];
  if (messages.length === 0) return "No messages yet";

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || !lastMsg.text) return "Sent a message";

  return lastMsg.text.length > 50
    ? lastMsg.text.substring(0, 50) + "..."
    : lastMsg.text;
};

// 👤 Get other participant from conversation
const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation || !conversation.participants) return null;
  return conversation.participants.find(
    (p) => String(p._id || p.id) !== String(currentUserId)
  );
};

const MessageList = ({ showHeader = true, embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const { activeUser } = useContext(AuthContext);
  const { conversations = [], loading } = useContext(MessageContext) || {};

  const filtered = (conversations || []).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  const outerClass = embedded
    ? "w-full bg-white h-full flex flex-col"
    : "w-full md:w-80 border-r bg-white h-full flex flex-col";

  return (
    <div className={outerClass}>
      {/* sticky header + optional search (stays on top while list scrolls) */}
      {showHeader && (
        <div
          className="sticky top-0 z-30 bg-white"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="p-2 border-b font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden p-2"
                aria-label="home"
                onClick={() => navigate("/")}
              >
                <FiChevronLeft />
              </button>
              <div className="text-sm font-semibold">
                {activeUser?.username || activeUser?.name || "Messages"}
              </div>
              <FiChevronDown className="text-slate-500" />
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="search users"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                onClick={() => setShowSearch(true)}
                title="Search users to message"
              >
                <FiSearch size={20} />
              </button>
              <button
                aria-label="camera"
                className="p-2 text-lg text-slate-600 hover:bg-slate-100 rounded-lg transition"
                onClick={() => navigate("/messages/new")}
              >
                <FiCamera />
              </button>
              <button
                aria-label="home"
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                onClick={() => navigate("/")}
              >
                <FiHome />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto divide-y">
        {loading ? (
          // show multiple skeleton rows while loading
          Array(6)
            .fill(0)
            .map((_, i) => <MessageSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No conversations yet
          </div>
        ) : (
          filtered.map((c) => {
            const otherUser = getOtherParticipant(
              c,
              activeUser?._id || activeUser?.id
            );
            const displayName =
              otherUser?.displayName || otherUser?.username || "Unknown";
            const avatar = otherUser?.profilePic || otherUser?.avatar;
            const lastMsg = getLastMessageText(c);
            const timeAgo = formatTime(c.lastMessageAt);
            const unreadCount = c.unread || 0;

            return (
              <Link
                key={c._id || c.id}
                to={`/messages/${c._id || c.id}`}
                state={{ from: location.pathname }}
                className="block"
              >
                <div className="p-2 flex items-center gap-2 hover:bg-slate-50 cursor-pointer">
                  <div className="relative">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                    )}
                    {unreadCount > 0 && (
                      <div className="absolute -right-0 -bottom-0 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate text-sm">
                        {displayName}
                      </div>
                      <div className="text-xs text-slate-400">{timeAgo}</div>
                    </div>
                    <div
                      className={`text-xs truncate ${
                        unreadCount > 0
                          ? "text-slate-700 font-semibold"
                          : "text-slate-500"
                      }`}
                    >
                      {lastMsg}
                    </div>
                  </div>

                  <div className="ml-2 flex items-center gap-2">
                    {/* unread dot */}
                    {unreadCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                    {/* camera icon */}
                    <div className="text-slate-400 text-lg">
                      <FiCamera />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Search Modal */}
      {showSearch && <MessageSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
};

export default MessageList;
