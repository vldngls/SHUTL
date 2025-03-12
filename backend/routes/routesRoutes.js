// routes/routes.routes.js
import express from "express";
import {
  createRoute,
  getRoutes,
  assignShuttleToRoute,
  deleteRoute
} from "../controllers/routesController.js";

const router = express.Router();

// Create a new route
router.post("/", createRoute);

// Get all routes
router.get("/", getRoutes);

// Assign a shuttle to a route
router.put("/:routeId/assign-shuttle", assignShuttleToRoute);

// Delete a route
router.delete("/:routeId", deleteRoute);

export default router;
