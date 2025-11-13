import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiMail,
  FiRepeat,
  FiBookmark,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { FaWhatsapp } from "react-icons/fa";
import { PostContext } from "../context/PostContext";
import ShareModal from "./ShareModal";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/formatDate";

const PostCard = ({ post, onAddComment, showComments = true }) => {
  const {
    addComment,
    toggleLike,
    toggleRepost,
    addShare,
    editPost,
    deletePost,
  } = useContext(PostContext);
  const { activeUser } = useContext(AuthContext);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(post?.comments || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post?.caption || "");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareMenuRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const previewVideoRef = useRef(null);
  const commentInputRef = useRef(null);
  const navigate = useNavigate();

  // ownerName: ensure we render a string (owner may be an object from API)
  const ownerName = useMemo(() => {
    const o = post?.owner;
    if (!o) return post?.username || "User";
    if (typeof o === "string") return o;
    if (typeof o === "object") return o.username || o._id || String(o);
    return String(o);
  }, [post?.owner, post?.username]);

  // keep the actual video element's muted property in sync with state
  useEffect(() => {
    try {
      if (previewVideoRef.current) previewVideoRef.current.muted = previewMuted;
    } catch {
      /* ignore */
    }
  }, [previewMuted]);

  // Coordinate playback so only one preview plays at a time and
  // auto-play/pause based on visibility. When this video starts
  // playing we broadcast a global event so others can pause.
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video) return;

    let observer = null;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const isVisible =
              entry.isIntersecting && entry.intersectionRatio >= 0.5;
            try {
              if (isVisible) {
                // Try to play and notify others that this is the active video
                const p = video.play && video.play();
                if (p && typeof p.then === "function") p.catch(() => {});
                try {
                  window.dispatchEvent(
                    new CustomEvent("snapgram:play", {
                      detail: { id: post?.id },
                    })
                  );
                } catch (e) {
                  console.warn(e);
                }
              } else {
                video.pause && video.pause();
              }
            } catch (e) {
              console.warn(e);
            }
          });
        },
        { threshold: [0.5] }
      );

      observer.observe(video);
    } catch (e) {
      // IntersectionObserver may not be available; fall back to no-op
      console.warn("IntersectionObserver init failed", e);
    }

    const onOtherPlay = (e) => {
      try {
        if (e?.detail?.id !== post?.id) {
          video.pause && video.pause();
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener("snapgram:play", onOtherPlay);
    return () => {
      try {
        if (observer && video) observer.unobserve(video);
      } catch (e) {
        console.warn(e);
      }
      window.removeEventListener("snapgram:play", onOtherPlay);
    };
  }, [post?.id]);

  const handlePostComment = () => {
    const text = (commentText || "").trim();
    if (!text) return;
    const newComment = {
      id: Date.now(),
      text,
      when: new Date().toISOString(),
      user: activeUser?.username || activeUser?.name || "User",
    };

    try {
      if (addComment && post?.id) {
        // send only the text to the server (server expects { text: string })
        addComment(post.id, newComment.text);
      } else if (onAddComment) {
        // keep onAddComment compatible by passing text
        onAddComment(post?.id, newComment.text);
      } else {
        setLocalComments((c) => [newComment, ...c]);
      }
    } catch (err) {
      setLocalComments((c) => [newComment, ...c]);
      console.warn("Failed to persist comment, using local state", err);
    }

    setCommentText("");
  };

  const isLiked =
    activeUser &&
    Array.isArray(post?.likedBy) &&
    post.likedBy.includes(activeUser.username);

  const handleToggleLike = () => {
    try {
      if (toggleLike && post?.id) toggleLike(post.id, activeUser?.username);
    } catch (err) {
      console.warn("Failed to toggle like", err);
    }
  };

  const formatLikes = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  // close share menu on outside click
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    const onDoc = (e) => {
      if (
        showShareMenu &&
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target)
      ) {
        setShowShareMenu(false);
      }
      if (
        optionsOpen &&
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(e.target)
      ) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDoc);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("resize", onResize);
    };
  }, [showShareMenu, optionsOpen]);

  // Keep localComments in sync when post.comments change (persisted updates)
  useEffect(() => {
    setLocalComments(post?.comments || []);
  }, [post?.comments]);

  const shareUrl = `${window.location.origin}/post/${post?.id}`;

  const handleShareOption = async (opt) => {
    setShowShareMenu(false);
    const text = `${post?.caption || ""} \n${shareUrl}`;
    try {
      if (opt === "snapgram") {
        // open the in-app share modal so user can pick conversation or search
        setShowShareModal(true);
        return;
      }
      if (opt === "whatsapp") {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          text
        )}`;
        window.open(url, "_blank");
        try {
          addShare && addShare(post?.id);
        } catch {
          console.warn("Failed to add share", post?.id);
        }
        return;
      }
      if (opt === "gmail") {
        const mail = `mailto:?subject=${encodeURIComponent(
          "Check out this post"
        )}&body=${encodeURIComponent(text)}`;
        window.open(mail, "_blank");
        try {
          addShare && addShare(post?.id);
        } catch {
          console.warn("Failed to add share", post?.id);
        }
        return;
      }
      if (opt === "copy") {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied to clipboard");
        } else {
          prompt("Copy link", shareUrl);
        }
        try {
          addShare && addShare(post?.id);
        } catch {
          console.warn("Failed to add share", post?.id);
        }
        return;
      }
      if (opt === "more") {
        if (navigator.share) {
          await navigator.share({
            title: post?.caption || "Post",
            text: post?.caption || "",
            url: shareUrl,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied to clipboard");
        } else {
          prompt("Copy link", shareUrl);
        }
        try {
          addShare && addShare(post?.id);
        } catch {
          console.warn("Failed to add share", post?.id);
        }
        return;
      }
    } catch (err) {
      console.warn("Share failed", err);
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-visible">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 overflow-hidden">
            {post?.profilePic && (
              <img
                src={post.profilePic}
                alt={ownerName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{ownerName}</div>
            <div className="text-xs text-slate-500">
              {formatDate(post?.createdAt || new Date().toISOString())}
            </div>
          </div>
          {/* Owner-only options menu (three-dot) */}
          <div className="relative">
            {activeUser?.username === post?.owner && (
              <div ref={optionsMenuRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOptionsOpen((s) => !s);
                  }}
                  aria-label="Post options"
                  className="p-1 text-gray-600 hover:text-gray-900"
                >
                  {/* simple three-dot icon */}
                  <span className="text-2xl leading-none">⋯</span>
                </button>
                {optionsOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg ring-1 ring-black/5 z-50">
                    <button
                      onClick={() => {
                        setOptionsOpen(false);
                        setIsEditing(true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setOptionsOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-100 aspect-[4/3] overflow-hidden relative">
        {post?.video ? (
          <>
            <video
              ref={previewVideoRef}
              src={post.video}
              className="w-full h-full object-cover cursor-pointer"
              playsInline
              muted={previewMuted}
              loop
              onPlay={() =>
                window.dispatchEvent(
                  new CustomEvent("snapgram:play", { detail: { id: post?.id } })
                )
              }
              onClick={() => navigate(`/reels?focus=${post?.id}`)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMuted((s) => !s);
              }}
              aria-label={previewMuted ? "Unmute preview" : "Mute preview"}
              className="absolute bottom-3 left-3 bg-black/60 text-white p-2 rounded-full z-10"
            >
              {previewMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>
          </>
        ) : post?.image ? (
          <img
            src={post.image}
            alt={post.caption || "post"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-100" />
        )}
      </div>

      <div className="p-4">
        {/* --- ACTIONS/STATS SECTION --- */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-slate-600">
            {/* Like Button + Count */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="like"
                className="hover:scale-110 transition"
                onClick={handleToggleLike}
              >
                {isLiked ? (
                  <AiFillHeart size={20} className="text-red-500" />
                ) : (
                  <FiHeart size={20} />
                )}
              </button>
              <span className="text-sm text-slate-700 font-medium">
                {formatLikes(post?.likes || 0)}
              </span>
            </div>

            {/* Comment Button + Count */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="comment"
                className="hover:scale-110 transition"
                onClick={() => {
                  if (showComments) {
                    commentInputRef.current?.focus();
                  } else {
                    navigate(`/post/${post?.id}`);
                  }
                }}
              >
                <FiMessageCircle size={20} />
              </button>
              <span className="text-sm text-slate-700 font-medium">
                {formatLikes(post?.comments?.length || 0)}
              </span>
            </div>

            {/* Repost Button + Count */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="repost"
                className="hover:scale-110 transition"
                onClick={() => {
                  try {
                    if (toggleRepost && post?.id) toggleRepost(post.id);
                  } catch (err) {
                    console.warn("Failed to toggle repost", err);
                  }
                }}
              >
                <FiRepeat size={20} />
              </button>
              <span className="text-sm text-slate-700 font-medium">
                {formatLikes(post?.reposts || 0)}
              </span>
            </div>

            {/* Share Button + Count + Menu */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  aria-label="share"
                  className="hover:scale-110 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu((s) => !s);
                  }}
                >
                  <FiSend size={20} />
                </button>

                {showShareMenu && (
                  <div ref={shareMenuRef}>
                    {/* Mobile: bottom sheet */}
                    {isMobile ? (
                      <div className="fixed inset-x-0 bottom-0 z-50 p-4">
                        <div className="bg-white rounded-t-xl shadow-lg p-3 max-h-[60vh] overflow-y-auto">
                          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                          <button
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded flex items-center gap-3"
                            onClick={() => handleShareOption("snapgram")}
                          >
                            <FiSend />
                            <span>Send in SnapGram</span>
                          </button>
                          <button
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded flex items-center gap-3"
                            onClick={() => handleShareOption("whatsapp")}
                          >
                            <FaWhatsapp />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded flex items-center gap-3"
                            onClick={() => handleShareOption("gmail")}
                          >
                            <FiMail />
                            <span>Gmail</span>
                          </button>
                          <button
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded flex items-center gap-3"
                            onClick={() => handleShareOption("copy")}
                          >
                            Copy link
                          </button>
                          <button
                            className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded flex items-center gap-3"
                            onClick={() => handleShareOption("more")}
                          >
                            More...
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg ring-1 ring-black/10 z-50 p-2">
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                          onClick={() => handleShareOption("snapgram")}
                        >
                          <FiSend />
                          <span>Send in SnapGram</span>
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                          onClick={() => handleShareOption("whatsapp")}
                        >
                          <FaWhatsapp />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                          onClick={() => handleShareOption("gmail")}
                        >
                          <FiMail />
                          <span>Gmail</span>
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                          onClick={() => handleShareOption("copy")}
                        >
                          Copy link
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                          onClick={() => handleShareOption("more")}
                        >
                          More...
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-700 font-medium">
                {formatLikes(post?.shareCount || 0)}
              </span>
            </div>
          </div>

          {/* Right side: Bookmark */}
          <div className="text-slate-600">
            <button aria-label="bookmark" className="hover:text-slate-800">
              <FiBookmark size={20} />
            </button>
          </div>
        </div>
        {/* --- END OF ACTIONS/STATS SECTION --- */}

        <div className="text-sm text-slate-700 mb-2">
          {isEditing ? (
            <div>
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full border p-2 rounded mb-2 text-sm"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditCaption(post?.caption || "");
                  }}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await editPost(post?.id || post?._id, {
                        caption: editCaption,
                      });
                      setIsEditing(false);
                    } catch (err) {
                      console.warn(err);
                      alert("Failed to update post");
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">{post?.caption || ""}</div>
              {activeUser?.username === post?.owner && null}
            </div>
          )}
        </div>

        {/* Comments list (preview) - ONLY SHOWN WHEN showComments is true */}
        {showComments &&
          ((post?.comments && post.comments.length > 0) ||
            localComments.length > 0) && (
            <div className="space-y-2 mb-2">
              {(post?.comments && post.comments.length > 0
                ? post.comments
                : localComments
              )
                .slice(0, 2)
                .map((c) => (
                  <div
                    key={c.id || c._id || c.when}
                    className="text-sm bg-slate-50 p-2 rounded"
                  >
                    <span className="font-semibold mr-2">
                      {(typeof c.user === "object"
                        ? c.user?.username
                        : c.user) || "User"}
                      :
                    </span>
                    <span>{String(c.text || "")}</span>
                  </div>
                ))}

              {/* View all comments link */}
              {(post?.comments || localComments || []).length > 2 && (
                <button
                  onClick={() => {
                    // Save scroll position before navigating
                    sessionStorage.setItem(
                      "home-scroll-position",
                      String(window.scrollY)
                    );
                    navigate(`/post/${post?.id}`);
                  }}
                  className="text-sm text-slate-500 hover:underline"
                >
                  View all {(post?.comments || localComments || []).length}{" "}
                  comments
                </button>
              )}
            </div>
          )}

        {/* Delete Confirmation Modal (owner-only) */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete post?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete the post. This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deletePost(post?.id || post?._id);
                      setShowDeleteModal(false);
                    } catch (err) {
                      console.warn(err);
                      alert("Failed to delete post");
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comment input box - only visible when showComments is true */}
        {showComments && (
          <div className="mt-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={1}
                  className="w-full px-3 py-2 text-sm resize-none outline-none bg-transparent"
                  placeholder="Add a comment..."
                />
                <div className="flex items-center justify-end gap-3 mt-1">
                  {commentText.trim().length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCommentText("");
                          commentInputRef.current?.blur();
                        }}
                        className="px-3 py-1 text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePostComment}
                        className="px-3 py-1 text-sm text-indigo-600 font-medium"
                      >
                        Post
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400"> </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments open on the dedicated post view - This line is just a comment */}
      </div>
      {/* Share modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </article>
  );
};

export default PostCard;
