import React from "react";
import { FiLoader } from "react-icons/fi";

const Loader = ({ size = "md", fullScreen = false }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      {/* Gradient Ring Spinner */}
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]} 
            border-4 border-gray-200 
            rounded-full 
            animate-spin 
            border-t-transparent 
            border-t-gradient-to-r 
            from-indigo-500 
            to-pink-500
          `}
          style={{
            borderTopColor: "transparent",
            borderImage: "linear-gradient(90deg, #6366f1, #ec4899) 1",
          }}
        />

        {/* Inner Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full animate-ping" />
        </div>

        {/* Icon (optional) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <FiLoader className={`w-1/2 h-1/2 text-indigo-600 animate-spin`} />
        </div>
      </div>

      {/* Optional Text */}
      <p className="mt-6 text-sm font-medium text-gray-600 animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default Loader;
