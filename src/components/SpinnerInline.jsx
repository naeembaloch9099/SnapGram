import React from "react";

const BestSkeletonLoader = ({ count = 1, className = "" }) => {
  // --- Custom Shimmer Effect Classes (Requires Tailwind Config Update) ---
  const SHIMMER_CLASS =
    "relative overflow-hidden bg-gray-200 dark:bg-gray-700 " +
    "after:absolute after:inset-0 " +
    "after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent " +
    "after:animate-shimmer";

  // --- Utility Component for a Shimmering Block ---
  const ShimmerBlock = ({ w, h, rounded = "rounded", customClass = "" }) => (
    <div
      className={`${w} ${h} ${rounded} ${SHIMMER_CLASS} ${customClass}`}
    ></div>
  );

  // --- Main List Item Skeleton Structure ---
  const ListItemSkeleton = ({ extraClass = "" }) => (
    <div
      className={`p-4 border border-gray-100 dark:border-gray-800 rounded-xl mb-4 ${extraClass}`}
    >
      {/* Header/Avatar Area */}
      <div className="flex items-center space-x-3 mb-3">
        <ShimmerBlock w="w-10" h="h-10" rounded="rounded-full" />
        <div className="flex flex-col space-y-1 w-full">
          <ShimmerBlock w="w-1/3" h="h-5" rounded="rounded-md" />
          <ShimmerBlock w="w-1/4" h="h-3" rounded="rounded-md" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-2">
        <ShimmerBlock w="w-full" h="h-4" />
        <ShimmerBlock w="w-11/12" h="h-4" />
        <ShimmerBlock w="w-3/4" h="h-4" />
      </div>

      {/* Footer/Action Bar Area */}
      <div className="flex mt-4 space-x-4">
        <ShimmerBlock w="w-16" h="h-6" rounded="rounded-full" />
        <ShimmerBlock w="w-16" h="h-6" rounded="rounded-full" />
      </div>
    </div>
  );

  // --- Render Logic ---
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <ListItemSkeleton key={index} extraClass={className} />
        ))}
    </>
  );
};

export default BestSkeletonLoader;
