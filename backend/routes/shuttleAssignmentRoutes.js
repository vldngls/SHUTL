import express from "express";
import {
  getAllAssignments,
  getDriverAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/shuttleAssignmentController.js";
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get("/", authenticateToken, getAllAssignments);
router.get("/driver", authenticateToken, getDriverAssignment);
router.post("/", authenticateToken, createAssignment);
router.put("/:id", authenticateToken, updateAssignment);
router.delete("/:id", authenticateToken, deleteAssignment);

export default router;
