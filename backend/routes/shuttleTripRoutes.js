import express from "express";
import ShuttleTrip from "../models/shuttleTrip.model.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all shuttle trips
router.get("/", authenticateToken, async (req, res) => {
  try {
    const trips = await ShuttleTrip.find().sort({ date: -1, time: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single shuttle trip
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const trip = await ShuttleTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new shuttle trip
router.post("/", authenticateToken, async (req, res) => {
  const trip = new ShuttleTrip({
    date: req.body.date,
    time: req.body.time,
    shuttleNumber: req.body.shuttleNumber,
    driver: req.body.driver,
    status: req.body.status,
    passengerCount: req.body.passengerCount,
    roundTripId: req.body.roundTripId,
  });

  try {
    const newTrip = await trip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a shuttle trip
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const trip = await ShuttleTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    trip.date = req.body.date || trip.date;
    trip.time = req.body.time || trip.time;
    trip.shuttleNumber = req.body.shuttleNumber || trip.shuttleNumber;
    trip.driver = req.body.driver || trip.driver;
    trip.status = req.body.status || trip.status;
    trip.passengerCount = req.body.passengerCount || trip.passengerCount;
    trip.roundTripId = req.body.roundTripId || trip.roundTripId;

    const updatedTrip = await trip.save();
    res.json(updatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a shuttle trip
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const trip = await ShuttleTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await trip.deleteOne();
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 