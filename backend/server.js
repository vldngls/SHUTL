// server.js

import express from 'express';
import cookieParser from 'cookie-parser';
import './config/env.js'; // Load environment variables
import connectDB from './config/db.js';
import cors from 'cors'; // Ensure this is imported correctly
import fareRoutes from './routes/fareRoutes.js';
import userDataRoutes from './routes/userDataRoutes.js';
import userRoutes from './routes/userRoutes.js';
import shuttleRoutes from './routes/shuttleRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js'; // Import schedule routes

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors()); // Call cors as a function

// Routes
app.use('/api/users', userRoutes);
app.use('/api/userdata', userDataRoutes);
app.use('/api/shuttle', shuttleRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/schedule', scheduleRoutes); // Add schedule routes

// Connect to the database
connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
