import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    email: { type: String, required: true },
    userType: { type: String, enum: ['Driver', 'Teller'], required: true }
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatRoomSchema = new mongoose.Schema({
  isGlobalRoom: { type: Boolean, default: true },
  messages: [messageSchema],
  lastMessage: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient querying
chatRoomSchema.index({ 'driver.email': 1, 'teller.email': 1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom; 