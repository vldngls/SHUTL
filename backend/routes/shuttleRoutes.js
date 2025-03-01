import express from "express";
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getShuttleSummary,
  getPendingOutTrips,
  getHourlyPassengers,
  getShuttleRouteTimes,
  getRecentTrips,
  getShuttleStats,
  getShuttleLocationById,
} from "../controllers/shuttleController.js";

const router = express.Router();

// Route to create a new shuttle trip
router.post("/trips", createTrip);

// Route to get all shuttle trips
router.get("/trips", getAllTrips);

// Route to get a specific shuttle trip by ID
router.get("/trips/:id", getTripById);

// Route to update a shuttle trip by ID
router.put("/trips/:id", updateTrip);

// Route to delete a shuttle trip by ID
router.delete("/trips/:id", deleteTrip);

// Add new summary endpoint
router.get("/summary", getShuttleSummary);

// Add the new pending trips route
router.get("/pending-trips", getPendingOutTrips);

// Add this new route
router.get("/hourly-passengers", getHourlyPassengers);

// Add this new route
router.get("/route-times", getShuttleRouteTimes);

// Add this new route
router.get("/recent-trips", getRecentTrips);

// Add this new route
router.get("/stats", getShuttleStats);

// Add route to get shuttle location by ID
router.get("/locations/:id", getShuttleLocationById);

export default router;
