import React, { useEffect, useRef } from "react";
import { FiPhone, FiVideo } from "react-icons/fi";

// ---
// **THIS IS THE UPDATED RINGING SOUND HOOK**
// (Logic unchanged as requested)
// ---
const useRingingSound = () => {
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      const audio = new Audio(
        "https://cdn.pixabay.com/audio/2022/02/10/audio_50294d3000.mp3"
      );
      audio.loop = true;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(
            "Audio autoplay was blocked. Will play on first click.",
            error
          );
          const playOnInteraction = () => {
            audio
              .play()
              .catch((e) =>
                console.error("Could not play audio on interaction", e)
              );
            document.removeEventListener("click", playOnInteraction);
          };
          document.addEventListener("click", playOnInteraction);
        });
      }

      audioRef.current = audio;
    } catch (e) {
      console.error("Could not create ringing sound:", e);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);
};

const IncomingCallModal = ({ callOffer, onAccept, onDecline }) => {
  const { caller, callType } = callOffer;

  // Start ringing sound
  useRingingSound();

  const isVideo = callType === "video";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-gray-900 text-white font-sans">
      {/* --- 1. Dynamic Blurred Background --- */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-3xl opacity-60 scale-110"
        style={{
          backgroundImage: `url(${
            caller.profilePic || "https://via.placeholder.com/500"
          })`,
        }}
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* --- 2. Top Info Section --- */}
      <div className="relative z-10 flex flex-col items-center pt-20 animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="flex items-center gap-2 mb-3 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          {isVideo ? <FiVideo size={14} /> : <FiPhone size={14} />}
          <span className="text-xs font-medium tracking-wide uppercase text-gray-200">
            Incoming {callType} Call
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg text-center px-4">
          {caller.displayName || caller.username}
        </h1>
        <p className="text-gray-300 mt-1 drop-shadow-md">SnapGram Audio...</p>
      </div>

      {/* --- 3. Center Pulsing Avatar --- */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Ripple Animation Ring */}
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />

          {/* Second subtle ring */}
          <div className="absolute -inset-4 rounded-full border border-white/10" />

          {/* Main Avatar */}
          <img
            src={caller.profilePic || "https://via.placeholder.com/150"}
            alt="caller"
            className="relative w-40 h-40 rounded-full object-cover shadow-2xl border-4 border-white/10"
          />
        </div>
      </div>

      {/* --- 4. Bottom Action Buttons --- */}
      <div className="relative z-10 w-full pb-16 px-8">
        <div className="flex justify-between items-center max-w-xs mx-auto">
          {/* Decline Button */}
          <div
            className="flex flex-col items-center gap-3 group cursor-pointer"
            onClick={onDecline}
          >
            <div className="w-20 h-20 rounded-full bg-red-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-300 transform group-hover:scale-110 group-active:scale-95">
              <FiPhone size={32} className="transform rotate-[135deg]" />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              Decline
            </span>
          </div>

          {/* Accept Button */}
          <div
            className="flex flex-col items-center gap-3 group cursor-pointer"
            onClick={onAccept}
          >
            <div className="w-20 h-20 rounded-full bg-green-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 animate-bounce">
              <FiPhone size={32} />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              Accept
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
