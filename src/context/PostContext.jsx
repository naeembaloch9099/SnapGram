/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import api from "../services/api";
import { AuthContext } from "./AuthContext";

export const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeUser } = useContext(AuthContext);

  // ✅ Use ref to track loading state without triggering re-renders
  const loadingRef = React.useRef(false);

  const loadFeed = useCallback(async () => {
    // ✅ FIX: Don't reload if already loading to prevent duplicate calls
    if (loadingRef.current) {
      console.log("⏭️ [PostContext.loadFeed] Already loading, skipping...");
      return;
    }

    console.log("🔄 [PostContext.loadFeed] Starting to load posts...");
    loadingRef.current = true;
    setLoading(true);

    try {
      console.log("📡 [PostContext.loadFeed] Making API call to /posts...");
      console.log(
        "📡 [PostContext.loadFeed] API baseURL:",
        api.defaults.baseURL
      );

      const res = await api.get("/posts");

      console.log("📡 [PostContext.loadFeed] API call completed successfully!");
      const raw = Array.isArray(res.data) ? res.data : [];

      console.log(
        `📥 [PostContext.loadFeed] Received ${raw.length} posts from server`
      );

      // DEBUG: high level response info to help diagnose "no posts" issues
      try {
        console.groupCollapsed(
          "📥 [PostContext.loadFeed] Server response summary"
        );
        console.log("status:", res.status || "(no status)");
        console.log("responseType:", typeof res.data);
        console.log("raw length:", raw.length);
        console.log(
          "sample keys (first item):",
          raw[0] ? Object.keys(raw[0]) : null
        );
        // show first 3 ids/titles for quick scan
        console.log(
          "sample items:",
          raw.slice(0, 3).map((p, i) => ({
            idx: i,
            id: p._id || p.id || null,
            owner: p.owner && (p.owner.username || p.owner._id || p.owner),
            hasComments: Array.isArray(p.comments) && p.comments.length > 0,
            image: !!(p.image || p.media),
            video: !!(p.video || (p.media && p.type === "video")),
          }))
        );
        console.groupEnd();
      } catch (logErr) {
        // don't break feed on logging errors
        console.warn("PostContext: logging failed", logErr);
      }

      // DEBUG: Log comments structure (kept for deeper inspection)
      console.group("📥 [PostContext.loadFeed] Server Data");
      raw.forEach((p, i) => {
        if (p.comments?.length > 0) {
          console.log(
            `Post ${i + 1}: ${p.comments.length} comments -`,
            p.comments.map((c) => ({
              id: (c.id || c._id).toString().substring(0, 8),
              text: c.text?.substring(0, 15),
              replyTo: c.replyTo
                ? "→ " + c.replyTo.toString().substring(0, 8)
                : "MAIN",
            }))
          );
        }
      });
      console.groupEnd();

      const normalized = raw.map((p, idx) => {
        const id = p.id || p._id || String(Math.random());

        // ✅ ENHANCED: Handle both populated owner objects and raw ObjectId/username strings
        let owner;
        let ownerId;
        let ownerUsername;

        if (typeof p.owner === "object" && p.owner !== null) {
          // Owner is populated: { _id: '...', username: '...', ... }
          ownerId = p.owner._id;
          ownerUsername = p.owner.username;
          owner = ownerUsername || ownerId || String(p.owner);
        } else if (typeof p.owner === "string") {
          // Owner is a string (could be ObjectId or username)
          owner = p.owner;
          // Try to determine if it's an ObjectId (24 hex chars) or username
          if (p.owner.match(/^[0-9a-fA-F]{24}$/)) {
            ownerId = p.owner;
            ownerUsername = null; // Will need to be populated
          } else {
            ownerUsername = p.owner;
            ownerId = null;
          }
        } else {
          owner = "unknown";
          ownerId = null;
          ownerUsername = null;
        }

        // Log any posts with missing or unusual owner data
        if (!ownerUsername && idx < 3) {
          console.log(
            `⚠️  Post ${id} has owner as ObjectId only (not populated):`,
            p.owner
          );
        }

        // support legacy `media` field: map to image/video depending on type
        const image = p.image || p.media || null;
        const video =
          p.video || (p.media && p.type === "video" ? p.media : null);

        // ✅ NORMALIZE COMMENTS: add `id` and `when` fields to each comment
        const comments = (p.comments || []).map((c) => ({
          ...c,
          id: c.id || c._id || String(Math.random()),
          when:
            c.when || c.createdAt || c.updatedAt || new Date().toISOString(),
        }));

        return {
          ...p,
          id,
          owner,
          ownerUsername,
          ownerId,
          image,
          video,
          comments,
        };
      });

      console.log(
        `✅ [PostContext.loadFeed] Loaded ${normalized.length} posts`
      );
      console.log(
        "   Owner format breakdown:",
        normalized.slice(0, 5).map((p) => ({
          id: p.id,
          owner: p.owner,
          ownerUsername: p.ownerUsername,
          ownerId: p.ownerId,
        }))
      );

      setPosts(normalized);

      // expose posts temporarily in development for debugging in browser console
      try {
        if (typeof window !== "undefined")
          window.__SNAPGRAM_POSTS__ = normalized;
      } catch (e) {
        console.warn("PostContext: failed to expose posts", e);
        /* ignore in non-browser contexts */
      }
    } catch (e) {
      console.error("❌ [PostContext.loadFeed] Failed to load feed:", e);
      console.error("❌ [PostContext.loadFeed] Error details:", {
        message: e.message,
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        stack: e.stack,
      });
      // Don't clear posts on error - keep showing cached data
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    console.log(
      "🎯 [PostContext] useEffect triggered, activeUser:",
      activeUser?.username || "not logged in"
    );
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFeed]);

  const addPost = async (postPayload) => {
    // postPayload: { caption, media, type }
    try {
      // Support multiple shapes: caller may pass {image, video} (data URL) or {media, type}
      let media = postPayload.media;
      let type = postPayload.type;
      if (!media) {
        if (postPayload.image) {
          media = postPayload.image;
          type = type || "image";
        } else if (postPayload.video) {
          media = postPayload.video;
          type = type || "video";
        }
      }
      const payload = { caption: postPayload.caption || "", media, type };
      const res = await api.post("/posts", payload);
      const created = res.data;
      // normalize created post
      const id = created.id || created._id || String(Math.random());
      const owner =
        typeof created.owner === "object" && created.owner !== null
          ? created.owner.username || created.owner._id || String(created.owner)
          : created.owner || "unknown";
      const normalized = { ...created, id, owner };
      setPosts((p) => [normalized, ...p]);
      return normalized;
    } catch (e) {
      console.warn("PostProvider: failed to create post", e);
      throw e;
    }
  };

  const addComment = async (postId, text, replyTo = null) => {
    // Accept either a plain text string or a prebuilt comment object for
    // backward compatibility with different callers.
    const textValue =
      typeof text === "string"
        ? text
        : text && typeof text.text === "string"
        ? text.text
        : null;

    if (!textValue || !textValue.trim()) {
      throw new Error("Empty comment");
    }

    // optimistic UI: insert a temporary comment while request is in-flight
    const tempComment = {
      id: `tmp-${Date.now()}`,
      text: textValue.trim(),
      when: new Date().toISOString(),
      user: activeUser || { username: "You" },
      replyTo: replyTo || null,
      _optimistic: true,
    };

    console.log("[PostContext.addComment] 📤 Sending to server:", {
      postId,
      text: textValue.substring(0, 20),
      replyTo: replyTo || "NONE",
    });

    // Extract @mentions from text (simple username pattern: letters, numbers, dot, underscore)
    const mentionRegex = /@([A-Za-z0-9_.]+)/g;
    const mentions = [];
    let m;
    while ((m = mentionRegex.exec(textValue)) !== null) {
      if (m[1]) mentions.push(m[1]);
    }

    try {
      const payload = {
        text: textValue,
        replyTo: replyTo || undefined,
      };
      if (mentions.length > 0) payload.mentions = Array.from(new Set(mentions));

      const res = await api.post(`/posts/${postId}/comment`, payload);
      const comment = res.data;

      console.log("[PostContext.addComment] 📥 Server response:", {
        id: (comment._id || comment.id).toString().substring(0, 8),
        text: comment.text?.substring(0, 20),
        replyTo: comment.replyTo
          ? comment.replyTo.toString().substring(0, 8)
          : "MAIN",
      });

      // normalize server comment for frontend consumption
      const displayComment = {
        ...comment,
        id: comment.id || comment._id || tempComment.id,
        // Keep user as object if it's populated, otherwise use tempComment user
        user:
          comment.user && typeof comment.user === "object"
            ? comment.user
            : tempComment.user,
        when: comment.createdAt || comment.when || new Date().toISOString(),
        replyTo: comment.replyTo || null,
      };

      console.log("[PostContext.addComment] ✅ Normalized and ready to add:", {
        id: (displayComment.id || "").toString().substring(0, 8),
        replyTo: displayComment.replyTo
          ? displayComment.replyTo.toString().substring(0, 8)
          : "MAIN",
      });

      // replace optimistic comment with the real one returned by server
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p._id || p.id) !== String(postId)) return p;
          const withoutTmp = (p.comments || []).filter((c) => !c._optimistic);
          return {
            ...p,
            comments: [displayComment, ...withoutTmp],
            commentsCount: (p.commentsCount || 0) + 1,
          };
        })
      );
      return displayComment;
    } catch (e) {
      console.warn("PostProvider: failed to add comment", e);
      // rollback optimistic comment
      setPosts((prev) =>
        prev.map((p) =>
          String(p._id || p.id) === String(postId)
            ? {
                ...p,
                comments: (p.comments || []).filter((c) => !c._optimistic),
              }
            : p
        )
      );
      throw e;
    }
  };

  const toggleCommentLike = async (postId, commentId, username) => {
    // ✅ VALIDATION: Check if commentId exists
    if (!commentId) {
      console.error("❌ [toggleCommentLike] Missing commentId!", {
        postId,
        commentId,
        username,
      });
      throw new Error("commentId is required");
    }

    console.group("❤️ [PostContext.toggleCommentLike] Starting");
    console.log("Parameters:", {
      postId,
      commentId,
      username,
    });

    // optimistic toggle locally using username (frontend uses usernames in likedBy)
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (String(p._id || p.id) !== String(postId)) return p;
        const comments = (p.comments || []).map((c) => {
          if (String(c.id || c._id) !== String(commentId)) return c;
          const likedBy = Array.isArray(c.likedBy) ? [...c.likedBy] : [];
          const has = username && likedBy.includes(username);
          console.log("Optimistic update:", {
            isLiked: has,
            action: has ? "REMOVE" : "ADD",
            likedBy_before: likedBy,
            likes_before: c.likes,
          });
          if (has) {
            // remove
            const idx = likedBy.indexOf(username);
            if (idx >= 0) likedBy.splice(idx, 1);
            return { ...c, likedBy, likes: Math.max(0, (c.likes || 1) - 1) };
          } else {
            // add
            if (username) likedBy.push(username);
            return { ...c, likedBy, likes: (c.likes || 0) + 1 };
          }
        });
        return { ...p, comments };
      });
      return updated;
    });

    try {
      console.log("📤 Sending request to server...");
      const res = await api.post(`/posts/${postId}/comment/${commentId}/like`);
      const { likes, liked } = res.data || {};

      console.log("📥 Server response:", {
        likes,
        liked,
        full_response: res.data,
      });

      // align with server response: ensure likes count matches
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p._id || p.id) !== String(postId)) return p;
          const comments = (p.comments || []).map((c) => {
            if (String(c.id || c._id) !== String(commentId)) return c;
            const likedBy = Array.isArray(c.likedBy) ? [...c.likedBy] : [];
            console.log("Aligning with server:", {
              liked,
              username,
              likedBy_before: likedBy,
            });
            if (liked && username && !likedBy.includes(username))
              likedBy.push(username);
            if (!liked && username) {
              const idx = likedBy.indexOf(username);
              if (idx >= 0) likedBy.splice(idx, 1);
            }
            console.log("After alignment:", {
              likedBy_after: likedBy,
              likes_count: typeof likes === "number" ? likes : c.likes,
            });
            return {
              ...c,
              likes: typeof likes === "number" ? likes : c.likes,
              likedBy,
            };
          });
          return { ...p, comments };
        })
      );
      console.log("✅ Comment like toggled successfully");
      console.groupEnd();
      return res.data;
    } catch (e) {
      console.error("❌ [PostContext.toggleCommentLike] ERROR:", {
        error: e.message,
        status: e.response?.status,
        data: e.response?.data,
        full_error: e,
      });
      console.groupEnd();
      throw e;
    }
  };

  const toggleLike = async (postId, username) => {
    try {
      // ✅ Optimistic update: toggle like immediately in UI
      let wasLiked = false;
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p._id || p.id) !== String(postId)) return p;

          const likedBy = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
          wasLiked = username && likedBy.includes(username);

          if (wasLiked) {
            // Remove like
            const idx = likedBy.indexOf(username);
            if (idx >= 0) likedBy.splice(idx, 1);
            return { ...p, likedBy, likes: Math.max(0, (p.likes || 1) - 1) };
          } else {
            // Add like
            if (username) likedBy.push(username);
            return { ...p, likedBy, likes: (p.likes || 0) + 1 };
          }
        })
      );

      // ✅ Send to server
      const res = await api.post(`/posts/${postId}/like`);
      const { likes, liked } = res.data || {};

      // ✅ Sync with server response
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p._id || p.id) !== String(postId)) return p;

          const likedBy = Array.isArray(p.likedBy) ? [...p.likedBy] : [];

          // Ensure liked state matches server
          if (liked && username && !likedBy.includes(username)) {
            likedBy.push(username);
          } else if (!liked && username) {
            const idx = likedBy.indexOf(username);
            if (idx >= 0) likedBy.splice(idx, 1);
          }

          return {
            ...p,
            likes: typeof likes === "number" ? likes : p.likes,
            likedBy,
          };
        })
      );

      return { likes, liked };
    } catch (e) {
      console.warn("PostProvider: failed to toggle like", e);
      throw e;
    }
  };

  const toggleRepost = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/repost`);
      const { reposts, reposted } = res.data || {};
      setPosts((prev) =>
        prev.map((p) =>
          String(p._id || p.id) === String(postId)
            ? { ...p, reposts, reposted }
            : p
        )
      );
      return { reposts, reposted };
    } catch (e) {
      console.warn("PostProvider: failed to toggle repost", e);
      throw e;
    }
  };

  const addShare = (postId) => {
    // not persisted server-side yet; increment locally
    setPosts((prev) =>
      prev.map((p) =>
        String(p._id || p.id) === String(postId)
          ? { ...p, shareCount: (p.shareCount || 0) + 1 }
          : p
      )
    );
  };

  const editPost = async (postId, { caption }) => {
    try {
      const res = await api.patch(`/posts/${postId}`, { caption });
      const updated = res.data;
      // normalize
      const id = updated.id || updated._id || String(Math.random());
      const owner =
        typeof updated.owner === "object"
          ? updated.owner.username || updated.owner._id || String(updated.owner)
          : updated.owner;
      const normalized = { ...updated, id, owner };
      setPosts((prev) =>
        prev.map((p) =>
          String(p.id || p._id) === String(postId) ? normalized : p
        )
      );
      return normalized;
    } catch (e) {
      console.warn("PostProvider: failed to edit post", e);
      throw e;
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) =>
        prev.filter((p) => String(p.id || p._id) !== String(postId))
      );
      return true;
    } catch (e) {
      console.warn("PostProvider: failed to delete post", e);
      throw e;
    }
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        loadFeed,
        addPost,
        addComment,
        toggleCommentLike,
        toggleLike,
        toggleRepost,
        addShare,
        editPost,
        deletePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
