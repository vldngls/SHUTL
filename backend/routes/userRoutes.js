import express from "express";
import {
  registerUser,
  loginUser,
  getUserCount,
  getAllUsers,
  getAllDrivers,
  getUsers,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/admin/user-count", getUserCount);
router.get("/admin/users", getAllUsers);
router.get("/drivers", getAllDrivers);
router.get("/", getUsers);

// New route to get current user's userType based on JWT
router.get("/me", authenticateToken, (req, res) => {
  res.json({ userType: req.user.userType });
});

export default router;
