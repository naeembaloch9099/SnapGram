import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
  FiMoreHorizontal,
  FiCamera,
  FiPlay,
  FiMusic,
  FiX,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import { PostContext } from "../context/PostContext";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const Reels = () => {
  // Guard against missing provider: if PostContext is undefined (not wrapped),
  // fall back to an empty object so destructuring doesn't throw.
  const _postContext = useContext(PostContext) || {};
  const {
    posts = [],
    addComment: addCommentToPost,
    toggleLike,
    deleteComment,
  } = _postContext;
  const { activeUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Show only video posts (reels) on this page
  // Defensive: ensure `posts` is always an array even if PostContext is missing
  const postsOnly = (posts || [])
    .filter(
      (p) =>
        (p.type === "video" || p.video) && String(p.video || "").trim() !== ""
    )
    .map((p) => {
      // Extract username from owner (can be object or string)
      let username = "Unknown";
      let profilePic = "";
      let ownerId = null;

      if (typeof p.owner === "object" && p.owner !== null) {
        username = p.owner.username || p.owner.displayName || "Unknown";
        profilePic = p.owner.profilePic || p.owner.avatar || "";
        ownerId = p.owner._id || p.owner.id;
      } else if (typeof p.owner === "string") {
        username = p.owner;
        ownerId = p.owner;
      }

      return {
        id: p.id,
        video: p.video,
        username: username,
        ownerId: ownerId,
        caption: p.caption || "",
        likes: p.likes || 0,
        comments: (p.comments || []).length,
        profilePic: profilePic,
        likedBy: Array.isArray(p.likedBy) ? p.likedBy : [],
        liked: !!(
          activeUser &&
          Array.isArray(p.likedBy) &&
          p.likedBy.includes(activeUser.username)
        ),
      };
    });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLike, setShowLike] = useState(false);
  const videoRefs = useRef([]);
  const observerRef = useRef(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [openCommentsFor, setOpenCommentsFor] = useState(null);
  const [shareMedia, setShareMedia] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const location = useLocation();
  const clickTimeoutRef = useRef(null);
  const [commentMenuOpen, setCommentMenuOpen] = useState(null); // Track which comment's menu is open
  const [conversations, setConversations] = useState([]);

  // When opening comments, seed local commentsMap from persisted posts so UI shows existing comments
  useEffect(() => {
    if (!openCommentsFor) return;
    // Defensive: guard posts in case PostContext isn't available yet
    const post = (posts || []).find(
      (p) => String(p.id) === String(openCommentsFor)
    );
    if (post) {
      setCommentsMap((prev) => ({
        ...(prev || {}),
        [openCommentsFor]: post.comments || [],
      }));
    }
  }, [openCommentsFor, posts]);

  // Broadcast comments sheet open/close so other UI (like BottomNav) can react
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent("snapgram:comments", {
          detail: { open: !!openCommentsFor },
        })
      );
    } catch (e) {
      console.warn(e);
    }
  }, [openCommentsFor]);

  // Intersection Observer
  useEffect(() => {
    if (postsOnly.length === 0) return;

    try {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const idx = Number(entry.target.dataset.index);
            const isVisible =
              entry.isIntersecting && entry.intersectionRatio >= 0.6;
            const vid = entry.target;
            try {
              if (isVisible) {
                // If this element is a video, play it; otherwise just mark active
                if (typeof vid.play === "function") {
                  const p = vid.play && vid.play();
                  if (p && typeof p.then === "function") p.catch(() => {});
                }
                try {
                  window.dispatchEvent(
                    new CustomEvent("snapgram:play", {
                      detail: { id: postsOnly[idx]?.id },
                    })
                  );
                } catch (e) {
                  console.warn(e);
                }
                setCurrentIndex(idx);
                setIsPlaying(true);
              } else {
                if (typeof vid.pause === "function") vid.pause && vid.pause();
                if (idx === currentIndex) setIsPlaying(false);
              }
            } catch (e) {
              console.warn(e);
            }
          });
        },
        { threshold: 0.6 }
      );

      videoRefs.current.forEach((el) => el && observerRef.current.observe(el));
    } catch (e) {
      console.warn("IntersectionObserver init failed", e);
    }

    return () => observerRef.current?.disconnect();
  }, [postsOnly.length, currentIndex, postsOnly]);

  // Pause reels when another media elsewhere starts playing (feed previews)
  useEffect(() => {
    const onOtherPlay = (e) => {
      try {
        const otherId = e?.detail?.id;
        if (!otherId) return;
        // If the other playing id is not the current visible reel, pause all reels
        if (otherId !== postsOnly[currentIndex]?.id) {
          videoRefs.current.forEach((v) => {
            try {
              if (v && typeof v.pause === "function") v.pause && v.pause();
            } catch (err) {
              console.warn(err);
            }
          });
          setIsPlaying(false);
        }
      } catch (err) {
        console.warn(err);
      }
    };

    window.addEventListener("snapgram:play", onOtherPlay);
    return () => window.removeEventListener("snapgram:play", onOtherPlay);
  }, [currentIndex, postsOnly]);

  // If navigated with ?focus=<postId> then scroll to that reel
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const focus = params.get("focus");
      const openComments = params.get("openComments");
      if (!focus || postsOnly.length === 0) return;
      const idx = postsOnly.findIndex((r) => String(r.id) === String(focus));
      if (idx >= 0) {
        // set current index and scroll the element into view
        setCurrentIndex(idx);
        setTimeout(() => {
          const el = videoRefs.current[idx];
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "auto", block: "start" });
          } else {
            const container = document.querySelector(
              ".h-screen.overflow-y-auto.snap-y"
            );
            if (container)
              container.scrollTo({
                top: idx * window.innerHeight,
                behavior: "auto",
              });
          }
        }, 50);
        // if openComments param is present (truthy), open comments sheet for this post
        if (openComments) {
          setOpenCommentsFor(focus);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, [location.search, postsOnly]);

  // Auto-play
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Autoplay blocked", err);
      }
    };

    // Only attach canplay handler and attempt play if this is a video element
    if (typeof video.play === "function") {
      if (video.readyState >= 3) playVideo();
      else video.addEventListener("canplay", playVideo, { once: true });

      return () => {
        try {
          if (typeof video.pause === "function") video.pause();
        } catch (err) {
          console.warn(err);
        }
      };
    }
    return undefined;
  }, [currentIndex]);

  // Post comment (persist to PostContext)
  const postComment = (id) => {
    const text = commentInput.trim();
    if (!text) return;

    // Detect mentions (@username)
    const mentions = text.match(/@(\w+)/g) || [];

    const c = {
      id: Date.now(),
      text,
      user: activeUser?.username || "you",
      when: new Date().toISOString(),
      profilePic: activeUser?.profilePic || activeUser?.avatar || "",
      mentions: mentions.map((m) => m.substring(1)), // Remove @ symbol
    };
    // local state (for immediate UI) and persistent store
    setCommentsMap((prev) => ({ ...prev, [id]: [c, ...(prev[id] || [])] }));
    try {
      addCommentToPost(id, c);
    } catch (e) {
      console.warn(e);
    }
    setCommentInput("");
  };

  // Delete comment
  const handleDeleteComment = (postId, commentId) => {
    try {
      // Remove from local state
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));

      // Remove from PostContext if available
      if (deleteComment) {
        deleteComment(postId, commentId);
      }

      setCommentMenuOpen(null);
    } catch (e) {
      console.warn("Failed to delete comment:", e);
    }
  };

  // Load conversations for share functionality
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await api.get("/messages/conversations");
        setConversations(res.data || []);
      } catch (e) {
        console.warn("Failed to load conversations:", e);
      }
    };

    if (shareMedia) {
      loadConversations();
    }
  }, [shareMedia]);

  // Share video in DM
  const handleShareInDM = async (conversationId) => {
    if (!shareMedia) return;

    try {
      await api.post(`/messages/conversation/${conversationId}/message`, {
        text: `Check out this reel: ${shareMedia.video}`,
        media: shareMedia.video,
        mediaType: "video",
      });

      setShareMedia(null);
      alert("Shared successfully!");
    } catch (e) {
      console.error("Failed to share:", e);
      alert("Failed to share video");
    }
  };

  // Toggle play
  const togglePlay = async () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;
    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // clear any pending click timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, []);

  // Double-tap like
  const handleDoubleTap = (idx) => {
    if (idx === currentIndex) {
      setShowLike(true);
      // also toggle like on double-tap
      const reel = postsOnly[idx];
      try {
        toggleLike(reel.id, activeUser?.username);
      } catch (e) {
        console.warn(e);
      }
      setTimeout(() => setShowLike(false), 700);
    }
  };

  if (postsOnly.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <FiCamera className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No posts yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Hide video controls */}
      <style>{`
        video::-webkit-media-controls,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls-download-button,
        video::-internal-media-controls-download-button {
          display: none !important;
        }
      `}</style>

      <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-black">
        {/* Top: Reels Title + Camera */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
          <h1 className="text-2xl font-bold text-white">Reels</h1>
          <FiCamera className="w-7 h-7 text-white" />
        </div>

        {postsOnly.map((reel, idx) => (
          <div
            key={reel.id}
            data-index={idx}
            className="relative h-screen w-full snap-start bg-black"
            onClick={(e) => {
              e.stopPropagation();
              // delay single-tap action to allow double-tap detection
              if (clickTimeoutRef.current)
                clearTimeout(clickTimeoutRef.current);
              clickTimeoutRef.current = setTimeout(() => {
                togglePlay();
                clickTimeoutRef.current = null;
              }, 250);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
              }
              handleDoubleTap(idx);
            }}
          >
            {/* Video element */}
            {reel.video ? (
              <video
                ref={(el) => (videoRefs.current[idx] = el)}
                src={reel.video}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={false}
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <p className="text-white">No video available</p>
              </div>
            )}

            {/* Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center">
                  <FiPlay className="w-10 h-10 text-black ml-1" />
                </div>
              </div>
            )}

            {/* Double-tap Heart */}
            {showLike && idx === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <FiHeart className="w-24 h-24 text-white animate-ping" />
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              {/* User + Follow */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={
                    reel.profilePic ||
                    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle fill='%23e5e7eb' cx='20' cy='20' r='20'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'>${reel.username
                      .charAt(0)
                      .toUpperCase()}</text></svg>`
                  }
                  alt={reel.username}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                />
                <div className="flex-1">
                  <p className="font-bold text-base">{reel.username}</p>
                  <p className="text-xs opacity-70">See more</p>
                </div>
                {/* Only show Follow button if not already following and not own profile */}
                {activeUser?.username !== reel.username &&
                  !activeUser?.following?.some((f) => {
                    const followingId =
                      typeof f === "string" ? f : f?._id || f?.id;
                    return followingId === reel.ownerId;
                  }) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to profile or implement follow logic
                        navigate(`/profile/${reel.username}`);
                      }}
                      className="px-4 py-1.5 border border-white rounded-full text-sm font-medium hover:bg-white/20 transition"
                    >
                      Follow
                    </button>
                  )}
              </div>

              {/* Caption */}
              <p className="text-sm font-medium mb-4 line-clamp-2">
                {reel.caption}
              </p>

              {/* Action Icons (Right Side) */}
              <div className="absolute right-3 bottom-16 flex flex-col gap-5">
                {/* Like */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        toggleLike(reel.id, activeUser?.username);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="p-2 rounded-full hover:scale-110 transition"
                    aria-pressed={reel.liked}
                  >
                    {reel.liked ? (
                      <AiFillHeart className="w-7 h-7 text-red-500 drop-shadow" />
                    ) : (
                      <FiHeart className="w-7 h-7 text-white drop-shadow" />
                    )}
                  </button>
                  <span className="text-xs font-medium drop-shadow">
                    {reel.likes}
                  </span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCommentsFor(reel.id);
                    }}
                    className="p-2 rounded-full hover:scale-110 transition"
                  >
                    <FiMessageCircle className="w-7 h-7 text-white drop-shadow" />
                  </button>
                  <span className="text-xs font-medium drop-shadow">
                    {reel.comments}
                  </span>
                </div>

                {/* Send / Share -> open DM share picker */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open share-to-DM picker with media info
                    setShareMedia({
                      type: "video",
                      video: reel.video,
                      text: reel.caption,
                      postId: reel.id,
                      username: reel.username,
                    });
                  }}
                  className="p-2 rounded-full hover:scale-110 transition"
                >
                  <FiSend className="w-7 h-7 text-white drop-shadow -rotate-12" />
                </button>

                {/* Save */}
                <button className="p-2 rounded-full hover:scale-110 transition">
                  <FiBookmark className="w-7 h-7 text-white drop-shadow" />
                </button>

                {/* More */}
                <button className="p-2 rounded-full hover:scale-110 transition">
                  <FiMoreHorizontal className="w-7 h-7 text-white drop-shadow" />
                </button>

                {/* Music */}
                <div className="mt-2 p-2 bg-white/10 rounded-full">
                  <FiMusic className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comments Sheet */}
      {openCommentsFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpenCommentsFor(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-3 pb-4">
            {/* Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="font-bold text-lg">Comments</h3>
              <button
                onClick={() => setOpenCommentsFor(null)}
                className="text-gray-600 text-sm px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Comments list */}
            <div className="max-h-64 overflow-y-auto space-y-3 mb-3 px-2">
              {(commentsMap[openCommentsFor] || []).map((c) => (
                <div key={c.id} className="flex gap-3 items-start relative">
                  <img
                    src={
                      c.profilePic ||
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle fill='%23e5e7eb' cx='20' cy='20' r='20'/></svg>"
                    }
                    alt={c.user}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{c.user}</p>
                      <span className="text-xs text-gray-400">
                        · {new Date(c.when).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">
                      {/* Render mentions with highlighting */}
                      {c.text.split(/(@\w+)/g).map((part, i) =>
                        part.startsWith("@") ? (
                          <span key={i} className="text-indigo-600 font-medium">
                            {part}
                          </span>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-1 relative">
                    <button className="text-gray-400 hover:text-red-500 text-lg">
                      ♡
                    </button>

                    {/* Show 3-dot menu only for own comments */}
                    {c.user === activeUser?.username && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setCommentMenuOpen(
                              commentMenuOpen === c.id ? null : c.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <FiMoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown menu */}
                        {commentMenuOpen === c.id && (
                          <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-50 w-32">
                            <button
                              onClick={() => {
                                // TODO: Implement edit functionality
                                setCommentMenuOpen(null);
                                alert("Edit feature coming soon!");
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiEdit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteComment(openCommentsFor, c.id)
                              }
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                            >
                              <FiTrash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick reactions */}
            <div className="px-3 mb-3">
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => {
                      // quick add reaction as a short-lived comment
                      const c = {
                        id: Date.now(),
                        text: emo,
                        user: activeUser?.username || "you",
                        when: new Date().toISOString(),
                      };
                      setCommentsMap((prev) => ({
                        ...(prev || {}),
                        [openCommentsFor]: [
                          c,
                          ...(prev?.[openCommentsFor] || []),
                        ],
                      }));
                      try {
                        addCommentToPost(openCommentsFor, c);
                      } catch (e) {
                        console.warn(e);
                      }
                    }}
                    className="text-2xl p-1"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            {/* Input area with avatar + send */}
            <div className="px-3">
              <div className="flex items-center gap-2">
                <img
                  src={
                    activeUser?.profilePic ||
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle fill='%23e5e7eb' cx='20' cy='20' r='20'/></svg>"
                  }
                  alt={activeUser?.username || "you"}
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
                <div className="flex-1 relative">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && postComment(openCommentsFor)
                    }
                    placeholder="Add comment... (Use @ to mention)"
                    className="w-full pl-4 pr-10 py-2 border rounded-full text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => postComment(openCommentsFor)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 text-white rounded-full"
                    aria-label="Post comment"
                  >
                    <span className="transform -rotate-45 inline-block">
                      <FiSend />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share to DM Modal */}
      {shareMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShareMedia(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-4 m-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Share to</h3>
              <button
                onClick={() => setShareMedia(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <video
                  src={shareMedia.video}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Reel from @{shareMedia.username}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {shareMedia.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversations list */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {conversations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id || conv.id}
                    onClick={() => handleShareInDM(conv._id || conv.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <img
                      src={
                        conv.otherUser?.profilePic ||
                        conv.otherUser?.avatar ||
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle fill='%23e5e7eb' cx='20' cy='20' r='20'/></svg>"
                      }
                      alt={conv.otherUser?.username || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">
                        {conv.otherUser?.username ||
                          conv.otherUser?.displayName ||
                          "User"}
                      </p>
                      <p className="text-xs text-gray-500">Send</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reels;
