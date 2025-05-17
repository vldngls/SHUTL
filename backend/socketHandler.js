import jwt from "jsonwebtoken"; // Import jwt to decode the token
import User from "./models/user.model.js"; // Import User model
import ShuttleTrip from "./models/shuttleTrip.model.js"; // Import ShuttleTrip model
import Notification from "./models/notification.model.js"; // Import Notification model

const setupSocket = (io, db) => {
  const shuttleLocations = new Map();
  const activePickupRequests = new Map(); // Store active pickup requests

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user authentication and status updates
    const handleUserAuth = async () => {
      // Check for token in both cookies and auth object
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.cookie
                    ?.split("; ")
                    .find((row) => row.startsWith("token="))
                    ?.split("=")[1];

      if (!token) {
        console.error("No token provided in WebSocket connection");
        socket.disconnect(true); // Force disconnect if no token
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        
        if (user) {
          socket.userId = user._id.toString();
          socket.userEmail = decoded.email;
          socket.userType = socket.handshake.auth.userType || user.userType;
          
          // Join the user's type room for notifications
          socket.join(socket.userType);
          
          await User.findByIdAndUpdate(socket.userId, {
            status: "active",
            last_active: new Date(),
          });
          io.emit("status_update", { userId: socket.userId, status: "active" });
          
          // Acknowledge successful authentication
          socket.emit("auth_success", { userId: socket.userId, userType: socket.userType });
        } else {
          console.error("No user found with the provided email");
          socket.disconnect(true);
          return;
        }
      } catch (err) {
        console.error("Error in user authentication:", err.message);
        socket.disconnect(true);
        return;
      }
    };

    // Initialize user authentication
    handleUserAuth().catch((err) => {
      console.error("Error in user authentication:", err.message);
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
          metadata: currentLocation.metadata,
        });
      }
    });

    socket.on("shuttle_location", (data) => {
      const {
        shuttleId,
        coordinates,
        timestamp,
        speed,
        heading,
        accuracy,
        streetName,
      } = data;

      // Create metadata object with all additional properties
      const metadata = {
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy,
        streetName: streetName,
      };

      // Store the location with metadata
      shuttleLocations.set(shuttleId, {
        coordinates,
        timestamp,
        metadata,
        socketId: socket.id,
      });

      // Update global shuttleLocations object for API access
      if (!global.shuttleLocations) {
        global.shuttleLocations = {};
      }

      global.shuttleLocations[shuttleId] = {
        coordinates,
        timestamp,
        lastUpdate: new Date(),
        metadata,
        socketId: socket.id,
      };

      // Broadcast to all clients tracking this shuttle
      io.to(`shuttle_${shuttleId}`).emit("shuttle_location", {
        shuttleId,
        coordinates,
        timestamp,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy,
      });

      // Also broadcast to all ShutlLoggedIn clients
      io.emit("shuttle_location_update", {
        shuttleId,
        coordinates,
        timestamp,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy,
      });
    });

    // Chat Messaging within Rooms
    socket.on("chat_message", ({ roomId, message }) => {
      io.to(roomId).emit("chat_message", message);
    });

    // Handle messages from the client
    socket.on("message", async (messageData) => {
      console.log("💬 Message received:", messageData);

      try {
        // Extract roomId from the message data
        const { roomId, ...messageWithoutRoomId } = messageData;

        // Broadcast the message to all clients in the room
        io.to(roomId).emit("message", messageWithoutRoomId);

        // No need to save to database here as it's already done via HTTP endpoint
      } catch (error) {
        console.error("Error handling message:", error);
      }
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

    // Handle trip creation
    socket.on("create_trip", async (tripData) => {
      console.log("🚌 Creating new trip:", tripData);
      try {
        // Create a new trip in the database
        const newTrip = await ShuttleTrip.create(tripData);
        console.log("✅ Trip created successfully:", newTrip);
        
        // Emit success event back to the client
        socket.emit("trip_created", { success: true, trip: newTrip });
        
        // Broadcast to all clients that a new trip was created
        io.emit("trip_update", { type: "created", trip: newTrip });
      } catch (error) {
        console.error("❌ Error creating trip:", error);
        socket.emit("trip_created", { 
          success: false, 
          error: error.message || "Failed to create trip" 
        });
      }
    });

    // Handle notifications from drivers
    socket.on("send_notification", async (data) => {
      try {
        // Save the notification to the database without a sender
        const notification = new Notification({
          message: data.message,
          recipientType: data.recipientType
        });
        await notification.save();

        // Create notification data with required fields
        const notificationData = {
          message: data.message,
          recipientType: data.recipientType,
          createdAt: notification.createdAt.toISOString(),
          timestamp: Date.now()
        };
        
        // Emit to specific room based on recipient type
        if (data.recipientType === "All") {
          // Broadcast to all connected clients
          io.emit("new_notification", notificationData);
        } else {
          // Emit to specific user type room
          io.to(data.recipientType).emit("new_notification", notificationData);
        }

        // Log notification delivery for debugging
        console.log(`Notification sent to recipients of type ${data.recipientType}`);
      } catch (error) {
        console.error("Error handling notification:", error.message);
      }
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      console.log(`✅ Socket ${socket.id} left room ${roomId}`);
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

          // Also remove from global shuttleLocations
          if (global.shuttleLocations && global.shuttleLocations[shuttleId]) {
            delete global.shuttleLocations[shuttleId];
          }

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
