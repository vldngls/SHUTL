import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js'; // Import the user routes

dotenv.config();

const app = express();

// Middleware to parse JSON data
app.use(express.json());

// Set up the user routes
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000");
});
