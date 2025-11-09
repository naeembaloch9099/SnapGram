import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiTrash2,
  FiKey,
  FiDatabase,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const KNOWN_KEYS = [
  "users",
  "activeUser",
  "snapgram.notifications.state",
  "demo_otp",
  "demo_reset_code",
  "demo_reset_user",
];

const Settings = () => {
  const { activeUser, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // UI States
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Password Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // LocalStorage Helpers
  const readUsers = () => {
    try {
      const data = localStorage.getItem("users");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const writeUsers = (users) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // Clear Demo Data
  const clearDemo = () => {
    setLoading(true);
    KNOWN_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error(`Failed to clear ${key}:`, e);
      }
    });
    setCleared(true);
    setMsg("Demo data cleared successfully.");
    setLoading(false);
    setTimeout(() => setCleared(false), 3000);
  };

  // Logout
  const handleLogout = async () => {
    console.log("🚪 [SETTINGS] User initiated logout from Settings page");
    setLoading(true);
    try {
      await logout();
      console.log("✅ [SETTINGS] Logout successful, redirecting to login");
      navigate("/login");
    } catch (err) {
      console.error("❌ [SETTINGS] Logout error:", err);
      setErr("Logout failed. Please try again.");
      setLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!activeUser) return;

    setLoading(true);
    setErr("");
    setMsg("");

    try {
      console.log("🗑️ [DELETE ACCOUNT] Sending delete request to backend...");

      // Call backend delete account endpoint
      const response = await api.delete("/auth/account");
      console.log("✅ [DELETE ACCOUNT] Response:", response.data);

      // Clear local storage
      const users = readUsers();
      const filtered = users.filter(
        (u) =>
          u.username !== activeUser.username &&
          String(u.id) !== String(activeUser.id)
      );
      writeUsers(filtered);

      // Logout
      logout();

      setMsg("Your account and all associated data have been deleted.");
      setConfirmDelete(false);

      // Redirect to signup after 2 seconds
      setTimeout(() => navigate("/signup"), 2000);
    } catch (e) {
      console.error("❌ [DELETE ACCOUNT ERROR]", e);
      setErr(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to delete account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    if (!activeUser) {
      setErr("No active user.");
      setLoading(false);
      return;
    }

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setErr("All fields are required.");
      setLoading(false);
      return;
    }

    if (oldPassword !== activeUser.password) {
      setErr("Current password is incorrect.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErr("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setErr("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const users = readUsers();
      const idx = users.findIndex(
        (u) =>
          String(u.id) === String(activeUser.id) ||
          u.username === activeUser.username
      );

      if (idx === -1) {
        setErr("Account not found in storage.");
        setLoading(false);
        return;
      }

      users[idx].password = newPassword;
      writeUsers(users);

      const updatedUser = { ...activeUser, password: newPassword };
      login(updatedUser);

      setMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch {
      setErr("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Messages */}
      {msg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <FiCheck className="w-5 h-5" />
          {msg}
        </div>
      )}
      {err && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <FiX className="w-5 h-5" />
          {err}
        </div>
      )}

      {/* Account Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiLogOut className="text-yellow-600" />
            Account
          </h2>
          <p className="text-sm text-gray-600">
            Manage your session and local account.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
            >
              <FiLogOut />
              Logout
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
            >
              <FiTrash2 />
              Delete Account
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FiKey className="text-indigo-600" />
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              required
            />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiKey />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Demo Data */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <FiDatabase className="text-red-600" />
          Demo Data
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Clear all demo accounts, sessions, and local data from your browser.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={clearDemo}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            <FiDatabase />
            {loading ? "Clearing..." : "Clear Demo Data"}
          </button>
          {cleared && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <FiCheck /> Cleared
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              This will <strong>permanently delete</strong> your local demo
              account. You cannot undo this action.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
