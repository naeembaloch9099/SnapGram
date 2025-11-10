import React from "react";
const ProfileSkeleton = () => {
  return (
    <>
      {/* Desktop / large screens: profile skeleton */}
      <div className="hidden lg:block max-w-4xl mx-auto px-4 py-8 bg-white min-h-screen">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          <div className="shrink-0 relative">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border-4 border-white shadow-lg" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto md:mx-0 animate-pulse" />
            <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto md:mx-0 animate-pulse" />

            <div className="flex justify-center md:justify-start gap-8 mt-6">
              <div className="space-y-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-600 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-600 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-600 rounded animate-pulse" />
              </div>
            </div>

            <div className="mt-5 h-3 bg-gray-100 dark:bg-gray-700 rounded w-64 mx-auto md:mx-0 animate-pulse" />
          </div>
        </div>

        <div className="border-t border-gray-200 my-8" />

        {/* grid skeleton */}
        <div className="grid grid-cols-3 gap-1 md:gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Mobile: show compact loader only */}
      <div className="lg:hidden">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-black p-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    </>
  );
};

export default ProfileSkeleton;
