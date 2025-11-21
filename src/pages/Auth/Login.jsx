import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import SocialLogin from "../../components/SocialLogin";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login(identifier, password);
      navigate(
        user?.username ? `/profile/${encodeURIComponent(user.username)}` : "/"
      );
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] px-6 py-10">
      {/* Card */}
      <div className="w-full max-w-xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 animate-fadeIn text-center">
        {/* Brand */}
        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          SnapGram
        </h1>
        <p className="text-neutral-200 mt-1 tracking-wide text-sm">
          Welcome back 👋
        </p>

        {error && (
          <div className="mt-5 bg-red-500/20 text-red-200 border border-red-500/40 px-3 py-2 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username, email or phone"
            className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl 
            text-white text-sm placeholder-white/60 focus:ring-2 focus:ring-white/60"
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl 
            text-white text-sm placeholder-white/60"
          />

          {/* Forgot password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-white/80 hover:text-white text-xs transition"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-white text-black font-semibold 
            text-sm tracking-wide hover:bg-neutral-200 active:scale-95 transition"
          >
            Log In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/30 flex-1"></div>
            <span className="text-white/70 text-xs">OR</span>
            <div className="h-px bg-white/30 flex-1"></div>
          </div>

          <SocialLogin mode="login" />
        </form>

        {/* Signup */}
        <p className="text-center text-white/80 mt-8 text-xs">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-white font-medium underline">
            Sign up
          </Link>
        </p>
      </div>

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
    </div>
  );
};

export default Login;
