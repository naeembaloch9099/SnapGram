import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

export default function PrefetchLink({
  to,
  queryKey,
  queryFn,
  children,
  ...props
}) {
  const queryClient = useQueryClient();
  const location = useLocation();

  React.useEffect(() => {
    const start = () => NProgress.start();
    const done = () => NProgress.done();
    // start on mount and stop on unmount to show progress while route changes
    start();
    return done;
  }, [location]);

  const handleEnter = () => {
    if (queryKey && queryFn)
      queryClient.prefetchQuery(queryKey, queryFn).catch(() => {});
  };

  return (
    <Link to={to} onMouseEnter={handleEnter} onFocus={handleEnter} {...props}>
      {children}
    </Link>
  );
}
