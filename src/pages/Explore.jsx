import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import SuggestionRow from "../components/SuggestionRow";
import { FiSearch, FiX, FiHeart, FiMessageCircle } from "react-icons/fi";
import Loader from "../components/Loader";

// 30 Random placeholder videos (free stock from Pexels via Vimeo)
const RANDOM_VIDEOS = [
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3 g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
  "https://player.vimeo.com/external/440218304.sd.mp4?s=4f0c8f8b8e6c7a5d5e6f7a8b9c0d1e2f3g4h5i6j&profile_id=165",
];

// Placeholder image
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Generate 30 random posts
  useEffect(() => {
    const generated = Array.from({ length: 30 }, (_, i) => {
      const isVideo = Math.random() > 0.5;
      return {
        id: `explore-${i}`,
        image: isVideo ? null : PLACEHOLDER_IMAGE,
        video: isVideo ? RANDOM_VIDEOS[i % RANDOM_VIDEOS.length] : null,
        likes: Math.floor(Math.random() * 5000) + 100,
        comments: Math.floor(Math.random() * 200),
      };
    });
    // simulate a short load so the skeleton/loader is visible on slow networks
    const t = setTimeout(() => {
      setPosts(generated);
      setPostsLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, []);

  // Filter by caption (we'll use random captions)
  const filteredPosts = posts.filter((p, i) =>
    `Beautiful moment ${i + 1} #nature #travel`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const displayPosts = searchQuery ? filteredPosts : posts;

  return (
    <>
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  // debounce search suggestions (300ms)
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  if (!v.trim()) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                    return;
                  }
                  debounceRef.current = setTimeout(async () => {
                    setSuggestionsLoading(true);
                    try {
                      const res = await api.get(
                        `/users/search?q=${encodeURIComponent(v.trim())}`
                      );
                      setSuggestions(res.data.results || []);
                      setShowSuggestions(true);
                    } catch (e) {
                      console.debug("search error", e?.message || e);
                      setSuggestions([]);
                      setShowSuggestions(false);
                    } finally {
                      setSuggestionsLoading(false);
                    }
                  }, 300);
                }}
                placeholder="Search accounts by username"
                className="w-full pl-10 pr-10 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-gray-50 transition"
                onFocus={() => {
                  if (suggestions.length) setShowSuggestions(true);
                }}
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-72 overflow-auto">
                  {suggestionsLoading ? (
                    <div className="p-4">
                      <Loader />
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <SuggestionRow
                        key={s._id || s.username}
                        suggestion={s}
                        onToggle={async (updated) => {
                          // optimistic update of local suggestion state
                          setSuggestions((prev) =>
                            prev.map((p) =>
                              p.username === updated.username
                                ? { ...p, ...updated }
                                : p
                            )
                          );
                        }}
                      />
                    ))
                  ) : (
                    <div className="p-4 text-sm text-gray-600">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto p-1 bg-white">
        {postsLoading ? (
          <div className="py-8">
            <Loader />
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FiSearch className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {displayPosts.map((post) => (
              <ExplorePost key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Reusable Post Component with Hover Play
const ExplorePost = ({ post }) => {
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="aspect-square relative overflow-hidden group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {post.video ? (
        <video
          ref={videoRef}
          src={post.video}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={post.image}
          alt="post"
          className="w-full h-full object-cover"
        />
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex gap-6 text-white">
          <div className="flex items-center gap-1">
            <FiHeart className="w-5 h-5" />
            <span className="font-semibold">{post.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiMessageCircle className="w-5 h-5" />
            <span className="font-semibold">{post.comments}</span>
          </div>
        </div>
      </div>

      {/* Video Icon */}
      {post.video && (
        <div className="absolute top-2 right-2 text-white opacity-80">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1.1 1.1 0 008 8.2v3.6a1.1 1.1 0 001.555 1.032l3.2-1.8a1.1 1.1 0 000-2.064l-3.2-1.8z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Explore;
