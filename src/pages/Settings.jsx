import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiTrash2,
  FiLock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const Settings = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const togglePass = (field) =>
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      setErr("Logout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete("/auth/account");
      await logout();
      setMsg("Account deleted successfully.");
      setTimeout(() => navigate("/signup"), 1500);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to delete account.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErr("All fields are required.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setErr("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/password", { oldPassword, newPassword });
      setMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErr("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 sm:p-10 border border-gray-200 transition-all">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <FiLock className="text-indigo-600" /> Account Settings
            </h1>
            <p className="mt-2 text-gray-500">
              Manage your security and privacy settings
            </p>
          </div>

          {/* Alerts */}
          {msg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5" /> {msg}
            </div>
          )}
          {err && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <FiXCircle className="w-5 h-5" /> {err}
            </div>
          )}

          {/* CHANGE PASSWORD CARD */}
          <div className="border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiLock /> Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {[
                {
                  label: "Current Password",
                  value: oldPassword,
                  set: setOldPassword,
                  field: "old",
                },
                {
                  label: "New Password",
                  value: newPassword,
                  set: setNewPassword,
                  field: "new",
                  placeholder: "At least 6 characters",
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  set: setConfirmPassword,
                  field: "confirm",
                  placeholder: "Repeat new password",
                },
              ].map(({ label, value, set, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass[field] ? "text" : "password"}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder || ""}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePass(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-500"
                    >
                      {showPass[field] ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <FiLock className="w-5 h-5" />
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* ACCOUNT ACTIONS CARD BELOW */}
          <div className="border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiLogOut /> Account Actions
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Sign out or permanently delete your account.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <FiLogOut className="w-5 h-5" />
              {loading ? "Signing out..." : "Logout"}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="mt-3 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FiTrash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Delete Account?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              This action <strong>cannot be undone.</strong> All your data will
              be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
