import express from "express";
import {
  saveUserData,
  getAllUserData,
  getUserDataByEmail,
  updateUserDataByEmail,
  getUserDataFromToken,
  getUserData,
  createUserData,
  updateUserData,
} from "../controllers/userDataController.js";
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Route to save user data
router.post("/save", saveUserData);

// Route to get all user data
router.get("/all", getAllUserData);

// Route to get user data by email using query parameters
router.get("/find", getUserDataByEmail);

// Route to update user data
router.put("/update", authMiddleware, updateUserDataByEmail);

// Route to get user data based on JWT token
router.get("/me", authMiddleware, getUserDataFromToken);

router.get('/', authenticateToken, getUserData);
router.post('/', authenticateToken, createUserData);
router.put('/', authenticateToken, updateUserData);

export default router;
