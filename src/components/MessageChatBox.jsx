import React, { useMemo, useRef, useEffect, useContext, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import ChatSkeleton from "./ChatSkeleton";
import StoryViewer from "./StoryViewer";
import { AuthContext } from "../context/AuthContext";
// --- YOUR PREVIOUS CODE (FOR TEXT/IMAGE/VOICE) ---
import { sendMessage } from "../services/messageService";
import { uploadToCloudinary } from "../services/cloudinaryClient";
import { joinRoom, leaveRoom, on, emit } from "../services/socket"; // 'emit' is still used for 'markSeen'
import api from "../services/api";

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

// Format a full timestamp similar to Instagram DM: "Yesterday at 20:29" or "05 March, 09:56"
// (prefixed with underscore because it's not currently used elsewhere)
const _formatFullTimestamp = (date) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    return (
      d.toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }) + `, ${time}`
    );
  } catch (e) {
    console.error("Error formatting full timestamp:", e);
    return "Invalid date format";
  }
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
          type="button"
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
const AudioBubble = ({ src, isFromMe = false, filename }) => {
  const aRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = aRef.current;
    if (!a) return;
    const onEnded = () => setPlaying(false);
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const a = aRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  };

  // simple static bar heights to mimic waveform; could be replaced with real waveform later
  const bars = [6, 10, 14, 18, 22, 18, 14, 10, 6, 8, 12, 16, 20, 16, 12, 8];

  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-2 rounded-full max-w-xs ${
        isFromMe ? "bg-[#0095F6] text-white" : "bg-[#F2F2F2] text-[#262626]"
      }`}
      onClick={() => {
        /* allow clicking bubble to toggle play */
        const a = aRef.current;
        if (a) {
          if (playing) a.pause();
          else a.play().catch(() => {});
          setPlaying(!playing);
        }
      }}
    >
      <audio ref={aRef} src={src} preload="metadata" className="sr-only" />
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          isFromMe ? "bg-white text-[#0095F6]" : "bg-[#262626] text-white"
        }`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <FiPause size={14} /> : <FiPlay size={14} />}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-1 bg-transparent rounded" />
          <div className="flex items-end gap-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`${playing ? "animate-pulse" : ""} rounded-sm`}
                style={{
                  width: 3,
                  height: `${h}px`,
                  background: isFromMe ? "white" : "#1f2937",
                  opacity: 0.95,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {filename && (
        <div className="ml-3 text-xs truncate max-w-[8rem]">{filename}</div>
      )}
    </div>
  );
};

const MessageContent = ({ message, isFromMe }) => {
  const { text, media, mediaUrl, postRef, postSnapshot } = message;

  // Use postRef if available, otherwise fall back to postSnapshot (embedded at send time)
  const post = postRef || postSnapshot;

  // If this message references a Post, render a small post preview (image/video + caption)
  if (post) {
    const apiBase = import.meta.env.VITE_API_URL || "";
    let prMediaUrl = null;
    const raw = post.image || post.video || null;
    if (raw) {
      if (raw.startsWith("/")) prMediaUrl = apiBase ? `${apiBase}${raw}` : raw;
      else prMediaUrl = raw;
    }

    return (
      <div className="rounded-lg border bg-white p-2 max-w-xs">
        {prMediaUrl && (
          <div className="mb-2 rounded overflow-hidden">
            {post.type === "image" && (
              <img
                src={prMediaUrl}
                alt="post preview"
                className="w-full h-auto rounded"
              />
            )}
            {post.type === "video" && <InstagramVideoPlayer src={prMediaUrl} />}
          </div>
        )}
        {post.caption && (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {post.caption}
          </div>
        )}
      </div>
    );
  }

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
  const apiBase = import.meta.env.VITE_API_URL || "";
  let fullMediaUrl = null;
  if (mediaUrl) {
    if (mediaUrl.startsWith("/")) {
      fullMediaUrl = apiBase ? `${apiBase}${mediaUrl}` : mediaUrl;
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
            <AudioBubble
              src={fullMediaUrl}
              isFromMe={isFromMe}
              filename={message.fileName || message.name}
            />
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
  const location = useLocation();
  const targetUser = location.state?.targetUser;

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
  // preview audio is handled inside AudioBubble; only keep preview URL state
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [tempConversationId, setTempConversationId] = useState(null);
  // Local viewer fallback when StoriesTray doesn't contain the story
  const [localViewerGroup, setLocalViewerGroup] = useState(null);

  // --- YOUR OLD useEffects: Unchanged ---
  const currentConversation = useMemo(() => {
    return conversations.find(
      (c) => String(c._id || c.id) === String(id || tempConversationId)
    );
  }, [conversations, id, tempConversationId]);

  const messages = useMemo(
    () => currentConversation?.messages || [],
    [currentConversation]
  );

  // Auto-create conversation if targetUser is provided
  useEffect(() => {
    if (!targetUser || !id || id !== "new" || creatingConversation) return;

    const createConv = async () => {
      setCreatingConversation(true);
      try {
        console.log("🔄 Creating conversation with", targetUser.username);
        const res = await api.post("/messages/conversation", {
          participantId: targetUser._id || targetUser.id,
        });
        const newConvId = res.data._id || res.data.id;
        setTempConversationId(newConvId);
        console.log("✅ Conversation created:", newConvId);
        // Replace URL without reload
        window.history.replaceState({}, "", `/messages/${newConvId}`);
      } catch (err) {
        console.error("❌ Failed to create conversation:", err);
      } finally {
        setCreatingConversation(false);
      }
    };

    createConv();
  }, [targetUser, id, creatingConversation]);

  useEffect(() => {
    if (chatRef.current)
      setTimeout(() => {
        if (chatRef.current)
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 0);
  }, [id, messages.length]);

  useEffect(() => {
    if (!id || id === "new") {
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
    if (!id || id === "new") {
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

  const otherUser = useMemo(() => {
    // If we have targetUser from navigation state, use it immediately
    if (targetUser) {
      return targetUser;
    }
    // Otherwise get from conversation
    return getOtherParticipant(
      currentConversation,
      activeUser?._id || activeUser?.id
    );
  }, [currentConversation, activeUser, targetUser]);

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

  useEffect(() => {
    // cleanup preview audio URL when changed/unmounted
    return () => {
      if (audioPreview && audioPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(audioPreview);
        } catch (e) {
          console.warn(e);
        }
      }
    };
  }, [audioPreview]);

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
      // If frontend Cloudinary config is available, upload from client first
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (cloudName && uploadPreset) {
        try {
          const uploadResult = await uploadToCloudinary(file);
          const url = uploadResult.secure_url || uploadResult.url;
          await sendMessage(id, {
            text: messageText || `[${type.toUpperCase()}]`,
            media: type,
            mediaUrl: url,
            fileName: file.name,
          });
        } catch (err) {
          console.error(
            "Client Cloudinary upload failed for message, falling back",
            err
          );
          // Fallback to server multipart upload
          await sendMessage(id, {
            text: messageText || `[${type.toUpperCase()}]`,
            media: type,
            fileName: file.name,
            file,
          });
        }
      } else {
        // No client config; use server upload
        await sendMessage(id, {
          text: messageText || `[${type.toUpperCase()}]`,
          media: type,
          fileName: file.name,
          file,
        });
      }
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

  // Open a story in the StoriesTray / StoryViewer by dispatching a global event
  const openStoryById = (storyId) => {
    if (!storyId) return;
    // Normalize possible shapes: string id, {_id:..}, {id:..}
    let idToSend = storyId;
    try {
      if (typeof storyId === "object") {
        idToSend =
          storyId._id || storyId.id || (storyId.toString && storyId.toString());
      }
      idToSend = String(idToSend);
    } catch (e) {
      console.debug("openStoryById: failed to normalize id", e);
    }

    console.info("MessageChatBox.openStoryById -> dispatching stories:open", {
      storyId: idToSend,
    });
    try {
      window.dispatchEvent(
        new CustomEvent("stories:open", {
          detail: { storyId: idToSend, story_id: idToSend },
        })
      );
      console.info(
        "MessageChatBox.openStoryById -> dispatched stories:open (CustomEvent)",
        { storyId: idToSend }
      );
    } catch {
      try {
        const ev = document.createEvent("CustomEvent");
        ev.initCustomEvent("stories:open", true, true, {
          storyId: idToSend,
          story_id: idToSend,
        });
        window.dispatchEvent(ev);
      } catch (err) {
        console.debug("Failed to dispatch stories:open", err);
      }
    }
  };

  // Lightweight click wrapper for story thumbnails — logs metadata and then opens the story
  const handleStoryClick = (message) => (ev) => {
    try {
      if (ev && ev.preventDefault) ev.preventDefault();
      const meta = message?.metadata || null;
      const candidate =
        meta?.storyId ||
        meta?.story_id ||
        meta?.story?.id ||
        meta?.storyUrl ||
        meta?.storyImage ||
        null;
      console.info("MessageChatBox: story thumbnail clicked", {
        candidate,
        metadata: meta,
        messageId: message?._id || message?.id,
      });
      if (!candidate) {
        console.warn("MessageChatBox: no story id found in metadata", message);
      }
      // preserve existing behaviour: dispatch event
      openStoryById(candidate || meta || null);
    } catch (err) {
      console.error("MessageChatBox.handleStoryClick error", err);
    }
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
              type="button"
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
    // If we're creating a conversation with targetUser, show the UI immediately
    if (targetUser && (id === "new" || creatingConversation)) {
      // Show chat UI with empty messages while conversation is being created
      return (
        <div className="flex flex-col h-full overflow-auto" ref={chatRef}>
          {/* HEADER */}
          <div className="chat-header fixed top-0 left-0 right-0 z-50 md:relative md:top-0 bg-white">
            <div
              className="p-3 border-b flex items-center gap-3"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              <button
                type="button"
                className="md:hidden p-2"
                aria-label="Back"
                onClick={() => navigate("/")}
              >
                <FiChevronLeft />
              </button>
              {targetUser.profilePic || targetUser.avatar ? (
                <img
                  src={targetUser.profilePic || targetUser.avatar}
                  alt={targetUser.displayName || targetUser.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {targetUser.displayName ||
                    deriveFullName(targetUser.username)}
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="messages-container p-4 flex-1 space-y-3 pt-16 pb-28 md:pt-4 md:pb-0">
            <div className="text-center text-slate-500 text-sm py-8">
              {creatingConversation
                ? "Starting conversation..."
                : "No messages yet. Start the conversation!"}
            </div>
          </div>
        </div>
      );
    }

    // Show skeleton for loading state
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Instagram-style Header */}
      <div className="border-b border-[#DBDBDB] px-5 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden -ml-2"
            aria-label="Back"
            onClick={() => navigate("/messages")}
          >
            <FiChevronLeft size={28} className="text-[#262626]" />
          </button>
          {otherUser?.profilePic ? (
            <img
              src={otherUser.profilePic}
              alt={otherUser.displayName || otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white font-semibold">
              {(otherUser?.displayName ||
                otherUser?.username)?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-sm text-[#262626]">
              {otherUser?.displayName || otherUser?.username || "User"}
            </div>
            <div className="text-xs text-[#737373]">Active now</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleStartCall("audio")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Voice call"
          >
            <FiPhone size={22} className="text-[#262626]" />
          </button>
          <button
            type="button"
            onClick={() => handleStartCall("video")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Video call"
          >
            <FiVideo size={22} className="text-[#262626]" />
          </button>
        </div>
      </div>

      {/* Messages Area - Instagram style */}
      <div className="flex-1 overflow-y-auto px-5 py-4" ref={chatRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {otherUser?.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt={otherUser.username}
                className="w-20 h-20 rounded-full object-cover mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
                {otherUser?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <p className="text-sm font-semibold text-[#262626] mb-1">
              {otherUser?.username || "User"}
            </p>
            <p className="text-sm text-[#737373] mb-4">
              {otherUser?.displayName || "No name"} • SnapGram
            </p>
            <p className="text-sm text-[#737373] mb-6">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const isFromMe =
                String(m.sender?._id || m.sender) ===
                String(activeUser?._id || activeUser?.id);
              const isCall = m.text?.startsWith("[call-");
              const hasMedia = !!m.media || !!m.mediaUrl;

              // Instagram 2025 Perfect Story Reply — Big thumbnail on top + reply below
              if (m.metadata && (m.metadata.storyId || m.metadata.storyUrl)) {
                const storyThumb =
                  m.metadata.storySnapshot?.image ||
                  m.metadata.storySnapshot?.url ||
                  m.metadata.storyUrl ||
                  m.metadata.storyImage ||
                  null;

                const senderName =
                  m.sender?.displayName || m.sender?.username || "Someone";

                const replyText =
                  m.text?.trim() || m.metadata?.text?.trim() || "❤️";

                return (
                  <div
                    key={m._id || m.id}
                    className={`flex ${
                      isFromMe ? "justify-end" : "justify-start"
                    } px-4 my-5`}
                  >
                    <div className="flex flex-col gap-3 max-w-[80%]">
                      {/* Caption moved into compact overlay on the thumbnail */}

                      {/* Thumbnail + Reply Bubble */}
                      <div
                        className={`flex flex-col ${
                          isFromMe ? "items-end" : "items-start"
                        } gap-3`}
                      >
                        {/* Story Thumbnail - Instagram Size */}
                        {storyThumb && (
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleStoryClick(m)(e);
                            }}
                            onClick={(e) => handleStoryClick(m)(e)}
                            className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 w-72 h-96 cursor-pointer"
                          >
                            <img
                              src={storyThumb}
                              alt="Story reply"
                              className="w-full h-full object-cover"
                            />
                            {/* Instagram-style dark gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {/* Sender avatar overlay (top-left) */}
                            {m.sender && (
                              <img
                                src={m.sender.profilePic || m.sender.avatar}
                                alt={m.sender.username || m.sender.displayName}
                                className="absolute top-3 left-3 w-10 h-10 rounded-full border-2 border-white object-cover shadow"
                                onError={(e) =>
                                  (e.currentTarget.src = "/default-avatar.png")
                                }
                              />
                            )}

                            {/* Tiny clickable caption overlay (bottom-left) */}
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                handleStoryClick(m)(ev);
                              }}
                              className="absolute left-3 bottom-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full shadow-sm hover:bg-black/70"
                            >
                              {isFromMe
                                ? "You replied"
                                : `${senderName} replied`}
                            </button>
                          </div>
                        )}

                        {/* Reply Bubble */}
                        <div className="max-w-[85%]">
                          <div
                            className={`rounded-3xl px-5 py-3.5 shadow-lg ${
                              isFromMe
                                ? "bg-[#0095F6] text-white rounded-br-none"
                                : "bg-white text-black border border-gray-200 rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm leading-snug whitespace-pre-wrap">
                              {replyText}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <p
                        className={`text-xs text-gray-400 ${
                          isFromMe ? "text-right" : "text-left"
                        } mt-1`}
                      >
                        {formatMessageTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              }

              if (isCall && !hasMedia) {
                return (
                  <div
                    key={m._id || m.id}
                    className="text-center text-xs text-[#737373] my-4"
                  >
                    <MessageContent message={m} isFromMe={isFromMe} />
                  </div>
                );
              }

              return (
                <div
                  key={m._id || m.id}
                  className={`flex ${
                    isFromMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[65%] rounded-3xl px-4 py-2 ${
                      isFromMe
                        ? "bg-[#0095F6] text-white"
                        : "bg-[#EFEFEF] text-[#262626] border border-[#DBDBDB]"
                    }`}
                  >
                    <MessageContent message={m} isFromMe={isFromMe} />
                    <div
                      className={`text-xs mt-1 ${
                        isFromMe ? "text-blue-100" : "text-[#737373]"
                      }`}
                    >
                      {formatMessageTime(m.createdAt)}
                      {isFromMe && (
                        <span className="ml-1">
                          {m.seen ? " • Seen" : " • Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              <div className="w-full h-full flex items-center justify-center">
                <AudioBubble
                  src={selectedMedia.preview}
                  isFromMe={true}
                  filename={selectedMedia.file.name}
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {selectedMedia.type === "audio" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium truncate">
                    {selectedMedia.file.name}
                  </div>
                  <div className="text-xs text-slate-600 ml-auto">
                    Ready to send
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <button
            type="button"
            onClick={cancelMediaPreview}
            className="p-2 text-slate-600 hover:text-red-600"
          >
            <FiX size={16} />
          </button>
          <button
            type="button"
            onClick={sendMediaMessage}
            disabled={sending}
            className="p-2 text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            <FiSend size={16} />
          </button>
        </div>
      )}

      {/* Instagram-style Input Bar */}
      <div className="border-t border-[#DBDBDB] px-5 py-3 bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="flex-shrink-0 text-[#262626] hover:text-[#0095F6] transition-colors duration-200"
            aria-label="Add media"
            disabled={isRecording}
          >
            <svg
              aria-label="Attach media"
              className="w-6 h-6"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                d="M6.549 5.013A1.557 1.557 0 1 0 4.985 6.58a1.557 1.557 0 0 0 1.564-1.567Z"
                fillRule="evenodd"
              ></path>
              <path
                d="M2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <path
                d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </button>

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />

          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-[#EFEFEF] rounded-full px-4 py-2.5 transition-all">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                <span
                  className="text-sm text-[#262626] font-medium"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Recording voice message...
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopRecording}
                className="flex-shrink-0 p-1.5 text-white bg-red-600 rounded-full hover:bg-red-700 transition"
                aria-label="Stop recording"
              >
                <FiSquare size={14} />
              </button>
            </div>
          ) : (
            <>
              <input
                placeholder="Message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-w-0 bg-white border border-[#DBDBDB] rounded-full px-4 py-2.5 outline-none text-sm focus:border-[#262626] transition-all duration-200 placeholder:text-[#8E8E8E]"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                disabled={!!selectedMedia}
              />

              {messageText.trim() ? (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="flex-shrink-0 font-semibold text-sm text-[#0095F6] hover:text-[#00376B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                  aria-label="Send message"
                >
                  {sending ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "Send"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="flex-shrink-0 text-[#262626] hover:text-[#0095F6] transition-colors duration-200"
                  aria-label="Record voice message"
                >
                  <svg
                    aria-label="Voice message"
                    className="w-6 h-6"
                    fill="currentColor"
                    height="24"
                    role="img"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M19.5 10.671v.329c0 4.14-3.36 7.5-7.5 7.5s-7.5-3.36-7.5-7.5v-.329a1.5 1.5 0 0 0-3 0v.329c0 5.518 4.159 10.073 9.5 10.781V24h3v-2.219c5.341-.708 9.5-5.263 9.5-10.781v-.329a1.5 1.5 0 0 0-3 0Z"></path>
                    <path d="M12 15.5a4 4 0 0 0 4-4V5a4 4 0 1 0-8 0v6.5a4 4 0 0 0 4 4Z"></path>
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {localViewerGroup && (
        <StoryViewer
          group={localViewerGroup}
          initialIndex={0}
          onClose={() => setLocalViewerGroup(null)}
        />
      )}
    </div>
  );
};

export default MessageChatBox;
