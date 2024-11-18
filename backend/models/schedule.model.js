// models/schedule.model.js
import mongoose from "mongoose";

// Define the schedule schema
const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create the Schedule model
const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
