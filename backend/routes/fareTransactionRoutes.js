import express from "express";
import {
  createFareTransaction,
  getTransactionsByShuttleID,
  getTransactionsByCommuterEmail,
} from "../controllers/fareTransactionController.js";

const router = express.Router();

// Route to create a new fare transaction
router.post("/", createFareTransaction);

// Route to get transactions by shuttleID
router.get("/", getTransactionsByShuttleID);

// Route to get transactions by commuter email
router.get("/commuter", getTransactionsByCommuterEmail);

export default router;
