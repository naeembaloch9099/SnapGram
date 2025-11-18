import React from "react";

const StoryBubble = ({ group }) => {
  const newest = group.stories && group.stories[0];
  const img = group.profilePic || newest?.profilePic || "/default-avatar.png";
  const hasViewed = !!group.hasViewed;

  return (
    <div className="flex flex-col items-center w-20">
      <div
        className={`w-16 h-16 rounded-full p-0.5 ${
          hasViewed ? "bg-gray-200" : "ring-4 ring-yellow-400"
        }`}
      >
        <div className="w-full h-full rounded-full bg-white overflow-hidden">
          <img
            src={img}
            alt={group.username || "user"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="text-xs mt-2 max-w-[64px] truncate text-center text-gray-700">
        {group.username || "User"}
      </div>
    </div>
  );
};

export default StoryBubble;
