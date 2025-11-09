import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PasswordInput from "../../components/PasswordInput";
import { ToastContainer } from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your email", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot", { email });
      if (res.data.ok) {
        showToast("OTP sent to your email! Check your inbox.", "success");
        setStep(2);
      }
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      showToast("Please fill all fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset", {
        email,
        otp,
        password: newPassword,
      });
      if (res.data.ok) {
        showToast(
          "Password reset successful! Redirecting to login...",
          "success"
        );
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      showToast(
        error.response?.data?.error || "Failed to reset password",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 1
              ? "Enter your email to receive an OTP"
              : "Enter the OTP and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Check your email for the OTP (expires in 2 minutes)
              </p>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New Password
              </label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline block w-full"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
