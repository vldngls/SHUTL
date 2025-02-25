import express from "express";
import {
  submitSuggestion,
  getAllSuggestions,
  updateSuggestionStatus,
} from "../controllers/suggestionController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

// Submit a new suggestion
router.post("/submit", submitSuggestion);

// Get all suggestions (protected route)
router.get("/", authenticateToken, getAllSuggestions);

// Update suggestion status (protected route)
router.patch("/:id/status", authenticateToken, updateSuggestionStatus);

export default router;
