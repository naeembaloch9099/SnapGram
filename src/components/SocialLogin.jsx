import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { facebookLogin as fbLoginService } from "../services/authService";

// small helper: inject FB SDK and wait until window.FB is available
const loadFacebookSDK = (appId) =>
  new Promise((resolve, reject) => {
    try {
      if (typeof window === "undefined") return reject(new Error("no window"));
      if (window.FB) return resolve(window.FB);
      // avoid injecting twice
      if (document.getElementById("facebook-jssdk")) {
        // wait for FB to initialize
        const t = setInterval(() => {
          if (window.FB) {
            clearInterval(t);
            resolve(window.FB);
          }
        }, 100);
        // timeout after 8s
        setTimeout(() => {
          clearInterval(t);
          if (window.FB) resolve(window.FB);
          else reject(new Error("FB SDK load timeout"));
        }, 8000);
        return;
      }

      window.fbAsyncInit = function () {
        try {
          window.FB.init({
            appId,
            cookie: true,
            xfbml: false,
            version: "v15.0",
          });
        } catch (e) {
          console.warn("FB.init failed", e);
          // ignore init error - still attempt to resolve
        }
        if (window.FB) resolve(window.FB);
      };

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.onload = () => {
        // fbAsyncInit should run; but if not, wait a short while
        setTimeout(() => {
          if (window.FB) resolve(window.FB);
          else reject(new Error("FB SDK loaded but window.FB missing"));
        }, 300);
      };
      script.onerror = (e) => reject(new Error("Failed to load FB SDK", e));
      document.body.appendChild(script);
    } catch (e) {
      reject(e);
    }
  });

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

      // Ensure SDK exists (load dynamically if needed)
      let FB;
      // If FB isn't already present, open a small popup synchronously so the
      // later FB.login call isn't blocked by popup blockers. This popup acts
      // as a user-gesture-owned window and will be closed once the flow
      // completes.
      let popupWin = null;
      if (!window.FB) {
        console.debug(
          "[SocialLogin] FB not present, attempting to open popup and load SDK",
          { appId }
        );
        try {
          popupWin = window.open("", "fb-login", "width=600,height=600");
          if (popupWin && popupWin.document) {
            popupWin.document.body.style.fontFamily = "Arial, sans-serif";
            popupWin.document.body.style.display = "flex";
            popupWin.document.body.style.alignItems = "center";
            popupWin.document.body.style.justifyContent = "center";
            popupWin.document.body.innerHTML =
              '<div style="text-align:center;padding:20px;">Loading Facebook sign-in…<br/><small>If this page stays blank, please allow popups for this site.</small></div>';
          }
        } catch (e) {
          console.warn("[SocialLogin] popup open error", e);
          // popup could be blocked; we'll handle below
          popupWin = null;
        }

        try {
          console.debug("[SocialLogin] loading FB SDK...");
          const startLoad = Date.now();
          FB = window.FB || (await loadFacebookSDK(appId));
          console.debug("[SocialLogin] FB SDK loaded", {
            tookMs: Date.now() - startLoad,
          });
        } catch (err) {
          console.error("[SocialLogin] FB SDK load error", err);
          if (!popupWin) {
            alert(
              "Failed to load Facebook SDK or popup blocked. Please enable popups and try again."
            );
          } else {
            // inform via the popup too
            try {
              popupWin.document.body.innerHTML =
                '<div style="text-align:center;padding:20px;color:#c00;">Failed to load Facebook SDK.<br/>Check console for details.</div>';
            } catch (e) {
              console.warn(
                "[SocialLogin] Error updating popup with FB SDK load failure",
                e
              );
              // ignore
            }
            alert("Failed to load Facebook SDK. Check console for details.");
          }
          setLoading(false);
          return;
        }
      } else {
        console.debug("[SocialLogin] FB already present on window");
        FB = window.FB;
      }

      // Now call FB.login
      console.debug("[SocialLogin] calling FB.login");
      FB.login(
        async (resp) => {
          console.debug("[SocialLogin] FB.login callback", resp);
          if (popupWin && !popupWin.closed) {
            try {
              popupWin.close();
            } catch (e) {
              console.warn("[SocialLogin] Error closing popup window", e);
              // ignore
            }
          }

          if (resp && resp.status === "connected" && resp.authResponse) {
            const token = resp.authResponse.accessToken;
            try {
              console.debug(
                "[SocialLogin] POSTing token to server (authService.facebookLogin)",
                { tokenPreview: token?.slice(0, 8) + "..." }
              );
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
      console.error("SocialLogin error", e);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        console.debug("[SocialLogin Button] Clicked! Event:", e);
        handleFacebook();
      }}
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
