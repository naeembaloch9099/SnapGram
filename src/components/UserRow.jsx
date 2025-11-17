import React from "react";
import { Link } from "react-router-dom";

const UserRow = ({
  user = {},
  onFollow = null,
  followLoading = false,
  showMessage = false,
  onMessage = null,
  actionVariant = "follow", // 'follow' | 'remove' | 'following'
  dense = false,
  isMutual = false,
}) => {
  const displayName = user.displayName || user.name || user.username || "User";
  const avatar = user.profilePic || user.avatar || user.profileImage || null;

  const avatarSizeClass = dense ? "w-10 h-10" : "w-14 h-14";
  const rootPadding = dense ? "py-2 px-1" : "py-3 px-2";
  const btnClass = dense ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";

  return (
    <div
      className={`flex items-center justify-between ${rootPadding} hover:bg-gray-50 rounded-lg transition`}
    >
      <Link
        to={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div
          className={`${avatarSizeClass} rounded-full overflow-hidden ring-1 ring-gray-100 flex-shrink-0`}
        >
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
          <div className="text-sm text-gray-500 truncate flex items-center gap-2">
            <span>{user.name || user.displayName || ""}</span>
            {isMutual && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                Follows you
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 ml-2">
        {showMessage && (
          <button
            onClick={onMessage}
            className={` ${btnClass} bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition`}
          >
            Message
          </button>
        )}

        {actionVariant === "follow" && (
          <button
            onClick={() => onFollow && onFollow(user)}
            disabled={followLoading}
            className={`${btnClass} rounded-lg font-medium transition disabled:opacity-50 ${
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
            className={`${btnClass} rounded-lg font-medium bg-gray-100 text-gray-700`}
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
