import React, { useMemo, useRef, useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiMessageCircle,
  FiImage,
  FiPhone,
  FiVideo,
  FiSend,
  FiX,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMic,
  FiSquare,
} from "react-icons/fi";
// --- NEW CODE (FOR VIDEO/AUDIO CALLS) ---
// We get the new 'startCall' and 'call' state from the context
import { MessageContext } from "../context/MessageContext";
import { AuthContext } from "../context/AuthContext";
// --- YOUR PREVIOUS CODE (FOR TEXT/IMAGE/VOICE) ---
import { sendMessage } from "../services/messageService";
import { joinRoom, leaveRoom, on, emit } from "../services/socket"; // 'emit' is still used for 'markSeen'

// --- YOUR PREVIOUS CODE ---
// This is your helper function, unchanged
const formatMessageTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// --- YOUR PREVIOUS CODE ---
// This is your helper function, unchanged
const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation || !conversation.participants) return null;
  return conversation.participants.find(
    (p) => String(p._id || p.id) !== String(currentUserId)
  );
};

// --- YOUR PREVIOUS CODE ---
// This is your video player for *video messages*, unchanged
const InstagramVideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    setIsPlaying(false);
  }, [src]);

  return (
    <div
      className="relative w-full h-auto max-w-xs cursor-pointer rounded-lg overflow-hidden"
      onClick={handlePlayPause}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        muted={isMuted}
        className="w-full h-full object-cover"
        onEnded={() => setIsPlaying(false)}
      >
        Your browser does not support the video tag.
      </video>
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity">
          <FiPlay className="text-white text-5xl opacity-80" />
        </div>
      )}
      {showControls && (
        <button
          onClick={handleMute}
          className="absolute bottom-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white z-10"
        >
          {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
        </button>
      )}
    </div>
  );
};

// --- THIS COMPONENT IS UPDATED ---
// It handles BOTH your old messages AND the new call messages
const MessageContent = ({ message }) => {
  const { text, media, mediaUrl } = message;

  // --- NEW: This part renders "Missed call" ---
  if (text && text.startsWith("[call-")) {
    let callMessage = "";
    let CallIcon = FiPhone;
    if (text.startsWith("[call-started:video]")) {
      callMessage = "You started a video call";
      CallIcon = FiVideo;
    } else if (text.startsWith("[call-started:audio]")) {
      callMessage = "You started an audio call";
      CallIcon = FiPhone;
    } else if (text.startsWith("[call-missed]")) {
      callMessage = "Missed call";
    } else if (text.startsWith("[call-declined]")) {
      callMessage = "Call declined";
    }

    if (callMessage) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <CallIcon className="text-gray-400" />
          <span>{callMessage}</span>
        </div>
      );
    }
  }

  // --- YOUR OLD CODE: This part renders images, videos, audio ---
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://snapserver-production.up.railway.app";
  let fullMediaUrl = null;
  if (mediaUrl) {
    if (mediaUrl.startsWith("/")) {
      fullMediaUrl = `${apiUrl}${mediaUrl}`;
    } else {
      fullMediaUrl = mediaUrl;
    }
  }

  const isPlaceholderText =
    text === "[IMAGE]" || text === "[VIDEO]" || text === "[AUDIO]";
  const showText = text && !(media && isPlaceholderText);

  return (
    <>
      {media && fullMediaUrl && (
        <div className="mb-1 rounded-lg overflow-hidden">
          {media === "image" && (
            <img
              src={fullMediaUrl}
              alt="Chat media"
              className="w-full h-auto max-w-xs rounded-lg"
            />
          )}
          {media === "video" && <InstagramVideoPlayer src={fullMediaUrl} />}
          {media === "audio" && (
            <audio src={fullMediaUrl} controls className="w-full mt-2">
              Your browser does not support the audio tag.
            </audio>
          )}
        </div>
      )}
      {showText && <div className="text-sm whitespace-pre-wrap">{text}</div>}
    </>
  );
};

const MessageChatBox = ({ conversationId }) => {
  const params = useParams();
  const id = conversationId || params.id;
  const navigate = useNavigate();

  // Helper: derive a presentable full name from a username when displayName is missing
  const deriveFullName = (username) => {
    if (!username) return null;
    try {
      // Replace non-letter/digit characters with spaces, split and capitalize each word
      const cleaned = username.replace(/[^a-zA-Z0-9]+/g, " ").trim();
      if (!cleaned) return username;
      return cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    } catch (e) {
      console.log("Error deriving full name:", e);
      return username;
    }
  };
  // --- UPDATED CONTEXT ---
  // We now get 'startCall' and 'call' from the context
  const {
    conversations = [],
    addMessageLocally,
    startCall,
    call,
  } = useContext(MessageContext) || {};
  const { activeUser } = useContext(AuthContext);

  // --- YOUR OLD STATE: Unchanged ---
  const chatRef = useRef(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const mediaInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- YOUR OLD useEffects: Unchanged ---
  const currentConversation = useMemo(() => {
    return conversations.find((c) => String(c._id || c.id) === String(id));
  }, [conversations, id]);

  const messages = useMemo(
    () => currentConversation?.messages || [],
    [currentConversation]
  );

  useEffect(() => {
    if (chatRef.current)
      setTimeout(() => {
        if (chatRef.current)
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 0);
  }, [id, messages.length]);

  useEffect(() => {
    if (!id) {
      return;
    }
    joinRoom(id);
    const unsubscribe = on("message", (msg) => {
      if (String(msg.conversation) === String(id)) {
        if (addMessageLocally) {
          addMessageLocally(id, msg);
        }
      }
    });
    return () => {
      leaveRoom(id);
      unsubscribe();
    };
  }, [id, addMessageLocally]);

  useEffect(() => {
    if (!id) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        emit("markSeen", {
          conversationId: id,
          userId: activeUser?._id || activeUser?.id,
        });
      } catch (err) {
        console.error("Failed to mark messages as seen:", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [id, activeUser]);

  const otherUser = useMemo(
    () =>
      getOtherParticipant(
        currentConversation,
        activeUser?._id || activeUser?.id
      ),
    [currentConversation, activeUser]
  );

  // --- YOUR OLD HANDLERS (Unchanged) ---
  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const preview = URL.createObjectURL(file);
      const type = file.type.startsWith("image/") ? "image" : "video";
      setSelectedMedia({ type, file, preview });
    }
  };

  const handleStartRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioFile = new File([audioBlob], "voicemessage.webm", {
          type: "audio/webm",
        });
        setAudioPreview(audioUrl);
        setSelectedMedia({ type: "audio", file: audioFile, preview: audioUrl });
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(
        "Microphone permission was denied. Please allow it in your browser settings."
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelMediaPreview = () => {
    if (selectedMedia && selectedMedia.type === "audio" && audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setSelectedMedia(null);
    setAudioPreview(null);
    setMessageText("");
  };

  const sendMediaMessage = async () => {
    if (!selectedMedia) return;
    try {
      setSending(true);
      const { type, file, preview } = selectedMedia;
      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        conversation: id,
        sender: {
          _id: activeUser._id || activeUser.id,
          username: activeUser.username,
          displayName: activeUser.displayName,
          profilePic: activeUser.profilePic,
        },
        text: messageText || `[${type.toUpperCase()}]`,
        media: type,
        mediaUrl: preview,
        createdAt: new Date().toISOString(),
      };
      if (addMessageLocally) {
        addMessageLocally(id, optimisticMessage);
      }
      await sendMessage(id, {
        text: messageText || `[${type.toUpperCase()}]`,
        media: type,
        fileName: file.name,
        file,
      });
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setMessageText("");
      setSelectedMedia(null);
      setAudioPreview(null);
    } catch (err) {
      console.error(
        "❌ ERROR SENDING MEDIA:",
        err.response?.data || err.message
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    if (!id || !activeUser) return;
    try {
      setSending(true);
      const messageToSend = messageText;
      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        conversation: id,
        sender: {
          _id: activeUser._id || activeUser.id,
          username: activeUser.username,
          displayName: activeUser.displayName,
          profilePic: activeUser.profilePic,
        },
        text: messageToSend,
        seen: false,
        createdAt: new Date().toISOString(),
      };
      if (addMessageLocally) {
        addMessageLocally(id, optimisticMessage);
      }
      setMessageText("");
      await sendMessage(id, { text: messageToSend });
    } catch (err) {
      console.error(
        "❌ ERROR SENDING MESSAGE:",
        err.response?.data || err.message
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // --- (End of your old handlers) ---

  // --- NEW: Updated Call Handler ---
  const handleStartCall = (callType) => {
    if (!otherUser) {
      console.error("Cannot start call, other user not found.");
      return;
    }
    if (call) {
      // If we are already in a call, just navigate to it
      navigate(`/call/${call.callId}`);
      return;
    }
    // This is the new function from MessageContext
    startCall(callType, otherUser, id);
  };

  // --- YOUR OLD JSX (Unchanged) ---
  if (!id) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center max-w-xl w-full px-6">
          <div className="mx-auto w-32 h-32 rounded-full border-2 border-slate-200 flex items-center justify-center mb-6">
            <FiMessageCircle size={36} className="text-slate-500" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Your messages</h3>
          <p className="text-sm text-slate-500 mb-6">
            Send private photos and messages to a friend or group.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/messages/new")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
            >
              Send message
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentConversation || !otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto" ref={chatRef}>
      {/* HEADER (Updated with new onClick) */}
      <div className="chat-header fixed top-0 left-0 right-0 z-50 md:relative md:top-0 bg-white">
        <div
          className="p-3 border-b flex items-center gap-3"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <button
            className="md:hidden p-2"
            aria-label="Back to home"
            title="Back to home"
            onClick={() => {
              // navigate back to home (or change to another interesting page)
              navigate("/");
            }}
          >
            <FiChevronLeft />
          </button>
          {otherUser?.profilePic ? (
            <img
              src={otherUser.profilePic}
              alt={otherUser.displayName || otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-col text-left">
              {/* Top line: full name (displayName or derived from username) */}
              <div className="font-medium truncate text-sm">
                {otherUser?.displayName
                  ? otherUser.displayName
                  : deriveFullName(otherUser?.username) || "User"}
              </div>
              {/* Below: always show @username (fallback to lowercased displayName or 'user') */}
              <div className="text-xs text-slate-400 truncate -mt-0.5">
                @
                {(otherUser?.username || otherUser?.displayName || "user")
                  .toString()
                  .toLowerCase()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 text-slate-600"
              aria-label="voice call"
              onClick={() => handleStartCall("audio")}
            >
              <FiPhone />
            </button>
            <button
              className="p-2 text-slate-600"
              aria-label="video call"
              onClick={() => handleStartCall("video")}
            >
              <FiVideo />
            </button>
          </div>
        </div>
      </div>

      {/* MESSAGES (Updated to style call messages) */}
      <div className="messages-container p-4 flex-1 space-y-3 pt-16 pb-28 md:pt-4 md:pb-0">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isFromMe =
              String(m.sender?._id || m.sender) ===
              String(activeUser?._id || activeUser?.id);
            return (
              <div
                key={m._id || m.id}
                className={
                  m.text?.startsWith("[call-")
                    ? "text-center text-slate-500 text-xs my-4"
                    : `max-w-[80%] ${
                        isFromMe
                          ? "ml-auto bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      } p-3 rounded-lg`
                }
              >
                <MessageContent message={m} />
                {!m.text?.startsWith("[call-") && (
                  <div
                    className={`text-xs mt-1 text-right flex items-center justify-end gap-1 ${
                      isFromMe ? "text-purple-200" : "text-slate-500"
                    }`}
                  >
                    <span>{formatMessageTime(m.createdAt)}</span>
                    {isFromMe && (
                      <span className="ml-1">
                        {m.seen ? "✓✓ seen" : "✓ sent"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MEDIA PREVIEW (Your old code, unchanged) */}
      {selectedMedia && (
        <div className="px-3 py-2 bg-slate-100 border-t flex items-center gap-2">
          <div className="relative w-16 h-16 bg-slate-200 rounded-lg overflow-hidden">
            {selectedMedia.type === "image" && (
              <img
                src={selectedMedia.preview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            )}
            {selectedMedia.type === "video" && (
              <video
                src={selectedMedia.preview}
                className="w-full h-full object-cover"
              />
            )}
            {selectedMedia.type === "audio" && (
              <audio
                src={selectedMedia.preview}
                controls
                className="w-full h-full"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600">
              {selectedMedia.type === "image"
                ? "📷 Image"
                : selectedMedia.type === "video"
                ? "🎥 Video"
                : "🎙️ Audio"}
            </p>
            <p className="text-xs font-medium truncate">
              {selectedMedia.file.name}
            </p>
            <p className="text-xs text-slate-600">Ready to send.</p>
          </div>

          <button
            onClick={cancelMediaPreview}
            className="p-2 text-slate-600 hover:text-red-600"
          >
            <FiX size={16} />
          </button>
          <button
            onClick={sendMediaMessage}
            disabled={sending}
            className="p-2 text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            <FiSend size={16} />
          </button>
        </div>
      )}

      {/* INPUT BAR (Your old code, unchanged) */}
      <div className="message-input-container fixed bottom-0 left-0 right-0 z-40 md:relative md:bottom-0 bg-white">
        <div
          className="bg-white p-3 border-t flex items-center gap-2 max-w-full overflow-x-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <button
            onClick={() => mediaInputRef.current?.click()}
            className="flex-shrink-0 p-2 sm:p-3 text-pink-600 bg-pink-100 rounded-full hover:bg-pink-200 transition"
            aria-label="media"
            title="Send photo or video"
            disabled={isRecording}
          >
            <FiImage size={20} />
          </button>

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />

          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-slate-100 rounded-full px-3 sm:px-4 py-2 sm:py-3">
              <span className="text-sm text-red-600 animate-pulse">
                Recording...
              </span>
              <button
                onClick={handleStopRecording}
                className="flex-shrink-0 p-2 text-white bg-red-600 rounded-full"
                aria-label="stop recording"
                title="Stop recording"
              >
                <FiSquare size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                placeholder="Message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-w-0 bg-slate-100 rounded-full px-3 sm:px-4 py-2 sm:py-3 outline-none text-sm"
                disabled={!!selectedMedia}
              />

              {messageText.trim() ? (
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="flex-shrink-0 p-2 sm:p-3 text-slate-600 disabled:text-slate-300 hover:text-purple-600 disabled:hover:text-slate-300 transition duration-200"
                  aria-label="send"
                  title="Send message"
                >
                  <FiSend
                    size={20}
                    className={sending ? "animate-pulse" : ""}
                  />
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={sending || !!selectedMedia}
                  className="flex-shrink-0 p-2 sm:p-3 text-slate-600 disabled:text-slate-300 hover:text-purple-600 disabled:hover:text-slate-300 transition duration-200"
                  aria-label="record voice message"
                  title="Record voice message"
                >
                  <FiMic size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageChatBox;
