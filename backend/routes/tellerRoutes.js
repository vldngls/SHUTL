import express from 'express';
import {
  createOrUpdateTellerProfile,
  fetchTellerProfileByEmail,
} from '../controllers/tellerProfileController.js';

const router = express.Router();

// POST - Create or Update Teller Profile
router.post('/', createOrUpdateTellerProfile);

// GET - Fetch Teller Profile by Email
router.get('/:email', fetchTellerProfileByEmail);

export default router;
