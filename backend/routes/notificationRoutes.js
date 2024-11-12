// backend/routes/notificationRoutes.js
import express from 'express';
import { sendNotification, getNotifications } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authenticateToken.js'; // Named import


const router = express.Router();

// Route for admin to send notifications by userType
router.post('/send', authenticateToken, sendNotification); // Admin-only
// Route for users to fetch their notifications by userType
router.get('/user', authenticateToken, getNotifications); // Accessible by all users

export default router;
