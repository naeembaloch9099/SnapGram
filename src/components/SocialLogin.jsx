import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { facebookLogin as fbLoginService } from "../services/authService";

// NOTE: The 'loadFacebookSDK' helper function has been removed.
// We rely entirely on the SDK being loaded and initialized via index.jsx
// or main.jsx on application startup to ensure FB is available when needed.

const SocialLogin = ({ label = "Continue with Facebook" }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFacebook = async () => {
    // AGGRESSIVE LOGGING - ALWAYS SHOW
    console.log("🔴 [SocialLogin] handleFacebook STARTED");
    console.log("🔴 window.FB present?", !!window.FB);
    console.log(
      "🔴 VITE_FACEBOOK_APP_ID =",
      import.meta.env.VITE_FACEBOOK_APP_ID
    );

    // FORCE ALERT TO SEE IF FUNCTION IS CALLED
    alert("Button clicked! Checking FB SDK...");

    setLoading(true);
    try {
      let appId = null;
      try {
        appId = import.meta.env.VITE_FACEBOOK_APP_ID || null;
        console.log("🔴 appId from env:", appId);
      } catch (envError) {
        alert("❌ ERROR reading environment: " + envError.message);
        setLoading(false);
        return;
      }

      if (!appId) {
        console.error("🔴 ERROR: appId is missing!");
        alert("❌ ERROR: Facebook App ID not set in VITE_FACEBOOK_APP_ID");
        setLoading(false);
        return;
      }

      alert("✅ App ID found: " + appId);

      // --- CRITICAL FIX: Ensure FB object is available ---
      let FB = window.FB;
      console.log("🔴 window.FB check 1:", !!FB);

      if (!FB) {
        alert("⚠️ Facebook SDK not loaded. Attempting to load dynamically...");
        console.log(
          "🔴 FB not on window, attempting to load SDK dynamically..."
        );
        // Try to load SDK dynamically as fallback
        try {
          const loadSDK = (appId) =>
            new Promise((resolve, reject) => {
              if (window.FB) return resolve(window.FB);
              if (document.getElementById("facebook-jssdk")) {
                const t = setInterval(() => {
                  if (window.FB) {
                    clearInterval(t);
                    resolve(window.FB);
                  }
                }, 100);
                setTimeout(() => {
                  clearInterval(t);
                  if (window.FB) resolve(window.FB);
                  else reject(new Error("FB SDK timeout"));
                }, 5000);
                return;
              }
              window.fbAsyncInit = function () {
                if (window.FB) {
                  window.FB.init({
                    appId,
                    cookie: true,
                    xfbml: false,
                    version: "v15.0",
                  });
                }
                if (window.FB) resolve(window.FB);
              };
              const script = document.createElement("script");
              script.id = "facebook-jssdk";
              script.src = "https://connect.facebook.net/en_US/sdk.js";
              script.async = true;
              script.onload = () => {
                setTimeout(() => {
                  if (window.FB) resolve(window.FB);
                  else reject(new Error("FB SDK loaded but window.FB missing"));
                }, 300);
              };
              script.onerror = () =>
                reject(new Error("Failed to load FB SDK script"));
              document.body.appendChild(script);
            });

          FB = await loadSDK(appId);
          console.log("🔴 SDK loaded dynamically, FB now:", !!FB);
          alert("✅ Facebook SDK loaded successfully!");
        } catch (sdkErr) {
          console.error("🔴 ERROR loading SDK:", sdkErr);
          alert("❌ Failed to load Facebook SDK: " + sdkErr.message);
          setLoading(false);
          return;
        }
      } else {
        alert("✅ Facebook SDK already available!");
      }

      if (!FB) {
        console.error("🔴 FATAL: FB is still not available!");
        alert(
          "❌ FATAL: Facebook SDK is not ready. Please refresh the page and try again."
        );
        setLoading(false);
        return;
      }

      alert("🚀 Calling FB.login()...");
      console.log("🔴 FB.login() is about to be called");

      // Add timeout to detect if FB.login callback is never called
      let callbackCalled = false;
      setTimeout(() => {
        if (!callbackCalled) {
          alert(
            "⏱️ TIMEOUT: Facebook didn't respond after 10 seconds. Popup might be blocked or app is in Development mode. Check: 1) Popup blocker, 2) Facebook App is Live, 3) You're added as a tester"
          );
          setLoading(false);
        }
      }, 10000);

      // Now call FB.login
      FB.login(
        async (resp) => {
          callbackCalled = true;
          alert("📩 Facebook responded! Status: " + resp?.status);
          console.log("🔴 [FB.login callback] Response:", resp);
          console.log("🔴 resp.status:", resp?.status);
          console.log("🔴 resp.authResponse:", resp?.authResponse);

          if (resp && resp.status === "connected" && resp.authResponse) {
            alert("✅ Facebook login successful! Sending to server...");
            const token = resp.authResponse.accessToken;
            console.log("🔴 Token obtained, sending to server...");
            try {
              console.log(
                "🔴 Calling fbLoginService with token preview:",
                token?.slice(0, 8) + "..."
              );
              // THIS is the network call to your backend /auth/facebook
              const res = await fbLoginService(token);
              console.log("🔴 SERVER RESPONSE:", res);

              const data = res?.data || {};
              console.log("🔴 Response data:", data);
              if (data.access || data.user) {
                console.log("🔴 Login successful, logging in user...");
                try {
                  await login({ access: data.access, ...data.user });
                  console.log("🔴 AuthContext login successful");
                } catch (e) {
                  console.warn("🔴 AuthContext.login failed", e);
                }
                navigate("/");
              } else {
                console.error("🔴 No access or user in response");
                alert(data.error || "Facebook login not configured on server");
              }
            } catch (err) {
              console.error("🔴 SERVER POST FAILED:", err);
              console.error("🔴 Error response:", err?.response?.data);
              console.error("🔴 Error status:", err?.response?.status);
              alert(err?.response?.data?.error || "Social login failed");
            }
          } else {
            console.warn("🔴 FB.login not connected or no authResponse");
            console.warn("🔴 resp.status:", resp?.status);
            alert(
              "❌ Facebook login failed! Status: " +
                (resp?.status || "unknown") +
                ". Check Facebook App settings."
            );
          }
          setLoading(false);
        },
        { scope: "email,public_profile" }
      );
    } catch (e) {
      console.error("🔴 OUTER CATCH - Fatal error:", e);
      console.error("🔴 Error stack:", e.stack);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      // Call the streamlined synchronous function directly on click
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
  );
};

export default SocialLogin;
