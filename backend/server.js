import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.listen(5000, () => {
    connectDB();
    console.log("Server started at http://localhost:5000");
});
