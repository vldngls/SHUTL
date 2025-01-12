import mongoose from "mongoose";

const shuttleAssignmentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    shuttleId: { type: String, required: true },
  },
  { timestamps: true }
);

const ShuttleAssignment = mongoose.model(
  "ShuttleAssignment",
  shuttleAssignmentSchema
);

export default ShuttleAssignment;
