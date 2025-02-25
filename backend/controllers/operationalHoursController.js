import OperationalHours from "../models/operationalHours.model.js";

// Get current operational hours
export const getOperationalHours = async (req, res) => {
  try {
    const hours = await OperationalHours.findOne({ isActive: true });
    res.status(200).json(hours || { startTime: "05:00", endTime: "22:00" }); // Default hours
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update operational hours
export const updateOperationalHours = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Start time and end time are required" });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res
        .status(400)
        .json({ error: "Invalid time format. Use HH:mm format" });
    }

    // Convert times to minutes for comparison
    const startMinutes =
      parseInt(startTime.split(":")[0]) * 60 +
      parseInt(startTime.split(":")[1]);
    const endMinutes =
      parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

    if (startMinutes >= endMinutes) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    // Deactivate current active hours
    await OperationalHours.updateMany({}, { isActive: false });

    // Create new operational hours
    const hours = new OperationalHours({ startTime, endTime });
    await hours.save();

    res.status(200).json(hours);
  } catch (error) {
    console.error("Error updating operational hours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check if current time is within operational hours
export const isWithinOperationalHours = async (time) => {
  try {
    const hours = await OperationalHours.findOne({ isActive: true });
    if (!hours) {
      // Default operational hours
      const defaultStart = "05:00";
      const defaultEnd = "22:00";
      return isTimeWithinRange(time, defaultStart, defaultEnd);
    }
    return isTimeWithinRange(time, hours.startTime, hours.endTime);
  } catch (error) {
    console.error("Error checking operational hours:", error);
    return false;
  }
};

// Helper function to check if time is within range
const isTimeWithinRange = (time, start, end) => {
  const [checkHour, checkMinute] = time.split(":").map(Number);
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const checkTime = checkHour * 60 + checkMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return checkTime >= startTime && checkTime <= endTime;
};
