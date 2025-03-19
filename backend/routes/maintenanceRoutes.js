import express from "express";
import maintenanceController from "../controllers/maintenanceController.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import User from "../models/user.model.js";
import { getLoginHistory } from "../controllers/userController.js";
import MaintenanceSettings from '../models/maintenanceSettings.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';

const router = express.Router();

// Debug route to check user
router.get("/debug/check-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    console.log("Debug - Looking for user:", req.params.id);
    console.log("Debug - User found:", user ? "Yes" : "No");
    if (user) {
      res.json({
        found: true,
        userType: user.userType,
        email: user.email,
      });
    } else {
      res.json({
        found: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Debug - Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance mode status (public route)
router.get('/maintenance/status', async (req, res) => {
  try {
    const settings = await MaintenanceSettings.getSettings();
    res.json({
      enabled: settings.isEnabled,
      message: settings.message,
      lastUpdated: settings.lastUpdated
    });
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    res.status(500).json({ message: 'Error getting maintenance status' });
  }
});

// All maintenance routes require authentication and admin privileges
router.use(authenticateToken, isAdmin);

// Login History
router.get("/login-history", getLoginHistory);

// System health metrics
router.get("/health", maintenanceController.getSystemHealth);

// System backup
router.post("/backup", maintenanceController.backupSystem);

// Cache management
router.post("/cache/clear", maintenanceController.clearCache);

// Database optimization
router.post("/database/optimize", maintenanceController.optimizeDatabase);

// System updates
router.get("/updates", maintenanceController.checkUpdates);

// API statistics
router.get("/stats", maintenanceController.getApiStats);

// Maintenance logs
router.get("/logs", maintenanceController.getLogs);

// Create maintenance log
router.post("/logs/create", maintenanceController.createLog);

// User stats
router.get("/users/stats", maintenanceController.getUserStats);

// Toggle maintenance mode (admin only)
router.post('/maintenance/toggle', async (req, res) => {
  try {
    const { enabled, message } = req.body;
    const settings = await MaintenanceSettings.getSettings();
    
    settings.isEnabled = enabled;
    if (message) {
      settings.message = message;
    }
    settings.lastUpdated = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();

    res.json({
      enabled: settings.isEnabled,
      message: settings.message,
      lastUpdated: settings.lastUpdated
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ message: 'Error toggling maintenance mode' });
  }
});

// Get maintenance logs (admin only)
router.get('/maintenance/logs', async (req, res) => {
  try {
    const settings = await MaintenanceSettings.findOne()
      .populate('updatedBy', 'name email');
    
    if (!settings) {
      return res.json([]);
    }

    const logs = [{
      time: settings.lastUpdated,
      action: settings.isEnabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      user: settings.updatedBy,
      message: settings.message
    }];

    res.json(logs);
  } catch (error) {
    console.error('Error getting maintenance logs:', error);
    res.status(500).json({ message: 'Error getting maintenance logs' });
  }
});

export default router;
