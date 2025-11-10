import React from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import MessageList from "../../components/MessageList";
import MessageChatBox from "../../components/MessageChatBox";

// Messages page renders the list and chat. On mobile, when a conversation is
// selected we hide the list and show the chat full-screen (mimicking the app
// behavior in your screenshots).
const Messages = () => {
  const { id } = useParams();

  if (!id) {
    // Full-page messages list (mobile and desktop) — header matches Notifications page style
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="text-slate-600 p-2 rounded hover:bg-slate-100"
              aria-label="Back to home"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold">Messages</h1>
          </div>

          <div className="bg-white rounded-md shadow-sm">
            {/* render the list without the internal header and with inner padding to match Notifications layout */}
            <div className="p-2">
              <MessageList showHeader={false} embedded={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-0 md:p-4 flex gap-4 h-[calc(100vh-4rem)] md:h-auto messaging-container">
      {/* left: list (on small = full width when no convo selected; on md it's a column) */}
      <div
        className={`w-full md:w-80 border-r bg-white h-full chat-sidebar ${
          id ? "hidden md:block" : "block"
        }`}
      >
        <MessageList />
      </div>

      {/* center/right: chat area
          - On small screens we only show the chat when an id is present (so tapping a contact opens a full-screen chat).
          - On md+ screens the chat is always visible as the right pane. */}
      <div
        className={`${
          id ? "flex-1 block" : "hidden md:flex-1 md:block"
        } bg-white h-full chat-main`}
      >
        <MessageChatBox conversationId={id} />
      </div>
    </div>
  );
};

export default Messages;
