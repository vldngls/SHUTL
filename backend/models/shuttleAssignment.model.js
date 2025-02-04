import mongoose from "mongoose";

const shuttleAssignmentSchema = new mongoose.Schema({
  driverEmail: { type: String, required: true },
  shuttleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shuttle', required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  schedule: {
    startTime: Date,
    endTime: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('ShuttleAssignment', shuttleAssignmentSchema);
