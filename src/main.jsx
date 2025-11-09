import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Optional: disable console output in the frontend when VITE_DISABLE_CONSOLE is set to 'true'
try {
  if (import.meta.env.VITE_DISABLE_CONSOLE === "true") {
    ["log", "info", "warn", "error", "debug"].forEach((m) => {
      // preserve original in case needed: window.__origConsole = window.__origConsole || {};
      try {
        window.__origConsole = window.__origConsole || {};
        window.__origConsole[m] = console[m];
      } catch (e) {
        console.log("Error preserving original console methods", e);
        // ignore
      }
      console[m] = () => {};
    });
  }
} catch (e) {
  console.log("Error reading VITE_DISABLE_CONSOLE", e);
  // ignore environment read errors during tests
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
