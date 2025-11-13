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
    console.debug("[SocialLogin] handleFacebook start");
    setLoading(true);
    try {
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID || null;

      if (!appId) {
        alert("Facebook App ID not set in VITE_FACEBOOK_APP_ID");
        setLoading(false);
        return;
      }

      // --- CRITICAL FIX: Ensure FB object is available ---
      const FB = window.FB;

      if (!FB) {
        console.warn("[SocialLogin] FB SDK not initialized on window.FB.");
        alert(
          "Facebook SDK is not ready. Please refresh the page and try again."
        );
        setLoading(false);
        return;
      }

      // If the SDK is ready, we proceed directly and synchronously with FB.login()
      // to ensure the call is linked immediately to the user's click event.
      console.debug(
        "[SocialLogin] FB SDK is ready. Calling FB.login synchronously."
      );

      // Now call FB.login
      FB.login(
        async (resp) => {
          console.debug("[SocialLogin] FB.login callback", resp);

          // NOTE: Removed the popupWin closing logic as the complex popup opening logic
          // (which caused the delay) was removed in favor of simple synchronous flow.

          if (resp && resp.status === "connected" && resp.authResponse) {
            const token = resp.authResponse.accessToken;
            try {
              console.debug(
                "[SocialLogin] POSTing token to server (authService.facebookLogin)",
                { tokenPreview: token?.slice(0, 8) + "..." }
              );
              // THIS is the network call to your backend /auth/facebook
              const res = await fbLoginService(token);
              console.debug("[SocialLogin] facebookLogin response", res);

              const data = res?.data || {};
              if (data.access || data.user) {
                try {
                  await login({ access: data.access, ...data.user });
                } catch (e) {
                  console.warn("AuthContext.login failed", e);
                }
                navigate("/");
              } else {
                alert(data.error || "Facebook login not configured on server");
              }
            } catch (err) {
              console.error("[SocialLogin] facebookLogin POST failed", err);
              alert(err?.response?.data?.error || "Social login failed");
            }
          } else {
            alert("Facebook login failed or was cancelled");
          }
          setLoading(false);
        },
        { scope: "email,public_profile" }
      );
    } catch (e) {
      console.error("SocialLogin error (Fatal)", e);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      // Call the streamlined synchronous function directly on click
      onClick={handleFacebook}
      disabled={loading}
      className="w-full mt-2 border border-gray-300 rounded-xl py-2.5 flex items-center justify-center gap-3 hover:bg-gray-50"
    >
      <svg
        className="w-5 h-5 text-blue-600"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1V12h2.1V9.8c0-2.1 1.2-3.3 3-3.3.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z" />
      </svg>
      {label}
    </button>
  );
};

export default SocialLogin;
