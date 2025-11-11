import React, { useContext, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { FiHeart } from "react-icons/fi";
import { PostContext } from "../../context/PostContext";
import { AuthContext } from "../../context/AuthContext";
import PostCard from "../../components/PostCard";
import { formatDate } from "../../utils/formatDate";

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { posts = [], addComment, toggleCommentLike } = useContext(PostContext);
  const { activeUser } = useContext(AuthContext);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  const post = posts.find((p) => String(p.id) === String(id));

  const renderWithMentions = (text) => {
    if (!text) return null;
    const parts = [];
    const mentionRegex = /@([A-Za-z0-9_.]+)/g;
    let lastIndex = 0;
    let m;
    while ((m = mentionRegex.exec(text)) !== null) {
      const idx = m.index;
      if (idx > lastIndex) parts.push(text.substring(lastIndex, idx));
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

  const handleBackClick = () => {
    if (location.state?.fromNotification && location.state?.actor) {
      const actorUsername =
        location.state.actor.username || location.state.actor;
      navigate(`/profile/${actorUsername}`);
    } else {
      navigate(-1);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-slate-500">
          Post not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="text-slate-600 p-2 rounded hover:bg-slate-100"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Post</h1>
        </div>

        {/* Post */}
        <div className="bg-white rounded-md shadow-sm p-4">
          <PostCard post={post} />

          {/* --- Instagram-style comment area --- */}
          <div className="mt-4 border-t border-gray-100 pt-3">
            {/* Preview one comment */}
            {((post.comments && post.comments.length > 0) || []).length > 0 && (
              <div>
                {(post.comments || []).slice(0, 1).map((c) => (
                  <div key={c.id || c._id} className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <span className="font-semibold text-sm mr-2">
                        {typeof c.user === "object" ? c.user?.username : c.user}
                      </span>
                      <span className="text-sm">
                        {renderWithMentions(c.text)}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(c.when)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        toggleCommentLike(post.id, c.id, activeUser?.username)
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
                  </div>
                ))}

                {/* View all link */}
                {post.comments.length > 1 && (
                  <button
                    onClick={() => {
                      const list = document.querySelector(".all-comments");
                      if (list)
                        list.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className="text-sm text-gray-500 hover:underline mt-2 block"
                  >
                    View all {post.comments.length} comments
                  </button>
                )}
              </div>
            )}

            {/* Full comment list */}
            <div className="all-comments mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {(post.comments || []).map((c) => (
                <div key={c.id || c._id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <span className="font-semibold text-sm mr-2">
                      {typeof c.user === "object" ? c.user?.username : c.user}
                    </span>
                    <span className="text-sm">
                      {renderWithMentions(c.text)}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(c.when)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      toggleCommentLike(post.id, c.id, activeUser?.username)
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
                </div>
              ))}
            </div>

            {/* --- Add comment input --- */}
            <div className="flex items-center gap-3 mt-3 border-t border-gray-100 pt-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 outline-none text-sm bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const text = commentText.trim();
                    if (!text) return;
                    addComment(post.id || post._id, text, replyTo);
                    setCommentText("");
                    setReplyTo(null);
                  }
                }}
              />
              {commentText.trim() !== "" && (
                <button
                  onClick={() => {
                    const text = commentText.trim();
                    if (!text) return;
                    addComment(post.id || post._id, text, replyTo);
                    setCommentText("");
                    setReplyTo(null);
                  }}
                  className="text-blue-500 text-sm font-semibold"
                >
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;
