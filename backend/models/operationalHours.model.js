import mongoose from "mongoose";

const operationalHoursSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // Format: "HH:mm"
    endTime: { type: String, required: true }, // Format: "HH:mm"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const OperationalHours = mongoose.model(
  "OperationalHours",
  operationalHoursSchema
);

export default OperationalHours;
