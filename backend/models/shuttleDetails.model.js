// models/shuttleDetails.model.js
import mongoose from "mongoose";

const shuttleDetailsSchema = new mongoose.Schema(
  {
    shuttleId: { type: String, required: true, unique: true },
    licensePlate: { type: String, required: true, unique: true },
    yearModel: { type: Number, required: true },
    initialOdometer: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ShuttleDetails", shuttleDetailsSchema);
