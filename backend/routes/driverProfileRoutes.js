import express from "express";
import {
  getDriverProfile,
  updateDriverProfile,
  uploadProfileImage,
} from "../controllers/driverProfileController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authenticateToken, getDriverProfile);
router.put("/me", authenticateToken, updateDriverProfile);
router.post("/upload-image", authenticateToken, uploadProfileImage);

export default router;
