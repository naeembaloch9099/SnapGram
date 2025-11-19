import React from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ToastItem = ({ toast, onRemove }) => {
  const { id, message, type } = toast;

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
  }[type];

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  }[type];

  const iconColor = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-yellow-500",
  }[type];

  const Icon = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    info: FiInfo,
    warning: FiAlertCircle,
  }[type];

  // Allow message to be a React node, an object with `.message`, or a string.
  // If it's a React element, render it directly. If it's an object, prefer
  // `.message` key. Otherwise render string or JSON fallback.
  const renderMessage = React.isValidElement(message)
    ? message
    : message && typeof message === "object"
    ? message.message || JSON.stringify(message)
    : message;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-md ${bgColor} animate-slideIn`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <p className={`font-medium text-sm flex-1 ${textColor}`}>
        {renderMessage}
      </p>
      <button
        onClick={() => onRemove(id)}
        className={`p-1 hover:bg-gray-200 rounded transition flex-shrink-0 ${textColor}`}
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
