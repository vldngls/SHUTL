// backend/controllers/notificationController.js
import Notification from "../models/notification.model.js";
import { io } from "../server.js"; // Import Socket.io instance

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
      io.emit("new_notification", {
        message,
        recipientType,
        createdAt: notification.createdAt,
      });
    } else {
      // Emit to specific user type room
      io.to(recipientType.toLowerCase()).emit("new_notification", {
        message,
        recipientType,
        createdAt: notification.createdAt,
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
    const userType = req.user.userType;
    const notifications = await Notification.find({
      $or: [
        { recipientType: userType },
        { recipientType: "All" }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
