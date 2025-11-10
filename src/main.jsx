import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Skeleton CSS for react-loading-skeleton
import "react-loading-skeleton/dist/skeleton.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Warm important caches on app start to improve perceived navigation speed
// Prefetch conversations and unread notifications so the Navbar/Sidebar can read cached data instantly
queryClient.prefetchQuery({
  queryKey: ["conversations"],
  queryFn: () =>
    import("./services/messageService").then((m) =>
      m.fetchConversations().then((r) => r.data)
    ),
});
queryClient.prefetchQuery({
  queryKey: ["notifications", { unreadOnly: true }],
  queryFn: () =>
    import("./services/notificationService").then((m) =>
      m.fetchNotifications(true).then((r) => r.data)
    ),
});

// Optional: disable console output in the frontend when VITE_DISABLE_CONSOLE is set to 'true'
try {
  if (import.meta.env.VITE_DISABLE_CONSOLE === "true") {
    ["log", "info", "warn", "error", "debug"].forEach((m) => {
      // preserve original in case needed: window.__origConsole = window.__origConsole || {};
      try {
        window.__origConsole = window.__origConsole || {};
        window.__origConsole[m] = console[m];
      } catch (e) {
        console.log("Error preserving original console methods", e);
        // ignore
      }
      console[m] = () => {};
    });
  }
} catch (e) {
  console.log("Error reading VITE_DISABLE_CONSOLE", e);
  // ignore environment read errors during tests
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
