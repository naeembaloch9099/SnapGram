import React, { useContext } from "react";
import { MessageContext } from "../context/MessageContext";
import { useNotifications } from "../context/NotificationContext";
import { useQueryClient } from "@tanstack/react-query";
import { useConversations } from "../hooks/useConversations";
import { useNotificationsData } from "../hooks/useNotifications";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiCompass,
  FiMessageCircle,
  FiBell,
  FiPlusSquare,
  FiUser,
} from "react-icons/fi";

const items = [
  { to: "/", label: "Home", icon: <FiHome /> },
  { to: "/explore", label: "Search", icon: <FiSearch /> },
  { to: "/reels", label: "Reels", icon: <FiCompass /> },
  { to: "/messages", label: "Messages", icon: <FiMessageCircle /> },
  { to: "/notifications", label: "Notifications", icon: <FiBell /> },
  { to: "/create", label: "Create", icon: <FiPlusSquare /> },
  { to: "/profile/me", label: "Profile", icon: <FiUser /> },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { conversations = [] } = useContext(MessageContext) || {};
  const { hasUnreadNotifications } = useNotifications() || {};
  // ensure queries exist in react-query cache without forcing sync fetch
  useConversations({ enabled: false });
  useNotificationsData(false, { enabled: false });

  const unreadConversations = Array.isArray(conversations)
    ? conversations.filter((c) => Number(c.unread) > 0).length
    : 0;
  return (
    <aside className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-64 xl:w-72 2xl:w-80 border-r border-gray-200/50 bg-white/80 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto py-8 px-6">
        {/* Logo/Brand */}
        <div className="mb-10">
          <h1 className="text-3xl xl:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            SnapGram
          </h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {/* Add Story (desktop) */}
          {/* Add story control moved to Stories tray to avoid duplicate UI */}

          {items.map((it) => {
            if (it.label === "Notifications") {
              return (
                <button
                  key={it.label}
                  aria-label={it.label}
                  onMouseEnter={() => {
                    // prefetch notifications data and module
                    qc.prefetchQuery({
                      queryKey: ["notifications", { unreadOnly: false }],
                      queryFn: () =>
                        import("../services/notificationService").then((m) =>
                          m.fetchNotifications(false).then((r) => r.data)
                        ),
                    });
                    import("../pages/Notifications");
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/notifications");
                  }}
                  className="w-full text-left flex items-center gap-4 py-3.5 px-4 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 text-gray-700 hover:text-gray-900 transition-all duration-200 group relative"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {it.icon}
                  </span>
                  <span className="text-base xl:text-lg font-medium">
                    {it.label}
                  </span>
                  {hasUnreadNotifications && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={it.label}
                to={it.to}
                aria-label={it.label}
                onMouseEnter={() => {
                  // prefetch conversations data and the messages route chunk
                  qc.prefetchQuery({
                    queryKey: ["conversations"],
                    queryFn: () =>
                      import("../services/messageService").then((m) =>
                        m.fetchConversations().then((r) => r.data)
                      ),
                  });
                  import("../pages/Messages/Messages");

                  // also prefetch posts/feed when hovering Home/Explore to improve page switch
                  if (it.to === "/" || it.to === "/explore") {
                    qc.prefetchQuery({
                      queryKey: ["posts", { page: 1 }],
                      queryFn: () =>
                        import("../services/postService").then((m) =>
                          m.fetchPosts().then((r) => r.data)
                        ),
                    });
                    import("../pages/Explore");
                  }

                  // prefetch profile data when hovering Profile link
                  if (it.to === "/profile/me") {
                    qc.prefetchQuery({
                      queryKey: ["profile", { username: "me" }],
                      queryFn: () =>
                        import("../services/userService").then((m) =>
                          m.fetchProfile("me").then((r) => r.data)
                        ),
                    });
                    import("../pages/Profile/Profile");
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3.5 px-4 rounded-2xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`text-2xl group-hover:scale-110 transition-transform duration-200`}
                    >
                      {it.icon}
                    </span>
                    <span className="text-base xl:text-lg font-medium">
                      {it.label}
                    </span>
                    {it.label === "Messages" && unreadConversations > 0 && (
                      <span
                        className={`ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full shadow-lg ${
                          isActive
                            ? "bg-white text-indigo-600"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {unreadConversations > 99 ? "99+" : unreadConversations}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200/50">
        <div className="text-xs text-gray-500 text-center">© 2024 SnapGram</div>
      </div>
    </aside>
  );
};

export default Sidebar;
