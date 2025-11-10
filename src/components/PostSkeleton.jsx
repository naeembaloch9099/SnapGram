import React from "react";
import Skeleton from "react-loading-skeleton";

const PostSkeleton = () => {
  return (
    <div
      className="post-skeleton bg-white shadow-sm rounded-md p-4 mb-4"
      style={{ borderRadius: 8 }}
    >
      {/* 1. Mimic a User Header (Image and Name) */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <Skeleton circle width={40} height={40} style={{ marginRight: 12 }} />
        <Skeleton width={120} height={18} />
      </div>

      {/* 2. Mimic the Main Content/Title */}
      <Skeleton count={1} height={22} style={{ marginBottom: 10 }} />

      {/* 3. Mimic the Text Body (3 lines) */}
      <Skeleton count={3} />

      {/* 4. Mimic Action Buttons (e.g., Reply/Like area) */}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Skeleton width={80} height={20} />
        <Skeleton width={60} height={20} />
      </div>
    </div>
  );
};

export default PostSkeleton;
