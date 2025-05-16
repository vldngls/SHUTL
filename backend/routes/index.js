import express from "express";
import shuttleTripRoutes from "./shuttleTripRoutes.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import issueRoutes from './issueRoutes';

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

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/tellers', tellerRoutes);
router.use('/suggestions', suggestionRoutes);
router.use('/issues', issueRoutes);

export default router;
