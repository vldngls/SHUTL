// models/schedule.model.js

import mongoose from 'mongoose';

// Define the schedule schema
const scheduleSchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true, 
    unique: true // Ensures that each day in the collection is unique
  },
  time: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// Create the Schedule model
const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
