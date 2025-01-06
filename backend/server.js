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
import tellerRoutes from './routes/tellerRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.MONGO_URI) {
  console.error('MongoDB connection string (MONGO_URI) is missing in .env file');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use('/api/users', userRoutes);
app.use('/api/userdata', userDataRoutes);
app.use('/api/shuttle', shuttleRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes); // Include notification routes
app.use('/api/teller', tellerRoutes); // Include teller profile routes

connectDB();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Restoring shuttle location broadcasting functionality
  socket.on('shuttle_location', (data) => {
    console.log('Received shuttle location:', data);
    // Broadcast to all connected clients except sender
    socket.broadcast.emit('shuttle_location', data);
  });

  // New: Real-time messaging
  socket.on('message', (msg) => {
    console.log('Message received:', msg);
    // Broadcast message to all connected clients
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
