import express from 'express';
import maintenanceController from '../controllers/maintenanceController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import User from '../models/user.model.js';

const router = express.Router();

// Debug logging for route registration
console.log('Registering maintenance routes...');

// Debug route to check user
router.get('/debug/check-user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    console.log('Debug - Looking for user:', req.params.id);
    console.log('Debug - User found:', user ? 'Yes' : 'No');
    if (user) {
      res.json({
        found: true,
        userType: user.userType,
        email: user.email
      });
    } else {
      res.json({
        found: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Debug - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All maintenance routes require authentication and admin privileges
router.use(authenticateToken, isAdmin);

// System health metrics
router.get('/health', maintenanceController.getSystemHealth);

// System backup
router.post('/backup', maintenanceController.backupSystem);

// Cache management
router.post('/cache/clear', maintenanceController.clearCache);

// Database optimization
router.post('/database/optimize', maintenanceController.optimizeDatabase);

// System updates
router.get('/updates', maintenanceController.checkUpdates);

// API statistics
router.get('/stats', maintenanceController.getApiStats);

// Maintenance logs
router.get('/logs', maintenanceController.getLogs);

// User stats
router.get('/users/stats', maintenanceController.getUserStats);

console.log('Maintenance routes registered successfully');

export default router; 