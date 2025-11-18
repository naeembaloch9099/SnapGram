// vite.config.js
import { defineConfig, loadEnv } from "vite";
import process from "process";
import react from "@vitejs/plugin-react";

// Export an async config so we can dynamically import optional build-time
// plugins (visualizer, compression). This keeps `npm install` light for
// developers while still enabling analysis on CI or when the devtools are
// intentionally installed.
export default defineConfig(async ({ command }) => {
  const plugins = [react()];

  // Allow the dev proxy target to be overridden with an env var so
  // developers can point the frontend dev server to a local backend.
  const defaultProxyTarget = "https://snapserver-production.up.railway.app";
  const viteEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd());
  const proxyTarget =
    viteEnv.VITE_DEV_PROXY_TARGET ||
    viteEnv.DEV_PROXY_TARGET ||
    defaultProxyTarget;

  const server = {
    host: true,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  };

  const build = {
    target: "es2018",
    brotliSize: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Split vendor packages into their own chunks by package name.
        manualChunks(id) {
          if (id && id.includes && id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  };

  if (command === "build") {
    try {
      const viz = await import("rollup-plugin-visualizer");
      const comp = await import("vite-plugin-compression");

      if (viz && viz.visualizer) {
        plugins.push(
          viz.visualizer({ filename: "dist/bundle-stats.html", open: false })
        );
      }

      if (comp && comp.default) {
        const viteCompression = comp.default;
        plugins.push(
          viteCompression({ algorithm: "brotliCompress", ext: ".br" })
        );
        plugins.push(viteCompression({ algorithm: "gzip" }));
      }
    } catch (e) {
      // Optional build plugins not installed. Continue without them.
      console.warn(
        "Optional build plugins not installed (visualizer/compression). Skipping.",
        e && e.message ? e.message : e
      );
    }
  }

  return {
    plugins,
    server,
    build,
  };
});
