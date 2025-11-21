import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPhone,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMoreHorizontal,
} from "react-icons/fi";
import { MessageContext } from "../context/MessageContext";
import { AuthContext } from "../context/AuthContext";

// Timer formatting helper
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num) => String(num).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

const CallPage = () => {
  const navigate = useNavigate();
  const { call, myStream, peerStream, endCall } = useContext(MessageContext);
  const { activeUser } = useContext(AuthContext);

  const [callTime, setCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);

  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const timerIntervalRef = useRef(null);

  // --- Attach Streams to Video Elements ---
  useEffect(() => {
    if (myStream && myVideoRef.current) {
      myVideoRef.current.srcObject = myStream;
      // Ensure audio track is enabled
      myStream.getAudioTracks().forEach((track) => (track.enabled = true));
      setIsCamOn(
        myStream.getVideoTracks().length > 0 &&
          myStream.getVideoTracks()[0].enabled
      );
    }
  }, [myStream]);

  useEffect(() => {
    if (peerStream && peerVideoRef.current) {
      peerVideoRef.current.srcObject = peerStream;
      // Ensure peer audio is enabled
      peerStream.getAudioTracks().forEach((track) => (track.enabled = true));
      peerStream.getVideoTracks().forEach((track) => (track.enabled = true));
    }
  }, [peerStream]);

  // --- Call Status and Timer ---
  useEffect(() => {
    if (call?.status === "connected") {
      timerIntervalRef.current = setInterval(() => {
        setCallTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setCallTime(0);
    }

    if (!call) {
      navigate(`/messages`);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [call?.status, call, navigate]);

  // --- Mute/Unmute Controls ---
  const toggleMute = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (myStream && call?.callType === "video") {
      myStream.getVideoTracks()[0].enabled = !isCamOn;
      setIsCamOn(!isCamOn);
    }
  };

  // Get the other user
  const otherUser =
    call?.caller?.username === activeUser?.username
      ? call?.recipient
      : call?.caller;

  // 🔧 Safe image handler with fallback
  const [imageError, setImageError] = useState(false);
  const getProfileImage = () => {
    if (imageError || !otherUser?.profilePic) {
      return "https://via.placeholder.com/500?text=No+Image";
    }
    return otherUser.profilePic;
  };

  const getStatusText = () => {
    if (!call) return "Call Ended";
    switch (call.status) {
      case "ringing":
        return "Ringing...";
      case "connected":
        return formatTime(callTime);
      case "declined":
        return "Call Declined";
      case "unavailable":
        return "Unavailable";
      case "ended":
        return "Call Ended";
      default:
        return "Connecting...";
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white">
      {/* --- 1. MAIN BACKGROUND / PEER VIDEO LAYER --- */}
      <div className="absolute inset-0 w-full h-full">
        {peerStream && call?.callType === "video" ? (
          <video
            ref={peerVideoRef}
            playsInline
            autoPlay
            controls={false}
            className="w-full h-full object-cover"
          />
        ) : (
          // Audio Mode / No Video UI: Blurred background + Centered Avatar
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Blurred Background Image - 🔧 FIX: Add error handling */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-60 scale-110"
              style={{
                backgroundImage: `url(${getProfileImage()})`,
              }}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/30" />{" "}
            {/* Overlay to darken */}
            {/* Center Avatar with Pulse */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                {call?.status === "ringing" && (
                  <div className="absolute inset-0 rounded-full border-[3px] border-white/30 animate-ping" />
                )}
                <img
                  src={getProfileImage()}
                  alt="user"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                  onError={() => setImageError(true)}
                />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white drop-shadow-md">
                {otherUser?.displayName || otherUser?.username}
              </h2>
              <p className="mt-2 text-white/80 text-lg font-medium drop-shadow-md">
                {getStatusText()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* --- 2. GRADIENT OVERLAYS (Visibility Protection) --- */}
      {call?.callType === "video" && (
        <>
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        </>
      )}

      {/* --- 3. HEADER INFO (Only shows on video calls, audio has center info) --- */}
      {call?.callType === "video" && (
        <div className="absolute top-0 left-0 right-0 pt-14 pb-4 flex flex-col items-center z-20">
          <h1 className="text-2xl font-bold drop-shadow-lg">
            {otherUser?.displayName || otherUser?.username}
          </h1>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm mt-2">
            {getStatusText()}
          </span>
        </div>
      )}

      {/* --- 4. SELF VIDEO (Draggable/Floating PiP Style) --- */}
      {call?.callType === "video" && (
        <div
          className={`absolute top-16 right-4 z-30 transition-all duration-300 ${
            isCamOn ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/50 backdrop-blur-sm">
            <video
              ref={myVideoRef}
              playsInline
              autoPlay
              muted
              controls={false}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* --- 5. CONTROL BAR (Bottom Glassmorphism) --- */}
      <div className="absolute bottom-10 left-0 right-0 z-40 flex justify-center items-center">
        <div className="flex items-center gap-6 px-8 py-5 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl">
          {/* Camera Toggle */}
          {call?.callType === "video" && (
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all duration-200 ${
                isCamOn
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-white text-black"
              }`}
            >
              {isCamOn ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
            </button>
          )}

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all duration-200 ${
              !isMuted
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-white text-black"
            }`}
          >
            {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </button>

          {/* End Call */}
          <button
            onClick={() => endCall(true)}
            className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-red-500/30 scale-110 mx-2"
          >
            <FiPhone size={28} className="transform rotate-[135deg]" />
          </button>

          {/* More Options (Visual Placeholder for future features) */}
          <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200">
            <FiMoreHorizontal size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
