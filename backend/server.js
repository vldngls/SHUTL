// backend/server.js
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import fareRoutes from "./routes/fareRoutes.js";
import userDataRoutes from "./routes/userDataRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import shuttleRoutes from "./routes/shuttleRoutes.js";
import shuttleDetailsRoutes from "./routes/shuttleDetailsRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tellerRoutes from "./routes/tellerRoutes.js";
import shuttleAssignmentRoutes from "./routes/shuttleAssignmentRoutes.js";
import fareTransactionRoutes from "./routes/fareTransactionRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import onfieldShuttleRoutes from "./routes/onfieldShuttleRoutes.js";
import setupSocket from "./socketHandler.js";
import driverProfileRoutes from "./routes/driverProfileRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import operationalHoursRoutes from "./routes/operationalHoursRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import routeRoutes from "./routes/routesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import shuttleTripRoutes from "./routes/shuttleTripRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error(
    "MongoDB connection string (MONGO_URI) is missing in .env file"
  );
  process.exit(1);
}

// Initialize global shuttleLocations object
global.shuttleLocations = {};

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers"
    ],
    exposedHeaders: ["Set-Cookie"]
  })
);

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/userdata", userDataRoutes);
app.use("/api/shuttle", shuttleRoutes);
app.use("/api/shuttle-details", shuttleDetailsRoutes);
app.use("/api/fares", fareRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/teller", tellerRoutes);
app.use("/api/shuttle-assignments", shuttleAssignmentRoutes);
app.use("/api/fare-transactions", fareTransactionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/userdatas", userDataRoutes);
app.use("/api/onfieldshuttles", onfieldShuttleRoutes);
app.use("/api/driver-profiles", driverProfileRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/operational-hours", operationalHoursRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shuttle-trips", shuttleTripRoutes);
app.use("/api/issues", issueRoutes);
app.get("/api", (req, res) => {
  res.json({ message: "API is working!" });
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

connectDB();

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://192.168.254.106:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    transports: ["websocket", "polling"],
  },
  cookie: {
    name: "token",
    httpOnly: true,
    sameSite: "none",
    secure: true
  },
});

setupSocket(io);

export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Access the server at http://localhost:${PORT} or your local IP address`
  );
});
