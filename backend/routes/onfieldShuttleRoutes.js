import express from 'express';
import { getOnfieldShuttles } from '../controllers/onfieldShuttleController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get('/', authenticateToken, getOnfieldShuttles);

export default router; 