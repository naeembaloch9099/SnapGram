import React, { useContext, useEffect } from "react";
import PostCard from "../components/PostCard";
import StoriesTray from "../components/StoriesTray";
import { PostContext } from "../context/PostContext";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const STATIC_POSTS = [
  {
    id: 1,
    caption: "Sunset vibes",
    image:
      "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: 2,
    caption: "City lights",
    image:
      "https://images.unsplash.com/photo-1504198266282-1659872e6590?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: 3,
    caption: "Mountain hike",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop",
  },
];

const Home = () => {
  const { posts: createdPosts = [] } = useContext(PostContext);
  const { activeUser } = useContext(AuthContext);
  const location = useLocation();

  // ✅ Restore scroll position when returning to Home page
  useEffect(() => {
    const scrollKey = "home-scroll-position";
    // Get saved scroll position
    const savedScrollY = sessionStorage.getItem(scrollKey);
    if (savedScrollY && !location.state?.skipScroll) {
      // Restore scroll after a short delay to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      }, 0);
    }
    // Clean up: remove the saved position after restoring
    sessionStorage.removeItem(scrollKey);
  }, [location.state?.skipScroll]);

  // Save scroll position before leaving
  useEffect(() => {
    const scrollKey = "home-scroll-position";
    const handleBeforeUnload = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // combine created posts with static posts (newest first)
  const combined = [...createdPosts, ...STATIC_POSTS];

  // filter feed: public posts or posts owned by the active user
  const feed = combined.filter((p) => {
    if (!p.visibility || p.visibility === "public") return true;
    if (p.owner === activeUser?.username) return true;
    if (p.visibility === "followers") {
      // best-effort: if activeUser is listed as allowed (post.allowed) or owner
      if (Array.isArray(p.allowed) && p.allowed.includes(activeUser?.username))
        return true;
      return false;
    }
    return false;
  });

  // normalize posts: ensure each post has `id` and `owner` is a string
  const normalizedFeed = feed.map((p) => {
    const id = p.id || p._id || String(Math.random());
    const owner =
      typeof p.owner === "object"
        ? p.owner.username || p.owner._id || String(p.owner)
        : p.owner;
    return { ...p, id, owner };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Home Feed
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover what's happening
          </p>
        </div>
      </div>

      {/* Stories Tray (grouped story bubbles) */}
      <StoriesTray />

      {/* Posts Grid with Cards */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {normalizedFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 to-pink-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-4xl sm:text-5xl">📸</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No posts yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              Start following people to see their posts
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {normalizedFeed.map((p, index) => (
              <div
                key={p.id}
                className="transform transition-all duration-300 hover:scale-[1.01]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PostCard post={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
