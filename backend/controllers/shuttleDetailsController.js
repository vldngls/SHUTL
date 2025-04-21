// controllers/shuttleDetailsController.js
import ShuttleDetails from "../models/shuttleDetails.model.js";

/** 
 * Create a new Shuttle
 */
export const createShuttle = async (req, res) => {
  try {
    const { shuttleId, licensePlate } = req.body;

    // Check if the shuttle already exists
    const existingShuttle = await ShuttleDetails.findOne({
      $or: [{ shuttleId }, { licensePlate }],
    });

    if (existingShuttle) {
      return res.status(400).json({ message: "Shuttle ID or License Plate already exists." });
    }

    const shuttle = new ShuttleDetails(req.body);
    await shuttle.save();
    res.status(201).json(shuttle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** 
 * Get all shuttles (with optional pagination)
 */
export const getShuttles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    const shuttles = await ShuttleDetails.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ShuttleDetails.countDocuments();

    res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      shuttles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update shuttle details
 */
export const updateShuttle = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const updateData = { ...req.body };

    // If status is being updated, ensure it's lowercase
    if (updateData.status) {
      updateData.status = updateData.status.toLowerCase();
    }

    const shuttle = await ShuttleDetails.findOneAndUpdate(
      { shuttleId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!shuttle) {
      return res.status(404).json({ message: "Shuttle not found." });
    }

    res.status(200).json(shuttle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a shuttle
 */
export const deleteShuttle = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const shuttle = await ShuttleDetails.findOneAndDelete({ shuttleId });

    if (!shuttle) {
      return res.status(404).json({ message: "Shuttle not found." });
    }

    res.status(200).json({ message: "Shuttle deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
