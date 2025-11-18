// StoryBubble.jsx
import React from "react";

const StoryBubble = ({ group, isYourStory = false, onClick, onAdd }) => {
  const hasUnseen = (group?.stories || []).some((s) => !s.viewed);
  const ringClass = hasUnseen ? "ring-4 ring-yellow-400" : "bg-gray-200";

  const avatarSrc = group?.profilePic || "/default-avatar.png";

  return (
    <div className="flex flex-col items-center w-20">
      <div className="relative">
        <button
          onClick={onClick}
          className={`w-16 h-16 rounded-full p-0.5 ${ringClass} flex items-center justify-center`}
          aria-label={
            isYourStory ? "View your story" : `View ${group?.username} story`
          }
        >
          <div className="w-full h-full rounded-full bg-white overflow-hidden">
            <img
              src={avatarSrc}
              alt={group?.username || "user"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget &&
                  (e.currentTarget.src = "/default-avatar.png");
              }}
            />
          </div>
        </button>

        {/* '+' overlay positioned cleanly at bottom-right of avatar */}
        {isYourStory && (
          <button
            aria-label="Add story"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onAdd === "function") return onAdd(e);
              if (typeof onClick === "function") return onClick();
            }}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center border-2 border-white shadow"
          >
            +
          </button>
        )}
      </div>

      <div className="text-xs mt-2 max-w-[64px] truncate text-center text-gray-700">
        {isYourStory ? "Your Story" : group?.username || "User"}
      </div>
    </div>
  );
};

export default StoryBubble;
