import express from "express";
import {
  createFareTransaction,
  getFareTransactions,
  getFareTransactionsByShuttleId,
  getFareTransactionsByDateRange,
  getFareTransactionsByCommuterEmail,
} from "../controllers/fareTransactionController.js";

const router = express.Router();

// Create a new fare transaction
router.post("/", createFareTransaction);

// Get all fare transactions
router.get("/", getFareTransactions);

// Get fare transactions by shuttle ID
router.get("/shuttle/:shuttleId", getFareTransactionsByShuttleId);

// Get fare transactions by date range
router.get("/date-range", getFareTransactionsByDateRange);

// Get fare transactions by commuter email
router.get("/commuter/:email", getFareTransactionsByCommuterEmail);

export default router;
