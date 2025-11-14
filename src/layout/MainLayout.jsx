import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import Sidebar from "../components/Sidebar";
import SuggestionsCard from "../components/SuggestionsCard";
import { NotificationProvider } from "../context/NotificationContext";

function MainLayout() {
  const location = useLocation();

  const isMessageConversation =
    location.pathname.startsWith("/messages/") &&
    location.pathname !== "/messages";

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        {/* Enhanced Sidebar for big screens */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Hide navbar only when a conversation is open */}
          {!isMessageConversation && <Navbar />}

          {/* Main Content Area */}
          <main
            className={`flex-1 ${
              isMessageConversation ? "pt-0" : "pt-16 md:pt-20 lg:pt-6"
            } ${isMessageConversation ? "pb-0" : "pb-24 md:pb-6"}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Improved grid system for large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
                {/* Main content - takes more space on big screens */}
                <div className="lg:col-span-12 xl:col-span-8 2xl:col-span-7">
                  <Outlet />
                </div>

                {/* Right sidebar - suggestions, trending, etc. */}
                <div className="hidden xl:block xl:col-span-4 2xl:col-span-5">
                  <div className="sticky top-24 space-y-4">
                    {/* Suggestions Card */}
                    <SuggestionsCard />

                    {/* Trending Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Trending
                      </h3>
                      <div className="text-xs text-gray-500">
                        Coming soon...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Hide bottom nav only when a conversation is open */}
          {!isMessageConversation && <BottomNav />}
        </div>
      </div>
    </NotificationProvider>
  );
}

export default MainLayout;
