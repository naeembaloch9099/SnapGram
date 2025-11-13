import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { facebookLogin as fbLoginService } from "../services/authService";

const SocialLogin = ({ label = "Continue with Facebook" }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFacebook = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && window.FB) {
        window.FB.login(async (resp) => {
          if (resp.status === "connected" && resp.authResponse) {
            const token = resp.authResponse.accessToken;
            try {
              const res = await fbLoginService(token);
              const data = res?.data || {};
              // If server returns access + user, set auth
              if (data.access || data.user) {
                try {
                  // AuthContext.login accepts a user object with access token
                  await login({ access: data.access, ...data.user });
                } catch (e) {
                  console.warn("AuthContext.login failed", e);
                }
                navigate("/");
              } else {
                alert(data.error || "Facebook login not configured on server");
              }
            } catch (err) {
              console.error("facebookLogin POST failed", err);
              alert(err?.response?.data?.error || "Social login failed");
            }
          } else {
            alert("Facebook login failed or was cancelled");
          }
          setLoading(false);
        }, { scope: "email,public_profile" });
      } else {
        // FB SDK not loaded - fallback: call server placeholder endpoint with dummy token
        try {
          const res = await fbLoginService("CLIENT_WILL_PROVIDE_TOKEN");
          alert(res?.data?.error || "Facebook login not configured on server");
        } catch (err) {
          alert(err?.response?.data?.error || "Social login failed");
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFacebook}
      disabled={loading}
      className="w-full mt-2 border border-gray-300 rounded-xl py-2.5 flex items-center justify-center gap-3 hover:bg-gray-50"
    >
      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1V12h2.1V9.8c0-2.1 1.2-3.3 3-3.3.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z" />
      </svg>
      {label}
    </button>
  );
};

export default SocialLogin;
