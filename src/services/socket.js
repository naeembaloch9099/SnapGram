let socket = null;

export function initSocket(baseUrl) {
  // Return a promise that resolves when the socket is connected.
  if (socket && socket.connected) return Promise.resolve(socket);
  if (socket && !socket.connected) {
    // If socket exists but not yet connected, wait for connect event.
    return new Promise((resolve) => {
      socket.once("connect", () => resolve(socket));
    });
  }

  // Determine socket URL:
  // Prefer explicit VITE_WS_URL (no path), otherwise derive origin from VITE_API_URL.
  const derivedBase = (() => {
    try {
      if (
        typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_WS_URL
      )
        return import.meta.env.VITE_WS_URL;
      if (
        typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_API_URL
      )
        return new URL(import.meta.env.VITE_API_URL).origin;
    } catch (e) {
      // ignore
    }
    return typeof window !== "undefined" ? window.location.origin : "";
  })();

  // dynamic import - return a promise
  return import("socket.io-client")
    .then(({ io }) => {
      try {
        // Allow polling fallback (avoids failing when websockets are blocked by proxy)
        const socketUrl = baseUrl || derivedBase;
        socket = io(socketUrl, {
          // let engine decide transports; include polling fallback
          transports: ["polling", "websocket"],
          upgrade: true,
          // allow cookies if needed (server uses credentials/cors)
          withCredentials: true,
          // path default is /socket.io
        });

        socket.on("connect", () => console.log("socket connected", socket.id));
        socket.on("disconnect", (reason) =>
          console.log("socket disconnected", reason)
        );

        // Helpful debugging handlers
        socket.on("connect_error", (err) =>
          console.error(
            "socket connect_error:",
            err && err.message ? err.message : err
          )
        );
        socket.on("connect_timeout", (timeout) =>
          console.error("socket connect_timeout:", timeout)
        );
        socket.on("reconnect_attempt", (attempt) =>
          console.log("socket reconnect_attempt", attempt)
        );

        return new Promise((resolve) => {
          socket.once("connect", () => resolve(socket));
        });
      } catch (err) {
        console.warn("socket init failed", err);
        socket = null;
        return Promise.resolve(null);
      }
    })
    .catch((err) => {
      console.warn(
        "socket.io-client not available; real-time features disabled",
        err
      );
      socket = null;
      return Promise.resolve(null);
    });
}

export function getSocket() {
  return socket;
}

export function joinRoom(room) {
  if (!socket) {
    // ensure socket is initialized and connected
    return initSocket().then((s) => {
      if (!s) return;
      s.emit("join", { room });
    });
  }
  socket.emit("join", { room });
}

export function leaveRoom(room) {
  if (!socket) {
    return initSocket().then((s) => {
      if (!s) return;
      s.emit("leave", { room });
    });
  }
  socket.emit("leave", { room });
}

export function on(event, cb) {
  if (!socket) {
    // wait for socket then attach
    let off = () => {};
    initSocket().then((s) => {
      if (!s) return;
      s.on(event, cb);
      off = () => s.off(event, cb);
    });
    return () => off();
  }
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

export function emit(event, payload) {
  if (!socket) {
    // ensure socket is ready then emit
    return initSocket().then((s) => {
      if (!s) return;
      s.emit(event, payload);
    });
  }
  socket.emit(event, payload);
}
