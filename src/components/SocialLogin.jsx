import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { facebookLogin as fbLoginService } from "../services/authService";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";

// NOTE: The 'loadFacebookSDK' helper function has been removed.
// We rely entirely on the SDK being loaded and initialized via index.jsx
// or main.jsx on application startup to ensure FB is available when needed.

const SocialLogin = ({ label = "Continue with Facebook", mode = "login" }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const handleFacebook = async () => {
    console.log("🔴 [SocialLogin] handleFacebook STARTED");
    console.log("🔴 window.FB present?", !!window.FB);

    setLoading(true);
    try {
      // Check if Facebook SDK is available
      if (!window.FB) {
        console.error("🔴 Facebook SDK not loaded!");
        showToast(
          "Facebook SDK not loaded. Please refresh the page and try again.",
          "error"
        );
        setLoading(false);
        return;
      }

      console.log("🔴 Checking FB.getLoginStatus first...");

      // CRITICAL FIX: Check login status first to see if popup will be blocked
      window.FB.getLoginStatus((statusResponse) => {
        console.log("🔴 FB.getLoginStatus response:", statusResponse);
        console.log("🔴 Current status:", statusResponse.status);

        if (statusResponse.status === "connected") {
          console.log("🔴 Already connected! Using existing session...");
          // User is already logged into Facebook and has authorized the app
          handleFacebookResponse(statusResponse);
        } else {
          console.log("🔴 Not connected, need to call FB.login()...");
          console.log("🔴 Attempting to open popup...");

          // Try to open popup
          window.FB.login(
            (loginResponse) => {
              console.log("🔴 FB.login response:", loginResponse);
              handleFacebookResponse(loginResponse);
            },
            { scope: "email,public_profile" }
          );
        }
      });
    } catch (e) {
      console.error("🔴 OUTER CATCH - Fatal error:", e);
      console.error("🔴 Error stack:", e.stack);
      showToast("An unexpected error occurred: " + e.message, "error");
      setLoading(false);
    }
  };

  const handleFacebookResponse = async (resp) => {
    console.log("🔴 handleFacebookResponse called with:", resp);
    console.log("🔴 resp.status:", resp?.status);
    console.log("🔴 resp.authResponse:", resp?.authResponse);

    if (resp && resp.status === "connected" && resp.authResponse) {
      console.log("✅ Facebook login successful! Sending to server...");
      const token = resp.authResponse.accessToken;
      console.log("🔴 Token obtained, sending to server...");
      try {
        console.log(
          "🔴 Calling fbLoginService with token preview:",
          token?.slice(0, 8) + "..."
        );
        // THIS is the network call to your backend /auth/facebook
        const res = await fbLoginService(token, mode);
        console.log("🔴 SERVER RESPONSE:", res);

        const data = res?.data || {};
        console.log("🔴 Response data:", data);
        if (data.access || data.user) {
          console.log("🔴 Login successful, logging in user...");
          try {
            await login({ access: data.access, ...data.user });
            console.log("🔴 AuthContext login successful");
            showToast(
              mode === "signup"
                ? "Account created successfully! Welcome to SnapGram"
                : "Welcome back!",
              "success"
            );
          } catch (e) {
            console.warn("🔴 AuthContext.login failed", e);
          }
          navigate("/");
        } else {
          console.error("🔴 No access or user in response");
          showToast(
            data.error || "Facebook login not configured on server",
            "error"
          );
        }
      } catch (err) {
        console.error("🔴 SERVER POST FAILED:", err);
        console.error("🔴 Error response:", err?.response?.data);
        console.error("🔴 Error status:", err?.response?.status);
        const errorMsg = err?.response?.data?.error || "Social login failed";
        showToast(errorMsg, "error", 5000);
      }
    } else {
      console.warn("🔴 FB.login not connected or no authResponse");
      console.warn("🔴 resp.status:", resp?.status);

      if (resp?.status === "unknown") {
        showToast(
          "Facebook popup was blocked or you cancelled. Please allow popups and try again.",
          "warning",
          5000
        );
      } else if (resp?.status === "not_authorized") {
        showToast(
          "You need to authorize the app to continue. Please try again.",
          "warning",
          5000
        );
      } else {
        showToast(
          "Facebook login failed. Please check your Facebook settings and try again.",
          "error",
          5000
        );
      }
    }
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleFacebook}
        disabled={loading}
        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 flex items-center justify-center gap-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1V12h2.1V9.8c0-2.1 1.2-3.3 3-3.3.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z" />
            </svg>
            {label}
          </>
        )}
      </button>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default SocialLogin;
