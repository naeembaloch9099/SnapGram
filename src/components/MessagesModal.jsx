import React, { useEffect } from "react";
import MessageList from "./MessageList";
import MessageChatBox from "./MessageChatBox";
import { FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";

const MessagesModal = ({ open, onClose }) => {
  const location = useLocation();

  // if user navigates to /messages or /messages/:id close the quick modal so
  // they land on the full messages screen instead of the overlay persisting.
  useEffect(() => {
    if (!open) return;
    if (location.pathname.startsWith("/messages")) onClose?.();
  }, [location.pathname, open, onClose]);

  // lock background scroll while modal is open to avoid the page content
  // scrolling/peeking under the overlay on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-black/40 flex items-start justify-center md:items-stretch md:justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl h-full md:h-auto md:rounded-l-xl bg-white md:shadow-xl md:max-w-4xl flex flex-col md:flex-row"
      >
        <div className="flex items-center justify-between p-3 border-b md:hidden">
          <div className="font-semibold">Messages</div>
          <button onClick={onClose} aria-label="close" className="p-2">
            <FiX />
          </button>
        </div>

        <div className="flex-1 md:flex md:flex-row h-full">
          <MessageList />
          <MessageChatBox />
        </div>
      </div>
    </div>
  );
};

export default MessagesModal;
