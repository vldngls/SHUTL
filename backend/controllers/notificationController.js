// backend/controllers/notificationController.js
import Notification from '../models/notification.model.js';
import { io } from '../server.js'; // Import Socket.io instance

// Send a notification based on user type
// backend/controllers/notificationController.js
export const sendNotification = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { message, recipientType } = req.body;

    // Save the notification to the database
    const notification = new Notification({
      message,
      sender: adminId,
      recipientType,
    });
    await notification.save();

    // Emit the notification with the recipientType so clients can filter
    io.emit('new_notification', { message, recipientType, createdAt: notification.createdAt });

    res.status(201).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
};


// Fetch notifications based on user's type
export const getNotifications = async (req, res) => {
    try {
        const userType = req.user.userType; // Assuming userType is set in req.user after authentication
        const notifications = await Notification.find({ recipientType: userType }).sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};
