import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiTrash2,
  FiKey,
  FiCheck,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import api from "../services/api";

const Settings = () => {
  const { activeUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // UI States
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Password Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setErr("Logout failed. Please try again.", err);
    } finally {
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
      await api.delete("/auth/account");
      await logout();
      setMsg("Account deleted successfully.");
      setTimeout(() => navigate("/signup"), 1500);
    } catch (e) {
      setErr(
        e?.response?.data?.error || e?.message || "Failed to delete account."
      );
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setErr("All fields are required.");
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
      await api.post("/auth/password", { oldPassword, newPassword });
      setMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      setErr(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Settings
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Manage your account, security, and preferences.
            </p>
          </div>

          {/* Alert Messages */}
          {msg && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
              <FiCheck className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{msg}</span>
            </div>
          )}
          {err && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{err}</span>
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-3">
            {/* Account Actions Card */}
            <div className="md:col-span-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-md">
                    <FiLogOut className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Account</h2>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Control your session and account access.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full group flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
                  >
                    <FiLogOut className="group-hover:rotate-12 transition-transform" />
                    {loading ? "Logging out..." : "Logout"}
                  </button>

                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full group flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <FiTrash2 className="group-hover:scale-110 transition-transform" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="md:col-span-2">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                    <FiKey className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Change Password
                  </h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Current Password
                    </label>
                    <PasswordInput
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <PasswordInput
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FiKey className="group-hover:rotate-12 transition-transform" />
                    {loading ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <FiAlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Delete Account?
                </h3>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                This action is <strong>permanent</strong>. All your data will be
                erased and cannot be recovered.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
                >
                  {loading ? "Deleting..." : "Delete Forever"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;
