import React, { useEffect, useState, useContext } from "react";
import StoryBubble from "./StoryBubble";
import AddStoryButton from "./AddStoryButton";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

// API base is handled by `src/services/api.js` (VITE_API_URL or dev proxy)

const StoriesTray = () => {
  const { activeUser } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // keep only stories within the last 1 hour (3600s)
  const withinOneHour = (iso) => {
    try {
      const t = new Date(iso).getTime();
      return Date.now() - t <= 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // Accept either: array of story docs OR an object with grouped data
  const normalizeResponse = React.useCallback(
    (data) => {
      if (!data) return [];
      const following = (activeUser && activeUser.following) || [];
      const localIsFollowing = (targetId) =>
        following.some(
          (f) =>
            String(f._id || f) === String(targetId) ||
            String(f) === String(targetId)
        );

      // If server already returned grouped payload (array of groups)
      if (Array.isArray(data) && data.length > 0 && data[0].stories) {
        return data
          .map((g) => ({
            ...g,
            stories: (g.stories || []).sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ),
          }))
          .filter((g) => {
            const newest = (g.stories || [])[0];
            if (!newest) return false;
            // recency
            if (!withinOneHour(newest.createdAt)) return false;
            // respect private visibility: if private and I'm not following, hide
            if (
              g.isPrivate &&
              !localIsFollowing(g.userId) &&
              String(g.userId) !== String(activeUser?._id)
            )
              return false;
            // ensure follows: only show stories from accounts I follow (or my own)
            if (
              !localIsFollowing(g.userId) &&
              String(g.userId) !== String(activeUser?._id)
            )
              return false;
            return true;
          });
      }

      // If server returned a flat array of story documents, group by poster
      if (Array.isArray(data)) {
        const by = {};
        data.forEach((st) => {
          const posterId =
            st.userId ||
            st.owner ||
            (st.user && (st.user._id || st.user.id)) ||
            st.posterId;
          const key = String(posterId || "unknown");
          if (!by[key])
            by[key] = {
              userId: key,
              username: st.username || (st.user && st.user.username) || "",
              profilePic:
                st.profilePic || (st.user && st.user.profilePic) || "",
              stories: [],
              hasViewed: !!st.hasViewed,
              isPrivate: !!st.isPrivate,
            };
          by[key].stories.push(st);
        });
        return Object.values(by)
          .map((g) => ({
            ...g,
            stories: g.stories.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ),
          }))
          .filter((g) => {
            const newest = (g.stories || [])[0];
            if (!newest) return false;
            if (!withinOneHour(newest.createdAt)) return false;
            if (
              g.isPrivate &&
              !localIsFollowing(g.userId) &&
              String(g.userId) !== String(activeUser?._id)
            )
              return false;
            if (
              !localIsFollowing(g.userId) &&
              String(g.userId) !== String(activeUser?._id)
            )
              return false;
            return true;
          });
      }

      // if server returned { groups: [...] }
      if (data.groups && Array.isArray(data.groups))
        return normalizeResponse(data.groups);
      return [];
    },
    [activeUser]
  );

  const fetchStories = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/stories/feed");
      const json = res.data;
      // helpful debug: log raw payload from server
      console.debug("Stories feed raw:", json);
      const grouped = normalizeResponse(json);
      setGroups(grouped);
      setError(null);
    } catch (err) {
      // surface backend error message for debugging
      console.warn("Stories fetch failed", err);
      const msg =
        err?.response?.data?.error || err?.message || "Failed to fetch stories";
      setError(msg);
      setGroups([]);
    }
    setLoading(false);
  }, [normalizeResponse]);

  useEffect(() => {
    fetchStories();
    // refresh when stories are uploaded elsewhere in the app
    const onChanged = () => fetchStories();
    window.addEventListener("stories:changed", onChanged);
    return () => window.removeEventListener("stories:changed", onChanged);
  }, [fetchStories]);

  // NOTE: compute following array inside normalizeResponse so we avoid hook dependency issues

  const markViewed = (posterId) => {
    setGroups((prev) =>
      prev.map((g) => (g.userId === posterId ? { ...g, hasViewed: true } : g))
    );
  };

  const handleBubbleClick = async (group) => {
    const story = (group.stories || [])[0];
    if (!story) return;
    const storyId = story._id || story.id;
    try {
      await api.post(`/stories/${storyId}/log_interaction`, { type: "view" });
    } catch (e) {
      console.warn("Failed to log view", e);
    }
    markViewed(group.userId);
    // TODO: open a story viewer modal/player — for now we just mark viewed
  };

  if (loading) return null;
  // show fetch error if present
  if (error)
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        <div className="text-sm text-red-600">
          Stories error: {String(error)}
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {activeUser && (
          <div className="flex-shrink-0">
            <AddStoryButton
              className=""
              onUploaded={() => {
                try {
                  fetchStories();
                } catch (e) {
                  console.warn(e);
                }
              }}
            />
          </div>
        )}
        {groups.length === 0 ? (
          <div className="text-sm text-gray-500">No stories</div>
        ) : (
          groups.map((g) => (
            <div key={g.userId} className="flex-shrink-0">
              <button
                onClick={() => handleBubbleClick(g)}
                className="focus:outline-none"
                aria-label={`Open stories from ${g.username || "user"}`}
              >
                <StoryBubble group={g} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StoriesTray;
