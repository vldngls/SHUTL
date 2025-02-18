import User from "./models/user.model.js"; // Import User model

const setupSocket = (io) => {
  io.on("connection", async (socket) => {
    console.log("✅ User connected:", socket.id);

    // Retrieve userId properly
    const userId = socket.handshake.query.userId;
    console.log(`🔍 Retrieved userId from handshake: ${userId}`);

    if (!userId) {
      console.error("❌ No userId provided in WebSocket connection.");
      return;
    }

    socket.userId = userId; // Store user ID in socket session

    // ✅ Update user status to active
    try {
      await User.findByIdAndUpdate(userId, { status: "active", last_active: new Date() });
      console.log(`✅ Updated user ${userId} to active`);
      io.emit("status_update", { userId, status: "active" });
    } catch (err) {
      console.error("❌ Error updating user status:", err);
    }

    // ✅ Shuttle Location Tracking
    socket.on("shuttle_location", (data) => {
      console.log("📍 Received shuttle location:", data);
      socket.broadcast.emit("shuttle_location", data);
    });

    // ✅ Messaging System
    socket.on("message", (msg) => {
      console.log("💬 Message received:", msg);
      io.emit("message", msg);
    });

    // ✅ Pickup Requests
    socket.on("pickup_request", (request) => {
      console.log("🚖 Received pickup request:", request);
      socket.broadcast.emit("pickup_request", request);
    });

    socket.on("pickup_accepted", (request) => {
      console.log("✅ Pickup request accepted:", request);
      io.emit("pickup_accepted", request);
    });

    // ✅ Room Management (Chat or Shuttle Groups)
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      console.log(`✅ Socket ${socket.id} left room ${roomId}`);
    });

    // ✅ Chat Messaging within Rooms
    socket.on("chat_message", ({ roomId, message }) => {
      io.to(roomId).emit("chat_message", message);
    });

    // ✅ User Status Updates (Commuters & Drivers/Tellers)
    socket.on("set_status", async ({ userId, status, duty_status }) => {
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      try {
        await User.findByIdAndUpdate(userId, { status, duty_status, last_active: new Date() });
        io.emit("status_update", { userId, status, duty_status });
      } catch (err) {
        console.error("❌ Error updating user status:", err);
      }
    });

    // ✅ Handle Disconnections - Set Users as Idle
    socket.on("disconnect", async () => {
      console.log(`🔴 User disconnected: ${socket.id}, userId: ${socket.userId}`);
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, { status: "idle", last_active: new Date() });
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
