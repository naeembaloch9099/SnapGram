import React, { useState, useEffect } from "react";
import PostSkeleton from "./PostSkeleton";

// Example component demonstrating conditional rendering with skeletons
const PostListExample = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Replace with your real API endpoint if available
        const res = await fetch("/api/posts");
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        setPosts(Array.isArray(json) ? json : []);
      } catch (err) {
        console.warn("PostListExample: failed to fetch posts", err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    // small delay to showcase skeletons during dev
    const t = setTimeout(fetchPosts, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="post-list-container">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, i) => <PostSkeleton key={i} />)
      ) : posts.length === 0 ? (
        <div className="p-4 text-slate-500">No posts available</div>
      ) : (
        posts.map((p) => (
          <div key={p._id || p.id} className="mb-4">
            {/* Replace this with your actual Post component */}
            <div className="p-4 bg-white rounded shadow-sm">
              {p.title || p.text || "Post"}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PostListExample;
