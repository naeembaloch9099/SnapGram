// Simple service worker implementing runtime caching for API and static assets.
const API_CACHE = "snapgram-api-v1";
const ASSETS_CACHE = "snapgram-assets-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // claim clients immediately so the SW starts controlling pages
      if (self.clients && self.clients.claim) await self.clients.claim();
      // Clean up old caches if any
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![API_CACHE, ASSETS_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
    })()
  );
});

// Helper: try cache first, then network, then cache network response
async function cacheFirst(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (e) {
    console.warn(e);
    return cached || new Response(null, { status: 504 });
  }
}

// Helper: stale-while-revalidate for APIs
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await networkFetch) || new Response(null, { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // API calls: stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Images, fonts, scripts, styles: cache-first
  if (
    request.destination === "image" ||
    ["script", "style", "font"].includes(request.destination)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For HTML navigation requests, try network first then fallback to cache
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          // Update the cache for future navigations
          const cache = await caches.open(ASSETS_CACHE);
          if (networkResponse && networkResponse.status === 200)
            cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (e) {
          console.warn(e);
          const cache = await caches.open(ASSETS_CACHE);
          const cached = await cache.match("/");
          return cached || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }
});
