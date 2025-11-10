// src/components/Loader.jsx
import React from "react";

/* ---------- Shimmer keyframes (in-file) ---------- */
const shimmerStyle = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
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

/* ---------- Re-usable shimmer block ---------- */
const ShimmerBlock = ({
  w = "w-full",
  h = "h-4",
  rounded = "rounded",
  className = "",
}) => (
  <div
    className={`${w} ${h} ${rounded} bg-gray-200 dark:bg-gray-700 animate-shimmer ${className}`}
  />
);

/* ---------- Icon placeholder ---------- */
const Icon = ({ size = "w-6 h-6", className = "" }) => (
  <div
    className={`${size} bg-gray-300 dark:bg-gray-600 rounded animate-shimmer ${className}`}
  />
);

/* ---------- MAIN LOADER COMPONENT ---------- */
const SnapGramSkeletonLoader = () => {
  return (
    <>
      {/* inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />

      {/* ----- DESKTOP ONLY (lg and larger) ----- */}
      <div className="hidden lg:flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <ShimmerBlock w="w-32" h="h-7" rounded="rounded-md" />
            <div className="flex items-center space-x-3">
              <Icon size="w-6 h-6" />
              <div className="relative">
                <Icon size="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-shimmer" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {[
              "Home",
              "Search",
              "Explore",
              "Messages",
              "Notifications",
              "Create",
              "Profile",
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center space-x-3 p-2 rounded-lg ${
                  i === 0 ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <Icon size="w-6 h-6" />
                <ShimmerBlock w="w-24" h="h-5" rounded="rounded-md" />
              </div>
            ))}
          </aside>

          {/* Main Feed */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto p-4 space-y-6">
              {/* ---- Post 1 ---- */}
              <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-4">
                {/* User */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShimmerBlock w="w-10" h="h-10" rounded="rounded-full" />
                    <div>
                      <ShimmerBlock w="w-24" h="h-4" rounded="rounded-md" />
                      <ShimmerBlock w="w-12" h="h-3" rounded="rounded-md" />
                    </div>
                  </div>
                  <Icon size="w-5 h-5" />
                </div>

                {/* Scores */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Icon size="w-5 h-5" className="text-red-500" />
                      <ShimmerBlock w="w-16" h="h-5" rounded="rounded-md" />
                    </div>
                    <ShimmerBlock w="w-12" h="h-6" rounded="rounded-md" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Icon size="w-5 h-5" className="text-red-500" />
                      <ShimmerBlock w="w-20" h="h-5" rounded="rounded-md" />
                    </div>
                    <ShimmerBlock w="w-12" h="h-6" rounded="rounded-md" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <ShimmerBlock w="w-40" h="h-5" rounded="rounded-md" />
                    <ShimmerBlock
                      w="w-16"
                      h="h-7"
                      rounded="rounded-md font-medium"
                    />
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3" />

                {/* Explained */}
                <div>
                  <ShimmerBlock
                    w="w-full"
                    h="h-5"
                    rounded="rounded-md"
                    className="mb-3"
                  />
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Icon size="w-5 h-5" className="text-pink-500" />
                      <ShimmerBlock w="w-20" h="h-5" rounded="rounded-md" />
                    </div>
                    <ShimmerBlock w="w-12" h="h-6" rounded="rounded-md" />
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-4">
                    {["like", "comment", "share", "save"].map((_, i) => (
                      <div key={i} className="flex items-center space-x-1">
                        <Icon size="w-6 h-6" />
                        <ShimmerBlock w="w-6" h="h-4" rounded="rounded-md" />
                      </div>
                    ))}
                  </div>
                  <Icon size="w-6 h-6" />
                </div>
              </article>

              {/* ---- Post 2 ---- */}
              <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <ShimmerBlock w="w-10" h="h-10" rounded="rounded-full" />
                  <div>
                    <ShimmerBlock w="w-20" h="h-4" rounded="rounded-md" />
                    <ShimmerBlock w="w-12" h="h-3" rounded="rounded-md" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-shimmer" />
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>

      {/* ----- MOBILE: nothing (replace with real UI later) ----- */}
      <div className="lg:hidden">{/* <YourRealMobileComponent /> */}</div>
    </>
  );
};

export default SnapGramSkeletonLoader;
