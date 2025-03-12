// models/routes.model.js
import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, unique: true },
    assignedShuttles: [{ type: mongoose.Schema.Types.ObjectId, ref: "ShuttleDetails" }],
  },
  { timestamps: true }
);

export default mongoose.model("Route", routeSchema);
