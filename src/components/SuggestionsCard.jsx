import React, { useState, useEffect } from "react";
import { fetchSuggestions, followUser } from "../services/userService";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";
import UserRow from "./UserRow";
import SkeletonUserRow from "./SkeletonUserRow";

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
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonUserRow key={i} />
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
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
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
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {suggestions.map((user) => (
            <UserRow
              key={user._id}
              user={user}
              onFollow={() => handleFollow(user.username, user._id)}
              followLoading={followingIds.has(user._id)}
              actionVariant={
                followingIds.has(user._id) ? "following" : "follow"
              }
            />
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default SuggestionsCard;
