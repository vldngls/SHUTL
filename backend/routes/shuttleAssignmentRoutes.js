import express from "express";
import {
  getAllAssignments,
  getDriverAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/shuttleAssignmentController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

// Add error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/", authenticateToken, asyncHandler(getAllAssignments));
router.get("/driver", authenticateToken, asyncHandler(getDriverAssignment));
router.post("/", authenticateToken, asyncHandler(createAssignment));
router.put("/:id", authenticateToken, asyncHandler(updateAssignment));
router.delete("/:id", authenticateToken, asyncHandler(deleteAssignment));

export default router;
