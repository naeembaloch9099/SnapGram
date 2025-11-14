// src/pages/Explore.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiX, FiHeart, FiMessageCircle } from "react-icons/fi";
import SuggestionRow from "../components/SuggestionRow";
import api from "../services/api";

// === Shimmer (for desktop skeleton) ===
const shimmerStyle = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite;
  }
  .dark .animate-shimmer {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  }
`;

// === Shimmer Block ===
const ShimmerBlock = ({
  w = "w-full",
  h = "h-4",
  rounded = "rounded",
  className = "",
}) => (
  <div
    className={`${w} ${h} ${rounded} bg-gray-200 dark:bg-gray-700 animate-shimmer ${className}`}
  />
);

// === Desktop Search Skeleton ===
const DesktopSearchSkeleton = () => (
  <div className="hidden lg:block p-4 space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <ShimmerBlock w="w-11" h="h-11" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock w="w-32" h="h-4" rounded="rounded-md" />
          <ShimmerBlock w="w-24" h="h-3" rounded="rounded-md" />
        </div>
        <ShimmerBlock
          w="w-16"
          h="h-8"
          rounded="rounded-md"
          className="bg-blue-500"
        />
      </div>
    ))}
  </div>
);

// === Desktop Grid Skeleton ===
const DesktopGridSkeleton = () => (
  <div className="hidden lg:grid grid-cols-3 gap-1">
    {[...Array(15)].map((_, i) => (
      <div key={i} className="aspect-square">
        <ShimmerBlock w="w-full" h="h-full" rounded="rounded-none" />
      </div>
    ))}
  </div>
);

// === BEAUTIFUL MOBILE LOADER ===
const MobileLoader = () => (
  <div className="lg:hidden flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-black p-6">
    <div className="relative">
      {/* Outer Ring */}
      <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-pulse"></div>
      {/* Inner Spinner */}
      <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
    <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
      Loading .........
    </p>
  </div>
);

// === Video & Image ===
const RANDOM_VIDEOS = Array(30).fill(
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165"
);
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const POSTS_PER_PAGE = 15;

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchMode, setSearchMode] = useState("accounts"); // "accounts" or "posts"
  const observer = useRef();
  const debounceRef = useRef(null);

  // Generate posts
  const generatePosts = useCallback((pageNum) => {
    return Array.from({ length: POSTS_PER_PAGE }, (_, i) => {
      const index = (pageNum - 1) * POSTS_PER_PAGE + i;
      const isVideo = Math.random() > 0.4;
      return {
        id: `post-${index}`,
        image: isVideo ? null : PLACEHOLDER_IMAGE,
        video: isVideo ? RANDOM_VIDEOS[index % RANDOM_VIDEOS.length] : null,
        likes: Math.floor(Math.random() * 8000) + 200,
        comments: Math.floor(Math.random() * 300),
        caption: `Moment #${index + 1} #nature #travel`,
        promesa: true,
      };
    });
  }, []);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(generatePosts(1));
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [generatePosts]);

  // Infinite scroll
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load more
  useEffect(() => {
    if (page === 1) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setPosts((prev) => [...prev, ...generatePosts(page)]);
      setHasMore(page < 8);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [page, generatePosts]);

  // === YOUR ORIGINAL SEARCH LOGIC (100% RESTORED) ===
  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQuery(v);
    // clear any existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // If input is empty, clear suggestions and hide dropdown
    if (!v.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    // Start a debounced fetch but show a loader for at least 200ms for better UX
    const MIN_VISIBLE_MS = 200;
    // mark loading immediately so the UI shows a spinner while debouncing
    setSuggestionsLoading(true);
    const start = Date.now();

    debounceRef.current = setTimeout(async () => {
      try {
        let res;
        if (searchMode === "accounts") {
          // Search for accounts
          res = await api.get(
            `/users/search?q=${encodeURIComponent(v.trim())}`
          );
        } else {
          // Search for posts by caption
          res = await api.get(
            `/posts/search?q=${encodeURIComponent(v.trim())}`
          );
        }
        const results = res.data.results || [];
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        // ensure loader is visible for the minimum time before showing results
        setTimeout(() => {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setSuggestionsLoading(false);
        }, remaining);
      } catch (e) {
        console.debug("search error", e);
        // hide dropdown if error
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        setTimeout(() => {
          setSuggestions([]);
          setShowSuggestions(false);
          setSuggestionsLoading(false);
        }, remaining);
      }
    }, 200);
  };

  const filteredPosts = searchQuery
    ? posts.filter((p) =>
        p.caption.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div
      className="min-h-screen bg-[#FAFAFA]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />

      {/* Instagram-style Search Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#DBDBDB] backdrop-blur-sm bg-opacity-95">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Search Bar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search"
              className="w-full pl-10 pr-10 py-2 bg-[#EFEFEF] rounded-lg text-sm outline-none focus:bg-white border border-transparent focus:border-[#DBDBDB] transition-all placeholder:text-[#8E8E8E]"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
              aria-label="Search"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
                aria-label="Clear"
              >
                <FiX className="w-4 h-4 text-[#262626]" />
              </button>
            )}
          </div>

          {/* Search Mode Tabs - Instagram style */}
          <div className="flex gap-8 border-b border-[#DBDBDB]">
            <button
              onClick={() => {
                setSearchMode("accounts");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className={`pb-3 px-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                searchMode === "accounts"
                  ? "text-[#262626] border-b border-[#262626]"
                  : "text-[#8E8E8E] hover:text-[#262626]"
              }`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Accounts
            </button>
            <button
              onClick={() => {
                setSearchMode("posts");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className={`pb-3 px-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                searchMode === "posts"
                  ? "text-[#262626] border-b border-[#262626]"
                  : "text-[#8E8E8E] hover:text-[#262626]"
              }`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Posts
            </button>
          </div>

          {/* Search Dropdown - Instagram style */}
          {showSuggestions && (
            <div
              className="absolute top-full left-0 right-0 mt-1 mx-4 bg-white border border-[#DBDBDB] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15)",
              }}
            >
              {suggestionsLoading ? (
                <DesktopSearchSkeleton />
              ) : suggestions.length > 0 ? (
                searchMode === "accounts" ? (
                  suggestions.map((user) => (
                    <SuggestionRow
                      key={user._id}
                      suggestion={user}
                      onToggle={(updated) => {
                        setSuggestions((prev) =>
                          prev.map((p) => (p._id === updated._id ? updated : p))
                        );
                      }}
                    />
                  ))
                ) : (
                  // Posts search results
                  suggestions.map((post) => (
                    <div
                      key={post._id}
                      className="p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {post.caption?.substring(0, 100) || "Post"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {post.likes?.length || 0} likes ·{" "}
                        {post.comments?.length || 0} comments
                      </p>
                    </div>
                  ))
                )
              ) : (
                <p className="p-4 text-center text-sm text-gray-500">
                  No {searchMode === "accounts" ? "users" : "posts"} found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-1">
        {loading && posts.length === 0 ? (
          <>
            {/* Desktop: Skeleton */}
            <div className="hidden lg:block py-8">
              <DesktopGridSkeleton />
            </div>
            {/* Mobile: Beautiful Loader */}
            <MobileLoader />
          </>
        ) : filteredPosts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filteredPosts.map((post, i) => (
              <div
                key={post.id}
                ref={i === filteredPosts.length - 3 ? lastPostRef : null}
                className="aspect-square relative overflow-hidden group cursor-pointer bg-gray-100 dark:bg-gray-800"
              >
                <ExplorePost post={post} />
              </div>
            ))}
          </div>
        )}

        {loading && posts.length > 0 && <LoadingDots />}
      </div>
    </div>
  );
};

// === Reusable Components ===
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-gray-500">
    <FiSearch className="w-16 h-16 mb-4 opacity-40" />
    <p className="text-lg font-medium">No posts found</p>
    <p className="text-sm mt-1">Try searching for something else</p>
  </div>
);

const LoadingDots = () => (
  <div className="py-8 flex justify-center">
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  </div>
);

const ExplorePost = ({ post }) => {
  const videoRef = useRef(null);
  const play = () => videoRef.current?.play().catch(() => {});
  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <>
      {post.video ? (
        <video
          ref={videoRef}
          src={post.video}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          onMouseEnter={play}
          onMouseLeave={pause}
        />
      ) : (
        <img
          src={post.image}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
        <div className="flex gap-4 text-white text-sm font-semibold">
          <div className="flex items-center gap-1">
            <FiHeart className="w-5 h-5 fill-white" />
            <span>{post.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiMessageCircle className="w-5 h-5 fill-white" />
            <span>{post.comments}</span>
          </div>
        </div>
      </div>

      {post.video && (
        <div className="absolute top-2 right-2 text-white opacity-80">
          <svg
            className="w-5 h-5 drop-shadow"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1.1 1.1 0 008 8.2v3.6a1.1 1.1 0 001.555 1.032l3.2-1.8a1.1 1.1 0 000-2.064l-3.2-1.8z" />
          </svg>
        </div>
      )}
    </>
  );
};

export default Explore;
