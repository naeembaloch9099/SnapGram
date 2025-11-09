import React from "react";

const PostGrid = ({ posts = [] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2">
    {posts.map((p, i) => (
      <div
        key={p.id || i}
        className="aspect-square bg-slate-100 overflow-hidden rounded-sm"
      >
        {p.src ? (
          <img
            src={p.src}
            alt={p.caption || `post-${p.id || i}`}
            className="w-full h-full object-cover block"
            onError={(e) => {
              // if image fails to load, keep the placeholder background
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-100" />
        )}
      </div>
    ))}
  </div>
);

export default PostGrid;
