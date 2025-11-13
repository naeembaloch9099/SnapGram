import React, { useContext, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
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
  const [replyToComment, setReplyToComment] = useState(null);
  const inputRef = useRef(null);

  // State to track which comment replies are visible (Map<commentId, boolean>)
  const [visibleReplies, setVisibleReplies] = useState({});

  const post = posts.find((p) => String(p.id) === String(id));

  // Build nested comment tree from flat comments (assuming parentId field)
  const buildCommentTree = useMemo(() => {
    if (!post?.comments || post.comments.length === 0) return [];

    const commentMap = {};
    const topLevel = [];

    // Initialize map
    post.comments.forEach((c) => {
      // Ensure 'replies' array exists for every comment
      commentMap[c.id || c._id] = { ...c, replies: [] };
    });

    // Build tree
    post.comments.forEach((c) => {
      const commentId = c.id || c._id;
      const parentId = c.parentId;
      if (parentId) {
        const parent = commentMap[parentId];
        if (parent) {
          // Push to replies array of the parent
          parent.replies.push(commentMap[commentId]);
        }
      } else {
        topLevel.push(commentMap[commentId]);
      }
    });

    // Sort top-level and replies by date descending (newest first for display)
    const sortByDateDesc = (items) => {
      if (!items) return;
      items.sort((a, b) => new Date(b.when) - new Date(a.when));
      items.forEach((item) => sortByDateDesc(item.replies));
    };
    sortByDateDesc(topLevel);

    return topLevel;
  }, [post?.comments]);

  // Function to toggle reply visibility for a parent comment
  const toggleReplies = (commentId) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const renderComment = (comment, level = 0) => {
    const commentId = comment.id || comment._id;
    const isLiked =
      Array.isArray(comment.likedBy) &&
      comment.likedBy.includes(activeUser?.username);
    const likeCount = comment.likedBy?.length || 0;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const repliesVisible = visibleReplies[commentId];

    // Determine which comments to show: All if repliesVisible is true, otherwise none.
    const repliesToShow = repliesVisible ? comment.replies : [];

    const username =
      typeof comment.user === "object" ? comment.user?.username : comment.user;

    // Indentation for replies. Top-level comments have no indentation.
    const indentClass = level > 0 ? "pl-6 border-l-2 border-gray-200 ml-2" : "";

    // Determine the name of the user this comment is replying to, for display in level > 0
    const replyToUser = comment.parentUsername;

    return (
      <div key={commentId} className={`space-y-3 ${level === 0 ? "mb-4" : ""}`}>
        <div className={`flex gap-3 ${indentClass}`}>
          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />{" "}
          {/* Placeholder avatar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <span className="font-semibold text-sm mr-1 truncate">
                {username}
              </span>
              {level > 0 && replyToUser && (
                <span className="text-xs text-gray-400">
                  ⋅ Replying to @{replyToUser}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-900 mb-1.5 leading-relaxed">
              {renderWithMentions(comment.text)}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{formatDate(comment.when)}</span>
                {likeCount > 0 && (
                  <span className="font-medium">
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() =>
                    toggleCommentLike(post.id, commentId, activeUser?.username)
                  }
                  className="p-1 rounded-full hover:bg-gray-100 flex items-center gap-1"
                >
                  {isLiked ? (
                    <AiFillHeart className="text-red-500 text-sm" />
                  ) : (
                    <FiHeart className="text-gray-400 text-sm" />
                  )}
                  {/* Hide like count if 0, show if liked or > 0 */}
                  {(isLiked || likeCount > 0) && (
                    <span className="font-medium text-gray-900">
                      {likeCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(commentId);
                    // Pass the parent's username for visual context in the input
                    const parentUsername = username;
                    setReplyToComment({ user: { username: parentUsername } });
                    setCommentText(`@${parentUsername} `); // Prefill with mention
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-gray-500 hover:text-gray-700 hover:underline font-medium"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Render Replies section for the current comment (only if replies exist) */}
        {hasReplies && (
          <div className={`space-y-3 ${level === 0 ? "pt-2" : ""}`}>
            {/* Toggle button: View/Hide Replies (only for top level comments) */}
            <button
              onClick={() => toggleReplies(commentId)}
              className="text-xs text-gray-500 hover:underline font-medium block ml-11"
            >
              {repliesVisible
                ? "Hide replies"
                : `View ${comment.replies.length} replies`}
            </button>

            {/* Render the actual replies (only if expanded) */}
            {repliesToShow.length > 0 && (
              <div className="space-y-3">
                {/* The replies themselves are rendered recursively at level + 1 */}
                {repliesToShow.map((reply) => renderComment(reply, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // The PostView page shows the full comment list, so we map directly to renderComment
  const renderFullComments = () => (
    <div className="full-comments space-y-4 max-h-[70vh] overflow-y-auto pb-4 px-4">
      {buildCommentTree.map((comment) => renderComment(comment))}
    </div>
  );

  // Existing utility function for mentions
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
          className="text-[#00376B] font-semibold hover:underline"
        >
          @{username}
        </Link>
      );
      lastIndex = idx + m[0].length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0
      ? parts.map((p, i) =>
          typeof p === "string" ? <span key={`t-${i}`}>{p}</span> : p
        )
      : text;
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

  const handlePostComment = () => {
    const text = commentText.trim();
    if (!text) return;

    // Add logic to include the parent's username for better UX, though backend might ignore it for now
    const parentUsername =
      replyToComment?.user?.username || replyToComment?.user;

    addComment(post.id || post._id, text, replyTo, parentUsername); // Assuming addComment can handle parentUsername
    setCommentText("");
    setReplyTo(null);
    setReplyToComment(null);
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-gray-500">
          Post not found.
        </div>
      </div>
    );
  }

  const hasComments = buildCommentTree.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 pb-2 border-b border-gray-200">
          <button
            onClick={handleBackClick}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Post</h1>
        </div>
        {/* Post Card - showComments MUST be false here */}
        <div className="bg-white rounded-lg shadow-sm mb-2 overflow-hidden">
          <PostCard post={post} showComments={false} />
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Full Comments List (Always rendered in PostView) */}
          <div className={`space-y-4 py-4 ${!hasComments ? "block px-4" : ""}`}>
            {hasComments ? (
              renderFullComments()
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No comments yet
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div className="px-4 pt-2 pb-4 border-t border-gray-200">
            {replyTo && replyToComment && (
              <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 rounded-full">
                <span className="text-xs text-gray-600">
                  Replying to @
                  {replyToComment.user?.username || replyToComment.user}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyToComment(null);
                    setCommentText("");
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
              {/* User avatar placeholder */}
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  replyTo ? "Post your reply..." : "Add a comment..."
                }
                className="flex-1 py-2 pr-2 text-sm text-gray-900 placeholder-gray-500 outline-none bg-transparent resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
              />
              {commentText.trim() !== "" && (
                <button
                  onClick={handlePostComment}
                  className="text-sm font-semibold text-blue-500 hover:text-blue-600 px-2 py-1 rounded-full hover:bg-blue-50 whitespace-nowrap"
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
