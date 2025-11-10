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

  // dynamic import - return a promise
  return import("socket.io-client")
    .then(({ io }) => {
      try {
        socket = io(
          baseUrl ||
            (typeof window !== "undefined" ? window.location.origin : ""),
          {
            transports: ["websocket"],
          }
        );
        socket.on("connect", () => console.log("socket connected", socket.id));
        socket.on("disconnect", () => console.log("socket disconnected"));
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
  if (!socket) return;
  socket.emit("join", { room });
}

export function leaveRoom(room) {
  if (!socket) return;
  socket.emit("leave", { room });
}

export function on(event, cb) {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

export function emit(event, payload) {
  if (!socket) return;
  socket.emit(event, payload);
}
