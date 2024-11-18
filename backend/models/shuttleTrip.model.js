import mongoose from "mongoose";

const shuttleTripSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true },
    shuttleNumber: { type: String, required: true },
    driver: { type: String, required: true },
    status: { type: String, enum: ["In", "Out"], required: true },
    passengerCount: { type: Number, required: true },
  },
  { timestamps: true }
);

const ShuttleTrip = mongoose.model("ShuttleTrip", shuttleTripSchema);

export default ShuttleTrip;
