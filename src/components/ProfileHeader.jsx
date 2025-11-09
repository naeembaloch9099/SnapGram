import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaShareAlt, FaUserPlus } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { BsGrid3X3, BsPersonSquare } from "react-icons/bs";
import { AuthContext } from "../context/AuthContext";

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const { activeUser } = useContext(AuthContext);
  // If the displayed profile matches the active user (or no user prop provided),
  // prefer values from AuthContext so edits update immediately.
  const isOwnProfile =
    !!activeUser &&
    (!user || (user.username && user.username === activeUser.username));

  const source = isOwnProfile ? activeUser : user || {};

  const {
    username = "zidi_baloxh_804",
    name = "نعیم رند بلوچ",
    bio = "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    tag = "#baloch",
    university = "CUI25 🎓",
    followers = 267,
    following = 148,
    profileImg = "",
    userPosts = [],
  } = source;

  // Use an inline SVG data URI for the default avatar to avoid remote requests
  const defaultAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none'><rect width='24' height='24' rx='12' fill='%23E5E7EB'/><circle cx='12' cy='9' r='3.2' fill='%239CA3AF'/><path d='M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6' fill='%23D1D5DB'/></svg>`
  )}`;

  // Prefer a valid profileImg; avoid using external placeholder services which may fail.
  const avatarSrc =
    profileImg && !profileImg.includes("via.placeholder.com")
      ? profileImg
      : defaultAvatar;

  // Use the user's posts only; don't inject remote dummy images.
  const displayPosts = Array.isArray(userPosts) ? userPosts : [];

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-8 font-sans">
      {/* ---------- Profile Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-center gap-10 sm:gap-14 border-b border-gray-300 pb-8">
        {/* Profile Picture */}
        <div className="flex justify-center sm:justify-start">
          <div className="relative">
            <img
              src={avatarSrc}
              alt="profile"
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow-md"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 opacity-20 hover:opacity-40 transition duration-300"></div>
          </div>
        </div>

        {/* Right Side Info */}
        <div className="flex flex-col flex-1 max-w-lg text-center sm:text-left">
          {/* Username + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{username}</h2>
            <div className="flex justify-center sm:justify-start gap-2 mt-3 sm:mt-0 flex-wrap">
              <button
                className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </button>
              <button
                title="Settings"
                onClick={() => navigate("/settings")}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition flex items-center justify-center"
              >
                <FiSettings size={16} />
              </button>
              <button className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md flex items-center gap-1 hover:bg-gray-100 transition">
                <FaShareAlt size={14} /> Share
              </button>
              <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition">
                <FaUserPlus size={14} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-8 mb-4 text-gray-800">
            <p>
              <span className="font-semibold">{displayPosts.length}</span> posts
            </p>
            <p>
              <span className="font-semibold">{followers}</span> followers
            </p>
            <p>
              <span className="font-semibold">{following}</span> following
            </p>
          </div>

          {/* Bio */}
          <div className="text-sm leading-relaxed space-y-0.5 text-gray-700">
            <p className="font-semibold text-gray-900">{name}</p>
            <p>{bio}</p>
            <p className="text-blue-500">{tag}</p>
            <p>{university}</p>
          </div>
        </div>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="flex justify-center gap-16 text-xs sm:text-sm font-medium text-gray-600 mt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 py-3 border-t-2 border-black text-black">
          <BsGrid3X3 size={14} />
          <span>POSTS</span>
        </div>
        <div className="flex items-center gap-2 py-3 hover:text-black cursor-pointer transition">
          <BsPersonSquare size={14} />
          <span>TAGGED</span>
        </div>
      </div>

      {/* Posts grid is rendered by the Profile page (avoid duplication here) */}
    </div>
  );
};

export default Profile;
