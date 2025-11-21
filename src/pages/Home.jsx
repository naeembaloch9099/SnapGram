import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHeart, FiMessageCircle } from "react-icons/fi"; // Icons
import PostCard from "../components/PostCard";
import StoriesTray from "../components/StoriesTray";
import { PostContext } from "../context/PostContext";
import { AuthContext } from "../context/AuthContext";

const STATIC_POSTS = [
  {
    id: 1,
    caption: "Sunset vibes 🌅",
    image:
      "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: 2,
    caption: "City lights at night 🌃",
    image:
      "https://images.unsplash.com/photo-1504198266282-1659872e6590?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: 3,
    caption: "Weekend mountain hike 🏔️",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop",
  },
];

const Home = () => {
  const { posts: createdPosts = [] } = useContext(PostContext);
  const { activeUser } = useContext(AuthContext);
  const location = useLocation();

  // --- Scroll Logic Preserved ---
  useEffect(() => {
    const scrollKey = "home-scroll-position";
    const savedScrollY = sessionStorage.getItem(scrollKey);
    if (savedScrollY && !location.state?.skipScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollY, 10));
      }, 0);
    }
    sessionStorage.removeItem(scrollKey);
  }, [location.state?.skipScroll]);

  useEffect(() => {
    const scrollKey = "home-scroll-position";
    const handleBeforeUnload = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- Data Logic Preserved ---
  const combined = [...createdPosts, ...STATIC_POSTS];

  const feed = combined.filter((p) => {
    if (!p.visibility || p.visibility === "public") return true;
    if (p.owner === activeUser?.username) return true;
    if (p.visibility === "followers") {
      if (Array.isArray(p.allowed) && p.allowed.includes(activeUser?.username))
        return true;
      return false;
    }
    return false;
  });

  const normalizedFeed = feed.map((p) => {
    const id = p.id || p._id || String(Math.random());
    const owner =
      typeof p.owner === "object"
        ? p.owner.username || p.owner._id || String(p.owner)
        : p.owner;
    return { ...p, id, owner };
  });

  // --- Sidebar Helper Component ---
  const SuggestedUser = ({ name, subtext, img }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
          <img src={img} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 hover:underline cursor-pointer">
            {name}
          </span>
          <span className="text-xs text-gray-500">{subtext}</span>
        </div>
      </div>
      <button className="text-xs font-bold text-blue-500 hover:text-blue-700">
        Follow
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      {/* Sticky Header (Mobile style, visible on desktop if sidebar hidden) */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
        <h1 className="text-xl font-bold font-serif italic tracking-wider">
          SnapGram
        </h1>
        <div className="flex items-center gap-5">
          <FiHeart size={24} className="text-gray-800" />
          <Link to="/messages">
            <FiMessageCircle size={24} className="text-gray-800" />
          </Link>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-[1000px] mx-auto flex justify-center md:pt-8">
        {/* --- Left Column: Stories + Feed --- */}
        <div className="w-full max-w-[470px] flex flex-col gap-4">
          {/* Stories */}
          <div className="bg-white md:border md:border-gray-200 md:rounded-lg py-4">
            <StoriesTray />
          </div>

          {/* Posts Feed */}
          <div className="flex flex-col gap-4 pb-20">
            {normalizedFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-lg">
                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📷</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No posts yet
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Follow people to see photos
                </p>
              </div>
            ) : (
              normalizedFeed.map((p) => (
                <div
                  key={p.id}
                  className="bg-white md:border md:border-gray-200 md:rounded-lg overflow-hidden"
                >
                  <PostCard post={p} />
                </div>
              ))
            )}

            {/* "You're all caught up" Checkmark */}
            {normalizedFeed.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center mb-3">
                  <span className="text-3xl text-green-500">✓</span>
                </div>
                <h3 className="text-lg font-semibold">You're all caught up</h3>
                <p className="text-gray-500 text-sm">
                  You've seen all new posts from the past 3 days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Sidebar (Desktop Only) --- */}
        <div className="hidden lg:block w-[319px] pl-16">
          <div className="fixed w-[319px]">
            {/* Active User Profile Switcher */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                  <img
                    src={
                      activeUser?.profilePic ||
                      "https://via.placeholder.com/150"
                    }
                    alt={activeUser?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-gray-900">
                    {activeUser?.username || "user"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {activeUser?.displayName || "SnapGram User"}
                  </span>
                </div>
              </div>
              <button className="text-blue-500 text-xs font-bold hover:text-blue-700">
                Switch
              </button>
            </div>

            {/* Suggestions Header */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 font-bold text-sm">
                Suggested for you
              </span>
              <button className="text-xs font-bold text-gray-900 hover:text-gray-500">
                See All
              </button>
            </div>

            {/* Suggestion List */}
            <div className="flex flex-col">
              <SuggestedUser
                name="sarah_designs"
                subtext="New to Instagram"
                img="https://i.pravatar.cc/150?u=a042581f4e29026024d"
              />
              <SuggestedUser
                name="travel_mike"
                subtext="Followed by user1 + 3 more"
                img="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              />
              <SuggestedUser
                name="tech_guru"
                subtext="Suggested for you"
                img="https://i.pravatar.cc/150?u=a04258114e29026302d"
              />
              <SuggestedUser
                name="art_daily"
                subtext="Popular near you"
                img="https://i.pravatar.cc/150?u=a042581f4e29026024d"
              />
              <SuggestedUser
                name="foodie_life"
                subtext="Follows you"
                img="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              />
            </div>

            {/* Footer Links */}
            <div className="mt-8 flex flex-wrap gap-x-1 gap-y-0 text-xs text-gray-300">
              {[
                "About",
                "Help",
                "Press",
                "API",
                "Jobs",
                "Privacy",
                "Terms",
                "Locations",
                "Language",
              ].map((item, i) => (
                <span key={i} className="hover:underline cursor-pointer">
                  {item} {i !== 8 && "•"}
                </span>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-300 uppercase">
              © 2025 SNAPGRAM FROM META
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
