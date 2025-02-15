// backend/models/notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ID of the admin
  recipientType: { type: String, required: true }, // Type of users (e.g., "Commuter", "Driver", etc.)
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // IDs of users who have read it
});

notificationSchema.index({ recipientType: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
