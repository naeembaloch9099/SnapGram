// services/api.js (Fixed Version)
import axios from "axios";

// ✅ [FIXED] Change the baseURL to the relative path '/api'
// This will now be handled by the Vite proxy in development.
const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) || // This is still good for production
  "/api"; // Default to the proxy path

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // This is still correct and essential
});

// ... rest of your api.js file (interceptors, etc.) ...
// (No other changes needed in this file)

api.interceptors.request.use((config) => {
  // attach token from localStorage only when it looks like a JWT string
  try {
    const token = localStorage.getItem("token");
    if (token && typeof token === "string") {
      // basic shape check: should have three parts separated by dots
      if (token.split(".").length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.debug(
          "api: token present but not a JWT; skipping Authorization header"
        );
      }
    }
  } catch (e) {
    // if localStorage access fails for any reason, continue without auth
    console.debug("api interceptor: localStorage read error", e?.message || e);
  }
  return config;
});

export default api;
