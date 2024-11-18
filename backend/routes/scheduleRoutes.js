// routes/scheduleRoutes.js

import express from "express";
import {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

// Route to create a new schedule entry
router.post("/", createSchedule); // Assuming the body contains an array of schedules

// Route to get all schedule entries
router.get("/", getAllSchedules);

// Route to get a specific schedule entry by ID (if you choose to implement IDs)
router.get("/:id", getScheduleById);

// Route to update a schedule entry by ID
router.put("/:id", updateSchedule);

// Route to delete a schedule entry by ID
router.delete("/:id", deleteSchedule);

export default router;
