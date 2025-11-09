import React, { useEffect, useRef } from "react";
import { FiPhone } from "react-icons/fi";

// ---
// **THIS IS THE UPDATED RINGING SOUND HOOK**
// It now uses a real MP3 file and loops it.
// ---
const useRingingSound = () => {
  // 1. Create a ref to hold the Audio object
  const audioRef = useRef(null);

  useEffect(() => {
    // 2. Create the Audio object when the component mounts
    try {
      // This is a high-quality, modern-sounding ringtone from a reliable CDN
      const audio = new Audio(
        "https://cdn.pixabay.com/audio/2022/02/10/audio_50294d3000.mp3"
      );
      audio.loop = true; // Make it loop continuously

      // Browsers often block audio that plays automatically.
      // We try to play it, and if it fails, we wait for the user
      // to interact (which they will when they see the modal).
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(
            "Audio autoplay was blocked. Will play on first click.",
            error
          );
          // As a fallback, we can try to play it again when the user clicks anywhere
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

    // 3. This is the cleanup function.
    // It runs when the user clicks "Accept" or "Decline"
    // (because the modal is unmounted / disappears)
    return () => {
      if (audioRef.current) {
        audioRef.current.pause(); // Stop the sound
        audioRef.current.src = ""; // Clear the audio source
        audioRef.current = null;
      }
    };
  }, []); // The empty array [] means this runs only once
};

//
// The rest of your file is 100% UNCHANGED.
// It already has the green/red buttons and UI.
//
const IncomingCallModal = ({ callOffer, onAccept, onDecline }) => {
  const { caller, callType } = callOffer;

  // This line starts the new, better ringing sound
  useRingingSound();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gray-900 text-white p-8">
      {/* Caller Info (Top) */}
      <div className="text-center pt-20">
        <h1 className="text-3xl font-semibold mb-2">
          {caller.displayName || caller.username}
        </h1>
        <p className="text-xl text-gray-300 animate-pulse">
          Incoming {callType} call...
        </p>
      </div>

      {/* Caller Avatar (Center) */}
      <div className="flex-1 flex items-center justify-center">
        {caller.profilePic ? (
          <img
            src={caller.profilePic}
            alt="caller"
            className="w-48 h-48 rounded-full object-cover border-4 border-gray-700"
          />
        ) : (
          <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-6xl uppercase">
              {(caller.username || "?").charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons (Bottom) */}
      <div className="w-full flex justify-around items-center pb-20">
        {/* Decline Button (Red) */}
        <div className="text-center">
          <button
            onClick={onDecline}
            className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform"
            aria-label="Decline call"
          >
            <FiPhone className="text-4xl transform rotate-135" />
          </button>
          <span className="mt-2 block text-sm">Decline</span>
        </div>

        {/* Accept Button (Green) */}
        <div className="text-center">
          <button
            onClick={onAccept}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform"
            aria-label="Accept call"
          >
            <FiPhone className="text-4xl" />
          </button>
          <span className="mt-2 block text-sm">Accept</span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
