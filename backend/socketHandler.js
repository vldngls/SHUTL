const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("shuttle_location", (data) => {
      console.log("Received shuttle location:", data);
      socket.broadcast.emit("shuttle_location", data);
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
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export default setupSocket; 