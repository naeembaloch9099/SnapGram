// StoryViewer.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { motion as M, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { FiTrash2 } from "react-icons/fi";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";
import { AuthContext } from "../context/AuthContext";

const StoryViewer = ({
  group,
  initialIndex = 0,
  onClose,
  onNextGroup,
  onPrevGroup,
  onViewed,
}) => {
  const stories = group?.stories || [];
  const { activeUser } = useContext(AuthContext);
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [mediaSrc, setMediaSrc] = useState(null);
  const [mediaIsVideo, setMediaIsVideo] = useState(false);
  const [_uploading, setUploading] = useState(false);

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);

  const current = stories[index];
  const duration = mediaIsVideo ? 15000 : 7000; // 15s video, 7s image
  const { toasts, showToast, removeToast } = useToast();
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  // format relative times like 'just now', '12 mins ago', '1 hr ago'
  const formatRelativeTime = (when) => {
    try {
      const then = new Date(when);
      const diff = Date.now() - then.getTime();
      const seconds = Math.floor(diff / 1000);
      if (seconds < 60) return "just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60)
        return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return "Yesterday";
      return `${days}d ago`;
    } catch (e) {
      console.log("formatRelativeTime error:", e);
      return new Date(when).toLocaleString();
    }
  };

  // --- Utility Functions ---

  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await api.post("/stories/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push(res.data);
      } catch (err) {
        console.warn("StoryViewer upload failed", err?.message || err);
      }
    }
    setUploading(false);
    // Notify StoriesTray to refresh the feed after upload
    try {
      window.dispatchEvent(
        new CustomEvent("stories:changed", { detail: results })
      );
    } catch (e) {
      console.warn("CustomEvent not supported, using fallback", e);
      // Fallback for non-standard environments
      const ev = document.createEvent("CustomEvent");
      ev.initCustomEvent("stories:changed", true, true, results);
      window.dispatchEvent(ev);
    }

    // show a friendly toast to the user about the result
    try {
      if (results.length === 1) {
        showToast &&
          showToast(
            "✅ Story added — it will expire in 1 hour.",
            "success",
            4000
          );
      } else if (results.length > 1) {
        showToast &&
          showToast(
            `✅ ${results.length} stories added — they will expire in 1 hour.`,
            "success",
            4500
          );
      }
    } catch (e) {
      console.debug("showToast failed", e);
    }
  };

  // viewers UI removed per user request

  const fetchMediaViaProxy = async (storyId) => {
    if (!storyId) return null;
    try {
      const res = await api.get(`/stories/proxy/${storyId}`, {
        responseType: "blob",
        timeout: 15000,
      });
      const blob = res.data;
      const objUrl = URL.createObjectURL(blob);
      setMediaSrc(objUrl);
      // if upstream returned a video MIME type, mark as video so we render the <video> tag
      try {
        if (blob && blob.type && blob.type.indexOf("video/") === 0) {
          setMediaIsVideo(true);
        }
      } catch (e) {
        console.debug("StoryViewer: proxy media type detection failed", e);
        /* ignore */
      }
      console.debug("fetchMediaViaProxy success", storyId, res.status);
      return objUrl;
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("fetchMediaViaProxy failed", msg);
      return null;
    }
  };

  // Send a reply as a direct message to the story owner
  const sendReply = useCallback(async () => {
    if (!current || !current._id) return;
    if (!replyText || String(replyText).trim().length === 0) return;
    try {
      setSendingReply(true);
      // Ensure conversation exists (server: getOrCreateConversation)
      const convRes = await api.post("/messages/conversation", {
        participantId: group.userId,
      });
      const convId = convRes?.data?._id || convRes?.data?.id;

      // Capture thumbnail from the currently displayed media
      let storySnapshot = null;
      if (mediaIsVideo && videoRef.current) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth || 400;
          canvas.height = videoRef.current.videoHeight || 600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            storySnapshot = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch (e) {
          console.debug("Failed to capture video thumbnail", e);
        }
      } else if (imageRef.current) {
        // For images, capture from the img element
        try {
          const canvas = document.createElement("canvas");
          canvas.width = imageRef.current.naturalWidth || 400;
          canvas.height = imageRef.current.naturalHeight || 600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(imageRef.current, 0, 0);
            storySnapshot = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch (e) {
          console.debug("Failed to capture image thumbnail", e);
        }
      }

      // Build message payload with story reference in metadata
      const payload = {
        text: replyText.trim(),
        storyId: current._id,
        storyUrl: current.url || mediaSrc,
        storySnapshot: storySnapshot || {
          url: current.url || mediaSrc,
          type:
            current.metadata?.resource_type ||
            (mediaIsVideo ? "video" : "image"),
        },
      };

      // Send the message
      await api.post(`/messages/${convId}`, payload);

      // Log the interaction on the story (server-side record)
      try {
        await api.post(`/stories/${current._id}/log_interaction`, {
          type: "reply",
          metadata: { text: replyText.trim() },
        });
      } catch (e) {
        // non-fatal if logging fails
        console.debug("story reply logging failed", e?.message || e);
      }

      showToast && showToast("✅ Reply sent", "success", 3000);
      setReplyText("");
    } catch (err) {
      console.warn("sendReply failed", err?.message || err);
      showToast && showToast("Failed to send reply", "error", 3500);
    } finally {
      setSendingReply(false);
    }
  }, [current, group.userId, replyText, mediaIsVideo, showToast, mediaSrc]);

  // --- Navigation Callbacks ---

  const goNext = useCallback(() => {
    if (index < stories.length - 1) setIndex((i) => i + 1);
    else onNextGroup?.();
  }, [index, stories.length, onNextGroup]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
    else onPrevGroup?.();
  }, [index, onPrevGroup]);

  const handleTap = (e) => {
    const x = e.clientX || e.touches[0].clientX;
    const width = window.innerWidth;
    if (x < width / 3) goPrev();
    else if (x > (2 * width) / 3) goNext();
  };

  // --- Effects ---

  // 1. Progress Timer Logic
  useEffect(() => {
    if (isPaused || !current) return;

    setProgress(0);
    // Clear any previous timer before starting a new one
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          goNext();
          return 100;
        }
        // Calculate the increment to reach 100% over the duration
        return p + 100 / (duration / 100);
      });
    }, duration / 100);

    // Cleanup timer on unmount or dependency change
    return () => clearInterval(timerRef.current);
  }, [index, isPaused, current, duration, goNext]);

  // 2. Report View to Parent/API (Mark as viewed)
  useEffect(() => {
    if (current && !current.viewed) {
      onViewed?.(group.userId);
      // NOTE: An API call to log interaction (type: 'view') should ideally happen here.
    }
  }, [index, group.userId, onViewed, current]);

  // 3. Media Cleanup & State Reset (Fixes the syntax error)
  useEffect(() => {
    setMediaError(false);
    setMediaSrc(null); // Reset media source when story changes
    // decide initial media kind from story metadata / url
    try {
      const isVideo = (() => {
        if (!current) return false;
        if (current.type && String(current.type).toLowerCase() === "video")
          return true;
        if (current.metadata && current.metadata.resource_type === "video")
          return true;
        const u = current.url || "";
        if (typeof u === "string" && u.match(/\.(mp4|webm|mov|m4v)(\?|$)/i))
          return true;
        return false;
      })();
      setMediaIsVideo(isVideo);
    } catch (e) {
      console.log("StoryViewer: media type detection failed", e);
      setMediaIsVideo(false);
    }

    // Cleanup function: Revoke previous object URL if one was created
    return () => {
      if (mediaSrc) {
        try {
          URL.revokeObjectURL(mediaSrc);
        } catch (e) {
          console.warn("Failed to revoke object URL:", e);
        }
      }
    };
    // The dependencies must cover both story change (current) and object URL (mediaSrc)
  }, [current, mediaSrc]);

  // When a proxied mediaSrc is set and it's a video, attempt to load and play it
  useEffect(() => {
    if (mediaSrc && mediaIsVideo) {
      try {
        // allow the element to pick up the src
        setTimeout(() => {
          try {
            videoRef.current?.load?.();
            videoRef.current?.play?.();
          } catch (e) {
            console.debug("StoryViewer: autoplay attempt failed", e);
          }
        }, 80);
      } catch (e) {
        console.debug("StoryViewer: proxy media load/play failed", e);
        /* ignore */
      }
    }
  }, [mediaSrc, mediaIsVideo]);

  // Fetch viewers for the current story (owner only)
  const fetchViewers = async () => {
    if (!current || !current._id) return;
    setViewersLoading(true);
    try {
      const res = await api.get(`/stories/${current._id}/viewers`);
      const v = res?.data?.viewers || [];
      setViewers(v);
    } catch (e) {
      console.warn("fetchViewers failed", e?.message || e);
      showToast && showToast("Failed to load viewers", "error", 3000);
    } finally {
      setViewersLoading(false);
    }
  };

  const sendHeartToViewer = async (viewerId) => {
    if (!current || !current._id || !viewerId) return;
    try {
      await api.post(`/stories/${current._id}/log_interaction`, {
        type: "reaction",
        metadata: { targetUserId: viewerId, reaction: "heart" },
      });
      setViewers((prev) =>
        prev.map((p) =>
          p.userId === viewerId ? { ...p, likedByOwner: true } : p
        )
      );
      showToast && showToast("❤️ Liked", "success", 1500);
    } catch (e) {
      console.warn("sendHeartToViewer failed", e?.message || e);
      showToast && showToast("Failed to send heart", "error", 2500);
    }
  };

  const removeHeartFromViewer = async (viewerId) => {
    if (!current || !current._id || !viewerId) return;
    try {
      await api.delete(`/stories/${current._id}/reaction`, {
        params: { targetUserId: viewerId },
      });
      setViewers((prev) =>
        prev.map((p) =>
          p.userId === viewerId ? { ...p, likedByOwner: false } : p
        )
      );
      showToast && showToast("💔 Removed", "success", 1500);
    } catch (e) {
      console.warn("removeHeartFromViewer failed", e?.message || e);
      showToast && showToast("Failed to remove heart", "error", 2500);
    }
  };

  const openConversationWith = async (viewerId) => {
    if (!viewerId) return;
    try {
      const conv = await api.post("/messages/conversation", {
        participantId: viewerId,
      });
      const convId = conv?.data?._id || conv?.data?.id;
      showToast && showToast("Opened conversation", "success", 1500);
      // Navigate to messages route (SPA route assumed at /messages/:convId)
      try {
        if (convId) {
          // If you have a SPA router, you may replace this with router navigation.
          window.location.href = `/messages/${convId}`;
        }
      } catch (navErr) {
        console.debug("navigation to messages failed", navErr);
      }
    } catch (e) {
      console.warn("openConversationWith failed", e?.message || e);
      showToast && showToast("Failed to open conversation", "error", 2500);
    }
  };

  if (!current) return null;

  // --- Render ---

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
        {stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <M.div
              className="h-full bg-white"
              initial={{
                width: i < index ? "100%" : i === index ? "0%" : "0%",
              }}
              animate={{
                width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={group.profilePic || "/default-avatar.png"}
              className="w-10 h-10 rounded-full ring-4 ring-white"
              onError={(e) => {
                e.currentTarget &&
                  (e.currentTarget.src = "/default-avatar.png");
              }}
            />
            {activeUser && String(activeUser._id) === String(group.userId) && (
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  inputRef.current && inputRef.current.click();
                }}
                title="Add story"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center border-2 border-white"
              >
                +
              </button>
            )}
          </div>
          <div>
            <p className="text-white font-medium">{group.username}</p>
            <p className="text-white/70 text-xs">
              {formatRelativeTime(current.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white text-3xl">
            &times;
          </button>
          {activeUser && String(activeUser._id) === String(group.userId) && (
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                // Show a persistent confirmation toast with Cancel and Confirm
                // Use showToast with a React node as the message (Toast now supports nodes)
                const id = showToast
                  ? showToast(
                      <div className="flex flex-col gap-3">
                        <div className="font-medium text-sm text-black">
                          Are you sure you want to delete this story?
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeToast && removeToast(id);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 rounded-md bg-red-600 text-white text-sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                removeToast && removeToast(id);
                                await api.delete(`/stories/${current._id}`);
                                showToast &&
                                  showToast("Story deleted", "success", 2500);
                                // notify other parts of the app to refresh stories tray
                                try {
                                  window.dispatchEvent(
                                    new CustomEvent("stories:changed", {
                                      detail: { deletedId: current._id },
                                    })
                                  );
                                } catch (e) {
                                  console.warn(
                                    "CustomEvent not supported, using fallback",
                                    e
                                  );
                                  const ev =
                                    document.createEvent("CustomEvent");
                                  ev.initCustomEvent(
                                    "stories:changed",
                                    true,
                                    true,
                                    {
                                      deletedId: current._id,
                                    }
                                  );
                                  window.dispatchEvent(ev);
                                }
                                // adjust viewer: advance or close
                                if (stories.length > 1) {
                                  if (index >= stories.length - 1) {
                                    setIndex((i) => Math.max(0, i - 1));
                                  }
                                } else {
                                  if (onNextGroup) onNextGroup();
                                  else onClose && onClose();
                                }
                              } catch (err) {
                                console.warn(
                                  "delete story failed",
                                  err?.message || err
                                );
                                showToast &&
                                  showToast(
                                    "Failed to delete story",
                                    "error",
                                    3000
                                  );
                              }
                            }}
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>,
                      "info",
                      0
                    )
                  : null;
              }}
              title="Delete story"
              className="text-white text-2xl p-1 hover:opacity-80"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>

      {/* hidden file input for owner upload inside viewer */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* bottom-centered viewers pill (owner only) - shows eye + views count */}
      {/* Instagram 2025 Exact Eye Button — Bottom Center */}
      {activeUser && String(activeUser._id) === String(group.userId) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewersOpen(true);
            if (viewers.length === 0) fetchViewers();
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 
                     bg-white px-9 py-4 rounded-full 
                     flex items-center gap-3 
                     shadow-2xl z-40
                     active:scale-95 transition-transform duration-75"
        >
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="font-bold text-lg text-black">
            {viewers.length || 0}
          </span>
        </button>
      )}

      {/* Media */}
      <div
        className="flex-1 flex items-center justify-center"
        onClick={handleTap}
      >
        {mediaIsVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {mediaError && (
              <div className="absolute z-20 text-white text-sm text-center">
                <div>Unable to play video</div>
                <button
                  className="mt-2 px-3 py-1 bg-white text-black rounded"
                  onClick={() => {
                    setMediaError(false);
                    // retry by forcing re-render
                    setTimeout(() => setIndex((i) => i), 50);
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <video
              ref={videoRef}
              key={current._id + (mediaSrc || current.url)}
              src={mediaSrc || current.url}
              controls
              crossOrigin="anonymous"
              playsInline
              muted
              preload="auto"
              className="max-h-full max-w-full object-contain"
              onCanPlay={() => {
                try {
                  videoRef.current?.play?.();
                } catch (err) {
                  console.debug("StoryViewer: video play failed", err);
                }
              }}
              onError={() => {
                const msg = `video onError for ${current?.url}`;
                console.debug("StoryViewer media_error:", msg);
                setMediaError(true);
                // attempt proxy fetch as a fallback
                fetchMediaViaProxy(current._id).then((obj) => {
                  if (obj) {
                    setMediaError(false);
                    console.debug("media playable via proxy", current._id);
                  }
                });
              }}
            />
          </div>
        ) : (
          <img
            ref={imageRef}
            src={mediaSrc || current.url}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              const msg = `image onError for ${current?.url}`;
              console.debug("StoryViewer media_error:", msg);
              e.currentTarget && (e.currentTarget.src = "/default-avatar.png");
              fetchMediaViaProxy(current._id);
            }}
          />
        )}
      </div>
      {/* Reply composer (bottom) - Instagram-like compact style */}
      {activeUser && String(activeUser._id) !== String(group.userId) && (
        <div
          className="absolute left-0 right-0 bottom-20 px-4 pb-6 z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2 shadow-sm">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 bg-transparent text-white placeholder-white/60 text-sm focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                {/* small quick react / like icon (non-functional visual) */}
                <button
                  type="button"
                  className="ml-2 mr-1 shrink-0 p-1 rounded-full hover:bg-white/10"
                  title="Like"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white/80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="shrink-0">
              <button
                disabled={sendingReply || replyText.trim().length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  sendReply();
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-md ${
                  sendingReply ? "opacity-60" : "hover:bg-indigo-700"
                }`}
                title={sendingReply ? "Sending..." : "Send"}
              >
                {sendingReply ? (
                  <svg
                    className="w-5 h-5 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeWidth="2"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      strokeWidth="2"
                      className="opacity-75"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M22 2L11 13"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M22 2l-7 20-4-9-9-4 20-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Instagram 2025 Exact Swipe-Up Viewers Sheet */}
      <AnimatePresence>
        {viewersOpen &&
          activeUser &&
          String(activeUser._id) === String(group.userId) && (
            <M.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 35, stiffness: 400 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="py-4 text-center">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-lg font-bold text-black">Views</h3>
                <button
                  onClick={() => setViewersOpen(false)}
                  className="text-3xl text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Viewers List */}
              <div className="flex-1 overflow-y-auto">
                {viewersLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading viewers...
                  </div>
                ) : viewers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No views yet
                  </div>
                ) : (
                  viewers.map((viewer) => (
                    <div
                      key={viewer.userId}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={viewer.profilePic || "/default-avatar.png"}
                          alt={viewer.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {viewer.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatRelativeTime(viewer.viewedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Message Button (Instagram style) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConversationWith(viewer.userId);
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          title="Message"
                        >
                          <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </button>

                        {/* Heart toggle (owner -> viewer) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (viewer.likedByOwner)
                              removeHeartFromViewer(viewer.userId);
                            else sendHeartToViewer(viewer.userId);
                          }}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          title={viewer.likedByOwner ? "Unheart" : "Heart"}
                        >
                          {viewer.likedByOwner ? (
                            <svg
                              className="w-6 h-6 text-red-500"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 21s-7.5-4.873-9.243-7.01C.826 11.7 3.01 7 7.5 7c2.24 0 3.74 1.07 4.5 2 .76-.93 2.26-2 4.5-2 4.49 0 6.674 4.7 4.743 6.99C19.5 16.127 12 21 12 21z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-6 h-6 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Instagram Exact Footer */}
              <div className="p-4 text-center text-xs text-gray-500 border-t border-gray-100">
                Viewer lists and view counts aren't available after 48 hours.
              </div>
            </M.div>
          )}
      </AnimatePresence>

      {/* Swipe Down to Close */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70">
        <svg
          className="w-8 h-8 mx-auto"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 16l-6-6h12z" />
        </svg>
        <p className="text-xs">Swipe down to close</p>
      </div>
      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default StoryViewer;
