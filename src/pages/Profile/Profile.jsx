import React, { useContext, useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { MessageContext } from "../../context/MessageContext";
import api from "../../services/api";
import { fetchProfile, followUser } from "../../services/userService";
import { PostContext } from "../../context/PostContext";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/Toast";
import {
  FiSettings,
  FiArrowLeft,
  FiHeart,
  FiMessageCircle,
  FiPlay,
  FiCamera,
} from "react-icons/fi";
import ProfileSkeleton from "../../components/ProfileSkeleton";

const Profile = () => {
  const { activeUser: me } = useContext(AuthContext);
  const { conversations = [] } = useContext(MessageContext) || {};
  const { username: routeUsername } = useParams();
  const [user, setUser] = useState(me);
  const [loadingUser, setLoadingUser] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const { posts = [] } = useContext(PostContext);
  const navigate = useNavigate();

  const [openList, setOpenList] = useState(null); // 'followers' | 'following'
  const [showRequests, setShowRequests] = useState(false);

  // Safe user posts (only show when allowed)
  const userPosts = useMemo(() => {
    if (!user?.username) {
      console.log("🔍 [Profile userPosts] No username available");
      return [];
    }

    console.group("🔍 [Profile userPosts] Filtering posts");
    console.log("Current user:", user.username);
    console.log("User _id:", user._id);
    console.log("Total posts in context:", posts.length);
    console.log(
      "Posts data:",
      posts.map((p) => ({
        id: p.id || p._id,
        owner: p.owner,
        ownerUsername: p.ownerUsername,
        ownerId: p.ownerId,
        ownerType: typeof p.owner,
        caption: p.caption?.substring(0, 30),
      }))
    );

    const filtered = posts.filter((p) => {
      // ✅ ENHANCED: Try multiple ways to match the owner
      let matches = false;

      // Method 1: Check ownerUsername field (most reliable)
      if (p.ownerUsername === user.username) {
        matches = true;
      }

      // Method 2: Check owner field directly (fallback for legacy posts)
      if (!matches && p.owner === user.username) {
        matches = true;
      }

      // Method 3: Check if owner is an object with username
      if (!matches && typeof p.owner === "object" && p.owner !== null) {
        if (p.owner.username === user.username) {
          matches = true;
        }
      }

      // Method 4: Check ownerId against user._id if available
      if (!matches && p.ownerId && user._id) {
        if (String(p.ownerId) === String(user._id)) {
          matches = true;
        }
      }

      if (!matches && (p.ownerUsername || p.owner)) {
        console.log(
          `❌ Post ${p.id} owner "${
            p.ownerUsername || p.owner
          }" doesn't match "${user.username}"`
        );
      } else if (matches) {
        console.log(
          `✅ Post ${p.id} owner "${p.ownerUsername || p.owner}" MATCHES "${
            user.username
          }"`
        );
      }

      return matches;
    });

    console.log(
      `📊 Filtered result: ${filtered.length} posts for user "${user.username}"`
    );
    console.groupEnd();

    return filtered;
  }, [posts, user?.username, user?._id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const target =
        routeUsername === "me" || !routeUsername
          ? me && me.username
          : routeUsername;
      if (!target) return;

      console.log("🔄 [Profile useEffect] Loading profile for:", target);

      // Always fetch from API to get fresh follower/following data
      setLoadingUser(true);
      try {
        const res = await fetchProfile(target);
        if (!mounted) return;

        console.log("📥 [Profile useEffect] Profile loaded:", {
          username: res.data?.username,
          _id: res.data?._id,
          isPrivate: res.data?.isPrivate,
          canViewPosts: res.data?.canViewPosts,
        });

        setUser(res.data || null);
      } catch (err) {
        console.error("❌ [Profile useEffect] Failed to load profile:", err);
        if (mounted) setUser(null);
      } finally {
        mounted && setLoadingUser(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [routeUsername, me]);

  // If not logged in and no remote profile
  if (!me && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mb-6" />
        <p className="text-lg font-medium text-gray-700 mb-2">Not logged in</p>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to view your profile
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition shadow-md"
        >
          Log In
        </Link>
      </div>
    );
  }

  // While we're fetching the profile data, show the full-page loader/skeleton
  if (loadingUser) {
    return <ProfileSkeleton />;
  }

  // Determine display name and profile image with fallbacks for older keys
  const displayName = user?.name || user?.fullName || user?.username || "User";
  const profileImage = user?.profilePic || user?.profileImage || "";
  // Safe initial letter
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6 bg-white min-h-screen">
      {/* === PROFILE HEADER === */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
        {/* Avatar */}
        <div className="shrink-0 relative">
          <img
            src={
              profileImage ||
              `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle fill='%23e2e8f0' cx='60' cy='60' r='60'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='48' font-family='system-ui,-apple-system,Arial'>${initial}</text></svg>`
            }
            alt={`${displayName}'s profile`}
            className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-gray-100"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle fill='%23e2e8f0' cx='60' cy='60' r='60'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='48'>${initial}</text></svg>`;
            }}
          />
          {me && me.username === user?.username && (
            <Link
              to="/settings"
              className="absolute -top-1 -right-1 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
              aria-label="Settings"
            >
              <FiSettings className="w-5 h-5 text-gray-700" />
            </Link>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {displayName}
            {loadingUser && (
              <span className="ml-2 text-sm text-gray-500">loading…</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">@{user.username}</p>

          {/* Stats */}
          <div className="flex justify-center md:justify-start gap-8 mt-6">
            <button
              onClick={() => setOpenList("followers")}
              className="group text-center hover:scale-105 transition"
            >
              <div className="text-2xl font-bold text-gray-900">
                {user.followersCount ??
                  (user.followers ? user.followers.length : 0)}
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-800">
                Followers
              </div>
            </button>
            <button
              onClick={() => setOpenList("following")}
              className="group text-center hover:scale-105 transition"
            >
              <div className="text-2xl font-bold text-gray-900">
                {user.followingCount ??
                  (user.following ? user.following.length : 0)}
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-800">
                Following
              </div>
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userPosts.length}
              </div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-5 text-gray-700 text-sm md:text-base max-w-md mx-auto md:mx-0 leading-relaxed">
            {user?.bio || "No bio yet."}
          </p>

          {/* Edit or Follow Button */}
          {me && me.username === user?.username ? (
            <button
              onClick={() => navigate("/profile/edit")}
              className="mt-6 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-full transition-all shadow-sm hover:shadow-md"
            >
              Edit Profile
            </button>
          ) : (
            <div className="mt-6 flex items-center gap-3">
              {/* Follow / Requested / Following / Message button */}
              <FollowControls
                me={me}
                user={user}
                navigate={navigate}
                conversations={conversations}
                showToast={showToast}
                onUpdated={async () => {
                  // refresh profile after follow action
                  try {
                    setLoadingUser(true);
                    const res = await fetchProfile(user.username);
                    setUser(res.data || user);
                  } catch (e) {
                    console.debug("refresh profile error", e?.message || e);
                  } finally {
                    setLoadingUser(false);
                  }
                }}
              />
              {/* If owner has pending requests, show count and open requests modal */}
              {user &&
                user.username &&
                me &&
                me.username === user.username &&
                user.followRequests &&
                user.followRequests.length > 0 && (
                  <button
                    onClick={() => setShowRequests(true)}
                    className="px-4 py-2 rounded-full bg-yellow-100 text-sm text-yellow-800"
                  >
                    Requests ({user.followRequests.length})
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* === POSTS GRID === */}
      <div className="grid grid-cols-3 gap-1 md:gap-3">
        {user && user.isPrivate && user.canViewPosts === false ? (
          <div className="col-span-3 py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <FiPlay className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">
              This account is private
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Follow to see their posts
            </p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <FiCamera className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">No Posts Yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Share your first photo or video
            </p>
          </div>
        ) : (
          userPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="relative aspect-square group overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f3f4f6' width='100%' height='100%'/>
                    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='32'>Broken</text></svg>`;
                  }}
                />
              ) : post.video ? (
                <div className="relative w-full h-full">
                  <video
                    src={post.video}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onError={(e) => {
                      e.currentTarget.poster = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='%23f3f4f6' width='100%' height='100%'/>
                      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='32'>Video</text></svg>`;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiPlay className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Empty</span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div className="flex gap-4 text-white text-sm font-medium">
                  <span className="flex items-center gap-1">
                    <FiHeart className="w-4 h-4" /> {post.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMessageCircle className="w-4 h-4" />{" "}
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* === MODAL === */}
      {openList && (
        <FollowersModal
          type={openList}
          onClose={() => setOpenList(null)}
          username={user.username}
          items={
            openList === "followers"
              ? user.followers || []
              : user.following || []
          }
          me={me}
          user={user}
          navigate={navigate}
          conversations={conversations}
          onFollowChange={() => {
            // Refresh profile to get updated followers/following
            fetchProfile(user.username)
              .then((res) => {
                setUser(res.data || user);
              })
              .catch(console.warn);
          }}
          showToast={showToast}
        />
      )}
      {showRequests && (
        <FollowRequestsModal
          onClose={() => setShowRequests(false)}
          owner={user}
          showToast={showToast}
          refreshProfile={async () => {
            try {
              const r = await fetchProfile(user.username);
              setUser(r.data || user);
            } catch (e) {
              console.debug(e?.message || e);
            }
          }}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Profile;

// === FOLLOWERS / FOLLOWING MODAL ===
const FollowersModal = ({
  type,
  onClose,
  username,
  items = [],
  me: meFromProps,
  user: profileUser,
  navigate,
  conversations = [],
  onFollowChange,
  showToast,
}) => {
  const [followers, setFollowers] = useState(items || []);
  const [loading, setLoading] = useState({});
  // Track pending follow requests for users in this list (local optimistic state)
  const [pendingMap, setPendingMap] = useState({});
  const { activeUser: me } = useContext(AuthContext);

  // Use the passed me if available, otherwise use from context
  const currentMe = meFromProps || me;

  // Sync followers when items change
  useEffect(() => {
    setFollowers(items || []);
    // reset pending map when items change
    setPendingMap({});
  }, [items]);

  // Check if user is already in my following list
  const isUserFollowing = (targetUser) => {
    const targetId = String(targetUser._id || targetUser.id);

    // First check: Is this user in the profile's following list?
    if (profileUser?.following && Array.isArray(profileUser.following)) {
      const inProfileFollowing = profileUser.following.some(
        (f) => String(f._id || f) === targetId
      );
      if (inProfileFollowing) {
        console.log(
          `✅ [isUserFollowing] ${targetUser.username} => true (in profileUser.following)`
        );
        return true;
      }
    }

    // Fallback: Check currentMe.following
    if (currentMe?.following && Array.isArray(currentMe.following)) {
      const result = currentMe.following.some(
        (f) => String(f._id || f) === targetId
      );
      console.log(`✅ [isUserFollowing] ${targetUser.username} => ${result}`);
      return result;
    }

    console.log(
      `❌ [isUserFollowing] ${targetUser.username} => false (no data)`
    );
    return false;
  };

  // Handle follow back action
  const handleFollowBack = async (userToFollow) => {
    try {
      setLoading((prev) => ({ ...prev, [userToFollow._id]: true }));

      const res = await followUser(userToFollow.username);

      // If the target is private, the action creates a pending request.
      // Track it locally so the UI updates to "Requested" immediately.
      if (userToFollow.isPrivate) {
        setPendingMap((p) => ({ ...p, [userToFollow._id]: true }));
        showToast(`Follow request sent to ${userToFollow.username}`, "info");
      } else {
        showToast(`You are now following ${userToFollow.username}`, "success");
      }

      // In some cases the server may return an updated user object; if so,
      // trigger the onFollowChange refresh so the parent can sync state.
      if (res?.data && onFollowChange) onFollowChange();

      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error(
        `❌ [FOLLOW BACK ERROR] Failed to follow ${userToFollow.username}:`,
        err
      );
      showToast(
        `Error: ${
          err?.response?.data?.error || err?.message || "Failed to follow"
        }`,
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [userToFollow._id]: false }));
    }
  };

  // Check if the current user already has a pending request with targetUser
  const isPendingForUser = (targetUser) => {
    const myId = String(currentMe?._id || currentMe?.id || "");

    // If the target user has a followRequests array, check if it contains me
    if (
      targetUser?.followRequests &&
      Array.isArray(targetUser.followRequests)
    ) {
      const found = targetUser.followRequests.some((r) => {
        const rId = r.user ? r.user._id || r.user.id || r.user : r;
        return String(rId) === myId;
      });
      if (found) return true;
    }

    // Otherwise check optimistic local pending map
    return !!pendingMap[targetUser._id];
  };

  // Cancel a pending follow request to targetUser (toggle endpoint)
  const handleCancelPending = async (targetUser) => {
    try {
      setLoading((prev) => ({ ...prev, [targetUser._id]: true }));

      // Call same follow toggle endpoint to cancel a pending request
      await followUser(targetUser.username);

      // Remove optimistic pending marker
      setPendingMap((p) => {
        const copy = { ...p };
        delete copy[targetUser._id];
        return copy;
      });

      showToast(`Follow request to ${targetUser.username} cancelled`, "info");

      // Ask parent to refresh profile state
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error(
        `❌ [CANCEL PENDING] Failed to cancel request for ${targetUser.username}:`,
        err
      );
      showToast(`Failed to cancel follow request`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  };

  const handleRemoveFromFollowers = async (userToRemove) => {
    try {
      setLoading((prev) => ({ ...prev, [userToRemove._id]: true }));

      // Call API to remove follower
      await api.post(`/users/followers/${userToRemove._id}/remove`);

      // Remove from local state
      setFollowers((prev) =>
        prev.filter((f) => String(f._id) !== String(userToRemove._id))
      );

      // Refresh profile to sync with server
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (err) {
      console.error(
        `❌ [REMOVE ERROR] Failed to remove follower ${userToRemove.username}:`,
        err
      );
      showToast(
        `Error: ${
          err?.response?.data?.error || err?.message || "Failed to remove"
        }`,
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [userToRemove._id]: false }));
    }
  };

  // ✅ NEW: Handle unfollow from Following list
  const handleUnfollow = async (userToUnfollow) => {
    try {
      setLoading((prev) => ({ ...prev, [userToUnfollow._id]: true }));

      // Call API to unfollow this user (using toggle endpoint)
      await api.post(`/users/${userToUnfollow._id}/follow`);

      // Remove from local state
      setFollowers((prev) =>
        prev.filter((f) => String(f._id) !== String(userToUnfollow._id))
      );

      showToast(`You unfollowed ${userToUnfollow.username}`, "success");

      // Refresh profile to sync with server
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (err) {
      console.error(
        `❌ [UNFOLLOW ERROR] Failed to unfollow ${userToUnfollow.username}:`,
        err
      );
      showToast(
        `Error: ${
          err?.response?.data?.error || err?.message || "Failed to unfollow"
        }`,
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [userToUnfollow._id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Close"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-lg">{username}</h2>
        <div className="w-10" />
      </div>

      {/* Title */}
      <div className="px-6 pt-4">
        <h3 className="text-xl font-bold text-gray-900">
          {type === "followers" ? "Followers" : "Following"}
        </h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {followers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No {type === "followers" ? "followers" : "people following"}
            </div>
          ) : (
            followers.map((u, idx) => {
              const userId = String(u._id || u.id || idx);
              const isLoading = loading[u._id];
              const isFollowing = isUserFollowing(u);

              console.log(`📌 [RENDER] ${u.username}:`, {
                type,
                isFollowing,
                should_show_message:
                  type === "followers" &&
                  currentMe?.username === username &&
                  isFollowing,
                should_show_followback:
                  type === "followers" &&
                  currentMe?.username === username &&
                  !isFollowing,
              });

              // Determine what buttons to show:
              // In followers list:
              //   - If mutual (isFollowing): show Message + Cross icon
              //   - If not mutual (!isFollowing): show Follow Back
              // In following list:
              //   - Show Cross icon to remove

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between py-4 px-3 hover:bg-gray-50 rounded-lg transition"
                >
                  {/* Left: Avatar and User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={
                        u.avatar ||
                        u.profilePic ||
                        `https://i.pravatar.cc/150?img=${idx}`
                      }
                      alt={u.username}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = `https://i.pravatar.cc/150?img=${idx}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {u.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {u.name || u.displayName || ""}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 ml-2">
                    {/* FOLLOWERS LIST - Own Profile */}
                    {type === "followers" &&
                    currentMe &&
                    currentMe.username === username ? (
                      <>
                        {/* Case 1: Mutual follow (user is in my following list) */}
                        {isFollowing && (
                          <>
                            {/* Message Button */}
                            <button
                              onClick={async () => {
                                try {
                                  // Check if conversation already exists
                                  const existingConv = conversations?.find(
                                    (c) =>
                                      c.participants?.some(
                                        (p) =>
                                          String(p._id || p.id) ===
                                          String(u._id)
                                      )
                                  );

                                  if (existingConv) {
                                    navigate(
                                      `/messages/${
                                        existingConv._id || existingConv.id
                                      }`
                                    );
                                  } else {
                                    // Create new conversation
                                    const res = await api.post(
                                      "/messages/conversation",
                                      {
                                        participantId: u._id,
                                      }
                                    );
                                    navigate(
                                      `/messages/${res.data._id || res.data.id}`
                                    );
                                  }
                                } catch (err) {
                                  console.error("Error opening chat:", err);
                                  showToast("Failed to open chat", "error");
                                }
                              }}
                              disabled={isLoading}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium flex-shrink-0 text-sm"
                              title={`Message ${u.username}`}
                            >
                              {isLoading ? "..." : "Message"}
                            </button>
                            {/* Cross Icon to Remove Follower */}
                            <button
                              onClick={() => handleRemoveFromFollowers(u)}
                              disabled={isLoading}
                              className="ml-2 p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0 text-gray-600 hover:text-gray-900"
                              title="Remove follower"
                            >
                              {isLoading ? (
                                <span className="text-lg">...</span>
                              ) : (
                                <span className="text-2xl font-light">✕</span>
                              )}
                            </button>
                          </>
                        )}

                        {/* Case 2: Not mutual (user is NOT in my following list) */}
                        {!isFollowing &&
                          (isPendingForUser(u) ? (
                            <button
                              onClick={() => handleCancelPending(u)}
                              disabled={isLoading}
                              className="px-6 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 font-medium flex-shrink-0"
                              title={`Cancel follow request to ${u.username}`}
                            >
                              ✓ {isLoading ? "..." : "Requested"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollowBack(u)}
                              disabled={isLoading}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium flex-shrink-0"
                              title={`Follow ${u.username} back`}
                            >
                              {isLoading ? "..." : "Follow Back"}
                            </button>
                          ))}
                      </>
                    ) : (
                      /* FOLLOWING LIST - Show Message + Cross icon for all */
                      type === "following" && (
                        <>
                          {/* Message Button */}
                          <button
                            onClick={async () => {
                              try {
                                // Check if conversation already exists
                                const existingConv = conversations?.find((c) =>
                                  c.participants?.some(
                                    (p) =>
                                      String(p._id || p.id) === String(u._id)
                                  )
                                );

                                if (existingConv) {
                                  navigate(
                                    `/messages/${
                                      existingConv._id || existingConv.id
                                    }`
                                  );
                                } else {
                                  // Create new conversation
                                  const res = await api.post(
                                    "/messages/conversation",
                                    {
                                      participantId: u._id,
                                    }
                                  );
                                  navigate(
                                    `/messages/${res.data._id || res.data.id}`
                                  );
                                }
                              } catch (err) {
                                console.error("Error opening chat:", err);
                                showToast("Failed to open chat", "error");
                              }
                            }}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium flex-shrink-0 text-sm"
                            title={`Message ${u.username}`}
                          >
                            {isLoading ? "..." : "Message"}
                          </button>
                          {/* Cross Icon to Unfollow */}
                          <button
                            onClick={() => handleUnfollow(u)}
                            disabled={isLoading}
                            className="ml-2 p-2 hover:bg-gray-200 rounded-full transition flex-shrink-0 text-gray-600 hover:text-gray-900"
                            title={`Unfollow ${u.username}`}
                          >
                            {isLoading ? (
                              <span className="text-lg">...</span>
                            ) : (
                              <span className="text-2xl font-light">✕</span>
                            )}
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// === FOLLOW CONTROLS ===
const FollowControls = ({
  me,
  user,
  navigate,
  conversations = [],
  showToast,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isOwner = me && user && me.username === user.username;

  // Determine follow state - MUST be before early return
  useEffect(() => {
    if (!user || !me) {
      return;
    }

    // Check if already following - try both _id and id
    const myId = me._id || me.id;

    const following =
      user.followers &&
      user.followers.some((f) => {
        const fId = f._id || f.id || f;
        const match = String(fId) === String(myId);
        return match;
      });

    setIsFollowing(following);

    // Check if follow request is pending
    const pending =
      user.followRequests &&
      user.followRequests.some((r) => {
        const rId = r.user ? r.user._id || r.user.id || r.user : r;
        return String(rId) === String(myId);
      });
    setIsPending(pending);
  }, [user, me]);

  if (!me || !user || isOwner) return null;

  const handleFollowClick = async () => {
    if (loading || !user) return;
    setLoading(true);
    try {
      const response = await followUser(user.username);
      console.log("✅ [FollowControls] Follow response:", response?.data);

      // Update local state immediately for instant UI feedback
      if (user.isPrivate) {
        setIsPending(true);
        showToast("Follow request sent", "success");
      } else {
        setIsFollowing(true);
        showToast("Now following", "success");
      }

      // ALWAYS refresh profile to get updated follow state from backend
      if (onUpdated) {
        await onUpdated();
      }
    } catch (e) {
      console.error(`❌ [FollowControls] Error:`, e?.message || e);
      showToast("Failed to update follow status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (loading || !user) return;
    setLoading(true);
    setShowDropdown(false);
    try {
      await followUser(user.username); // Toggle to unfollow

      // Update local state immediately for instant UI feedback
      setIsFollowing(false);
      showToast("Unfollowed", "info");

      // ALWAYS refresh profile to get updated follow state
      if (onUpdated) await onUpdated();
    } catch (e) {
      console.error(`❌ [FollowControls] Unfollow error:`, e?.message || e);
      showToast("Failed to unfollow", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (loading || !user) return;
    setLoading(true);
    try {
      console.log(
        `🔄 [CANCEL REQUEST] Attempting to cancel request for: ${user.username}`
      );
      // Call the same follow endpoint to cancel the request
      const response = await followUser(user.username);
      console.log(`✅ [CANCEL REQUEST] Response:`, response?.data);

      // Update local state immediately for instant UI feedback
      setIsPending(false);
      showToast(`Follow request cancelled`, "info");

      // ALWAYS refresh profile to get updated follow state
      if (onUpdated) await onUpdated();
    } catch (e) {
      console.error(`❌ [CANCEL REQUEST] Error:`, e);
      console.error(`❌ [CANCEL REQUEST] Error message:`, e?.message);
      console.error(`❌ [CANCEL REQUEST] Error response:`, e?.response?.data);
      showToast("Failed to cancel follow request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 relative">
      {isFollowing ? (
        <>
          {/* Following Dropdown Button - Instagram Style */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              Following
              <span className="text-xs">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                <button
                  onClick={handleUnfollow}
                  disabled={loading}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-600 transition text-sm font-medium"
                >
                  Unfollow
                </button>
              </div>
            )}
          </div>

          {/* Message Button - Instagram Style */}
          <button
            onClick={async () => {
              try {
                console.log(
                  `💬 [FollowControls] Opening message with ${user.username}`
                );

                // Find existing conversation
                const existingConv = conversations?.find((c) =>
                  c.participants?.some(
                    (p) => String(p._id || p.id) === String(user._id)
                  )
                );

                if (existingConv) {
                  // Navigate immediately if conversation exists
                  navigate(`/messages/${existingConv._id || existingConv.id}`);
                } else {
                  // Navigate to messages page immediately with user info in state
                  // The MessageChatBox will create the conversation on mount
                  navigate(`/messages/new`, {
                    state: {
                      targetUser: {
                        _id: user._id,
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName || user.name,
                        profilePic: user.profilePic,
                        avatar: user.avatar,
                      },
                    },
                  });
                }
              } catch (err) {
                console.error("Error opening chat:", err);
                if (showToast) {
                  showToast("Failed to open chat", "error");
                }
              }
            }}
            className="px-6 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Message
          </button>
        </>
      ) : isPending ? (
        <button
          onClick={handleCancelRequest}
          disabled={loading}
          className="px-6 py-2.5 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-700 transition disabled:opacity-50 font-medium flex items-center gap-2"
        >
          <span>✓</span>
          {loading ? "Cancelling..." : "Requested"}
        </button>
      ) : (
        <button
          onClick={handleFollowClick}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? "..." : "Follow"}
        </button>
      )}
    </div>
  );
};

// === FOLLOW REQUESTS MODAL (owner) ===
const FollowRequestsModal = ({ onClose, owner, showToast, refreshProfile }) => {
  const [loading, setLoading] = useState(false);
  const [requesters, setRequesters] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      console.log("🔵 [FOLLOW REQUESTS MODAL] Mount - Checking owner data:", {
        hasOwner: !!owner,
        ownerUsername: owner?.username,
        hasFollowRequests: !!owner?.followRequests,
        requestsCount: owner?.followRequests?.length || 0,
      });

      if (!owner || !owner.followRequests) {
        console.log(
          "� [FOLLOW REQUESTS MODAL] Early exit - no owner or followRequests"
        );
        return;
      }

      setLoading(true);
      console.log(
        `⏳ [FOLLOW REQUESTS MODAL] Loading ${owner.followRequests.length} requests...`
      );

      try {
        const arr = await Promise.all(
          owner.followRequests.map(async (r) => {
            const id = r.user || r;
            try {
              const res = await fetchProfile(id);
              console.log(
                `✅ [FOLLOW REQUESTS MODAL] Loaded requester: ${res.data?.username}`
              );
              return res.data || { _id: id };
            } catch (error) {
              console.warn(
                `⚠️ [REQUEST] Failed to load profile for ${id}:`,
                error?.message
              );
              return { _id: id, username: id };
            }
          })
        );
        if (mounted) {
          console.log(`✅ [FOLLOW REQUESTS MODAL] All profiles loaded:`, {
            count: arr.length,
            usernames: arr.map((r) => r.username),
          });
          setRequesters(arr);
        }
      } catch (e) {
        console.error(
          "❌ [FOLLOW REQUESTS MODAL] Failed to load follow requests:",
          e?.message || e
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [owner]);

  // Debug: Track requesters array changes
  useEffect(() => {
    console.log("🔴 [BUTTON DEBUG] Requesters state changed:", {
      count: requesters.length,
      loading: loading,
      requesters: requesters.map((r) => ({
        id: r._id,
        username: r.username,
      })),
    });
  }, [requesters, loading]);

  const accept = async (requesterId) => {
    try {
      const requester = requesters.find(
        (r) => String(r._id) === String(requesterId)
      );

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`✅ [ACCEPT REQUEST] From: ${requester?.username}`);
      console.log(`📌 Requester ID: ${requesterId}`);
      console.log(`📌 Owner: ${owner.username}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const response = await api.post(
        `/users/${owner._id}/requests/${requesterId}/accept`
      );

      console.log(`🔔 [ACCEPT] API Response:`, response?.data);

      if (refreshProfile) {
        console.log(`🔃 [ACCEPT] Refreshing profile...`);
        await refreshProfile();
      }

      setRequesters((prev) => {
        const filtered = prev.filter(
          (p) => String(p._id) !== String(requesterId)
        );
        console.log(`📋 [ACCEPT] Remaining requests: ${filtered.length}`);
        return filtered;
      });

      // Show success toast
      showToast(
        `Follow request from ${requester?.username} accepted`,
        "success"
      );
    } catch (e) {
      console.error(
        `❌ [ACCEPT ERROR] Failed to accept request from ${requesterId}:`,
        e?.message || e
      );
      console.error(`📋 Error Details:`, {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      showToast("Failed to accept follow request", "error");
    }
  };

  const reject = async (requesterId) => {
    try {
      const requester = requesters.find(
        (r) => String(r._id) === String(requesterId)
      );

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`❌ [REJECT REQUEST] From: ${requester?.username}`);
      console.log(`📌 Requester ID: ${requesterId}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const response = await api.post(
        `/users/${owner._id}/requests/${requesterId}/reject`
      );

      console.log(`🗑️ [REJECT] API Response:`, response?.data);

      if (refreshProfile) {
        console.log(`🔃 [REJECT] Refreshing profile...`);
        await refreshProfile();
      }

      setRequesters((prev) => {
        const filtered = prev.filter(
          (p) => String(p._id) !== String(requesterId)
        );
        console.log(`📋 [REJECT] Remaining requests: ${filtered.length}`);
        return filtered;
      });

      // Show success toast
      showToast(`Follow request from ${requester?.username} declined`, "info");
    } catch (e) {
      console.error(
        `❌ [REJECT ERROR] Failed to reject request from ${requesterId}:`,
        e?.message || e
      );
      console.error(`📋 Error Details:`, {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      showToast("Failed to decline follow request", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-lg">Follow Requests</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="py-6">
            <Loader fullScreen={false} size="sm" />
          </div>
        ) : requesters.length === 0 ? (
          <div className="text-center text-gray-500">No requests</div>
        ) : (
          <div className="space-y-4">
            {requesters.map((r) => {
              console.log(
                `🟦 [BUTTON RENDER] Rendering requester with buttons:`,
                {
                  username: r.username,
                  id: r._id,
                  hasAcceptButton: true,
                  hasRejectButton: true,
                }
              );
              return (
                <div
                  key={r._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={r.avatar || `https://i.pravatar.cc/80?u=${r._id}`}
                      alt={r.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {r.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {r.displayName || ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(r._id)}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => reject(r._id)}
                      className="px-4 py-1.5 border border-gray-300 rounded-full text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
