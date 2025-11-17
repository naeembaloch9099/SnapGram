// services/api.js (Fixed Version)
import axios from "axios";

// Prefer the dev proxy (`/api`) when running locally so cookies and
// same-origin proxying works. In production use `VITE_API_URL` if provided.
const baseURL = (() => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      // In dev always use the Vite proxy path so the browser talks to localhost
      if (import.meta.env.DEV) return "/api";
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    console.log("api: error determining baseURL", e?.message || e);
    // ignore and fall back to proxy
  }
  return "/api";
})();

console.debug("api: baseURL resolved to", baseURL);

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
