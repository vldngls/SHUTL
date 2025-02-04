import express from "express";
import {
  assignShuttle,
  getAllAssignments,
  updateAssignment,
  deleteAssignment,
  getDriverAssignment,
} from "../controllers/shuttleAssignmentController.js";
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/assign", assignShuttle);
router.get("/assignments", getAllAssignments);
router.put("/assign/:id", updateAssignment);
router.delete("/assign/:id", deleteAssignment);
router.get('/driver', authMiddleware, getDriverAssignment);

export default router;
