import express from "express";

import {
  createOrUpdateTellerProfile,
  fetchTellerProfileByEmail,
  fetchAllTellers, 
  deleteTellerProfile,
} from "../controllers/tellerProfileController.js";

const router = express.Router();

// POST - Create or Update Teller Profile
router.post("/", createOrUpdateTellerProfile);

// GET - Fetch All Teller Profiles
router.get("/", fetchAllTellers); // Add this route

// GET - Fetch Teller Profile by Email
router.get("/:email", fetchTellerProfileByEmail);

router.delete("/:id", deleteTellerProfile);


export default router;
