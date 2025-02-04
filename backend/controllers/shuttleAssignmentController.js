import ShuttleAssignment from "../models/shuttleAssignment.model.js";

// Assign a shuttle to a driver
export const assignShuttle = async (req, res) => {
  try {
    const { driverId, shuttleId } = req.body;
    const existingAssignment = await ShuttleAssignment.findOne({ driverId });

    if (existingAssignment) {
      existingAssignment.shuttleId = shuttleId;
      await existingAssignment.save();
      return res.status(200).json(existingAssignment);
    }

    const assignment = new ShuttleAssignment({ driverId, shuttleId });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all shuttle assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await ShuttleAssignment.find().populate(
      "driverId",
      "name username"
    );
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a shuttle assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { shuttleId } = req.body;
    const updatedAssignment = await ShuttleAssignment.findByIdAndUpdate(
      id,
      { shuttleId },
      { new: true }
    );
    if (!updatedAssignment)
      return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json(updatedAssignment);
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
    const driverEmail = req.user.email; // Email from decoded token
    console.log('Looking for assignment for driver:', driverEmail);
    
    const assignment = await ShuttleAssignment.findOne({ 
      driverEmail: driverEmail 
    }).populate('shuttleId');
    
    if (!assignment) {
      return res.status(404).json({ message: "No shuttle assigned" });
    }
    
    console.log('Found assignment:', assignment);
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error in getDriverAssignment:', error);
    res.status(500).json({ error: error.message });
  }
};
