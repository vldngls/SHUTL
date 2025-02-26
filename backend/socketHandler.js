import jwt from "jsonwebtoken"; // Import jwt to decode the token
import User from "./models/user.model.js"; // Import User model

const setupSocket = (io, db) => {
  const shuttleLocations = new Map();
  const activePickupRequests = new Map(); // Store active pickup requests

  io.on("connection", (socket) => {
    // SHUTL-Leb: User connection and status update
    console.log("✅ User connected:", socket.id);
    let userId = socket.handshake.query.userId;
    console.log(`🔍 Retrieved userId from handshake: ${userId}`);

    // Handle user authentication and status updates
    const handleUserAuth = async () => {
      if (!userId) {
        const token = socket.handshake.headers.cookie
          ?.split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const cursor = db
              .collection("users")
              .find({ email: decoded.email });
            const user = await cursor.next();

            if (user) {
              userId = user._id.toString();
              socket.userId = userId; // Store user ID in socket session
              console.log(`🔍 Retrieved userId from email: ${userId}`);
            } else {
              console.error("❌ No user found with the provided email.");
              return;
            }
          } catch (err) {
            console.error("❌ Error decoding token or finding user:", err);
            return;
          }
        } else {
          console.error("❌ No token provided in WebSocket connection.");
          return;
        }
      } else {
        socket.userId = userId; // Store user ID in socket session
      }

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
    };

    // Initialize user authentication
    handleUserAuth().catch((err) => {
      console.error("Error in user authentication:", err);
    });

    // HEAD: Shuttle tracking - join room for shuttle tracking
    socket.on("join_shuttle_tracking", (shuttleId) => {
      const roomName = `shuttle_${shuttleId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined ${roomName}`);

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
      console.log("📍 Received shuttle location:", data);

      // Store the location
      shuttleLocations.set(shuttleId, {
        coordinates,
        timestamp,
        socketId: socket.id,
      });

      // Broadcast to all clients tracking this shuttle
      io.to(`shuttle_${shuttleId}`).emit("shuttle_location", {
        shuttleId,
        coordinates,
        timestamp,
      });

      // Also broadcast to all ShutlLoggedIn clients
      io.emit("shuttle_location_update", {
        shuttleId,
        coordinates,
        timestamp,
      });
    });

    // Messaging system (from HEAD)
    socket.on("message", (msg) => {
      console.log("💬 Message received:", msg);
      io.emit("message", msg);
    });

    // Pickup requests
    socket.on("pickup_request", (request) => {
      console.log("🚖 Received pickup request:", request);
      // Check if a similar request already exists
      const isDuplicate = Array.from(activePickupRequests.values()).some(
        (existing) =>
          existing.shuttleId === request.shuttleId &&
          existing.status === "pending" &&
          Date.now() - new Date(existing.timestamp).getTime() < 5000 // Within 5 seconds
      );

      if (!isDuplicate) {
        const requestId = Date.now().toString();
        const enhancedRequest = {
          ...request,
          requestId,
          status: "pending",
          timestamp: new Date().toISOString(),
        };
        activePickupRequests.set(requestId, enhancedRequest);

        // Emit to all connected clients instead of just the shuttle room
        io.emit("pickup_request", enhancedRequest);
        console.log(
          "📢 Emitted pickup request to all clients:",
          enhancedRequest
        );
      } else {
        console.log("🚫 Duplicate pickup request ignored");
      }
    });

    // Merge pickup_accepted event handlers
    socket.on("pickup_accepted", (request) => {
      console.log("✅ Pickup request accepted:", request);
      const pickupRequest = activePickupRequests.get(request.requestId);
      if (pickupRequest && pickupRequest.status === "pending") {
        const updatedRequest = {
          ...pickupRequest,
          status: "accepted",
          driverId: socket.id,
        };
        activePickupRequests.set(request.requestId, updatedRequest);
        io.emit("pickup_request_taken", request.requestId);
        io.emit("pickup_accepted", updatedRequest);
      }
    });

    // HEAD branch additional pickup events
    socket.on("pickup_completed", (requestId) => {
      if (activePickupRequests.has(requestId)) {
        activePickupRequests.delete(requestId);
        io.emit("pickup_completed", requestId);
      }
    });

    socket.on("pickup_cancelled", (requestId) => {
      if (activePickupRequests.has(requestId)) {
        activePickupRequests.delete(requestId);
        io.emit("pickup_cancelled", requestId);
      }
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
      console.log("User disconnected:", socket.id);

      // Remove shuttle locations for this socket
      for (const [shuttleId, data] of shuttleLocations.entries()) {
        if (data.socketId === socket.id) {
          shuttleLocations.delete(shuttleId);
          io.emit("shuttle_disconnected", { shuttleId });
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

    // Add these handlers
    socket.on("check_room", (room, callback) => {
      const isInRoom = socket.rooms.has(room);
      callback({ inRoom: isInRoom, room, socketId: socket.id });
    });

    socket.on("list_rooms", (callback) => {
      const rooms = Array.from(socket.rooms);
      callback(rooms);
    });
  });
};

export default setupSocket;
