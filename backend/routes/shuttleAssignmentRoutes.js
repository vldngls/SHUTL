import express from "express";
import {
  assignShuttle,
  getAllAssignments,
  updateAssignment,
  deleteAssignment,
} from "../controllers/shuttleAssignmentController.js";

const router = express.Router();

router.post("/assign", assignShuttle);
router.get("/assignments", getAllAssignments);
router.put("/assign/:id", updateAssignment);
router.delete("/assign/:id", deleteAssignment);

export default router;
