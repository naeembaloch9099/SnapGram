/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [activeUser, setActiveUser] = useState(null);

  // Try to refresh access token on mount using httpOnly refresh cookie
  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log(
        "🔄 [AUTH INIT] Checking if user is logged in (via refresh cookie)..."
      );

      // sanitize any invalid token left in localStorage (avoid sending malformed values)
      try {
        const t = localStorage.getItem("token");
        if (t && typeof t === "string" && t.split(".").length !== 3) {
          console.debug(
            "AuthProvider: removing malformed token from localStorage"
          );
          localStorage.removeItem("token");
        }
      } catch (e) {
        console.debug(
          "AuthProvider: failed to sanitize token",
          e?.message || e
        );
      }

      try {
        const res = await api.post("/auth/refresh");
        const { access, user } = res.data || {};
        if (access) localStorage.setItem("token", access);
        if (mounted && user) {
          console.log(
            "✅ [AUTH INIT] User found via refresh cookie:",
            user.username
          );
          setActiveUser(user);
        }
      } catch {
        // not logged in or refresh failed
        console.log(
          "❌ [AUTH INIT] No valid refresh cookie - user not logged in"
        );
        // ensure we don't keep a bad token
        try {
          const t = localStorage.getItem("token");
          if (t && typeof t === "string" && t.split(".").length !== 3) {
            localStorage.removeItem("token");
          }
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (usernameOrUser, password) => {
    // Support two usages:
    // - login(username, password) => performs API login
    // - login(userObj) => directly set active user (used after register/verify)
    if (usernameOrUser && typeof usernameOrUser === "object") {
      const user = usernameOrUser;
      try {
        if (user.access) localStorage.setItem("token", user.access);
        setActiveUser(user);
      } catch (e) {
        console.debug("AuthContext.login setActive error", e);
      }
      return user;
    }

    const username = usernameOrUser;
    try {
      const res = await api.post("/auth/login", { username, password });
      const { access, user } = res.data || {};
      if (access) localStorage.setItem("token", access);
      setActiveUser(user);
      return user;
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      console.debug("AuthContext.login error", msg, err?.response?.data || err);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 [LOGOUT] Calling backend to clear refresh token...");
      await api.post("/auth/logout");
      console.log("✅ [LOGOUT] Backend logout successful");
    } catch (err) {
      console.warn(
        "⚠️ [LOGOUT] Backend logout failed, clearing locally anyway:",
        err?.message
      );
    }
    console.log("🗑️ [LOGOUT] Clearing local token from localStorage");
    localStorage.removeItem("token");
    console.log("🗑️ [LOGOUT] Clearing activeUser from state");
    setActiveUser(null);
    console.log("✅ [LOGOUT] User logged out completely (cookies cleared)");
  };

  const value = { activeUser, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
