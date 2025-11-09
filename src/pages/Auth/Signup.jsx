import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import PasswordInput from "../../components/PasswordInput";

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

  // --- ERROR: This function was a bug ---
  // It was reading from 'localStorage' but nothing ever wrote to it.
  // This check provided a false sense of security and would not work.
  // The server is the correct place to validate if a username is taken,
  // which happens in the `handleSendOtp` step. I have removed this
  // function because it was a non-functional error.
  /*
  const readUsers = () => { ... };
  const checkUsernameAvailable = (name) => { ... };
  */

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    // Validate format client-side
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

  // --- Kept: Profile Image Handling ---
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

  // ---- simple toast implementation ----
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

  // --- FIX: Added missing handleSuggest function ---
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

        // Restart timer
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

  // --- FIX: Logic corrected ---
  // This function now validates fields *before* trying to register
  const handleSendOtp = () => {
    setError("");
    // strict policy: require an email for signup
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!isEmail)
      return setErrorAndToast("Please enter a valid email for signup");

    // --- Added other field validations here ---
    if (!username) return setErrorAndToast("Please choose a username");

    // Validate username format
    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return setErrorAndToast(
        "Username can only contain lowercase letters, digits, and special characters (. - _). No spaces allowed."
      );
    }

    if (password.length < 6)
      return setErrorAndToast("Password must be at least 6 characters");
    if (password !== confirm) return setErrorAndToast("Passwords do not match");
    // --- End of validation ---

    console.debug("Signup: requesting server register (send OTP) for", contact);

    const payload = {
      username,
      password,
      email: contact,
      name: fullName || username,
      profilePic: preview || undefined,
      bio: "",
    };
    api
      .post("/auth/register", payload)
      .then((res) => {
        const data = res && res.data ? res.data : res;
        console.debug("/auth/register response:", data);

        setOtpSent(true);
        addToast(
          "Verification code sent to your email (check spam).",
          "success"
        );
        // NO debug OTP - strictly email only
      })
      .catch((err) => {
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
      });
  };

  // --- FIX: Major logic error fixed ---
  // This function should *only* verify the OTP, not re-register.
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // --- Validation ---
    if (!contact) return setErrorAndToast("Please enter your email");
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    if (!isEmail) return setErrorAndToast("Enter a valid email address");
    if (!username) return setErrorAndToast("Please choose a username");
    if (password.length < 6)
      return setErrorAndToast("Password must be at least 6 characters");
    if (password !== confirm) return setErrorAndToast("Passwords do not match");

    // --- Main Logic Fix ---
    // 1. Check if OTP was even requested
    if (!otpSent) {
      return setErrorAndToast("Please request a verification code first");
    }

    // 2. Check if OTP was entered
    if (!otp) {
      return setErrorAndToast("Please enter the OTP");
    }

    // 3. If all checks pass, submit to /auth/verify
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

  return (
    <div>
      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* --- ADDED: JSX for profile image preview --- */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="profile-pic">
            <img
              src={preview || "https://via.placeholder.com/100"} // Default image
              alt="Profile preview"
              className="w-24 h-24 rounded-full object-cover cursor-pointer border-2 border-gray-300"
            />
          </label>
          <input
            id="profile-pic"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden" // Hide the default file input
          />
          <button
            type="button"
            onClick={() => document.getElementById("profile-pic").click()}
            className="text-sm text-indigo-600 hover:underline"
          >
            {preview ? "Change" : "Upload"} photo
          </button>
        </div>

        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email" // Changed to be specific
          className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
        />

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
        />

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              placeholder="Username (lowercase, no spaces)"
              className={`w-full border ${
                usernameAvailable === false
                  ? "border-red-500"
                  : usernameAvailable === true
                  ? "border-green-500"
                  : "border-gray-300"
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none`}
            />
            {checkingUsername && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                Checking...
              </span>
            )}
            {usernameAvailable === true && !checkingUsername && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                ✓
              </span>
            )}
            {usernameAvailable === false && !checkingUsername && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                ✗
              </span>
            )}

            {/* Username suggestions dropdown */}
            {usernameSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-2 text-xs text-gray-600 border-b">
                  Suggestions:
                </div>
                {usernameSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm transition-colors"
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
            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            Suggest
          </button>
        </div>

        {/* Password and confirm with show/hide */}
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
        />

        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
        />

        {!otpSent ? (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP from email"
              maxLength={6}
              className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span>
                    Resend in {Math.floor(resendTimer / 60)}:
                    {(resendTimer % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500">
                OTP expires in 2 minutes
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-medium py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md"
        >
          {/* Changed button text based on state */}
          {otpSent ? "Verify & Create Account" : "Create Account"}
        </button>
        {/* Display general errors */}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Have an account?{" "}
        <Link
          to="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          Log in
        </Link>
      </p>

      {/* Toasts container */}
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
