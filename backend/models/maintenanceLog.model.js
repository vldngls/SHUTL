import mongoose from "mongoose";

const maintenanceLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "error"],
      required: true,
    },
    details: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model exists before creating it
const MaintenanceLog = mongoose.models.MaintenanceLog || mongoose.model("MaintenanceLog", maintenanceLogSchema);

export default MaintenanceLog;
