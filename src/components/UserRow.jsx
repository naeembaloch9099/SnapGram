import React from "react";
import { Link } from "react-router-dom";

const UserRow = ({
  user = {},
  onFollow = null,
  followLoading = false,
  showMessage = false,
  onMessage = null,
  actionVariant = "follow", // 'follow' | 'remove' | 'following'
}) => {
  const displayName = user.displayName || user.name || user.username || "User";
  const avatar = user.profilePic || user.avatar || user.profileImage || null;

  return (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition">
      <Link
        to={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-100 flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white font-semibold text-lg">
              {String(displayName[0] || "U").toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {user.username}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {user.name || user.displayName || ""}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 ml-2">
        {showMessage && (
          <button
            onClick={onMessage}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            Message
          </button>
        )}

        {actionVariant === "follow" && (
          <button
            onClick={() => onFollow && onFollow(user)}
            disabled={followLoading}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${
              followLoading
                ? "bg-gray-100 text-gray-400"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {followLoading ? "..." : "Follow"}
          </button>
        )}

        {actionVariant === "following" && (
          <button
            disabled
            className="px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-700"
          >
            Following
          </button>
        )}

        {actionVariant === "remove" && (
          <button
            onClick={() => onFollow && onFollow(user)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default UserRow;
