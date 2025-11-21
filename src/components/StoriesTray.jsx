// src/components/StoriesTray.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import StoryBubble from "./StoryBubble";
import StoryViewer from "./StoryViewer";
import AddStoryButton from "./AddStoryButton";
import { AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const StoriesTray = () => {
  const { activeUser } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  // upload handled inline via AddStoryButton; no modal state required

  // Check if story is within last 10 hours (stories expire after 10 hours)
  const withinExpirationTime = useCallback((iso) => {
    try {
      const t = new Date(iso).getTime();
      return Date.now() - t <= 10 * 60 * 60 * 1000; // 10 hours
    } catch {
      return false;
    }
  }, []);

  // Check if user is followed
  const localIsFollowing = useCallback(
    (targetId) =>
      (activeUser?.following || []).some(
        (f) =>
          String(f._id || f) === String(targetId) ||
          String(f) === String(targetId)
      ),
    [activeUser]
  );

  // Normalize stories from backend (supports both flat & grouped responses)
  const normalizeGroups = useCallback(
    (data) => {
      if (!data) return [];

      // Case 1: Already grouped by backend
      if (Array.isArray(data) && data.length > 0 && data[0].stories) {
        return data
          .map((g) => ({
            ...g,
            stories: (g.stories || []).sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ),
          }))
          .filter((g) => {
            const newest = g.stories[0];
            if (!newest || !withinExpirationTime(newest.createdAt))
              return false;
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

      // Case 2: Flat array → group manually
      if (Array.isArray(data)) {
        const byUser = {};
        data.forEach((st) => {
          const userId = String(
            st.userId ||
              st.owner ||
              st.user?._id ||
              st.user?.id ||
              st.posterId ||
              "unknown"
          );
          if (!byUser[userId]) {
            byUser[userId] = {
              userId,
              username: st.username || st.user?.username || "User",
              profilePic:
                st.profilePic || st.user?.profilePic || "/default-avatar.png",
              stories: [],
              hasViewed: !!st.hasViewed || !!st.viewed,
              isPrivate: !!st.isPrivate,
            };
          }
          byUser[userId].stories.push(st);
        });

        return Object.values(byUser)
          .map((g) => ({
            ...g,
            stories: g.stories.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ),
          }))
          .filter((g) => {
            const newest = g.stories[0];
            if (!newest || !withinExpirationTime(newest.createdAt))
              return false;
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

      return [];
    },
    [activeUser, localIsFollowing, withinExpirationTime]
  );

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      const res = await api.get("/stories/feed");
      const normalized = normalizeGroups(res.data);
      setGroups(normalized);
      // Expose for temporary debugging: inspect in DevTools with `window.__SNAPGRAM_STORIES`
      try {
        window.__SNAPGRAM_STORIES = normalized;
        window.__SNAPGRAM_STORIES_TS = Date.now();
      } catch (e) {
        console.log("show error", e);
        /* ignore if read-only */
      }
      console.debug("stories.fetchStories -> loaded groups", {
        count: Array.isArray(normalized) ? normalized.length : 0,
        sample: (normalized || []).slice(0, 3),
      });
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    }
  }, [normalizeGroups]);

  // Initial load + polling every 15s
  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 15000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  // Open viewer at specific group/story
  const openViewer = (groupIdx, storyIdx = 0) => {
    setCurrentGroupIndex(groupIdx);
    setCurrentStoryIndex(storyIdx);
    setViewerOpen(true);
  };

  // Listen for external requests to open a story viewer (e.g. from message thumbnail)
  useEffect(() => {
    const handler = (ev) => {
      try {
        const detail = ev?.detail || {};
        const raw =
          detail.storyId ||
          detail.story_id ||
          detail.storyUrl ||
          detail.url ||
          null;
        if (!raw) return;

        // Normalize candidate strings for comparison
        const candidate = String(raw);

        // Find group and story index containing this story by trying several story fields
        for (let gi = 0; gi < groups.length; gi++) {
          const g = groups[gi];
          const si = (g.stories || []).findIndex((s) => {
            try {
              console.debug("stories:open received", {
                detail,
                groupsCount: Array.isArray(groups) ? groups.length : 0,
              });

              const checks = [
                s._id,
                s.id,
                s.storyId,
                s.url,
                s.media?.url,
                s.image,
                s.thumbnail,
                s.postId,
              ];
              return checks.some((c) => !!c && String(c) === candidate);
            } catch (e) {
              console.log("error occured ", e);
              return false;
            }
          });
          if (si >= 0) {
            console.info("stories:open found story in groups", {
              groupIndex: gi,
              storyIndex: si,
            });
            setCurrentGroupIndex(gi);
            setCurrentStoryIndex(si);
            setViewerOpen(true);
            return;
          }
        }

        // Story not found in groups - fetch it from backend by storyId
        console.info(
          "stories:open story not in groups, fetching from backend",
          {
            candidate,
          }
        );

        if (!candidate) {
          console.warn("No story ID to fetch");
          return;
        }

        // Fetch the story by ID
        api
          .get(`/stories/${candidate}`)
          .then((res) => {
            const story = res.data;
            if (!story) {
              console.warn("Story not found on backend");
              return;
            }

            // Create a temporary group for this story
            const tempGroup = {
              userId: story.userId || story.owner?._id,
              username: story.username || story.owner?.username || "User",
              profilePic:
                story.profilePic ||
                story.owner?.profilePic ||
                "/default-avatar.png",
              stories: [story],
              hasViewed: !!story.viewed,
            };

            console.info("Opened story from backend", {
              tempGroup,
            });

            // Open viewer with the fetched story
            setCurrentGroupIndex(-1); // Indicate this is a temp group
            setCurrentStoryIndex(0);
            // Store the temp group and open viewer
            if (tempGroup) {
              // Pass via local state since it's not in groups
              window.__TEMP_STORY_GROUP = tempGroup;
              setViewerOpen(true);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch story", err);
          });
      } catch (e) {
        console.debug("stories:open handler failed", e);
      }
    };

    window.addEventListener("stories:open", handler);
    return () => window.removeEventListener("stories:open", handler);
  }, [groups]);

  // owner file input ref + handler (hooks must be top-level)
  const ownerInputRef = useRef(null);

  const handleOwnerFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData();
        fd.append("file", f);
        try {
          const res = await api.post("/stories/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          results.push(res.data);
        } catch (err) {
          console.warn("Owner upload failed", err);
        }
      }
      try {
        window.dispatchEvent(
          new CustomEvent("stories:changed", { detail: results })
        );
      } catch (e) {
        console.log("CustomEvent not supported, using fallback", e);
        try {
          const ev = document.createEvent("CustomEvent");
          ev.initCustomEvent("stories:changed", true, true, results);
          window.dispatchEvent(ev);
        } catch (e) {
          console.log("error occured ", e);
        }
      }
      try {
        await fetchStories();
      } catch (e) {
        console.log(e);
      }
    },
    [fetchStories]
  );

  const currentGroup =
    currentGroupIndex === -1
      ? window.__TEMP_STORY_GROUP
      : groups[currentGroupIndex];

  const handleNextGroup = () => {
    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((i) => i + 1);
      setCurrentStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  };

  const handlePrevGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((i) => i - 1);
      setCurrentStoryIndex(0);
    }
  };

  return (
    <>
      {/* Stories Tray */}
      <div className="px-4 py-3 bg-white border-b overflow-x-auto scrollbar-hide">
        <div className="flex gap-4">
          {/* Your Story Bubble: if user already has stories show them, otherwise show upload button */}
          {(() => {
            const ownerIndex = groups.findIndex(
              (g) => String(g.userId) === String(activeUser?._id)
            );
            if (ownerIndex >= 0) {
              const ownerGroup = groups[ownerIndex];
              return (
                <>
                  <input
                    ref={ownerInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => handleOwnerFiles(e.target.files)}
                  />
                  <StoryBubble
                    key={ownerGroup.userId}
                    group={{
                      ...ownerGroup,
                      username:
                        activeUser?.username ||
                        ownerGroup.username ||
                        "Your Story",
                      profilePic:
                        ownerGroup.profilePic ||
                        activeUser?.profilePic ||
                        "/default-avatar.png",
                    }}
                    isYourStory={true}
                    onClick={() => openViewer(ownerIndex)}
                    onAdd={() =>
                      ownerInputRef.current && ownerInputRef.current.click()
                    }
                  />
                </>
              );
            }
            return (
              <div className="flex-shrink-0">
                <AddStoryButton
                  onUploaded={() => {
                    try {
                      fetchStories();
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                />
              </div>
            );
          })()}

          {/* Others' Stories (exclude current user's own group to avoid duplicate) */}
          {groups
            .filter((group) => String(group.userId) !== String(activeUser?._id))
            .map((group) => {
              const realIndex = groups.findIndex(
                (g) => String(g.userId) === String(group.userId)
              );
              return (
                <StoryBubble
                  key={group.userId}
                  group={group}
                  onClick={() => openViewer(realIndex)}
                />
              );
            })}
        </div>
      </div>
      {/* Dev-only debug panel: helps manually test story opening */}
      {import.meta.env.MODE !== "production" && (
        <div className="fixed right-4 bottom-4 z-50 text-sm">
          <div className="bg-white border rounded-lg shadow p-3 w-64">
            <div className="font-semibold text-xs mb-2">Stories Debug</div>
            <div className="text-xs text-slate-500 mb-2">
              Groups: {Array.isArray(groups) ? groups.length : 0}
            </div>
            <DebugPanel groups={groups} />
          </div>
        </div>
      )}

      {/* Full-Screen Story Viewer */}
      <AnimatePresence>
        {viewerOpen && currentGroup && (
          <StoryViewer
            group={currentGroup}
            initialIndex={currentStoryIndex}
            onClose={() => setViewerOpen(false)}
            onNextGroup={handleNextGroup}
            onPrevGroup={handlePrevGroup}
            onViewed={(userId) => {
              setGroups((prev) =>
                prev.map((g) =>
                  g.userId === userId
                    ? {
                        ...g,
                        stories: g.stories.map((s) => ({ ...s, viewed: true })),
                      }
                    : g
                )
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Add story is handled inline by the AddStoryButton above */}
    </>
  );
};

export default StoriesTray;

// --- DebugPanel component (dev-only) ---
const DebugPanel = ({ groups }) => {
  const [input, setInput] = React.useState("");
  const [msg, setMsg] = React.useState(null);

  const pickSample = (g) => {
    if (!g || !g.stories || g.stories.length === 0) return;
    const s = g.stories[0];
    const id = s._id || s.id || s.storyId || s.url || "";
    setInput(String(id));
  };

  const openCandidate = (candidate) => {
    try {
      const idToSend = String(candidate || input || "");
      if (!idToSend) return setMsg("Please enter an id or select a sample.");
      setMsg(`Dispatching: ${idToSend}`);
      window.dispatchEvent(
        new CustomEvent("stories:open", {
          detail: { storyId: idToSend, story_id: idToSend, storyUrl: idToSend },
        })
      );
      // also show a short-lived visual hint
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      console.error(e);
      setMsg("Dispatch failed (see console)");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="story id or url"
          className="flex-1 px-2 py-1 border rounded text-xs"
        />
        <button
          onClick={() => openCandidate()}
          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
        >
          Open
        </button>
      </div>

      <div className="max-h-28 overflow-y-auto mb-2">
        {(groups || []).slice(0, 6).map((g, idx) => (
          <div key={idx} className="mb-1">
            <button
              onClick={() => pickSample(g)}
              className="w-full text-left text-xs p-1 border rounded bg-gray-50 hover:bg-gray-100"
            >
              {g.username || g.userId} • {g.stories?.length || 0}
            </button>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 mb-1">{msg}</div>
      <div className="text-xs text-left text-slate-400">
        window.__SNAPGRAM_STORIES available in Console
      </div>
    </div>
  );
};
