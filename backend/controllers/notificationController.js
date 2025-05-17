// backend/controllers/notificationController.js
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { broadcastNotification } from "../server.js";

// Valid recipient types
const VALID_RECIPIENT_TYPES = ["Commuter", "Driver", "Teller", "Administrator", "All"];

// Send a notification based on user type
export const sendNotification = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { message, recipientType } = req.body;

    // Validate recipient type
    if (!VALID_RECIPIENT_TYPES.includes(recipientType)) {
      return res.status(400).json({ error: "Invalid recipient type" });
    }

    // Save the notification to the database
    const notification = new Notification({
      message,
      sender: adminId,
      recipientType,
    });
    await notification.save();

    // Emit the notification to specific rooms based on recipient type
    if (recipientType === "All") {
      // Broadcast to all connected clients
      broadcastNotification({
        message,
        recipientType,
        timestamp: notification.createdAt
      });
    } else {
      // Emit to specific user type room
      broadcastNotification({
        message,
        recipientType,
        timestamp: notification.createdAt
      });
    }

    res.status(201).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Failed to send notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// Fetch notifications based on user's type
export const getNotifications = async (req, res) => {
  try {
    const { recipientType } = req.query;
    const query = recipientType ? { recipientType } : {};
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};
