// backend/server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

import connectDB from './config/db.js';
import fareRoutes from './routes/fareRoutes.js';
import userDataRoutes from './routes/userDataRoutes.js';
import userRoutes from './routes/userRoutes.js';
import shuttleRoutes from './routes/shuttleRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import tellerRoutes from './routes/tellerRoutes.js'; // Import teller routes

// Set up __dirname and load environment variables from root-level .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.MONGO_URI) {
  console.error('MongoDB connection string (MONGO_URI) is missing in .env file');
  process.exit(1);
}

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create an HTTP server for Socket.io

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', // Default to localhost for dev
  credentials: true,
}));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/userdata', userDataRoutes);
app.use('/api/shuttle', shuttleRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes); // Include notification routes
app.use('/api/teller', tellerRoutes); // Include teller profile routes

// Connect to the database
connectDB();

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// Handle client connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Export io to use it in other modules (optional, if needed)
export { io };

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
