import express from "express";
import { submitIssue } from "../controllers/issueController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Route for submitting issue reports
router.post("/submit", authenticateToken, submitIssue);

export default router; 