import React, { useEffect, useState, useCallback, useContext } from "react";
import { fetchConversations, sendMessage } from "../services/messageService";
import api from "../services/api";
import { MessageContext } from "../context/MessageContext";
import { AuthContext } from "../context/AuthContext";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Keeping for completeness, though not explicitly used in the final clean structure
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";

const ShareModal = ({ open, onClose, post }) => {
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null); // id (conversation or user) currently sending

  const { addMessageLocally } = useContext(MessageContext) || {};
  const { activeUser } = useContext(AuthContext) || {};
  const { toasts, showToast, removeToast } = useToast();
  // const navigate = useNavigate(); // This was in the original code, keeping the import but commenting out the usage if not needed.

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetchConversations();
      const payload = res && res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload && Array.isArray(payload.results)
        ? payload.results
        : [];
      setConversations(list);
    } catch (e) {
      console.warn("ShareModal: failed to load conversations", e);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadConversations();
  }, [open, loadConversations]);

  useEffect(() => {
    let mounted = true;
    const doSearch = async () => {
      if (!query || query.trim().length < 2) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(
          `/users/search?q=${encodeURIComponent(query)}`
        );
        if (!mounted) return;
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload && Array.isArray(payload.results)
          ? payload.results
          : [];
        setUsers(list);
      } catch (e) {
        console.warn("ShareModal: user search failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const id = setTimeout(doSearch, 250);
    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [query]);

  const handleSendToConversation = async (conversationId) => {
    if (!conversationId) return;
    setSendingId(conversationId);
    try {
      // Optimistic local insert
      if (addMessageLocally) {
        const optimistic = {
          _id: `temp_${Date.now()}`,
          conversation: conversationId,
          sender: {
            _id: activeUser?._id || activeUser?.id,
            username: activeUser?.username,
            displayName: activeUser?.displayName,
            profilePic: activeUser?.profilePic,
          },
          text: post?.caption || "",
          postRef: {
            _id: post?.id || post?._id,
            caption: post?.caption,
            image: post?.image,
            video: post?.video,
            type: post?.type,
          },
          createdAt: new Date().toISOString(),
        };
        try {
          addMessageLocally(conversationId, optimistic);
        } catch (err) {
          console.warn("ShareModal: optimistic add failed", err);
        }
      }

      await sendMessage(conversationId, {
        postId: post?.id || post?._id,
        text: post?.caption || "",
      });
      onClose();
      showToast("Message sent", "success");
    } catch (e) {
      console.warn("ShareModal: failed to send message", e);
      showToast(e?.response?.data?.error || "Failed to send message", "error");
    } finally {
      setSendingId(null);
    }
  };

  const handleSendToUser = async (user) => {
    if (!user) return;
    const uid = user._id || user.id;
    setSendingId(uid);
    try {
      // 1. Create or retrieve conversation
      const convRes = await api.post("/messages/conversation", {
        participantId: uid,
      });
      const conv = convRes.data;

      // 2. Optimistic local insert
      if (addMessageLocally) {
        const optimistic = {
          _id: `temp_${Date.now()}`,
          conversation: conv._id || conv.id,
          sender: {
            _id: activeUser?._id || activeUser?.id,
            username: activeUser?.username,
            displayName: activeUser?.displayName,
            profilePic: activeUser?.profilePic,
          },
          text: post?.caption || "",
          postRef: {
            _id: post?.id || post?._id,
            caption: post?.caption,
            image: post?.image,
            video: post?.video,
            type: post?.type,
          },
          createdAt: new Date().toISOString(),
        };
        try {
          addMessageLocally(conv._id || conv.id, optimistic);
        } catch (err) {
          console.warn("ShareModal: optimistic add failed", err);
        }
      }

      // 3. Send the actual message
      await sendMessage(conv._id || conv.id, {
        postId: post?.id || post?._id,
        text: post?.caption || "",
      });

      onClose();
      showToast("Message sent", "success");
    } catch (e) {
      console.warn("ShareModal: failed to create conversation or send", e);
      showToast(e?.response?.data?.error || "Failed to send message", "error");
    } finally {
      setSendingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Send</h3>
              <div className="text-sm text-slate-500">
                Share this post in a message
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-600">
              Close
            </button>
          </div>
        </div>

        <div className="p-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 border rounded px-2 py-1 mb-3">
            <FiSearch />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people"
              className="flex-1 outline-none text-sm"
            />
          </div>

          {/* Conditional Rendering for Search Results or Recent Conversations */}
          {query.trim().length >= 2 ? (
            <div>
              <div className="text-xs text-slate-500 mb-2">Search results</div>
              {loading && (
                <div className="text-sm text-slate-500">Searching...</div>
              )}
              {!loading && users.length === 0 && (
                <div className="text-sm text-slate-400">No users</div>
              )}
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u._id || u.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {u.profilePic && (
                          <img
                            src={u.profilePic}
                            alt={u.username}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{u.username}</div>
                        <div className="text-xs text-slate-500">
                          {u.displayName}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSendToUser(u)}
                        disabled={sendingId === (u._id || u.id)}
                        className={`px-3 py-1 rounded transition ${
                          sendingId === (u._id || u.id)
                            ? "bg-white text-slate-400 border"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        {sendingId === (u._id || u.id) ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-500 mb-2">Recent</div>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {conversations.map((c) => {
                  const participant =
                    c.participants &&
                    c.participants.find(
                      (p) => p && p._id !== activeUser?._id && p.username
                    );
                  const display = participant ||
                    (c.participants && c.participants[0]) || {
                      username: "Conversation",
                    };
                  return (
                    <div
                      key={c._id || c.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {display.profilePic && (
                            <img
                              src={display.profilePic}
                              alt={display.username}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {display.username ||
                              display.displayName ||
                              "Conversation"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {(c.messages &&
                              c.messages[c.messages.length - 1]?.text) ||
                              ""}
                          </div>
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendToConversation(c._id || c.id)
                          }
                          disabled={sendingId === (c._id || c.id)}
                          className={`px-3 py-1 rounded transition ${
                            sendingId === (c._id || c.id)
                              ? "bg-white text-slate-400 border"
                              : "bg-indigo-600 text-white"
                          }`}
                        >
                          {sendingId === (c._id || c.id)
                            ? "Sending..."
                            : "Send"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ShareModal;
