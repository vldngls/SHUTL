import express from "express";
import {
  createFareTransaction,
  getTransactionsByShuttleID,
} from "../controllers/fareTransactionController.js";

const router = express.Router();

// Route to create a new fare transaction
router.post("/", createFareTransaction);

// Route to get transactions by shuttleID
router.get("/", getTransactionsByShuttleID);

export default router;
