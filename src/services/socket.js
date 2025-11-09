let socket = null;

export function initSocket(baseUrl) {
  if (socket) return socket;
  // dynamic import - non-blocking
  import("socket.io-client")
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
      } catch (err) {
        console.warn("socket init failed", err);
        socket = null;
      }
    })
    .catch((err) => {
      console.warn(
        "socket.io-client not available; real-time features disabled",
        err
      );
      socket = null;
    });
  return socket;
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
