const setupSocket = (io) => {
  const shuttleLocations = new Map();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Add a room join for shuttle tracking
    socket.on("join_shuttle_tracking", (shuttleId) => {
      socket.join(`shuttle_${shuttleId}`);
      console.log(
        `Socket ${socket.id} joined shuttle tracking for ${shuttleId}`
      );

      // Send current location if exists
      const currentLocation = shuttleLocations.get(shuttleId);
      if (currentLocation) {
        socket.emit("shuttle_location", {
          shuttleId,
          coordinates: currentLocation.coordinates,
          timestamp: currentLocation.timestamp,
        });
      }
    });

    socket.on("shuttle_location", (data) => {
      const { shuttleId, coordinates, timestamp } = data;

      // Store the latest location
      shuttleLocations.set(shuttleId, {
        coordinates,
        timestamp,
        socketId: socket.id,
      });

      // Broadcast to all clients
      io.emit("shuttle_location", {
        shuttleId,
        coordinates,
        timestamp,
      });
    });

    socket.on("message", (msg) => {
      console.log("Message received:", msg);
      io.emit("message", msg);
    });

    socket.on("pickup_request", (request) => {
      console.log("Received pickup request:", request);
      socket.broadcast.emit("pickup_request", request);
    });

    socket.on("pickup_accepted", (request) => {
      console.log("Pickup request accepted:", request);
      io.emit("pickup_accepted", request);
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on("chat_message", ({ roomId, message }) => {
      io.to(roomId).emit("chat_message", message);
    });

    socket.on("disconnect", () => {
      // Remove disconnected shuttle's location
      for (const [shuttleId, data] of shuttleLocations.entries()) {
        if (data.socketId === socket.id) {
          shuttleLocations.delete(shuttleId);
          io.emit("shuttle_disconnected", { shuttleId });
          break;
        }
      }
    });
  });
};

export default setupSocket;
