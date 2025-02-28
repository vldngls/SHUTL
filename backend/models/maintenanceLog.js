import mongoose from 'mongoose';

const maintenanceLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'error'],
    required: true
  },
  details: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('MaintenanceLog', maintenanceLogSchema); 