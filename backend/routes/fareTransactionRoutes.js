import express from "express";
import {
  createFareTransaction,
  getTransactionsByShuttleID,
  getTransactionsByCommuterEmail,
  getTotalEarnings,
} from "../controllers/fareTransactionController.js";

const router = express.Router();

// Route to create a new fare transaction
router.post("/", createFareTransaction);

// Route to get transactions by shuttleID
router.get("/", getTransactionsByShuttleID);

// Route to get transactions by commuter email
router.get("/commuter", getTransactionsByCommuterEmail);

// Route to get total earnings
router.get("/earnings", getTotalEarnings);

export default router;
