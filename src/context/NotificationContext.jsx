/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
} from "../services/notificationService";
import { fetchProfile } from "../services/userService";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [activity, setActivity] = useState({
    likes: 0,
    mentions: 0,
    comments: 0,
    views: 0,
    follow_requests: 0,
  });

  const openNotifications = () => setOpen(true);
  const closeNotifications = () => setOpen(false); // Calculate activity counts from notifications

  useEffect(() => {
    const counts = {
      likes: 0,
      mentions: 0,
      comments: 0,
      views: 0,
      follow_requests: 0,
    };

    (notifications || []).forEach((n) => {
      if (n.type === "like") counts.likes++;
      else if (n.type === "mention") counts.mentions++;
      else if (n.type === "comment") counts.comments++;
      else if (n.type === "view") counts.views++;
      else if (n.type === "follow_request") counts.follow_requests++;
    });

    setActivity(counts); // --- ✅ FIX APPLIED HERE --- // Show unread dot if there are any UNREAD notifications

    const hasUnread = (notifications || []).some((n) => n.read === false);
    setHasUnreadNotifications(hasUnread); // --- ✅ END FIX ---
  }, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Only load unread notifications to prevent showing already-read ones
      console.log(
        "📥 [NotificationContext] Loading unread notifications only..."
      );
      const res = await fetchNotifications(true); // Pass true for unreadOnly
      const list = Array.isArray(res.data) ? res.data : [];

      console.log(
        `📊 [NotificationContext] Loaded ${list.length} unread notifications`
      );

      // normalize actor to only include username and avatar for UI // Handle both populated objects and raw ObjectId references

      const normalized = list.map((n) => {
        let actorNormalized = null;
        let actorId = null;

        if (n.actor) {
          if (typeof n.actor === "object") {
            // Could be: { _id: "...", username: "...", ... } (populated)
            // Or: { $oid: "..." } (MongoDB ref format)
            if (n.actor.username || n.actor.displayName) {
              // Actor is populated with username
              actorNormalized = {
                username: n.actor.username || n.actor.displayName || "User",
                avatar: n.actor.avatar || n.actor.profilePic,
              };
            } else {
              // Actor is just an ObjectId reference, save for enrichment
              actorId = n.actor._id || n.actor;
            }
          } else if (typeof n.actor === "string") {
            // Actor is a raw ObjectId string
            actorId = n.actor;
          }
        }

        return {
          ...n,
          actor: actorNormalized,
          actorId: actorId, // Keep raw ID for enrichment from server
        };
      });

      setNotifications(normalized);
    } catch (e) {
      console.warn("NotificationProvider: failed to load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const onActivity = (e) => {
      try {
        const { type, actor, raw } = e?.detail || {};
        if (!type) return; // If actor is an object (server sent a populated actor), use it directly.

        if (actor && typeof actor === "object") {
          // accept actor objects but only keep username and avatar for display
          const enriched = {
            type,
            actor: { username: actor.username, avatar: actor.avatar },
            createdAt: new Date(),
            synthetic: true,
            read: false, // Mark new socket notifications as unread
            raw,
          };
          setNotifications((prev) => [enriched, ...(prev || [])]);
          return;
        } // If actor is an id string, add a placeholder and try to fetch the profile.

        if (actor && typeof actor === "string") {
          const placeholder = {
            type,
            actor: null,
            createdAt: new Date(),
            synthetic: true,
            read: false, // Mark new socket notifications as unread
          };
          setNotifications((prev) => [placeholder, ...(prev || [])]);
          fetchProfile(actor)
            .then((res) => {
              const user = res?.data; // only keep username and avatar for notification actor
              const actorLight = user
                ? {
                    username: user.username,
                    avatar: user.avatar || user.profilePic,
                  }
                : null;
              setNotifications((prev) => {
                const next = prev ? [...prev] : [];
                const idx = next.findIndex(
                  (n) => n.synthetic && n.type === type
                );
                const enriched = {
                  type,
                  actor: actorLight,
                  createdAt: new Date(),
                  synthetic: true,
                  read: false, // Mark new socket notifications as unread
                  raw,
                };
                if (idx >= 0) next.splice(idx, 1, enriched);
                else next.unshift(enriched);
                return next;
              });
            })
            .catch(() => {
              // keep placeholder if fetch fails
            });
          return;
        } // No actor information at all — push a simple synthetic notification

        setNotifications((prev) => [
          {
            type,
            actor: null,
            createdAt: new Date(),
            synthetic: true,
            read: false,
          },
          ...(prev || []),
        ]);
      } catch (err) {
        console.warn(err);
      }
    };
    window.addEventListener("snapgram:activity", onActivity);
    return () => window.removeEventListener("snapgram:activity", onActivity);
  }, []); // After initial load, ensure any notifications with actor as a raw id are // enriched by fetching the corresponding user profiles.

  useEffect(() => {
    const enrichActors = async () => {
      try {
        const list = notifications || []; // Collect both n.actor (if string) and n.actorId (if set)
        const ids = Array.from(
          new Set(
            list
              .map((n) => {
                // Check actorId first (set by normalization)
                if (n.actorId) return String(n.actorId); // Also check if actor is still a string
                if (typeof n.actor === "string") return n.actor;
                return null;
              })
              .filter(Boolean)
          )
        );

        if (ids.length === 0) return;

        console.log("[NotificationContext] Enriching actor IDs:", ids);

        const promises = ids.map((id) =>
          fetchProfile(id)
            .then((r) => ({ id, user: r.data }))
            .catch((err) => {
              console.warn(`Failed to fetch profile for ${id}:`, err);
              return { id, user: null };
            })
        );
        const results = await Promise.all(promises);
        const map = results.reduce((acc, r) => {
          if (r.user) {
            acc[r.id] = {
              username: r.user.username,
              avatar: r.user.avatar || r.user.profilePic,
            };
            console.log(
              `[NotificationContext] Enriched ${r.id} -> ${r.user.username}`
            );
          }
          return acc;
        }, {});

        if (Object.keys(map).length === 0) {
          console.warn("[NotificationContext] No profiles enriched");
          return;
        }

        setNotifications((prev) =>
          (prev || []).map((n) => {
            const actorToCheck =
              n.actorId || (typeof n.actor === "string" ? n.actor : null);
            if (actorToCheck && map[actorToCheck]) {
              return { ...n, actor: map[actorToCheck] };
            }
            return n;
          })
        );
      } catch (err) {
        console.warn("[NotificationContext] Enrichment failed:", err);
      }
    };
    enrichActors();
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();

      // ✅ FIX: Remove read notifications from local state instead of marking them
      // This prevents them from reappearing on refresh since backend now filters them out
      setNotifications([]);

      setActivity({
        likes: 0,
        mentions: 0,
        comments: 0,
        views: 0,
        follow_requests: 0,
      });
      setHasUnreadNotifications(false);
    } catch (e) {
      console.warn("Failed to mark notifications as read:", e);
    }
  }, []);

  const clearActivity = () => {
    setActivity({
      _id: 0,
      mentions: 0,
      comments: 0,
      views: 0,
      follow_requests: 0,
    });
    setHasUnreadNotifications(false);
  }; // ✅ NEW: Remove a notification from the list

  const removeNotification = (notificationId) => {
    console.log(`🗑️ [CONTEXT] Removing notification: ${notificationId}`);
    setNotifications((prev) =>
      (prev || []).filter((n) => n._id !== notificationId)
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        open,
        openNotifications,
        closeNotifications,
        notifications,
        loading,
        loadNotifications,
        markAllRead,
        activity,
        clearActivity,
        hasUnreadNotifications,
        removeNotification,
      }}
    >
      {children}{" "}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationContext;
