/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { fetchConversations, sendMessage } from "../services/messageService";
import {
  initSocket,
  on as socketOn,
  emit as socketEmit,
  joinRoom,
  leaveRoom,
  // getSocket removed (was unused)
} from "../services/socket";
import { AuthContext } from "./AuthContext";

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  // --- This is your old state for messages ---
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- This is your new state for calls ---
  const [incomingCall, setIncomingCall] = useState(null);
  const [call, setCall] = useState(null);
  const [callPeer, setCallPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [peerStream, setPeerStream] = useState(null);
  const callTimeoutRef = useRef(null);

  // --- NEW: State for the message pop-up ---
  const [messageToast, setMessageToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // --- This is your old function ---
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchConversations();
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn("MessageProvider: failed to load conversations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- This is your old useEffect ---
  useEffect(() => {
    if (!activeUser) return;
    loadConversations();
  }, [loadConversations, activeUser]);

  // --- This is your new function to close the pop-up ---
  const closeMessageToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setMessageToast(null);
  }, []);

  // ---
  // **FIX:** ALL CALL FUNCTIONS ARE MOVED HERE, *BEFORE* THE useEffect
  // ---
  const endCall = useCallback(
    (emitSignal = true) => {
      console.log("Ending call...");
      if (callPeer) {
        callPeer.destroy();
      }
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      if (emitSignal && call) {
        socketEmit("call:end", {
          callId: call.callId,
          recipientId: call.recipient._id,
          callerId: call.caller._id,
        });
        if (call.status === "ringing" || call.status === "unavailable") {
          sendMessage(call.conversationId, { text: `[call-missed]` });
        } else if (call.status === "declined") {
          sendMessage(call.conversationId, { text: `[call-declined]` });
        }
      }
      setCall(null);
      setCallPeer(null);
      setMyStream(null);
      setPeerStream(null);
      navigate(`/messages/${call?.conversationId || ""}`);
    },
    [callPeer, myStream, call, navigate]
  );

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    const declineData = {
      callId: incomingCall.callId,
      callerId: incomingCall.caller._id,
    };
    socketEmit("call:declined", declineData);
    sendMessage(incomingCall.conversationId, { text: `[call-missed]` });
    setIncomingCall(null);
  }, [incomingCall]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });
      setMyStream(stream);
      const callData = {
        callId: incomingCall.callId,
        caller: incomingCall.caller,
        recipient: activeUser,
        callType: incomingCall.callType,
        conversationId: incomingCall.conversationId,
        status: "connected",
      };
      setCall(callData);
      const peer = new window.SimplePeer({
        initiator: false,
        stream: stream,
        trickle: false,
      });
      setCallPeer(peer);
      peer.signal(incomingCall.signal);
      peer.on("signal", (answer) => {
        const acceptData = {
          callId: incomingCall.callId,
          callerId: incomingCall.caller._id,
          recipient: activeUser,
          signal: answer,
        };
        socketEmit("call:accepted", acceptData);
      });
      peer.on("stream", (stream) => {
        setPeerStream(stream);
      });
      peer.on("close", () => endCall(false));
      peer.on("error", (err) => console.error("Peer error:", err));
      navigate(`/call/${incomingCall.callId}`);
      setIncomingCall(null);
    } catch (err) {
      console.error("Failed to accept call:", err);
      declineCall();
    }
  }, [incomingCall, activeUser, navigate, endCall, declineCall]);

  const startCall = useCallback(
    async (callType, otherUser, conversationId) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });
        setMyStream(stream);
        const callId = `call_${Date.now()}_${activeUser._id}`;
        const callData = {
          callId,
          caller: activeUser,
          recipient: otherUser,
          callType,
          conversationId,
          status: "ringing",
        };
        setCall(callData);
        const peer = new window.SimplePeer({
          initiator: true,
          stream: stream,
          trickle: false,
        });
        setCallPeer(peer);
        peer.on("signal", (offer) => {
          const callOffer = {
            recipientId: otherUser._id,
            caller: {
              _id: activeUser._id,
              username: activeUser.username,
              displayName: activeUser.displayName,
              profilePic: activeUser.profilePic,
            },
            callType,
            callId,
            conversationId,
            signal: offer,
          };
          socketEmit("call:start", callOffer);
          sendMessage(conversationId, { text: `[call-started:${callType}]` });
          navigate(`/call/${callId}`);
        });
        peer.on("stream", (stream) => {
          setPeerStream(stream);
        });
        peer.on("close", () => endCall(false));
        peer.on("error", (err) => console.error("Peer error:", err));
      } catch (err) {
        console.error("Failed to start call:", err);
        alert("Could not get camera/mic. Please check permissions.");
      }
    },
    [activeUser, navigate, endCall]
  );

  // --- This useEffect is UPDATED ---
  useEffect(() => {
    if (!activeUser) return;
    // Initialize socket and wait for it to be ready before joining
    // Declare userId here so it's available to the effect cleanup below.
    const userId = activeUser.id || activeUser._id;
    (async () => {
      const s = await initSocket(
        import.meta.env.VITE_API_URL ||
          "https://snapserver-production.up.railway.app"
      );
      if (s && userId) {
        try {
          // Join a room for this user so server can emit personal events
          // join via both channels to be resilient: 'join' and 'authenticate'
          joinRoom(userId).catch((e) => console.warn("joinRoom error", e));
          // notifier listens for 'authenticate' as well
          s.emit("authenticate", userId);
          console.log("socket: authenticated & joined room", userId, s.id);
        } catch (e) {
          console.log(e);
        }
      }
    })();

    // --- (Your old call listeners are unchanged) ---
    const offCallIncoming = socketOn("call:incoming", (callOffer) => {
      console.log("📞 Incoming call received:", callOffer);
      setIncomingCall(callOffer);
      callTimeoutRef.current = setTimeout(() => {
        setIncomingCall((currentCall) => {
          if (currentCall && currentCall.callId === callOffer.callId) {
            console.log("📞 Call timed out (recipient)");
            sendMessage(callOffer.conversationId, { text: `[call-missed]` });
            return null;
          }
          return currentCall;
        });
      }, 30000);
    });
    const offCallAccepted = socketOn("call:accepted", (data) => {
      console.log("✅ Call was accepted by recipient:", data.signal);
      if (callPeer) {
        callPeer.signal(data.signal);
      }
      setCall((prev) => (prev ? { ...prev, status: "connected" } : null));
    });
    const offCallDeclined = socketOn("call:declined", () => {
      console.log("❌ Call was declined");
      setCall((prev) => (prev ? { ...prev, status: "declined" } : null));
    });

    // **THIS IS THE LINE THAT WAS CRASHING**
    // It is now safe because endCall is defined above.
    const offCallEnded = socketOn("call:ended", () => {
      console.log("👋 Call ended by peer");
      endCall(false);
    });
    // --- (End of call listeners) ---

    // --- YOUR Message Listener is UPDATED ---
    const offMessage = socketOn("message", (msg) => {
      try {
        console.log("🔔 SOCKET MESSAGE RECEIVED:", {
          _id: msg._id,
          text: msg.text,
          media: msg.media,
          conversationId: msg.conversation,
        });

        const convId = msg.conversation || msg.conversationId;
        const isFromOtherUser =
          String(msg.sender?._id || msg.sender) !==
          String(activeUser?._id || activeUser?.id);

        const isOnChatPage = window.location.pathname.includes(
          `/messages/${convId}`
        );

        if (isFromOtherUser && !isOnChatPage) {
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          setMessageToast(msg);
          toastTimeoutRef.current = setTimeout(() => {
            setMessageToast(null);
          }, 4000);
        }

        setConversations((prev) => {
          const found = prev.find(
            (c) => String(c._id || c.id) === String(convId)
          );
          if (!found) {
            console.log("ℹ️ New conversation, creating...");
            return [
              { _id: convId, participants: [], messages: [msg], unread: 1 },
              ...prev,
            ];
          }
          return prev.map((c) =>
            String(c._id || c.id) === String(convId)
              ? (() => {
                  const before = c.messages || [];
                  const mapped = before.map((m) => {
                    if (
                      m._id?.toString().startsWith("temp_") &&
                      String(m.sender?._id || m.sender) ===
                        String(msg.sender?._id || msg.sender) &&
                      m.text === msg.text
                    ) {
                      console.log(
                        "✅ Replaced temp message:",
                        m._id,
                        "->",
                        msg._id
                      );
                      return msg;
                    }
                    return m;
                  });

                  const exists = before.some(
                    (m) => String(m._id) === String(msg._id)
                  );
                  const combined = exists ? mapped : mapped.concat([msg]);

                  const seen = new Set();
                  const unique = [];
                  for (const mm of combined) {
                    const key = String(mm._id || mm.id);
                    if (!seen.has(key)) {
                      seen.add(key);
                      unique.push(mm);
                    }
                  }
                  return { ...c, messages: unique };
                })()
              : c
          );
        });
      } catch (e) {
        console.error("❌ Socket message error:", e);
      }
    });

    // --- (Your old notification/seen listeners are unchanged) ---
    const offNotification = socketOn("notification", (n) => {
      const actorId = n.from || n.actor || n.actorId || n.fromId || null;
      window.dispatchEvent(
        new CustomEvent("snapgram:activity", {
          detail: {
            type: n.type || "messages",
            amount: 1,
            actor: actorId,
            raw: n,
          },
        })
      );
    });

    const offMessagesSeen = socketOn("messagesSeen", (data) => {
      console.log("👁️ MESSAGES SEEN EVENT:", {
        conversationId: data.conversationId,
        markedBy: data.markedBy,
      });

      const { conversationId, markedBy } = data;
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id || c.id) === String(conversationId)
            ? {
                ...c,
                messages: (c.messages || []).map((msg) => {
                  const isFromMe =
                    String(msg.sender?._id || msg.sender) === String(markedBy);
                  return isFromMe ? msg : { ...msg, seen: true };
                }),
              }
            : c
        )
      );
    });

    return () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (userId) {
        try {
          leaveRoom(userId);
        } catch (e) {
          console.warn(e);
        }
      }
      offCallIncoming();
      offCallAccepted();
      offCallDeclined();
      offCallEnded();
      offMessage();
      offNotification();
      offMessagesSeen();
    };
  }, [
    activeUser,
    navigate,
    callPeer,
    closeMessageToast,
    endCall,
    acceptCall,
    declineCall,
    startCall,
  ]); // Added all functions to dependency array

  // --- (All your other functions are defined *after* the useEffect) ---
  const addMessageLocally = (conversationId, message) => {
    setConversations((prev) => {
      const found = prev.find(
        (c) => String(c._id || c.id) === String(conversationId)
      );
      if (!found)
        return [
          {
            _id: conversationId,
            participants: [],
            messages: [message],
            unread: 1,
          },
          ...prev,
        ];
      return prev.map((c) =>
        String(c._id || c.id) === String(conversationId)
          ? (() => {
              const before = c.messages || [];
              const incomingKey = String(message._id || message.id);
              if (before.some((m) => String(m._id || m.id) === incomingKey)) {
                return {
                  ...c,
                  messages: before,
                  unread:
                    String(message.sender?._id || message.sender) ===
                    String(activeUser?._id || activeUser?.id)
                      ? c.unread || 0
                      : (c.unread || 0) + 1,
                };
              }
              const combined = [...before, message];
              const seen = new Set();
              const unique = [];
              for (const mm of combined) {
                const key = String(mm._id || mm.id);
                if (!seen.has(key)) {
                  seen.add(key);
                  unique.push(mm);
                }
              }
              return {
                ...c,
                messages: unique,
                unread:
                  String(message.sender?._id || message.sender) ===
                  String(activeUser?._id || activeUser?.id)
                    ? c.unread || 0
                    : (c.unread || 0) + 1,
              };
            })()
          : c
      );
    });
  };
  const markAllRead = () => {
    setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
  };
  const markConversationRead = (conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id || c.id) === String(conversationId)
          ? { ...c, unread: 0 }
          : c
      )
    );
  };
  const markMessagesAsSeen = (conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id || c.id) === String(conversationId)
          ? {
              ...c,
              messages: (c.messages || []).map((msg) => {
                const isFromMe =
                  String(msg.sender?._id || msg.sender) ===
                  String(activeUser?._id || activeUser?.id);
                return {
                  ...msg,
                  seen: isFromMe ? msg.seen : true,
                };
              }),
            }
          : c
      )
    );
  };

  return (
    <MessageContext.Provider
      value={{
        // Your old values
        conversations,
        loading,
        loadConversations: loadConversations,
        addMessageLocally,
        markAllRead,
        markConversationRead,
        markMessagesAsSeen,

        // Your call values
        incomingCall,
        call,
        myStream,
        peerStream,
        startCall,
        acceptCall,
        declineCall,
        endCall,

        // --- NEW: Values for the message pop-up ---
        messageToast,
        closeMessageToast,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
