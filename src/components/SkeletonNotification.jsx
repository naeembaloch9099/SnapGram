import React from "react";

const SkeletonNotification = () => {
  return (
    <div className="flex items-start gap-3 bg-white p-3 rounded hover:bg-slate-50 transition">
      <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-56 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
    </div>
  );
};

export default SkeletonNotification;
