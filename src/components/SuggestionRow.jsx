import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const SuggestionRow = ({ suggestion, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(suggestion);
  const [navLoading, setNavLoading] = useState(false);
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
        <button 
          onClick={handleFollow}
          className="px-4 py-1.5 rounded-lg bg-[#EFEFEF] text-[#262626] text-sm font-semibold hover:bg-[#DBDBDB] transition-colors duration-200"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          Following
        </button>
      );
    // If request is pending for a private account
    if (state.requested || state.isPrivate) {
      // if requested true show Requested, else show Follow (which will create request)
      if (state.requested)
        return (
          <button 
            onClick={handleFollow}
            className="px-4 py-1.5 rounded-lg bg-[#EFEFEF] text-[#262626] text-sm font-semibold hover:bg-[#DBDBDB] transition-colors duration-200"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Requested
          </button>
        );
      return (
        <button
          onClick={handleFollow}
          className="px-4 py-1.5 rounded-lg bg-[#0095F6] text-white text-sm font-semibold hover:bg-[#1877F2] transition-colors duration-200"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          Follow
        </button>
      );
    }
    // default: public account not followed
    return (
      <button
        onClick={handleFollow}
        className="px-4 py-1.5 rounded-lg bg-[#0095F6] text-white text-sm font-semibold hover:bg-[#1877F2] transition-colors duration-200"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        Follow
      </button>
    );
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors duration-200 cursor-pointer">
      <img
        src={
          state.avatar || state.profilePic || "https://via.placeholder.com/48"
        }
        alt="avatar"
        className="w-11 h-11 rounded-full object-cover"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <Link
              to={`/profile/${state.username}`}
              className="font-semibold text-sm text-[#262626] truncate block hover:opacity-70 transition-opacity"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              onClick={(e) => {
                // show a small inline loader before navigation for perceived speed
                // prevent default and navigate programmatically after a tiny delay
                e.preventDefault();
                if (navLoading) return;
                setNavLoading(true);
                setTimeout(() => navigate(`/profile/${state.username}`), 120);
              }}
            >
              {navLoading ? (
                <span
                  className="inline-block w-4 h-4 border-2 border-t-transparent border-[#0095F6] rounded-full animate-spin"
                  aria-hidden="true"
                />
              ) : (
                state.username
              )}
            </Link>
            <div className="text-xs text-[#737373] truncate" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {state.displayName || state.name || ""}
            </div>
          </div>
        </div>
      </div>
      <div>{renderButton()}</div>
    </div>
  );
};

export default SuggestionRow;
