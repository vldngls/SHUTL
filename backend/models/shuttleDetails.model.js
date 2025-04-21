// models/shuttleDetails.model.js
import mongoose from "mongoose";

const shuttleDetailsSchema = new mongoose.Schema(
  {
    shuttleId: { type: String, required: true, unique: true },
    licensePlate: { type: String, required: true, unique: true },
    yearModel: { type: Number, required: true },
    makeAndModel: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    driver: { type: String },
    maxPassengers: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ShuttleDetails", shuttleDetailsSchema);
