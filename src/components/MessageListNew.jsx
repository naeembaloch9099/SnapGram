import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiCamera } from "react-icons/fi";

const DUMMY = [
  {
    id: 1,
    name: "pro legend",
    last: "3 new messages",
    time: "3h",
    isPrivate: false,
    unread: 3,
    online: false,
  },
  {
    id: 2,
    name: "Zeeshan",
    last: "Sent a reel by savage_",
    time: "8h",
    isPrivate: false,
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Hammad hamid",
    last: "2 new messages",
    time: "8h",
    isPrivate: true,
    unread: 2,
    online: false,
  },
  {
    id: 4,
    name: "Kashif Baloch",
    last: "2 new messages",
    time: "14h",
    isPrivate: false,
    unread: 2,
    online: false,
  },
  {
    id: 5,
    name: "zeeshan Bangash",
    last: "Sent a reel by shikarli",
    time: "16h",
    isPrivate: false,
    unread: 0,
    online: true,
  },
  {
    id: 6,
    name: "Ali Huzaifa",
    last: "Liked a message",
    time: "17h",
    isPrivate: false,
    unread: 0,
    online: false,
  },
  {
    id: 7,
    name: "Akbar Baloch",
    last: "Sent a reel by imshah",
    time: "18h",
    isPrivate: false,
    unread: 0,
    online: false,
  },
  {
    id: 8,
    name: "Azwar Malik",
    last: "Sent a reel by memesby...",
    time: "23h",
    isPrivate: false,
    unread: 0,
    online: false,
  },
  {
    id: 9,
    name: "Zia Ur Rehman",
    last: "2 new messages",
    time: "1d",
    isPrivate: false,
    unread: 2,
    online: false,
  },
  {
    id: 10,
    name: "Adeel Sandhu",
    last: "You replied to their story",
    time: "2d",
    isPrivate: false,
    unread: 0,
    online: false,
  },
];

const MessageListNew = () => {
  const location = useLocation();

  return (
    <div className="w-full md:w-80 border-r bg-white h-full flex flex-col">
      <div className="p-3 border-b font-semibold flex items-center justify-between">
        <div>Messages</div>
        <button aria-label="camera" className="p-2 text-lg text-slate-600">
          <FiCamera />
        </button>
      </div>

      <div className="overflow-auto divide-y">
        {DUMMY.map((c) => (
          <Link
            key={c.id}
            to={`/messages/${c.id}`}
            state={{ from: location.pathname }}
            className="block"
          >
            <div className="p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
                {c.unread > 0 && (
                  <div className="absolute -right-0 -bottom-0 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />
                )}
                {c.online && (
                  <div className="absolute -left-0 -bottom-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.time}</div>
                </div>
                <div className="text-sm text-slate-500 truncate">{c.last}</div>
              </div>

              <div className="ml-3 flex items-center gap-2">
                {/* lock icon */}
                <div className="text-slate-400 text-sm">
                  {c.isPrivate ? "🔒" : "🔓"}
                </div>
                {/* camera icon on far right */}
                <div className="text-slate-400 text-lg">
                  <FiCamera />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MessageListNew;
