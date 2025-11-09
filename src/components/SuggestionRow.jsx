import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const SuggestionRow = ({ suggestion, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(suggestion);
  const navigate = useNavigate();
  const { activeUser } = useContext(AuthContext);

  const handleFollow = async () => {
    if (loading) return;
    // require login first
    if (!activeUser) {
      // redirect to login for better UX instead of calling the API and getting a server error
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      // use username to toggle follow/request
      const res = await api.post(
        `/users/${encodeURIComponent(state.username)}/follow`
      );
      // server returns { pending: true, requested: true } for private pending
      // or { following: true } when followed, or cancel states
      const data = res.data || {};
      // Merge updated state based on server response
      if (data.pending || data.requested) {
        setState((s) => ({ ...s, requested: true, isFollowing: false }));
        onToggle && onToggle({ ...state, requested: true, isFollowing: false });
      } else if (data.following !== undefined) {
        setState((s) => ({
          ...s,
          isFollowing: !!data.following,
          requested: false,
        }));
        onToggle &&
          onToggle({
            ...state,
            isFollowing: !!data.following,
            requested: false,
          });
      } else {
        // fallback: toggle requested -> false
        setState((s) => ({ ...s, requested: false, isFollowing: false }));
        onToggle &&
          onToggle({ ...state, requested: false, isFollowing: false });
      }
    } catch (e) {
      console.debug("follow toggle error", e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    // If already following
    if (state.isFollowing)
      return (
        <button className="px-4 py-1 rounded bg-gray-100 text-sm">
          Following
        </button>
      );
    // If request is pending for a private account
    if (state.requested || state.isPrivate) {
      // if requested true show Requested, else show Follow (which will create request)
      if (state.requested)
        return (
          <button className="px-4 py-1 rounded bg-yellow-400 text-sm">
            Requested
          </button>
        );
      return (
        <button
          onClick={handleFollow}
          className="px-4 py-1 rounded bg-blue-600 text-white text-sm"
        >
          Follow
        </button>
      );
    }
    // default: public account not followed
    return (
      <button
        onClick={handleFollow}
        className="px-4 py-1 rounded bg-blue-600 text-white text-sm"
      >
        Follow
      </button>
    );
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
      <img
        src={
          state.avatar || state.profilePic || "https://via.placeholder.com/48"
        }
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <Link
              to={`/profile/${state.username}`}
              className="font-semibold text-sm truncate block"
            >
              {state.username}
            </Link>
            <div className="text-xs text-gray-500 truncate">
              {state.displayName || ""}
            </div>
          </div>
        </div>
      </div>
      <div>{renderButton()}</div>
    </div>
  );
};

export default SuggestionRow;
