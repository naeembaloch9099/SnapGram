import React from "react";
import Skeleton from "react-loading-skeleton";

const MessageSkeleton = () => {
  return (
    <div className="p-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer">
      <div className="relative">
        <Skeleton circle={true} width={40} height={40} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="font-medium truncate text-sm">
            <Skeleton width={120} height={14} />
          </div>
          <div className="text-xs text-slate-400">
            <Skeleton width={40} height={10} />
          </div>
        </div>
        <div className="text-xs truncate text-slate-500">
          <Skeleton width={`80%`} height={10} />
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
