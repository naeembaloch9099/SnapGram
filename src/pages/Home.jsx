import React, { useContext, useEffect } from "react";
import PostCard from "../components/PostCard";
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
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Home</h1>
      <div className="space-y-4">
        {normalizedFeed.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
};

export default Home;
