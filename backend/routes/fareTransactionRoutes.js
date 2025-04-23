import express from "express";
import {
  createFareTransaction,
  getFareTransactions,
  getFareTransactionsByShuttleId,
  getFareTransactionsByDateRange,
  getFareTransactionsByCommuterEmail,
  getTotalEarnings
} from "../controllers/fareTransactionController.js";
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new fare transaction
router.post("/", createFareTransaction);

// Get all fare transactions
router.get("/", getFareTransactions);

// Get fare transactions by shuttle ID
router.get("/shuttle/:shuttleId", getFareTransactionsByShuttleId);

// Get fare transactions by date range
router.get("/date-range", getFareTransactionsByDateRange);

// Get fare transactions for the authenticated commuter
router.get("/me", authMiddleware, getFareTransactionsByCommuterEmail);

// Get total earnings
router.get("/earnings", getTotalEarnings);

export default router;
