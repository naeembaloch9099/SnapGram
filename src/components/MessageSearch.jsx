import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiLoader } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { MessageContext } from "../context/MessageContext";
import api from "../services/api";

const MessageSearch = ({ onClose }) => {
  const navigate = useNavigate();
  const { activeUser } = useContext(AuthContext);
  const { conversations = [] } = useContext(MessageContext) || {};

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Show toast notification
  const showToast = (message, type = "info") => {
    // Using simple alert for now, can be replaced with a toast component
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can integrate with your toast system here
  };

  // Search for users by username
  const handleSearch = async (searchTerm) => {
    setQuery(searchTerm);

    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(
        `/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      const users = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      // Filter out current user and already messaged users
      const filtered = users.filter(
        (u) =>
          String(u._id || u.id) !== String(activeUser?._id || activeUser?.id)
      );

      setResults(filtered);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection - open chat or follow
  const handleUserSelect = async (user) => {
    try {
      setActionLoading((prev) => ({ ...prev, [user._id]: true }));

      // Check if user is following
      const currentMe = activeUser;
      const isFollowing = currentMe?.following?.some(
        (f) => String(f._id || f) === String(user._id || user.id)
      );

      // If private account and not following, show toast and don't proceed
      if (user.isPrivate && !isFollowing) {
        showToast(
          `${user.username} is a private account. Follow them first to message.`,
          "info"
        );
        setActionLoading((prev) => ({ ...prev, [user._id]: false }));
        return;
      }

      // Check if conversation already exists
      const existingConv = conversations.find((c) =>
        c.participants?.some((p) => String(p._id || p.id) === String(user._id))
      );

      if (existingConv) {
        // Open existing conversation
        navigate(`/messages/${existingConv._id || existingConv.id}`);
      } else {
        // Create new conversation via API
        const res = await api.post("/messages/conversations", {
          participantId: user._id,
        });
        const convId = res.data._id || res.data.id;
        navigate(`/messages/${convId}`);
      }

      onClose?.();
    } catch (err) {
      console.error("Error opening chat:", err);
      showToast("Failed to open chat. Please try again.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-4 sm:pt-20 md:pt-24">
      <div className="bg-white rounded-2xl w-[95%] max-w-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Search Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 border border-slate-200 rounded-xl outline-none text-base sm:text-lg placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
              aria-label="Close search"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <FiLoader className="mx-auto text-2xl text-indigo-600 animate-spin mb-3" />
              <p className="text-slate-500">Searching...</p>
            </div>
          ) : query && results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 text-lg">No users found</p>
              <p className="text-slate-400 text-sm mt-2">
                Try searching with a different username
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((user) => {
                const isLoading = actionLoading[user._id];
                const currentMe = activeUser;
                const isFollowing = currentMe?.following?.some(
                  (f) => String(f._id || f) === String(user._id)
                );
                const canMessage = !user.isPrivate || isFollowing;

                return (
                  <div
                    key={user._id || user.id}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition flex items-center justify-between group"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <img
                        src={
                          user.profilePic ||
                          user.avatar ||
                          `https://i.pravatar.cc/150?u=${user.username}`
                        }
                        alt={user.username}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                        onError={(e) => {
                          e.currentTarget.src = `https://i.pravatar.cc/150?u=${user.username}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                            {user.displayName || user.username}
                          </div>
                          {user.isPrivate && (
                            <span className="text-lg flex-shrink-0">🔒</span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 truncate">
                          @{user.username}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleUserSelect(user)}
                      disabled={isLoading || !canMessage}
                      title={
                        !canMessage
                          ? `Follow ${user.username} first to message`
                          : `Message ${user.username}`
                      }
                      className={`ml-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition flex-shrink-0 whitespace-nowrap ${
                        canMessage
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <FiLoader className="inline animate-spin" />
                      ) : canMessage ? (
                        "Message"
                      ) : (
                        "Follow First"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <FiSearch className="mx-auto text-4xl mb-3 text-slate-300" />
              <p className="text-lg">Search for users to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageSearch;
