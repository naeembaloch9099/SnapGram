import React from "react";
import { useParams, Link } from "react-router-dom";
import MessageList from "../../components/MessageList";
import MessageChatBox from "../../components/MessageChatBox";

// Instagram-style Messages page with exact 3-column layout
const Messages = () => {
  const { id } = useParams();

  // Mobile: single view - either list or chat
  // Desktop: split view - list + chat side by side
  return (
    <div
      className="h-screen md:h-[calc(100vh-4rem)] flex bg-[#FAFAFA]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Left: Message List - Instagram style */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] bg-white h-full ${
          id ? "hidden md:block" : "block"
        }`}
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
      >
        <MessageList />
      </div>

      {/* Right: Chat Area - Instagram style */}
      <div
        className={`flex-1 bg-white h-full ${
          id
            ? "block"
            : "hidden md:flex md:flex-col md:items-center md:justify-center"
        }`}
      >
        {id ? (
          <MessageChatBox conversationId={id} />
        ) : (
          // Empty state when no conversation selected (desktop only)
          <div className="hidden md:flex flex-col items-center justify-center h-full px-4">
            <div className="w-24 h-24 rounded-full border-2 border-[#262626] flex items-center justify-center mb-5">
              <svg
                aria-label="Direct"
                className="w-12 h-12"
                fill="currentColor"
                height="96"
                role="img"
                viewBox="0 0 96 96"
                width="96"
              >
                <path
                  d="M48 0C21.532 0 0 21.533 0 48s21.532 48 48 48 48-21.532 48-48S74.468 0 48 0Zm0 94C22.636 94 2 73.364 2 48S22.636 2 48 2s46 20.636 46 46-20.636 46-46 46Zm12.227-53.284-7.257 5.507c-.49.37-1.166.375-1.661.005l-5.373-4.031a3.453 3.453 0 0 0-4.989.921l-6.756 10.718c-.653 1.027.615 2.189 1.582 1.453l7.257-5.507a1.382 1.382 0 0 1 1.661-.005l5.373 4.031a3.453 3.453 0 0 0 4.989-.92l6.756-10.719c.653-1.027-.615-2.189-1.582-1.453Z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
            <h2 className="text-[22px] font-light text-[#262626] mb-2">
              Your messages
            </h2>
            <p className="text-sm text-[#737373] text-center max-w-[350px] mb-6">
              Send private photos and messages to a friend or group.
            </p>
            <Link
              to="/messages/new"
              className="px-6 py-2 bg-[#0095F6] text-white font-semibold rounded-lg hover:bg-[#1877F2] transition-all duration-200"
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
            >
              Send Message
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
