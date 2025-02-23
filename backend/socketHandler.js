import User from "./models/user.model.js"; // Import User model

const setupSocket = (io) => {
  const shuttleLocations = new Map();
  const activePickupRequests = new Map(); // Store active pickup requests

  io.on("connection", async (socket) => {
    // SHUTL-Leb: User connection and status update
    console.log("✅ User connected:", socket.id);
    const userId = socket.handshake.query.userId;
    console.log(`🔍 Retrieved userId from handshake: ${userId}`);

    if (!userId) {
      console.error("❌ No userId provided in WebSocket connection.");
      return;
    }
    socket.userId = userId; // Store user ID in socket session

    try {
      await User.findByIdAndUpdate(userId, {
        status: "active",
        last_active: new Date(),
      });
      console.log(`✅ Updated user ${userId} to active`);
      io.emit("status_update", { userId, status: "active" });
    } catch (err) {
      console.error("❌ Error updating user status:", err);
    }

    // HEAD: Shuttle tracking - join room for shuttle tracking
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

    // Merge shuttle_location event handlers
    socket.on("shuttle_location", (data) => {
      // HEAD branch functionality: update location and broadcast to all
      const { shuttleId, coordinates, timestamp } = data;
      shuttleLocations.set(shuttleId, {
        coordinates,
        timestamp,
        socketId: socket.id,
      });
      io.emit("shuttle_location", { shuttleId, coordinates, timestamp });

      // SHUTL-Leb branch functionality: log and broadcast (except sender)
      console.log("📍 Received shuttle location:", data);
      socket.broadcast.emit("shuttle_location", data);
    });

    // Messaging system (from HEAD)
    socket.on("message", (msg) => {
      console.log("💬 Message received:", msg);
      io.emit("message", msg);
    });

    // Merge pickup_request event handlers
    socket.on("pickup_request", (request) => {
      // HEAD branch functionality: store and broadcast with a generated requestId
      console.log("Received pickup request:", request);
      const requestId = Date.now().toString(); // Generate unique ID
      activePickupRequests.set(requestId, {
        ...request,
        requestId,
        status: "pending",
      });
      io.emit("pickup_request", {
        ...request,
        requestId,
      });

      // SHUTL-Leb branch functionality: log and broadcast to others
      console.log("🚖 Received pickup request:", request);
      socket.broadcast.emit("pickup_request", request);
    });

    // Merge pickup_accepted event handlers
    socket.on("pickup_accepted", (request) => {
      // HEAD branch functionality: update request status and notify all clients
      console.log("Pickup request accepted:", request);
      const pickupRequest = activePickupRequests.get(request.requestId);
      if (pickupRequest) {
        activePickupRequests.set(request.requestId, {
          ...pickupRequest,
          status: "accepted",
          driverId: socket.id,
        });
        io.emit("pickup_request_taken", request.requestId);
      }

      // SHUTL-Leb branch functionality: log and emit accepted event
      console.log("✅ Pickup request accepted:", request);
      io.emit("pickup_accepted", request);
    });

    // HEAD branch additional pickup events
    socket.on("pickup_completed", (requestId) => {
      activePickupRequests.delete(requestId);
      io.emit("pickup_completed", requestId);
    });

    socket.on("pickup_cancelled", (requestId) => {
      activePickupRequests.delete(requestId);
      io.emit("pickup_cancelled", requestId);
    });

    // Room Management (Chat or Shuttle Groups)
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      console.log(`✅ Socket ${socket.id} left room ${roomId}`);
    });

    // Chat Messaging within Rooms
    socket.on("chat_message", ({ roomId, message }) => {
      io.to(roomId).emit("chat_message", message);
    });

    // SHUTL-Leb: User Status Updates (Commuters & Drivers/Tellers)
    socket.on("set_status", async ({ userId, status, duty_status }) => {
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      try {
        await User.findByIdAndUpdate(userId, {
          status,
          duty_status,
          last_active: new Date(),
        });
        io.emit("status_update", { userId, status, duty_status });
      } catch (err) {
        console.error("❌ Error updating user status:", err);
      }
    });

    // Merge disconnect events
    socket.on("disconnect", async () => {
      // HEAD branch functionality: remove shuttle location if this socket was tracking it
      for (const [shuttleId, data] of shuttleLocations.entries()) {
        if (data.socketId === socket.id) {
          shuttleLocations.delete(shuttleId);
          io.emit("shuttle_disconnected", { shuttleId });
          break;
        }
      }

      // SHUTL-Leb branch functionality: update user status to idle upon disconnect
      console.log(
        `🔴 User disconnected: ${socket.id}, userId: ${socket.userId}`
      );
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            status: "idle",
            last_active: new Date(),
          });
          console.log(`✅ Updated user ${socket.userId} to idle`);
          io.emit("status_update", { userId: socket.userId, status: "idle" });
        } catch (err) {
          console.error("❌ Error updating disconnect status:", err);
        }
      }
    });
  });
};

export default setupSocket;
