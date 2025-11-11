import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Skeleton CSS for react-loading-skeleton
import "react-loading-skeleton/dist/skeleton.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
// React Query Devtools are useful in development but should not be bundled
// into production. Lazy-load them only in DEV so they don't increase prod bundle size.
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  }))
);

NProgress.configure({ showSpinner: false });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
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

// Prefetch the main feed/posts and current user's profile to speed up initial navigation
queryClient.prefetchQuery({
  queryKey: ["posts", { page: 1 }],
  queryFn: () =>
    import("./services/postService").then((m) =>
      m.fetchPosts().then((r) => r.data)
    ),
});
queryClient.prefetchQuery({
  queryKey: ["profile", { username: "me" }],
  queryFn: () =>
    import("./services/userService").then((m) =>
      m.fetchProfile("me").then((r) => r.data)
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
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  </StrictMode>
);

// Register a service worker for runtime caching of assets and API responses.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
