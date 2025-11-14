import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSuggestions, followUser } from "../services/userService";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";

const SuggestionsCard = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const { toasts, showToast, removeToast } = useToast();

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetchSuggestions(3);
      setSuggestions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleFollow = async (username, userId) => {
    try {
      setFollowingIds((prev) => new Set([...prev, userId]));
      await followUser(username);
      showToast(`Following ${username}`, "success");

      // Remove from suggestions after following
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    } catch (error) {
      console.error("Failed to follow user:", error);
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      showToast("Failed to follow user", "error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Suggestions For You
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-2.5 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Suggestions For You
        </h3>
        <div className="text-center py-6">
          <p className="text-xs text-gray-500 mb-2">No suggestions available</p>
          <button
            onClick={loadSuggestions}
            className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Suggestions For You
          </h3>
          <button
            onClick={loadSuggestions}
            className="text-xs font-semibold text-blue-500 hover:text-blue-600"
          >
            See All
          </button>
        </div>

        <div className="space-y-3">
          {suggestions.map((user) => (
            <div key={user._id} className="flex items-center gap-3">
              {/* Avatar */}
              <Link to={`/profile/${user.username}`}>
                <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-gray-200 hover:ring-gray-300 transition-all">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.username}`}>
                  <h4 className="font-semibold text-sm text-gray-900 truncate hover:text-gray-600 transition-colors">
                    {user.username}
                  </h4>
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {user.name || "SnapGram User"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Followed by {user.followersCount || 0}{" "}
                  {user.followersCount === 1 ? "other" : "others"}
                </p>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(user.username, user._id)}
                disabled={followingIds.has(user._id)}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                  followingIds.has(user._id)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                }`}
              >
                {followingIds.has(user._id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default SuggestionsCard;
