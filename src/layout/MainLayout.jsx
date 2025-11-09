import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Sidebar from "../components/Sidebar";
import { NotificationProvider } from "../context/NotificationContext";

function MainLayout() {
  const location = useLocation();

  const isMessageConversation =
    location.pathname.startsWith("/messages/") &&
    location.pathname !== "/messages";

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-slate-50">
        {/* hide the global navbar only when a conversation is open so the messages header is used; keep it for the messages list */}
        {!isMessageConversation && <Navbar />}
        {/* keep top padding for mobile navbar; remove/keep smaller padding on larger screens */}
        {/* reduce bottom padding on the /messages routes because BottomNav is hidden there */}
        {/* Use smaller bottom padding when on messages to avoid unnecessary blank space */}
        <main
          className={`pt-16 md:pt-6 lg:pt-6 ${
            isMessageConversation ? "pb-6" : "pb-24 md:pb-16"
          }`}
        >
          <div className="container-md">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* left sidebar (desktop) */}
              <div className="hidden lg:block lg:col-span-1">
                <Sidebar />
              </div>

              {/* main content */}
              <div className="lg:col-span-2">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
        {/* hide global bottom nav only when a conversation is open so the chat composer can take full space */}
        {!isMessageConversation && <BottomNav />}

        {/* Notifications are shown on their own page via /notifications route. The drawer component is no longer mounted here. */}
      </div>
    </NotificationProvider>
  );
}

export default MainLayout;
