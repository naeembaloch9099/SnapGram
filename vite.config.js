// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Proxy /api to the local backend during development so the frontend and
    // API share the same origin (cookies, refresh flows, and CORS are simpler).
    proxy: {
      "/api": {
        // Proxy to deployed backend (Railway). During local development you
        // can change this back to your local backend address if running the backend locally.
        target: "https://snapserver-production.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
