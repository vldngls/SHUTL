// backend/models/notification.model.js
import mongoose from "mongoose";

const VALID_RECIPIENT_TYPES = ["Commuter", "Driver", "Teller", "Administrator", "All"];

const notificationSchema = new mongoose.Schema({
  message: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false 
  },
  recipientType: { 
    type: String, 
    required: true,
    enum: VALID_RECIPIENT_TYPES,
    validate: {
      validator: function(v) {
        return VALID_RECIPIENT_TYPES.includes(v);
      },
      message: props => `${props.value} is not a valid recipient type!`
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }]
});

notificationSchema.index({ recipientType: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
