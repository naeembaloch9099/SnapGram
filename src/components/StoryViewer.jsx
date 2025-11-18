// StoryViewer.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { motion as M } from "framer-motion";
import api from "../services/api";
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

  // --- State and Refs ---
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

  const current = stories[index];
  const duration = mediaIsVideo ? 15000 : 7000; // 15s video, 7s image

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
              {new Date(current.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white text-3xl">
            &times;
          </button>
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

      {/* Viewers UI removed per user request */}

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
    </div>
  );
};

export default StoryViewer;
