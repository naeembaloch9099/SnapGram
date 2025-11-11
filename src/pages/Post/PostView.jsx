import React, { useContext, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { PostContext } from "../../context/PostContext";
import { AuthContext } from "../../context/AuthContext";
import PostCard from "../../components/PostCard";
import { AiFillHeart } from "react-icons/ai";
import { FiHeart } from "react-icons/fi";
import { formatDate } from "../../utils/formatDate";

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { posts = [] } = useContext(PostContext);
  const { addComment, toggleCommentLike } = useContext(PostContext);
  const { activeUser } = useContext(AuthContext);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  const post = posts.find((p) => String(p.id) === String(id));

  // Helper: render comment text with @mentions turned into Links
  const renderWithMentions = (text) => {
    if (!text) return null;
    const parts = [];
    const mentionRegex = /@([A-Za-z0-9_.]+)/g;
    let lastIndex = 0;
    let m;
    while ((m = mentionRegex.exec(text)) !== null) {
      const idx = m.index;
      if (idx > lastIndex) {
        parts.push(text.substring(lastIndex, idx));
      }
      const username = m[1];
      parts.push(
        <Link
          key={`mention-${idx}-${username}`}
          to={`/profile/${encodeURIComponent(username)}`}
          className="text-indigo-600 font-medium"
        >
          @{username}
        </Link>
      );
      lastIndex = idx + m[0].length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.map((p, i) =>
      typeof p === "string" ? <span key={`t-${i}`}>{p}</span> : p
    );
  };

  // DEBUG: Log detailed comment structure
  console.group("🔍 [PostView] Comment Structure Analysis");
  console.log("Post ID:", id);
  console.log("Total comments:", post?.comments?.length || 0);
  if (post?.comments?.length > 0) {
    post.comments.forEach((c, i) => {
      console.log(`Comment ${i}:`, {
        id: c.id || c._id,
        text: c.text,
        replyTo_value: c.replyTo,
        replyTo_type: typeof c.replyTo,
        replyTo_is_empty: !c.replyTo,
      });
    });
    console.table(
      post.comments.map((c) => ({
        id: c.id || c._id,
        text: c.text?.substring(0, 20) + "...",
        replyTo: c.replyTo || "MAIN_COMMENT",
        user: typeof c.user === "object" ? c.user?.username : c.user,
      }))
    );
  }
  console.groupEnd();

  // Handle back button: if coming from notifications (state has notification info), navigate to commenter's profile
  const handleBackClick = () => {
    // If we have state from notification, check if there's actor/commenter info
    if (location.state?.fromNotification && location.state?.actor) {
      const actorUsername =
        location.state.actor.username || location.state.actor;
      navigate(`/profile/${actorUsername}`);
    } else {
      // Default: go back in history or to profile
      navigate(-1);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={handleBackClick}
              className="text-slate-600 p-2 rounded hover:bg-slate-100"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold">Post</h1>
          </div>
          <div className="bg-white rounded-md shadow-sm p-6 text-center text-slate-500">
            Post not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="text-slate-600 p-2 rounded hover:bg-slate-100"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Post</h1>
        </div>

        <div className="bg-white rounded-md shadow-sm p-4">
          <div className="space-y-4">
            <PostCard post={post} />
          </div>

          {/* Comments section */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3">Comments</h2>
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pb-24">
              {(() => {
                const mainComments = (post.comments || []).filter(
                  (c) => !c.replyTo
                );

                console.group("📊 [PostView] Render Analysis");
                console.log(
                  `Main comments (replyTo is empty/null): ${mainComments.length}`
                );
                console.log(
                  "Main comment IDs:",
                  mainComments.map((c) => c.id || c._id)
                );
                console.log(
                  "All comments:",
                  post.comments.map((c) => ({
                    id: c.id || c._id,
                    replyTo: c.replyTo,
                    replyTo_type: typeof c.replyTo,
                  }))
                );

                mainComments.forEach((c, i) => {
                  const commentId = c.id || c._id;
                  const replies = (post.comments || []).filter(
                    (r) => String(r.replyTo) === String(commentId)
                  );
                  console.log(`Comment #${i + 1}: "${c.text}" (${commentId})`, {
                    isReply: !!c.replyTo,
                    repliesUnder: replies.length,
                  });
                });
                console.groupEnd();

                return mainComments;
              })().map((c) => (
                <div key={c.id || c._id || c.when} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {typeof c.user === "object"
                            ? c.user?.username
                            : c.user}
                        </div>
                        <div className="text-sm text-slate-700">
                          {renderWithMentions(c.text)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(c.when)}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              const commentId = c.id || c._id;
                              const username =
                                typeof c.user === "object"
                                  ? c.user?.username
                                  : c.user;
                              console.log(
                                `🔗 [PostView] Reply clicked - setting replyTo to: "${commentId}", mentioning: @${username}`
                              );
                              setReplyTo(commentId);
                              setCommentText(`@${username} `);
                              inputRef.current?.focus();
                            }}
                            className="hover:underline"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCommentLike(
                              post.id,
                              c.id,
                              activeUser?.username
                            )
                          }
                          className="p-1"
                        >
                          {Array.isArray(c.likedBy) &&
                          c.likedBy.includes(activeUser?.username) ? (
                            <AiFillHeart className="text-red-500" />
                          ) : (
                            <FiHeart />
                          )}
                        </button>
                        <div className="text-xs text-slate-500">
                          {c.likes || 0}
                        </div>
                      </div>
                    </div>

                    {/* replies */}
                    {(() => {
                      const replies = (post.comments || []).filter(
                        (r) => String(r.replyTo) === String(c.id || c._id)
                      );
                      if (replies.length > 0) {
                        console.log(
                          `Found ${replies.length} replies to comment "${c.text}":`,
                          replies.map((r) => ({
                            id: r.id || r._id,
                            replyTo: r.replyTo,
                          }))
                        );
                      }
                      return replies;
                    })().map((r) => (
                      <div
                        key={r.id || r._id || r.when}
                        className="mt-3 ml-12 flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {typeof r.user === "object"
                              ? r.user?.username
                              : r.user}
                          </div>
                          <div className="text-sm text-slate-700">
                            {renderWithMentions(r.text)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {formatDate(r.when)}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleCommentLike(
                                post.id,
                                r.id,
                                activeUser?.username
                              )
                            }
                            className="p-1"
                          >
                            {Array.isArray(r.likedBy) &&
                            r.likedBy.includes(activeUser?.username) ? (
                              <AiFillHeart className="text-red-500" />
                            ) : (
                              <FiHeart />
                            )}
                          </button>
                          <div className="text-xs text-slate-500">
                            {r.likes || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* comment input */}
            <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="w-full max-w-3xl px-4 pointer-events-auto">
                <div className="bg-white p-3 rounded-full flex items-center gap-3 shadow-md">
                  <input
                    ref={inputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      replyTo ? "Replying..." : "Join the conversation..."
                    }
                    className="flex-1 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const text = (commentText || "").trim();
                        if (!text) return;
                        console.log(
                          `💬 [PostView] SUBMITTING with replyTo="${
                            replyTo || "null"
                          }"`
                        );
                        addComment(post.id || post._id, text, replyTo);
                        setCommentText("");
                        setReplyTo(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const text = (commentText || "").trim();
                      if (!text) return;
                      console.log(
                        `💬 [PostView] SUBMITTING with replyTo="${
                          replyTo || "null"
                        }"`
                      );
                      addComment(post.id || post._id, text, replyTo);
                      setCommentText("");
                      setReplyTo(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-full"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;
