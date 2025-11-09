import React from "react";

const FollowButton = ({ following }) => (
  <button
    className={`py-1 px-3 rounded ${
      following ? "border" : "bg-indigo-600 text-white"
    }`}
  >
    {following ? "Following" : "Follow"}
  </button>
);

export default FollowButton;
