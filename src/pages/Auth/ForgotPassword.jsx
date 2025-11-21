import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PasswordInput from "../../components/PasswordInput";
import { ToastContainer } from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [step, setStep] = useState(1);
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
        showToast("OTP sent to your email!", "success");
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
        showToast("Password reset successful!", "success");
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
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 py-10 
      bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]"
    >
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div
        className="w-full max-w-xl bg-black/40 backdrop-blur-xl border border-white/10 
        rounded-3xl shadow-2xl p-10 animate-fadeIn text-white"
      >
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-center">Reset Password</h1>
        <p className="text-center text-white/70 mt-2">
          {step === 1
            ? "Enter your email to receive an OTP"
            : "Enter OTP & new password"}
        </p>

        {/* STEP 1 — EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="mt-10 space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-5 py-4 bg-white/15 border border-white/25 rounded-xl text-white 
                  placeholder-white/60 focus:ring-2 focus:ring-white/60"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-white text-black font-bold tracking-wide
                hover:bg-neutral-200 active:scale-95 transition disabled:opacity-40"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="block text-center w-full mt-4 text-white/80 hover:text-white text-sm"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* STEP 2 — OTP + PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-10 space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-5 py-4 bg-white/15 border border-white/25 rounded-xl text-white 
                  placeholder-white/60 focus:ring-2 focus:ring-white/60"
                required
              />
              <p className="text-xs text-white/60 mt-1">
                OTP expires in 2 minutes
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                New Password
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full px-5 py-4 bg-white/15 border border-white/25 rounded-xl text-white 
                  placeholder-white/60 focus:ring-2 focus:ring-white/60"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full px-5 py-4 bg-white/15 border border-white/25 rounded-xl text-white 
                  placeholder-white/60 focus:ring-2 focus:ring-white/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-white text-black font-bold tracking-wide
                hover:bg-neutral-200 active:scale-95 transition disabled:opacity-40"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-white/80 hover:text-white text-sm mt-4"
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="block text-center w-full text-white/80 hover:text-white text-sm"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
