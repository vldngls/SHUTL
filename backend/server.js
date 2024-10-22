import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import userDataRoutes from './routes/userDataRoutes.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js'; // Ensure correct path

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',  // Replace with your frontend's origin
  credentials: true,  // Allow credentials (cookies) to be sent with requests
};

app.use(cors(corsOptions));

app.use('/api/users', userRoutes);  // Ensure this is correct

// Routes
app.use('/api/userdata', userDataRoutes);  // Make sure this is added correctly

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
