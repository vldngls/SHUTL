import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

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
