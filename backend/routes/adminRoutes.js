import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

export default router; 