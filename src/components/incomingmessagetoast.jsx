import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";

const IncomingMessageToast = ({ toastData, onClose }) => {
  const navigate = useNavigate();
  const { sender, text, conversation } = toastData;

  // Auto-close the toast after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  // Handle clicking the toast
  const handleClick = () => {
    navigate(`/messages/${conversation}`);
    onClose();
  };

  return (
    <div
      className="fixed top-20 right-5 z-[100] w-full max-w-sm cursor-pointer"
      onClick={handleClick}
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 flex items-center space-x-3 border dark:border-gray-700">
        {/* Avatar */}
        {sender.profilePic ? (
          <img
            src={sender.profilePic}
            alt="sender"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xl uppercase text-white">
              {(sender.username || "?").charAt(0)}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {sender.displayName || sender.username}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {text}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Don't trigger click on parent
            onClose();
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default IncomingMessageToast;
