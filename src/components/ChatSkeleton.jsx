import React from "react";
import Skeleton from "react-loading-skeleton";

const ChatSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="p-3 border-b flex items-center gap-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Skeleton circle width={40} height={40} />
        <div className="flex-1 min-w-0">
          <Skeleton width={160} height={14} />
          <div className="text-xs text-slate-400">
            <Skeleton width={80} height={10} />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* a few left/right bubbles */}
        <div className="max-w-[70%] bg-slate-100 p-3 rounded-lg mb-3">
          <Skeleton count={2} />
        </div>
        <div className="ml-auto max-w-[70%] bg-purple-600 text-white p-3 rounded-lg mb-3">
          <Skeleton count={1} />
        </div>
        <div className="max-w-[70%] bg-slate-100 p-3 rounded-lg mb-3">
          <Skeleton count={3} />
        </div>
        <div className="ml-auto max-w-[70%] bg-purple-600 text-white p-3 rounded-lg mb-3">
          <Skeleton count={1} />
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-100">
            <Skeleton circle width={40} height={40} />
          </div>
          <div className="flex-1">
            <Skeleton height={40} />
          </div>
          <div className="w-10">
            <Skeleton width={32} height={32} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSkeleton;
