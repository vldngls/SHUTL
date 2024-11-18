import mongoose from 'mongoose';

const userDataSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 0, // Discount value
  },
  paymentMethod: {
    type: String,
    required: true, // Payment method
  },
  contactNumber: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150', // Default profile picture URL
  },
}, {
  timestamps: true,
});

export default mongoose.model('UserData', userDataSchema);
