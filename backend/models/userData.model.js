import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  phoneNumber: String,
  address: String,
  preferences: {
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  }
}, {
  timestamps: true
});

export default mongoose.model('UserData', userDataSchema);
