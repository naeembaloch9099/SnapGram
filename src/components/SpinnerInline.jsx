import React from "react";

// Shimmer Animation Keyframes (Tailwind-compatible via inline style)
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite;
  }
  .dark .animate-shimmer {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  }
`;

// Reusable Shimmer Block
const ShimmerBlock = ({
  w = "w-full",
  h = "h-4",
  rounded = "rounded",
  className = "",
}) => (
  <div
    className={`${w} ${h} ${rounded} bg-gray-200 dark:bg-gray-700 animate-shimmer ${className}`}
  ></div>
);

// Icon Placeholder
const Icon = ({ size = "w-6 h-6" }) => (
  <div
    className={`${size} bg-gray-300 dark:bg-gray-600 rounded animate-shimmer`}
  ></div>
);

const InstagramSkeletonLoader = () => {
  return (
    <>
      {/* Inject Shimmer Animation */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />

      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
        {/* Header */}
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <ShimmerBlock w="w-28" h="h-8" rounded="rounded" />

            {/* Search Bar - Hidden on Mobile */}
            <div className="hidden md:block flex-1 max-w-xs mx-8">
              <ShimmerBlock w="w-full" h="h-9" rounded="rounded-full" />
            </div>

            {/* Nav Icons */}
            <div className="flex items-center space-x-4 md:space-x-6">
              <Icon />
              <Icon />
              <Icon />
              <Icon />
              <ShimmerBlock w="w-8" h="h-8" rounded="rounded-full" />
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-64 space-y-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <ShimmerBlock w="w-14" h="h-14" rounded="rounded-full" />
                  <div className="flex-1 space-y-2">
                    <ShimmerBlock w="w-32" h="h-4" rounded="rounded-md" />
                    <ShimmerBlock w="w-20" h="h-3" rounded="rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex-1 max-w-2xl">
            {/* Stories */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 mb-6">
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center space-y-1 flex-shrink-0"
                  >
                    <div className="relative p-1 bg-gradient-to-tr from-yellow-400 to-pink-600 rounded-full">
                      <ShimmerBlock w="w-14" h="h-14" rounded="rounded-full" />
                    </div>
                    <ShimmerBlock w="w-14" h="h-3" rounded="rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Posts */}
            {[...Array(3)].map((_, i) => (
              <article
                key={i}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6 overflow-hidden"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <ShimmerBlock w="w-10" h="h-10" rounded="rounded-full" />
                    <div className="space-y-1">
                      <ShimmerBlock w="w-32" h="h-4" rounded="rounded-md" />
                      <ShimmerBlock w="w-20" h="h-3" rounded="rounded-md" />
                    </div>
                  </div>
                  <Icon size="w-6 h-6" />
                </div>

                {/* Image */}
                <div className="bg-gray-200 dark:bg-gray-800 h-96 animate-shimmer"></div>

                {/* Actions */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex space-x-4">
                    <Icon size="w-7 h-7" />
                    <Icon size="w-7 h-7" />
                    <Icon size="w-7 h-7" />
                  </div>
                  <Icon size="w-7 h-7" />
                </div>

                {/* Likes */}
                <div className="px-3 pb-1">
                  <ShimmerBlock w="w-24" h="h-4" rounded="rounded-md" />
                </div>

                {/* Caption */}
                <div className="px-3 pb-2 space-y-1">
                  <ShimmerBlock w="w-full" h="h-4" rounded="rounded-md" />
                  <ShimmerBlock w="w-11/12" h="h-4" rounded="rounded-md" />
                  <ShimmerBlock w="w-3/4" h="h-4" rounded="rounded-md" />
                </div>

                {/* View Comments */}
                <div className="px-3 pb-2">
                  <ShimmerBlock w="w-32" h="h-3" rounded="rounded-md" />
                </div>

                {/* Time */}
                <div className="px-3 pb-3">
                  <ShimmerBlock w="w-20" h="h-3" rounded="rounded-md" />
                </div>
              </article>
            ))}
          </main>

          {/* Right Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-80">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <ShimmerBlock w="w-32" h="h-5" rounded="rounded-md" />
                <ShimmerBlock w="w-16" h="h-4" rounded="rounded-md" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ShimmerBlock w="w-11" h="h-11" rounded="rounded-full" />
                      <div className="space-y-1">
                        <ShimmerBlock w="w-24" h="h-4" rounded="rounded-md" />
                        <ShimmerBlock w="w-20" h="h-3" rounded="rounded-md" />
                      </div>
                    </div>
                    <ShimmerBlock
                      w="w-16"
                      h="h-7"
                      rounded="rounded-md bg-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Hide Scrollbar for Stories */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default InstagramSkeletonLoader;
