import React from "react";
import { Link } from "react-router-dom";
import { FiHome, FiCompass } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* 404 Number */}
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 animate-pulse">
          404
        </h1>

        {/* Message */}
        <p className="mt-6 text-2xl font-semibold text-gray-800">
          Oops! Page not found
        </p>
        <p className="mt-3 text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Emoji */}
        <div className="mt-8 text-6xl">Lost in space</div>

        {/* Action Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <FiHome className="w-6 h-6" />
          Back to Home
        </Link>

        {/* Explore Alternative */}
        <p className="mt-6 text-sm text-gray-500">
          or{" "}
          <Link
            to="/explore"
            className="text-indigo-600 hover:text-indigo-700 font-medium underline-offset-2 hover:underline"
          >
            explore posts <FiCompass className="inline w-4 h-4" />
          </Link>
        </p>
      </div>

      {/* Tailwind Animation Keyframes */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
