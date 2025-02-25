import express from "express";
import {
  getOperationalHours,
  updateOperationalHours,
} from "../controllers/operationalHoursController.js";

const router = express.Router();

router.get("/", getOperationalHours);
router.post("/", updateOperationalHours);

export default router;
