import ShuttleAssignment from "../models/shuttleAssignment.model.js";

// Assign a shuttle to a driver
export const assignShuttle = async (req, res) => {
  try {
    const { driverEmail, shuttleId } = req.body;
    const existingAssignment = await ShuttleAssignment.findOne({ driverEmail });

    if (existingAssignment) {
      existingAssignment.shuttleId = shuttleId;
      await existingAssignment.save();
      return res.status(200).json(existingAssignment);
    }

    const assignment = new ShuttleAssignment({ driverEmail, shuttleId });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error in assignShuttle:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all shuttle assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await ShuttleAssignment.find();
    // Transform the data to match frontend expectations
    const transformedAssignments = assignments.map(assignment => ({
      shuttleNumber: assignment.shuttleId,
      driver: assignment.driverEmail,
      status: assignment.status
    }));
    res.status(200).json(transformedAssignments);
  } catch (error) {
    console.error("Error in getAllAssignments:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update a shuttle assignment
export const updateAssignment = async (req, res) => {
  try {
    const assignment = await ShuttleAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a shuttle assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAssignment = await ShuttleAssignment.findByIdAndDelete(id);
    if (!deletedAssignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDriverAssignment = async (req, res) => {
  try {
    const driverEmail = req.user.email;
    const assignment = await ShuttleAssignment.findOne({
      driverEmail: driverEmail,
    }).populate("shuttleId");

    if (!assignment) {
      return res.status(404).json({ message: "No shuttle assigned" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const { driverEmail, shuttleId, status } = req.body;

    // Validate required fields
    if (!driverEmail || !shuttleId) {
      return res.status(400).json({
        error: "driverEmail and shuttleId are required",
      });
    }

    // Check if the shuttle is already assigned to another driver
    const existingShuttleAssignment = await ShuttleAssignment.findOne({ shuttleId });
    if (existingShuttleAssignment) {
      return res.status(400).json({
        error: `Shuttle ${shuttleId} is already assigned to another driver`,
      });
    }

    // Check if the driver already has an assignment
    const existingDriverAssignment = await ShuttleAssignment.findOne({ driverEmail });
    if (existingDriverAssignment) {
      return res.status(400).json({
        error: `Driver ${driverEmail} already has an assigned shuttle`,
      });
    }

    const assignment = new ShuttleAssignment({
      driverEmail,
      shuttleId,
      status: status || "active",
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error in createAssignment:", error);
    res.status(500).json({ error: error.message });
  }
};
