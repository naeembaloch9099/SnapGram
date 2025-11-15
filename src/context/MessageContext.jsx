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
import {
  fetchConversations,
  sendMessage as apiSendMessage,
} from "../services/messageService";
import {
  initSocket,
  on as socketOn,
  emit as socketEmit,
  joinRoom,
  leaveRoom,
} from "../services/socket";
import { AuthContext } from "./AuthContext";

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  // --- State ---
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [incomingCall, setIncomingCall] = useState(null);
  const [call, setCall] = useState(null);
  const [callPeer, setCallPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [peerStream, setPeerStream] = useState(null);
  const callTimeoutRef = useRef(null);

  const [messageToast, setMessageToast] = useState(null);
  const toastTimeoutRef = useRef(null); // --- Utilities ---

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchConversations();
      // Normalize server response shape. Some endpoints may return { results: [...] }
      const payload = res && res.data;
      if (Array.isArray(payload)) {
        setConversations(payload);
      } else if (payload && Array.isArray(payload.results)) {
        setConversations(payload.results);
      } else {
        console.warn(
          "MessageProvider: unexpected conversations response shape:",
          payload
        );
        setConversations([]);
      }
    } catch (e) {
      console.warn("MessageProvider: failed to load conversations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeMessageToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setMessageToast(null);
  }, []); // --- Call Handlers (defined before useEffect) ---

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
          apiSendMessage(call.conversationId, { text: `[call-missed]` });
        } else if (call.status === "declined") {
          apiSendMessage(call.conversationId, { text: `[call-declined]` });
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
    apiSendMessage(incomingCall.conversationId, { text: `[call-missed]` });
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
          apiSendMessage(conversationId, {
            text: `[call-started:${callType}]`,
          });
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
  ); // --- Context Mutators (used by components) ---

  // Add a message locally (optimistic update). Ensures stable temp ids
  // and deduplicates messages by id.
  const addMessageLocally = useCallback(
    (conversationId, message) => {
      setConversations((prev) => {
        const msg = { ...message };
        if (!msg._id && !msg.id) {
          msg._id = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        }

        const found = prev.find(
          (c) => String(c._id || c.id) === String(conversationId)
        );
        if (!found) {
          return [
            {
              _id: conversationId,
              participants: [],
              messages: [msg],
              unread: 1,
            },
            ...prev,
          ];
        }

        return prev.map((c) => {
          if (String(c._id || c.id) !== String(conversationId)) return c;

          const before = c.messages || [];

          const incomingKey = String(msg._id || msg.id);
          if (before.some((m) => String(m._id || m.id) === incomingKey)) {
            // message already exists
            return {
              ...c,
              messages: before,
              unread:
                String(msg.sender?._id || msg.sender) ===
                String(activeUser?._id || activeUser?.id)
                  ? c.unread || 0
                  : (c.unread || 0) + 1,
            };
          }

          const combined = [...before, msg];
          const seen = new Set();
          const unique = [];
          for (let i = 0; i < combined.length; i++) {
            const mm = combined[i];
            const key = String(mm._id || mm.id || `idx_${i}`);
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(mm);
            }
          }

          return {
            ...c,
            messages: unique,
            unread:
              String(msg.sender?._id || msg.sender) ===
              String(activeUser?._id || activeUser?.id)
                ? c.unread || 0
                : (c.unread || 0) + 1,
          };
        });
      });
    },
    [activeUser]
  );

  // 🟢 FIX for LIVE SEEN: Function to mark messages as seen locally
  const markMessagesAsSeenLocally = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) => {
        const isCurrentChatOpen = window.location.pathname.includes(
          `/messages/${c._id || c.id}`
        );
        if (isCurrentChatOpen) {
          return {
            ...c,
            unread: 0,
            messages: (c.messages || []).map((msg) => {
              const isSentByMe =
                String(msg.sender?._id || msg.sender) ===
                String(activeUser?._id || activeUser?.id);
              if (isSentByMe && !msg.seen) {
                return { ...msg, seen: true };
              }
              return msg;
            }),
          };
        }
        return c;
      })
    );
  }, [activeUser]);

  // Mark a single conversation as read
  const markConversationRead = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id || c.id) === String(conversationId)
          ? { ...c, unread: 0 }
          : c
      )
    );
  }, []);

  // Mark all conversations as read
  const markAllRead = useCallback(() => {
    setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
  }, []);

  // Send a message to the server with optimistic local update
  const sendMessageToServer = useCallback(
    async (conversationId, payload) => {
      if (!activeUser) throw new Error("Not authenticated");

      const tempMsg = {
        _id: `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        sender: activeUser,
        text: payload && payload.text ? payload.text : payload.fileName || "",
        createdAt: new Date().toISOString(),
        // attach a flag so we can identify optimistic messages if needed
        _optimistic: true,
      };

      // Optimistic add
      addMessageLocally(conversationId, tempMsg);

      try {
        const res = await apiSendMessage(conversationId, payload);
        const serverMsg = res?.data;
        if (serverMsg) {
          // Replace temp message with server message
          setConversations((prev) =>
            prev.map((c) => {
              if (String(c._id || c.id) !== String(conversationId)) return c;
              const msgs = (c.messages || []).map((m) =>
                String(m._id) === String(tempMsg._id) ? serverMsg : m
              );
              if (!msgs.some((m) => String(m._id) === String(serverMsg._id))) {
                msgs.push(serverMsg);
              }
              const seen = new Set();
              const unique = [];
              for (const mm of msgs) {
                const key = String(mm._id || mm.id);
                if (!seen.has(key)) {
                  seen.add(key);
                  unique.push(mm);
                }
              }
              return { ...c, messages: unique };
            })
          );
        }
        return res;
      } catch (err) {
        // mark optimistic message as failed
        setConversations((prev) =>
          prev.map((c) => {
            if (String(c._id || c.id) !== String(conversationId)) return c;
            return {
              ...c,
              messages: (c.messages || []).map((m) =>
                String(m._id) === String(tempMsg._id)
                  ? { ...m, sendFailed: true }
                  : m
              ),
            };
          })
        );
        throw err;
      }
    },
    [addMessageLocally, activeUser]
  );

  useEffect(() => {
    if (!activeUser) return;
    // Load conversations from server (link frontend state with DB)
    loadConversations();
    const userId = activeUser.id || activeUser._id;
    (async () => {
      const s = await initSocket(
        import.meta.env.VITE_API_URL ||
          "https://snapserver-production.up.railway.app"
      );
      if (s && userId) {
        try {
          joinRoom(userId).catch((e) => console.warn("joinRoom error", e));
          s.emit("authenticate", userId);
          console.log("socket: authenticated & joined room", userId, s.id);
        } catch (e) {
          console.log(e);
        }
      }
    })(); // --- Call Listeners (Unchanged) ---

    const offCallIncoming = socketOn("call:incoming", (callOffer) => {
      console.log("📞 Incoming call received:", callOffer);
      setIncomingCall(callOffer);
      callTimeoutRef.current = setTimeout(() => {
        setIncomingCall((currentCall) => {
          if (currentCall && currentCall.callId === callOffer.callId) {
            console.log("📞 Call timed out (recipient)");
            apiSendMessage(callOffer.conversationId, { text: `[call-missed]` });
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
    const offCallEnded = socketOn("call:ended", () => {
      console.log("👋 Call ended by peer");
      endCall(false);
    }); // --- End of call listeners --- // --- Message Listener (Unchanged) ---
    const offMessage = socketOn("message", (msg) => {
      try {
        // ... message toast and other logic ...
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
          } // ... rest of the setConversations logic remains the same ...
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
    }); // --- Notification Listener (Unchanged) ---

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
    }); // 🟢 FIX for LIVE SEEN: Listener now calls the dedicated state update function

    const offMessagesSeen = socketOn("messagesSeen", (data) => {
      console.log("👁️ MESSAGES SEEN EVENT RECEIVED:", data);
      markMessagesAsSeenLocally();
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
    markMessagesAsSeenLocally,
    loadConversations,
  ]);

  return (
    <MessageContext.Provider
      value={{
        // Your old values
        conversations,
        loading,
        loadConversations: loadConversations,
        addMessageLocally,
        sendMessageToServer,
        markAllRead,
        markConversationRead, // Your call values
        incomingCall,
        call,
        myStream,
        peerStream,
        startCall,
        acceptCall,
        declineCall,
        endCall, // --- NEW: Values for the message pop-up ---

        messageToast,
        closeMessageToast,
      }}
    >
      {children}{" "}
    </MessageContext.Provider>
  );
};
