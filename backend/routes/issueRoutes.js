import express from "express";
import { submitIssue } from "../controllers/issueController.js";
import { authenticateToken } from "../middleware/auth.js";
import Issue from "../models/issue.model.js";

const router = express.Router();

// Route for submitting issue reports
router.post("/submit", authenticateToken, submitIssue);

// Route for getting all issues
router.get("/", authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: error.message });
  }
});

// Route for updating issue status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "resolved", "unresolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 