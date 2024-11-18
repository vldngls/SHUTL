import ShuttleTrip from "../models/shuttleTrip.model.js";

// Add new shuttle trip record
export const createTrip = async (req, res) => {
  try {
    const trip = new ShuttleTrip(req.body);
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update existing trip by unique ID
export const updateTrip = async (req, res) => {
  try {
    const updatedTrip = await ShuttleTrip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTrip)
      return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a trip by unique ID
export const deleteTrip = async (req, res) => {
  try {
    const deletedTrip = await ShuttleTrip.findByIdAndDelete(req.params.id);
    if (!deletedTrip)
      return res.status(404).json({ message: "Trip not found" });
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all trips
export const getAllTrips = async (req, res) => {
  try {
    const trips = await ShuttleTrip.find();
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single trip by unique ID
export const getTripById = async (req, res) => {
  try {
    const trip = await ShuttleTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
