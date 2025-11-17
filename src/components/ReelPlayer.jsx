import React, { useEffect, useRef, useState } from "react";
import {
  FiPlay,
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
  FiMoreHorizontal,
  FiMusic,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";

const ReelPlayer = ({
  reel,
  idx,
  total,
  videoRef,
  isActive,
  onToggleLike,
  onOpenComments,
  onShare,
  onTogglePlay,
  isPlaying,
  onDoubleTap,
  activeUser,
  toggleLike,
}) => {
  const localRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = localRef.current;
    if (!v) return;

    const onTime = () => {
      try {
        const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
        setProgress(Number.isFinite(pct) ? pct : 0);
      } catch (e) {
        // ignore
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  useEffect(() => {
    // keep muted state applied to the video element
    const v = localRef.current;
    if (v) v.muted = !!muted;
  }, [muted]);

  // keyboard shortcut: press 'm' to toggle mute when this reel is active
  useEffect(() => {
    if (!isActive) return undefined;
    const onKey = (e) => {
      if (e.key === "m" || e.key === "M") setMuted((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive]);

  // combine parent ref assignment with internal ref
  const assignRef = (el) => {
    localRef.current = el;
    if (typeof videoRef === "function") videoRef(el);
  };

  return (
    <div
      data-index={idx}
      className="relative h-screen w-full snap-start bg-black"
    >
      {reel.video ? (
        <video
          ref={assignRef}
          src={reel.video}
          className="w-full h-full object-cover"
          loop
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <p className="text-white">No video available</p>
        </div>
      )}

      {/* Segmented progress indicator at top */}
      <div className="absolute left-0 right-0 top-3 z-40 px-3">
        <div className="flex gap-1">
          {(Array.from({ length: Math.max(1, total || 1) }) || []).map(
            (_, i) => (
              <div key={i} className="flex-1 h-1 bg-white/30 rounded">
                <div
                  className="h-1 bg-white rounded"
                  style={{
                    width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%",
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Pause icon overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center">
            <FiPlay className="w-10 h-10 text-black ml-1" />
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={reel.profilePic || ""}
            alt={reel.username}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-white"
            onError={(e) => {
              e.currentTarget.src = "";
            }}
          />
          <div className="flex-1">
            <p className="font-bold text-base">{reel.username}</p>
            <p className="text-xs opacity-70">See more</p>
          </div>

          {activeUser?.username !== reel.username && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // go to profile (consumer will navigate)
                // consumer may choose to implement follow here
                window.location.href = `/profile/${reel.username}`;
              }}
              className="px-4 py-1.5 border border-white rounded-full text-sm font-medium hover:bg-white/20 transition"
            >
              Follow
            </button>
          )}
        </div>

        <p className="text-sm font-medium mb-4 line-clamp-2">{reel.caption}</p>

        <div className="absolute right-3 bottom-16 flex flex-col gap-3">
          {/* Mute / Unmute */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted((s) => !s);
              }}
              className="p-2 rounded-full hover:scale-110 transition"
              aria-pressed={muted}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <FiVolumeX className="w-6 h-6 text-white drop-shadow" />
              ) : (
                <FiVolume2 className="w-6 h-6 text-white drop-shadow" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike && onToggleLike(reel.id);
                if (toggleLike) toggleLike(reel.id, activeUser?.username);
              }}
              className="p-2 rounded-full hover:scale-110 transition"
              aria-pressed={reel.liked}
            >
              {reel.liked ? (
                <AiFillHeart className="w-6 h-6 text-red-500 drop-shadow" />
              ) : (
                <FiHeart className="w-6 h-6 text-white drop-shadow" />
              )}
            </button>
            <span className="text-xs font-medium drop-shadow">
              {reel.likes}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments && onOpenComments(reel.id);
              }}
              className="p-2 rounded-full hover:scale-110 transition"
            >
              <FiMessageCircle className="w-6 h-6 text-white drop-shadow" />
            </button>
            <span className="text-xs font-medium drop-shadow">
              {reel.comments}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare && onShare(reel);
            }}
            className="p-2 rounded-full hover:scale-110 transition"
          >
            <FiSend className="w-6 h-6 text-white drop-shadow -rotate-12" />
          </button>

          <button className="p-2 rounded-full hover:scale-110 transition">
            <FiBookmark className="w-6 h-6 text-white drop-shadow" />
          </button>

          <button className="p-2 rounded-full hover:scale-110 transition">
            <FiMoreHorizontal className="w-6 h-6 text-white drop-shadow" />
          </button>

          <div className="mt-2 p-2 bg-white/10 rounded-full">
            <FiMusic className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelPlayer;
