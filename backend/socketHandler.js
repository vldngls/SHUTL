const setupSocket = (io) => {
  const shuttleLocations = new Map();
  const activePickupRequests = new Map(); // Store active pickup requests

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
      const requestId = Date.now().toString(); // Generate unique ID
      activePickupRequests.set(requestId, {
        ...request,
        requestId,
        status: 'pending'
      });
      // Broadcast to all drivers
      io.emit("pickup_request", {
        ...request,
        requestId
      });
    });

    socket.on("pickup_accepted", (request) => {
      console.log("Pickup request accepted:", request);
      const pickupRequest = activePickupRequests.get(request.requestId);
      if (pickupRequest) {
        activePickupRequests.set(request.requestId, {
          ...pickupRequest,
          status: 'accepted',
          driverId: socket.id
        });
        // Notify all clients that this request is taken
        io.emit("pickup_request_taken", request.requestId);
      }
    });

    socket.on("pickup_completed", (requestId) => {
      activePickupRequests.delete(requestId);
      io.emit("pickup_completed", requestId);
    });

    socket.on("pickup_cancelled", (requestId) => {
      activePickupRequests.delete(requestId);
      io.emit("pickup_cancelled", requestId);
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
