import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import SocialLogin from "../../components/SocialLogin";

const Login = () => {
  console.debug("[Login Page] Loaded");
  console.debug(
    "[Login Page] VITE_FACEBOOK_APP_ID =",
    import.meta.env.VITE_FACEBOOK_APP_ID
  );
  useEffect(() => {
    console.debug("[Login Page] Component mounted");
  }, []);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState(""); // username, email or phone
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    (async () => {
      try {
        // AuthContext.login accepts (usernameOrUser, password)
        // Server accepts { username, password } where username can be username or email
        const user = await login(identifier, password);
        if (user && user.username) {
          navigate(`/profile/${encodeURIComponent(user.username)}`);
        } else {
          navigate(`/`);
        }
      } catch (err) {
        // err is an Error thrown by AuthContext.login
        setError(err?.message || "Login failed. Try again.");
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Animated Container */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/20 transform transition-all duration-300 hover:shadow-indigo-200/50">
          {/* Logo/Title with gradient */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SnapGram
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
              Welcome Back 👋
            </h2>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50/80 backdrop-blur border border-red-200 rounded-xl px-4 py-3 mb-6 text-center animate-shake shadow-sm">
              <span className="font-medium">⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Username, email, or phone"
                className="w-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-5 py-3.5 text-sm sm:text-base outline-none transition-all duration-300 bg-white/50 backdrop-blur shadow-sm group-hover:shadow-md"
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="relative group">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl px-5 py-3.5 text-sm sm:text-base outline-none transition-all duration-300 bg-white/50 backdrop-blur shadow-sm group-hover:shadow-md"
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="text-right text-sm">
              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold py-3.5 sm:py-4 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg transform"
            >
              <span className="flex items-center justify-center gap-2">
                <span>Log in</span>
                <span className="text-xl">→</span>
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social login */}
          <div>
            <SocialLogin mode="login" />
          </div>

          <div className="mt-8 text-center text-sm sm:text-base text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
