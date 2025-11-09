import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";

const Login = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome Back 👋
        </h2>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username, email, or phone"
            className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
          />

          <div className="text-right text-sm mt-1">
            <Link
              to="/forgot-password"
              className="text-indigo-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-medium py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md"
          >
            Log in
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
