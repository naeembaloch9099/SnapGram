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

// 📝 Get last message preview text (prefix with "You:" when the active user sent it)
const getLastMessageText = (conversation, currentUserId) => {
  if (!conversation) return "";

  const messages = conversation.messages || [];
  if (messages.length === 0) return "No messages yet";

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg) return "Sent a message";

  const text =
    lastMsg.text ||
    (lastMsg.media
      ? `[${String(lastMsg.media).toUpperCase()}]`
      : "Sent a message");

  const senderId = lastMsg.sender?._id || lastMsg.sender || null;
  const isMe = senderId && String(senderId) === String(currentUserId);

  const truncated = text.length > 50 ? text.substring(0, 50) + "..." : text;
  return isMe ? `You: ${truncated}` : truncated;
};

// 👤 Get other participant from conversation
const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation || !conversation.participants) return null;
  return conversation.participants.find(
    (p) => String(p._id || p.id) !== String(currentUserId)
  );
};

const MessageList = ({ showHeader = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const { activeUser } = useContext(AuthContext);
  const { conversations = [], loading } = useContext(MessageContext) || {};

  const filtered = (conversations || []).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  return (
    <div className="w-full bg-white h-full flex flex-col font-sans">
      {/* Instagram-style Header */}
      {showHeader && (
        <div className="border-b border-[#DBDBDB] px-5 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden -ml-2"
              aria-label="back"
              onClick={() => navigate("/")}
            >
              <FiChevronLeft size={28} className="text-[#262626]" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition">
              <span
                className="text-base font-semibold text-[#262626]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {activeUser?.username || "username"}
              </span>
              <FiChevronDown size={20} className="text-[#262626]" />
            </div>
          </div>
          <button
            aria-label="New message"
            className="p-2 hover:bg-[#FAFAFA] rounded-full transition"
            onClick={() => navigate("/messages/new")}
          >
            <svg
              aria-label="New message"
              className="text-[#262626]"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <path
                d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 0 1 2.004 0l1.224 1.225a1.417 1.417 0 0 1 0 2.004Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <line
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="16.848"
                x2="20.076"
                y1="3.924"
                y2="7.153"
              ></line>
            </svg>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-[#DBDBDB]">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full px-4 py-2 bg-[#EFEFEF] rounded-lg text-left text-[#8E8E8E] text-sm hover:bg-[#E0E0E0] transition"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Search messages...
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <MessageSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#262626] flex items-center justify-center mb-4">
              <svg
                aria-label="Direct"
                className="w-10 h-10"
                fill="currentColor"
                height="96"
                role="img"
                viewBox="0 0 96 96"
                width="96"
              >
                <path
                  d="M48 0C21.532 0 0 21.533 0 48s21.532 48 48 48 48-21.532 48-48S74.468 0 48 0Zm0 94C22.636 94 2 73.364 2 48S22.636 2 48 2s46 20.636 46 46-20.636 46-46 46Zm12.227-53.284-7.257 5.507c-.49.37-1.166.375-1.661.005l-5.373-4.031a3.453 3.453 0 0 0-4.989.921l-6.756 10.718c-.653 1.027.615 2.189 1.582 1.453l7.257-5.507a1.382 1.382 0 0 1 1.661-.005l5.373 4.031a3.453 3.453 0 0 0 4.989-.92l6.756-10.719c.653-1.027-.615-2.189-1.582-1.453Z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
            <p className="text-sm text-[#737373] text-center">
              No conversations yet
            </p>
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
            const lastMsg = getLastMessageText(
              c,
              activeUser?._id || activeUser?.id
            );
            const timeAgo = formatTime(c.lastMessageAt);
            const unreadCount = c.unread || 0;

            return (
              <Link
                key={c._id || c.id}
                to={`/messages/${c._id || c.id}`}
                state={{ from: location.pathname }}
                className="block"
              >
                <div className="px-5 py-2 flex items-center gap-3 hover:bg-[#FAFAFA] cursor-pointer transition-colors duration-200">
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-14 h-14 rounded-full object-cover"
                        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white font-semibold text-lg"
                        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
                      >
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-3 border-b border-[#DBDBDB]">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`text-sm truncate ${
                          unreadCount > 0
                            ? "font-semibold text-[#262626]"
                            : "font-normal text-[#262626]"
                        }`}
                        style={{
                          fontFamily:
                            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}
                      >
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-2 ml-2">
                        <span
                          className="text-xs text-[#737373] flex-shrink-0"
                          style={{
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                        >
                          {timeAgo}
                        </span>
                        {unreadCount > 0 && (
                          <div className="w-2 h-2 rounded-full bg-[#0095F6]" />
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        unreadCount > 0
                          ? "text-[#262626] font-medium"
                          : "text-[#737373] font-normal"
                      }`}
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {lastMsg}
                    </p>
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
