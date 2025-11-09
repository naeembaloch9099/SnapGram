import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { fetchNotifications } from "../services/notificationService";
import { NotificationsList } from "../components/NotificationsDrawer";
import { useNotifications } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

// Full-screen notifications page (mobile)
const FullNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { markAllRead } = useNotifications() || {};
  const { activeUser } = useContext(AuthContext);

  useEffect(() => {
    // Mark all notifications as read when page loads - ONLY ONCE
    if (markAllRead) {
      markAllRead().catch((e) => {
        console.warn("Failed to mark notifications as read:", e);
      });
    }
  }, [markAllRead]); // markAllRead is stable due to useCallback with [] deps

  useEffect(() => {
    setLoading(true);
    fetchNotifications()
      .then((res) => {
        const d = res?.data;
        if (Array.isArray(d)) {
          if (d.length > 0 && d[0].when) setData(d);
          else setData([{ when: "Recent", items: d }]);
        } else {
          setData(null);
        }
      })
      .catch((err) => {
        console.warn(err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  // If activeUser is not loaded, show loading state
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="text-slate-600 p-2 rounded hover:bg-slate-100"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold">Notifications</h1>
          </div>
          <div className="text-center text-slate-500 py-8">Loading user...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Link
            to="/"
            className="text-slate-600 p-2 rounded hover:bg-slate-100 flex-shrink-0"
          >
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold">Notifications</h1>
        </div>

        {/* Debug info */}
        <div className="text-xs sm:text-sm text-slate-500 mb-4 p-2 sm:p-3 bg-slate-100 rounded overflow-auto">
          User: {activeUser?.username || "loading"} (
          {activeUser?._id || activeUser?.id || "no ID"})
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <NotificationsList
            data={data}
            variant="mobile"
            currentUserId={activeUser._id || activeUser.id}
          />
        )}

        {error && (
          <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 rounded">
            Failed to load notifications
          </div>
        )}
      </div>
    </div>
  );
};

export default FullNotifications;
