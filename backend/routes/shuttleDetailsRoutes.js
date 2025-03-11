// routes/shuttleDetails.routes.js
import express from "express";
import {
  createShuttle,
  getShuttles,
  updateShuttle,
  deleteShuttle,
} from "../controllers/shuttleDetailsController.js";

const router = express.Router();

// Create a new shuttle
router.post("/shuttles", createShuttle);

// Get all shuttles (supports pagination)
router.get("/shuttles", getShuttles);

// Update a shuttle by shuttleId
router.put("/shuttles/:shuttleId", updateShuttle);

// Delete a shuttle by shuttleId
router.delete("/shuttles/:shuttleId", deleteShuttle);

export default router;
