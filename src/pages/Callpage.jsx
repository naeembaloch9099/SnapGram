import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPhone, FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { MessageContext } from "../context/MessageContext";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

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
  const { callId } = useParams();
  const { call, myStream, peerStream, endCall } = useContext(MessageContext);
  const { activeUser } = useContext(AuthContext); // Get activeUser

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
      setIsCamOn(
        myStream.getVideoTracks().length > 0 &&
          myStream.getVideoTracks()[0].enabled
      );
    }
  }, [myStream]);

  useEffect(() => {
    if (peerStream && peerVideoRef.current) {
      peerVideoRef.current.srcObject = peerStream;
    }
  }, [peerStream]);

  // --- Call Status and Timer ---
  useEffect(() => {
    if (call?.status === "connected") {
      // Start the 00:01, 00:02 timer
      timerIntervalRef.current = setInterval(() => {
        setCallTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      // Clear timer if status is not 'connected'
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setCallTime(0);
    }

    // Handle user leaving the page or call ending unexpectedly
    if (!call) {
      // If the call object is gone, navigate away
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
      myStream.getAudioTracks()[0].enabled = isMuted; // Note: enabled is opposite of isMuted
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (myStream && call?.callType === "video") {
      myStream.getVideoTracks()[0].enabled = !isCamOn;
      setIsCamOn(!isCamOn);
    }
  };

  // Get the other user (recipient if we are caller, caller if we are recipient)
  const otherUser =
    call?.caller?.username === activeUser?.username
      ? call?.recipient
      : call?.caller;

  const getStatusText = () => {
    if (!call) return "Call Ended";
    switch (call.status) {
      case "ringing":
        return "Ringing...";
      case "connected":
        return formatTime(callTime); // The 00:01 timer
      case "declined":
        return "Call Declined";
      case "unavailable":
        return "User is unavailable";
      case "ended":
        return "Call Ended";
      default:
        return "Connecting...";
    }
  };

  // This is the "In-Call" UI
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gray-900 text-white p-8">
      {/* 1. Video Feeds */}
      <div className="absolute inset-0 w-full h-full">
        {/* Peer Video (Full Screen) */}
        {peerStream && call?.callType === "video" ? (
          <video
            ref={peerVideoRef}
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback: Show avatar if audio-only or no peer stream yet
          <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
            {otherUser?.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt="user"
                className="w-48 h-48 rounded-full object-cover border-4 border-gray-700"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-6xl uppercase">
                  {(otherUser?.username || "?").charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-semibold mt-4">
              {otherUser?.displayName || otherUser?.username || "Unknown"}
            </h1>
          </div>
        )}

        {/* My Video (Picture-in-Picture) */}
        {call?.callType === "video" && (
          <video
            ref={myVideoRef}
            playsInline
            autoPlay
            muted
            className={`absolute top-4 right-4 w-32 h-48 object-cover rounded-lg bg-black ${
              isCamOn ? "" : "hidden"
            }`}
          />
        )}
      </div>

      {/* 2. Top Info */}
      <div className="relative z-10 text-center pt-4">
        <h1 className="text-2xl font-semibold">
          {otherUser?.displayName || otherUser?.username || "Unknown"}
        </h1>
        <p className="text-lg text-gray-300">{getStatusText()}</p>
      </div>

      {/* 3. Bottom Controls */}
      <div className="relative z-10 w-full max-w-sm flex justify-around items-center pb-8">
        {/* Show Camera toggle only for video calls */}
        {call?.callType === "video" && (
          <button
            onClick={toggleCamera}
            className="p-4 bg-gray-700 bg-opacity-50 rounded-full disabled:opacity-30"
          >
            {isCamOn ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
          </button>
        )}

        <button
          onClick={toggleMute}
          className="p-4 bg-gray-700 bg-opacity-50 rounded-full"
        >
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>

        <button
          onClick={() => endCall(true)}
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform"
          aria-label="End call"
        >
          <FiPhone className="text-3xl transform rotate-135" />
        </button>
      </div>
    </div>
  );
};

export default CallPage;
