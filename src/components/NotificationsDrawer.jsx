import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";
import { FiX } from "react-icons/fi";
import { formatDate } from "../utils/formatDate";
import api from "../services/api";
import { followUser } from "../services/userService";

const STORAGE_KEY = "snapgram.notifications.state";

const NotificationsList = ({
  data = [],
  variant = "mobile",
  currentUserId = null,
  loadNotifications = null,
}) => {
  const isMobile = variant === "mobile";
  const [followRequestsState, setFollowRequestsState] = useState({});
  const navigate = useNavigate();
  const { activeUser } = useContext(AuthContext);

  // Normalize input
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No notifications yet
      </div>
    );
  }

  // Check if data is in "sections" format
  const looksLikeSections =
    list.length > 0 && list.every((s) => Array.isArray(s.items));

  if (looksLikeSections) {
    return (
      <div className="space-y-6">
        {list.map((sec, sIdx) => (
          <div key={`${sec.when}-${sIdx}`}>
            <h3 className="text-sm font-semibold mb-3">{sec.when}</h3>
            <div className="space-y-3">
              {(sec.items || []).map((n, iIdx) => {
                // --- Common logic for parsing notification ---
                const actor = n.actor || null;
                let user = n.user || "User";
                if (actor && typeof actor === "object" && actor.username) {
                  user = actor.username;
                } else if (
                  actor &&
                  typeof actor === "object" &&
                  actor.displayName
                ) {
                  user = actor.displayName;
                }

                // Precompute commonly used display values before rendering
                const avatar =
                  n.avatar ||
                  (actor && actor.avatar) ||
                  n.meta?.actorAvatar ||
                  null;
                let text = n.text || "activity";
                if (n.type === "like") {
                  text = n.comment ? "liked your comment" : "liked your post";
                } else if (n.type === "comment")
                  text = "commented on your post";
                else if (n.type === "mention")
                  text =
                    n.meta && n.meta.kind === "reel"
                      ? "mentioned you in a reel"
                      : "mentioned you in a post";
                else if (n.type === "follow") text = "followed you";
                else if (n.type === "follow_request")
                  text = "sent you a follow request";
                else if (n.type === "follow_accepted")
                  text = "accepted your follow request";
                else if (n.type === "message") text = "sent you a message";

                const time = formatDate(n.createdAt || n.updatedAt || n.time);
                const metaImage = n.metaImage || n.meta?.image || null;

                // --- START: SIMPLE FOLLOW (PUBLIC) LOGIC ---
                if (n.type === "follow") {
                  const actorId = actor?._id || null;
                  const actorUsername = actor?.username || user;
                  const isLoading =
                    followRequestsState[n._id]?.loading || false;

                  // Check if already following this user
                  const isAlreadyFollowing = activeUser?.following?.some(
                    (followingUser) => {
                      // following array can contain user objects or IDs
                      const followingId =
                        typeof followingUser === "string"
                          ? followingUser
                          : followingUser?._id || followingUser?.id;
                      return followingId === actorId;
                    }
                  );

                  const handleFollowBackSimple = async () => {
                    try {
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: true },
                      }));

                      // follow by username (service will resolve id)
                      await followUser(actorUsername);

                      // refresh notifications list if available
                      if (loadNotifications) await loadNotifications();

                      // create or get conversation then navigate to messages
                      try {
                        const convRes = await api.post(
                          "/messages/conversation",
                          {
                            participantId: actorId,
                          }
                        );
                        const conv = convRes.data;
                        if (conv && (conv._id || conv.id)) {
                          navigate(`/messages/${conv._id || conv.id}`);
                        } else {
                          // fallback: open messages page
                          navigate(`/messages`);
                        }
                      } catch (e) {
                        // ignore conversation errors, still a successful follow
                        console.warn("Failed to create conversation:", e);
                        navigate(`/messages`);
                      }
                    } catch (err) {
                      console.error("❌ [FOLLOW BACK] failed:", err);
                      alert("Failed to follow back");
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: false },
                      }));
                    }
                  };

                  return (
                    <div
                      key={n._id || n.id}
                      className="flex items-center justify-between gap-3 bg-white p-3 rounded hover:bg-slate-50 transition"
                    >
                      <Link
                        to={`/profile/${encodeURIComponent(actorUsername)}`}
                        className="flex items-start gap-3 flex-1"
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                            {user?.[0] || "U"}
                          </div>
                        )}
                        <div className="text-sm flex-1 flex items-center gap-1">
                          <span className="font-semibold">{user}</span>
                          <span className="text-slate-700">{text}</span>
                          <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                            {time}
                          </span>
                        </div>
                      </Link>

                      <div className="flex gap-2 flex-shrink-0">
                        {!isAlreadyFollowing ? (
                          <button
                            onClick={handleFollowBackSimple}
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                          >
                            {isLoading ? "..." : "Follow Back"}
                          </button>
                        ) : (
                          <span className="px-4 py-1.5 text-slate-500 text-sm font-medium">
                            Following
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                // --- END: SIMPLE FOLLOW (PUBLIC) LOGIC ---
                // --- End of common logic ---

                // --- START: FOLLOW REQUEST LOGIC (REVISED) ---
                if (n.type === "follow_request") {
                  const isLoading =
                    followRequestsState[n._id]?.loading || false;
                  // RE-ADD isConfirmed:
                  const isConfirmed =
                    followRequestsState[n._id]?.confirmed || false;
                  const isDeleted =
                    followRequestsState[n._id]?.deleted || false;
                  const requesterId = actor._id || actor;
                  const isPrivateAccount = actor?.isPrivate || false;

                  // Check if already following this user
                  const isAlreadyFollowing = activeUser?.following?.some(
                    (followingUser) => {
                      const followingId =
                        typeof followingUser === "string"
                          ? followingUser
                          : followingUser?._id || followingUser?.id;
                      return followingId === requesterId;
                    }
                  );

                  if (isDeleted) {
                    return null;
                  }

                  // UPDATED: Still sets local state
                  const handleConfirm = async () => {
                    try {
                      if (!currentUserId) {
                        alert("User ID not loaded yet.");
                        return;
                      }
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: true },
                      }));

                      await api.post(
                        `/users/${currentUserId}/requests/${requesterId}/accept`
                      );

                      console.log(
                        `✅ [CONFIRM] Follow request accepted. Showing 'Follow Back'.`
                      );
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: {
                          ...prev[n._id],
                          loading: false,
                          confirmed: true, // This changes the button to "Follow Back"
                        },
                      }));
                    } catch (err) {
                      console.error(
                        `❌ [CONFIRM ERROR] Failed to accept request:`,
                        err
                      );
                      alert("Failed to accept follow request");
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: false },
                      }));
                    }
                  };

                  // UPDATED: Sets local state to "deleted"
                  const handleDelete = async () => {
                    try {
                      if (!currentUserId) {
                        alert("User ID not loaded yet.");
                        return;
                      }
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: true },
                      }));

                      await api.post(
                        `/users/${currentUserId}/requests/${requesterId}/reject`
                      );

                      console.log(
                        `✅ [DELETE] Follow request rejected. Hiding notification.`
                      );
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: {
                          ...prev[n._id],
                          loading: false,
                          deleted: true, // This hides the notification
                        },
                      }));
                    } catch (err) {
                      console.error(`❌ [DELETE ERROR] Failed to reject:`, err);
                      alert("Failed to reject follow request");
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: false },
                      }));
                    }
                  };

                  // UPDATED: Now calls loadNotifications()
                  const handleFollowBack = async () => {
                    try {
                      console.log(
                        `👥 [FOLLOW BACK] Following back ${user} (Private Account: ${isPrivateAccount})`
                      );
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: true },
                      }));

                      // This is the function that is failing for you
                      await followUser(user);

                      console.log(
                        `✅ [FOLLOW BACK] Now following ${user}. Reloading list.`
                      );

                      // THIS IS THE FIX for your "refresh" problem
                      if (loadNotifications) {
                        await loadNotifications();
                      }

                      // We don't need to set local state, because the list reload
                      // will remove this notification anyway.
                    } catch (err) {
                      console.error(
                        `❌ [FOLLOW BACK ERROR] Failed to follow:`,
                        err
                      );
                      alert("Failed to follow back");
                      setFollowRequestsState((prev) => ({
                        ...prev,
                        [n._id]: { ...prev[n._id], loading: false },
                      }));
                    }
                  };

                  // DELETED: handleMessage is no longer needed

                  return (
                    <div
                      key={n._id || n.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="avatar"
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                            {user?.[0] || "U"}
                          </div>
                        )}
                        <div className="text-xs sm:text-sm flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="font-semibold truncate">
                              {user}
                            </span>
                            <span className="text-slate-700 line-clamp-2">
                              {text}
                            </span>
                            {n.meta?.snippet && (
                              <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {n.meta.snippet}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-1">
                            {time}
                          </span>
                        </div>
                      </div>

                      {/* --- REVISED 2-STAGE JSX LOGIC --- */}
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                        {!isConfirmed ? (
                          // STAGE 1: Confirm / Delete
                          <>
                            <button
                              onClick={handleConfirm}
                              disabled={isLoading || !currentUserId}
                              title={
                                !currentUserId ? "User ID not loaded yet" : ""
                              }
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium whitespace-nowrap"
                            >
                              {isLoading ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={isLoading || !currentUserId}
                              title={
                                !currentUserId ? "User ID not loaded yet" : ""
                              }
                              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-full hover:bg-gray-50 disabled:opacity-50 transition font-medium whitespace-nowrap"
                            >
                              {isLoading ? "..." : "Delete"}
                            </button>
                          </>
                        ) : // STAGE 2: Follow Back (only show if not already following)
                        !isAlreadyFollowing ? (
                          <button
                            onClick={handleFollowBack}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium whitespace-nowrap"
                          >
                            {isLoading ? "..." : "Follow Back"}
                          </button>
                        ) : (
                          <span className="px-4 py-1.5 text-slate-500 text-sm font-medium">
                            Following
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                // --- END: FOLLOW REQUEST LOGIC ---

                // Regular notifications (not follow_request)
                // Determine target: if notification meta.kind === 'reel' route to /reels?focus=<postId>&openComments=1
                const postId = n.post || n.postId;
                const targetHref =
                  n.meta && n.meta.kind === "reel"
                    ? `/reels?focus=${encodeURIComponent(
                        postId
                      )}&openComments=1`
                    : `/post/${postId}`;

                return (
                  <Link
                    to={targetHref}
                    state={{
                      fromNotification: true,
                      actor: actor,
                    }}
                    key={n._id || n.id || `${sec.when}-${sIdx}-${iIdx}`}
                    className={`flex items-center justify-between gap-3 bg-white ${
                      isMobile ? "p-4" : "p-2"
                    } rounded hover:bg-slate-50 transition cursor-pointer`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="avatar"
                          className={`${
                            isMobile ? "w-12 h-12" : "w-10 h-10"
                          } rounded-full object-cover flex-shrink-0`}
                        />
                      ) : (
                        <div
                          className={`${
                            isMobile ? "w-12 h-12" : "w-10 h-10"
                          } rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0`}
                        >
                          {user?.[0] || "U"}
                        </div>
                      )}
                      <div
                        className={`${
                          isMobile ? "text-base" : "text-sm"
                        } flex-1`}
                      >
                        <div>
                          <span className="font-semibold mr-1">{user}</span>
                          <span className="text-slate-700">{text}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {time}
                        </div>
                      </div>
                    </div>
                    {metaImage && (
                      <img
                        src={metaImage}
                        alt="meta"
                        className={`${
                          isMobile ? "w-14 h-14" : "w-12 h-12"
                        } object-cover rounded flex-shrink-0`}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- ELSE: FLAT LIST LOGIC ---
  // (We must apply the same fixes here)
  return (
    <div className="space-y-3">
      {list.map((n) => {
        // --- Common logic for parsing notification ---
        const actor = n.actor || null;
        let user = "User";
        if (actor && typeof actor === "object" && actor.username) {
          user = actor.username;
        } else if (actor && typeof actor === "object" && actor.displayName) {
          user = actor.displayName;
        } else if (n.meta?.actorName) {
          user = n.meta.actorName;
        } else if (n.meta?.actorUsername) {
          user = n.meta.actorUsername;
        } else if (typeof actor === "string") {
          user = "Loading...";
        }
        const avatar = (actor && actor.avatar) || n.meta?.actorAvatar || null;
        let text = "";
        if (n.type === "like") {
          text = n.comment ? "liked your comment" : "liked your post";
        } else if (n.type === "comment") text = "commented on your post";
        else if (n.type === "mention")
          text =
            n.meta && n.meta.kind === "reel"
              ? "mentioned you in a reel"
              : "mentioned you in a post";
        else if (n.type === "follow") text = "followed you";
        else if (n.type === "follow_request")
          text = "sent you a follow request";
        else if (n.type === "message") text = "sent you a message";
        const metaImage = n.meta?.image || n.meta?.metaImage || null;
        const time = formatDate(n.createdAt || n.updatedAt || n.time);
        // --- End of common logic ---

        // --- START: SIMPLE FOLLOW (FLAT LIST) ---
        if (n.type === "follow") {
          const actorId = actor?._id || null;
          const actorUsername = actor?.username || user;
          const isLoading = followRequestsState[n._id]?.loading || false;

          const handleFollowBackSimple = async () => {
            try {
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: true },
              }));

              await followUser(actorUsername);
              if (loadNotifications) await loadNotifications();

              // create or get conversation then navigate to messages
              try {
                const convRes = await api.post("/messages/conversation", {
                  participantId: actorId,
                });
                const conv = convRes.data;
                if (conv && (conv._id || conv.id)) {
                  navigate(`/messages/${conv._id || conv.id}`);
                } else {
                  navigate(`/messages`);
                }
              } catch (e) {
                console.warn("Failed to create conversation:", e);
                navigate(`/messages`);
              }
            } catch (err) {
              console.error("❌ [FOLLOW BACK] failed:", err);
              alert("Failed to follow back");
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false },
              }));
            }
          };

          return (
            <div
              key={n._id || n.id}
              className="flex items-center justify-between gap-3 bg-white p-3 rounded hover:bg-slate-50 transition"
            >
              <Link
                to={`/profile/${encodeURIComponent(actorUsername)}`}
                className="flex items-start gap-3 flex-1"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                    {user?.[0] || "U"}
                  </div>
                )}
                <div className="text-sm flex-1 flex items-center gap-1">
                  <span className="font-semibold">{user}</span>
                  <span className="text-slate-700">{text}</span>
                  <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                    {time}
                  </span>
                </div>
              </Link>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleFollowBackSimple}
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                >
                  {isLoading ? "..." : "Follow Back"}
                </button>
              </div>
            </div>
          );
        }
        // --- END: SIMPLE FOLLOW (FLAT LIST) ---

        // --- START: FOLLOW REQUEST LOGIC (REVISED) ---
        if (n.type === "follow_request") {
          const isLoading = followRequestsState[n._id]?.loading || false;
          // RE-ADD isConfirmed:
          const isConfirmed = followRequestsState[n._id]?.confirmed || false;
          const isDeleted = followRequestsState[n._id]?.deleted || false;
          const requesterId = actor._id || actor;

          if (isDeleted) {
            return null;
          }

          // UPDATED: Still sets local state
          const handleConfirm = async () => {
            try {
              if (!currentUserId) {
                alert("User ID not loaded yet.");
                return;
              }
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: true },
              }));
              await api.post(
                `/users/${currentUserId}/requests/${requesterId}/accept`
              );
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false, confirmed: true },
              }));
            } catch (err) {
              console.error(
                `❌ [CONFIRM ERROR] Failed to accept request:`,
                err
              );
              alert("Failed to accept follow request");
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false },
              }));
            }
          };

          // UPDATED: Sets local state to "deleted"
          const handleDelete = async () => {
            try {
              if (!currentUserId) {
                alert("User ID not loaded yet.");
                return;
              }
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: true },
              }));
              await api.post(
                `/users/${currentUserId}/requests/${requesterId}/reject`
              );
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false, deleted: true },
              }));
            } catch (err) {
              console.error(`❌ [DELETE ERROR] Failed to reject:`, err);
              alert("Failed to reject follow request");
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false },
              }));
            }
          };

          // UPDATED: Now calls loadNotifications()
          const handleFollowBack = async () => {
            try {
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: true },
              }));

              // This is the function that is failing for you
              await followUser(user);

              // THIS IS THE FIX for your "refresh" problem
              if (loadNotifications) {
                await loadNotifications();
              }
            } catch (err) {
              console.error(`❌ [FOLLOW BACK ERROR] Failed to follow:`, err);
              alert("Failed to follow back");
              setFollowRequestsState((prev) => ({
                ...prev,
                [n._id]: { ...prev[n._id], loading: false },
              }));
            }
          };

          // DELETED: handleMessage is no longer needed

          return (
            <div
              key={n._id || n.id}
              className="flex items-center justify-between gap-3 bg-white p-3 rounded hover:bg-slate-50 transition"
            >
              <div className="flex items-start gap-3 flex-1">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                    {user?.[0] || "U"}
                  </div>
                )}
                <div className="text-sm flex-1 flex items-center gap-1">
                  <span className="font-semibold">{user}</span>
                  <span className="text-slate-700">{text}</span>
                  <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                    {time}
                  </span>
                </div>
              </div>

              {/* --- REVISED 2-STAGE JSX LOGIC --- */}
              <div className="flex gap-2 flex-shrink-0">
                {!isConfirmed ? (
                  // STAGE 1: Confirm / Delete
                  <>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading || !currentUserId}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                    >
                      {isLoading ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isLoading || !currentUserId}
                      className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-50 disabled:opacity-50 transition font-medium"
                    >
                      {isLoading ? "..." : "Delete"}
                    </button>
                  </>
                ) : (
                  // STAGE 2: Follow Back
                  // We removed the "Message" button logic
                  <button
                    onClick={handleFollowBack}
                    disabled={isLoading}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition font-medium flex-shrink-0"
                  >
                    {isLoading ? "..." : "Follow Back"}
                  </button>
                )}
              </div>
            </div>
          );
        }
        // --- END: FOLLOW REQUEST LOGIC ---

        // Regular notifications (not follow_request)
        const postId = n.post || n.postId;
        const targetHref =
          n.meta && n.meta.kind === "reel"
            ? `/reels?focus=${encodeURIComponent(postId)}&openComments=1`
            : `/post/${postId}`;

        return (
          <Link
            to={targetHref}
            state={{
              fromNotification: true,
              actor: actor,
            }}
            key={n._id || n.id}
            className={`flex items-center justify-between gap-3 bg-white p-2 rounded hover:bg-slate-50 transition cursor-pointer`}
          >
            <div className="flex items-start gap-3 flex-1">
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                  {user?.[0] || "U"}
                </div>
              )}
              <div className="text-sm flex-1">
                <div>
                  <span className="font-semibold mr-1">{user}</span>
                  <span className="text-slate-700">{text}</span>
                </div>
                {n.meta?.snippet && (
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {n.meta.snippet}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1">{time}</div>
              </div>
            </div>
            {metaImage && (
              <img
                src={metaImage}
                alt="meta"
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
};

// --- NotificationsDrawer component (Unchanged) ---
const NotificationsDrawer = () => {
  const { activeUser } = useContext(AuthContext);
  const {
    open,
    closeNotifications,
    notifications,
    loading,
    loadNotifications,
  } = useNotifications();

  const [store, setStore] = useState({});
  const [openCommentsFor, setOpenCommentsFor] = useState(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStore(JSON.parse(raw));
    } catch {
      setStore({});
    }
  }, []);

  const dataList = notifications || [];

  const persistStore = (next) => {
    setStore(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to persist notifications state", err);
    }
  };

  const toggleLike = (id) => {
    const next = { ...store };
    next[id] = next[id] || { liked: false, comments: [] };
    next[id].liked = !next[id].liked;
    persistStore(next);
  };

  const openComments = (id) => {
    setOpenCommentsFor(id);
    setNewComment("");
  };

  const closeComments = () => setOpenCommentsFor(null);

  const addComment = (id) => {
    if (!newComment?.trim()) return;
    const next = { ...store };
    next[id] = next[id] || { liked: false, comments: [] };
    next[id].comments.push({
      text: newComment.trim(),
      when: new Date().toISOString(),
    });
    persistStore(next);
    setNewComment("");
  };

  return (
    <>
      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeNotifications}
          />
          <div className="relative bg-white w-full md:w-96 max-h-[70vh] overflow-auto p-4 rounded-t-lg md:rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button onClick={closeNotifications} className="p-2">
                <FiX />
              </button>
            </div>
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : (
              <NotificationsList
                data={dataList}
                variant="desktop"
                currentUserId={activeUser?._id}
                store={store}
                onToggleLike={toggleLike}
                onOpenComments={openComments}
                loadNotifications={loadNotifications}
              />
            )}
          </div>
        </div>
      )}

      {openCommentsFor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeComments}
          />
          <div className="relative bg-white w-full md:w-96 max-h-[70vh] overflow-auto p-4 rounded-t-lg md:rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Comments</h3>
              <button onClick={closeComments} className="p-2">
                <FiX />
              </button>
            </div>
            <div className="space-y-2">
              {(store[openCommentsFor]?.comments || []).length > 0 ? (
                store[openCommentsFor].comments.map((c, i) => (
                  <div key={i} className="text-sm bg-slate-50 p-2 rounded">
                    {c.text}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No comments yet</div>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Write a comment"
                />
                <button
                  onClick={() => addComment(openCommentsFor)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { NotificationsList };
export default NotificationsDrawer;
