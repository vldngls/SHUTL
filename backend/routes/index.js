import express from "express";
import shuttleTripRoutes from "./shuttleTripRoutes.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Register shuttle trips routes
router.use("/shuttle-trips", shuttleTripRoutes);

// Example route definitions
router.get("/shuttle/stats", authenticateToken, getShuttleStats);
router.get(
  "/users/active-users",
  authenticateToken,
  authorizeRoles("Admin", "Teller"),
  getActiveUsers
);
router.post(
  "/notifications/send",
  authenticateToken,
  authorizeRoles("Admin"),
  sendNotification
);

export default router;
