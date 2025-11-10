import React from "react";
import { useLocation } from "react-router-dom";

// Lightweight CSS-based page transition to avoid an extra dependency.
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const [stage, setStage] = React.useState("enter");

  React.useEffect(() => {
    setStage("enter");
    const t = setTimeout(() => setStage("idle"), 160);
    return () => clearTimeout(t);
  }, [pathname]);

  const style = {
    transition: "opacity 160ms ease-out, transform 160ms ease-out",
    opacity: stage === "idle" ? 1 : 0,
    transform: stage === "idle" ? "translateX(0px)" : "translateX(-10px)",
  };

  return <div style={style}>{children}</div>;
}
