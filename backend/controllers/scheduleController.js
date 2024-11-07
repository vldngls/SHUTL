// controllers/scheduleController.js

import Schedule from '../models/schedule.model.js';

// Controller to create a new schedule
export const createSchedule = async (req, res) => {
  try {
    await Schedule.deleteMany(); // Optional: Clear previous schedules
    const schedules = req.body; // Assuming an array of schedules is sent
    const createdSchedules = await Schedule.insertMany(schedules);
    res.status(201).json(createdSchedules);
  } catch (error) {
    console.error("Error saving schedules: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get all schedules
export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to get a specific schedule by ID
export const getScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to update a schedule by ID
export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to delete a schedule by ID
export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    if (!deletedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule: ", error);
    res.status(500).json({ message: "Server error" });
  }
};
