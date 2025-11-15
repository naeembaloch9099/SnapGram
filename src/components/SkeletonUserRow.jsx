import React from "react";

const SkeletonUserRow = () => {
  return (
    <div className="flex items-center justify-between py-3 px-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-36 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
      </div>
      <div className="ml-2">
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
};

export default SkeletonUserRow;
