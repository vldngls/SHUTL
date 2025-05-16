import express from "express";
import { submitIssue } from "../controllers/issueController.js";

const router = express.Router();

// Route for submitting issue reports
router.post("/submit", submitIssue);

export default router; 