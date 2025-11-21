import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { uploadToCloudinary } from "../../services/cloudinaryClient";
import PasswordInput from "../../components/PasswordInput";
import SocialLogin from "../../components/SocialLogin";

// Helper component for the user avatar/placeholder
const UserAvatarPlaceholder = ({ preview, onClick }) => (
  <div className="flex flex-col items-center gap-1 mb-4">
    <label htmlFor="profile-pic" className="cursor-pointer relative group">
      <img
        // Placeholder uses the gradient colors for the border
        src={preview || "https://placehold.co/100x100/FEDA75/4F5BD5?text=Photo"}
        alt="Profile preview"
        className="w-20 h-20 rounded-full object-cover border-4 border-white/40 shadow-lg transition-all group-hover:scale-105"
      />
      <div className="absolute inset-0 w-20 h-20 rounded-full bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.424 4h3.152a2 2 0 011.664.89l.812 1.218a2 2 0 001.664.89H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
      </div>
    </label>
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] text-white/80 font-medium hover:text-white transition"
    >
      {preview ? "Change Photo" : "Upload Photo"}
    </button>
  </div>
);

const suggestUsername = (fullName) => {
  if (!fullName) return "user" + Math.floor(Math.random() * 9000 + 1000);
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  return base || "user" + Math.floor(Math.random() * 9000 + 1000);
};

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // --- LOGIC FUNCTIONS (Retained) ---

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      setUsernameSuggestions([]);
      setError(
        "Username can only contain lowercase letters, digits, and special characters (. - _). No spaces allowed."
      );
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(() => {
      api
        .post("/auth/check-username", { username })
        .then((res) => {
          setCheckingUsername(false);
          setUsernameAvailable(res.data.available);
          setUsernameSuggestions(res.data.suggestions || []);
          if (!res.data.available) {
            setError(res.data.message);
          } else {
            setError("");
          }
        })
        .catch((err) => {
          setCheckingUsername(false);
          console.error("Username check error:", err);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // OTP resend timer
  useEffect(() => {
    if (!otpSent) return;

    setCanResendOtp(false);
    setResendTimer(120); // 2 minutes

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResendOtp(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent]);

  // Profile Image Handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // simple toast implementation
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info", ttl = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttl);
  };
  const setErrorAndToast = (msg) => {
    setError(msg);
    addToast(msg, "error");
  };

  const handleSuggest = () => {
    const newUsername = suggestUsername(fullName);
    setUsername(newUsername);
  };

  // Handle username suggestion click
  const handleUseSuggestion = (suggestion) => {
    setUsername(suggestion);
    setUsernameSuggestions([]);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResendOtp) return;

    api
      .post("/auth/resend-otp", { email: contact })
      .then((res) => {
        addToast("New verification code sent to your email!", "success", res);
        setCanResendOtp(false);
        setResendTimer(120);

        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              setCanResendOtp(true);
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Failed to resend code";
        setErrorAndToast(msg);
      });
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    setError("");
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!isEmail)
      return setErrorAndToast("Please enter a valid email for signup");
    if (!username) return setErrorAndToast("Please choose a username");

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return setErrorAndToast(
        "Username can only contain lowercase letters, digits, and special characters (. - _). No spaces allowed."
      );
    }

    if (password.length < 6)
      return setErrorAndToast("Password must be at least 6 characters");
    if (password !== confirm) return setErrorAndToast("Passwords do not match");

    console.debug("Signup: requesting server register (send OTP) for", contact);

    const doRegister = async (profilePicValue) => {
      const payload = {
        username,
        password,
        email: contact,
        name: fullName || username,
        profilePic: profilePicValue || undefined,
        bio: "",
      };
      try {
        const res = await api.post("/auth/register", payload);
        const data = res && res.data ? res.data : res;
        console.debug("/auth/register response:", data);
        setOtpSent(true);
        addToast(
          "Verification code sent to your email (check spam).",
          "success"
        );
      } catch (err) {
        console.error(
          "/auth/register error:",
          err.response ? err.response.data : err
        );
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to request verification code";
        setError(msg);
        addToast(msg, "error");
        setOtpSent(false);
      }
    };

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (preview && cloudName && uploadPreset) {
      try {
        let blob;
        if (preview.startsWith("data:")) {
          const res = await fetch(preview);
          blob = await res.blob();
        } else {
          const res = await fetch(preview);
          blob = await res.blob();
        }
        const file = new File([blob], `profile_${Date.now()}.png`, {
          type: blob.type || "image/png",
        });
        const uploadResult = await uploadToCloudinary(file);
        const url = uploadResult.secure_url || uploadResult.url;
        await doRegister(url);
      } catch (err) {
        console.error(
          "Profile client upload failed, registering without client upload:",
          err
        );
        await doRegister(preview);
      }
    } else {
      await doRegister(preview);
    }
  };

  // Handle OTP Verify
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!contact) return setErrorAndToast("Please enter your email");
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!isEmail) return setErrorAndToast("Enter a valid email address");
    if (!username) return setErrorAndToast("Please choose a username");
    if (password.length < 6)
      return setErrorAndToast("Password must be at least 6 characters");
    if (password !== confirm) return setErrorAndToast("Passwords do not match");
    if (!otpSent) {
      return setErrorAndToast("Please request a verification code first");
    }
    if (!otp) {
      return setErrorAndToast("Please enter the OTP");
    }

    console.debug("Verifying OTP for:", contact);
    api
      .post("/auth/verify", { email: contact, otp })
      .then((res) => {
        console.debug(
          "/auth/verify response:",
          res && res.data ? res.data : res
        );
        addToast(
          "Account verified and created. You are now logged in.",
          "success"
        );
        const data = res.data || {};
        try {
          if (data.access) localStorage.setItem("token", data.access);
          if (data.user) {
            localStorage.setItem("activeUser", JSON.stringify(data.user));
            try {
              login && login(data.user);
            } catch (e) {
              console.warn("AuthContext.login failed", e);
            }
            navigate(`/profile/${encodeURIComponent(data.user.username)}`);
          } else {
            navigate("/");
          }
        } catch (e) {
          console.error("post-verify client error:", e);
        }
      })
      .catch((err) => {
        console.error(
          "/auth/verify error:",
          err.response ? err.response.data : err
        );
        const msg2 =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to verify account";
        setError(msg2);
        addToast(msg2, "error");
      });
  };

  // --- JSX RENDER (Vertical Flexibility for Scrollability) ---

  return (
    // Main Container: Full screen background gradient. Removed rigid vertical centering (items-center)
    // and added top/bottom padding to allow content to fill and scroll naturally.
    <div
      className="min-h-screen w-full flex justify-center 
                    bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] 
                    px-6 pt-8 pb-8"
    >
      {" "}
      {/* Increased top/bottom padding slightly for better feel, ensuring scroll works */}
      {/* Card: Centered horizontally, now flows vertically with screen size */}
      <div className="w-full max-w-xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 animate-fadeIn text-center flex-shrink-0">
        {" "}
        {/* Adjusted p-8/p-10 to p-6/p-8 */}
        {/* Brand */}
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          SnapGram
        </h1>
        <p className="text-neutral-200 mt-1 tracking-wide text-sm">
          Create your account
        </p>
        {/* Profile Image Upload */}
        <div className="mt-4">
          <UserAvatarPlaceholder
            preview={preview}
            onClick={() => document.getElementById("profile-pic").click()}
          />
          <input
            id="profile-pic"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden" // Hide the default file input
          />
        </div>
        {error && (
          <div className="mt-3 bg-red-500/20 text-red-200 border border-red-500/40 px-3 py-2 rounded-xl text-xs text-center">
            {error}
          </div>
        )}
        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Email Input */}
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white text-sm placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:outline-none"
            required
          />

          {/* Full Name Input */}
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name (optional)"
            className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white text-sm placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:outline-none"
          />

          {/* Username Input with Suggest Button */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                placeholder="Username (lowercase, no spaces)"
                className={`w-full px-4 py-2.5 rounded-xl text-white text-sm placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:outline-none ${
                  usernameAvailable === false
                    ? "bg-red-500/30 border-red-500/70"
                    : usernameAvailable === true
                    ? "bg-green-500/30 border-green-500/70"
                    : "bg-white/15 border border-white/25"
                }`}
              />

              {/* Status Indicator */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {checkingUsername && (
                  <span className="text-xs text-white/50">...</span>
                )}
                {usernameAvailable === true && !checkingUsername && (
                  <span className="text-green-400 text-sm">✓</span>
                )}
                {usernameAvailable === false && !checkingUsername && (
                  <span className="text-red-400 text-sm">✗</span>
                )}
              </div>

              {/* Username suggestions dropdown (Styling for dark mode) */}
              {usernameSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-neutral-800 border border-white/20 rounded-lg shadow-xl text-left">
                  {usernameSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleUseSuggestion(suggestion)}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 text-xs text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSuggest}
              className="px-3 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-all flex-shrink-0"
            >
              Suggest
            </button>
          </div>

          {/* Password Input */}
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white text-sm placeholder-white/60"
          />

          {/* Confirm Password Input */}
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm Password"
            autoComplete="new-password"
            className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white text-sm placeholder-white/60"
          />

          {/* Action Buttons / OTP Flow */}
          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-95 transition mt-5"
            >
              SEND VERIFICATION CODE
            </button>
          ) : (
            <div className="space-y-3 pt-3">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP from email"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl text-center tracking-widest bg-white/15 border border-white/25 text-white text-sm placeholder-white/60 focus:ring-2 focus:ring-white/60 focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>
                  {canResendOtp ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-white font-bold hover:underline transition"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span>
                      Resend in {Math.floor(resendTimer / 60)}:
                      {(resendTimer % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </span>
                <span>Code expires in 2 min</span>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm tracking-wide hover:bg-neutral-200 active:scale-95 transition"
              >
                VERIFY & CREATE ACCOUNT
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/30 flex-1"></div>
            <span className="text-white/70 text-xs">OR</span>
            <div className="h-px bg-white/30 flex-1"></div>
          </div>

          <SocialLogin mode="signup" />
        </form>
        {/* LOGIN LINK */}
        <p className="text-center text-white/80 mt-5 text-xs">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-medium underline">
            Log in
          </Link>
        </p>
      </div>
      {/* ANIMATIONS (Reused from Login) */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Toasts container (retained) */}
      <div className="fixed right-4 bottom-6 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm px-4 py-2 rounded-lg shadow-md text-sm text-white flex items-center gap-2 ${
              t.type === "success"
                ? "bg-green-600"
                : t.type === "error"
                ? "bg-red-600"
                : t.type === "info"
                ? "bg-blue-600"
                : "bg-gray-700"
            }`}
          >
            <div className="flex-1">{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Signup;
