import ShuttleTrip from "../models/shuttleTrip.model.js";
import ShuttleAssignment from "../models/shuttleAssignment.model.js";

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

// Get summary data for teller dashboard
export const getShuttleSummary = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Querying for date range:", { today, tomorrow }); // Debug log

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).lean();

    console.log("Found trips:", todayTrips); // Debug log

    // Group trips by shuttle and calculate round trips
    const tripsByShuttle = {};
    todayTrips.forEach((trip) => {
      const shuttleNum = trip.shuttleNumber;
      if (!tripsByShuttle[shuttleNum]) {
        tripsByShuttle[shuttleNum] = { in: 0, out: 0 };
      }
      if (trip.status === "In") tripsByShuttle[shuttleNum].in++;
      if (trip.status === "Out") tripsByShuttle[shuttleNum].out++;
    });

    // Calculate total round trips (minimum of in/out pairs)
    const roundTrips = Object.values(tripsByShuttle).reduce((total, counts) => {
      return total + Math.min(counts.in, counts.out);
    }, 0);

    // Calculate total passengers
    const totalPassengers = todayTrips.reduce(
      (sum, trip) => sum + (trip.passengerCount || 0),
      0
    );

    // Get active shuttles count
    const activeShuttles = await ShuttleAssignment.countDocuments({
      status: "active",
    });

    const summaryData = {
      roundTrips,
      totalPassengers,
      activeShuttles,
    };

    console.log("Sending summary data:", summaryData); // Debug log

    res.status(200).json(summaryData);
  } catch (error) {
    console.error("Error getting shuttle summary:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add this new endpoint
export const getPendingOutTrips = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Find Out trips that don't have matching In trips
    const pendingTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      status: "Out",
      roundTripId: { $exists: true },
    }).lean();

    // Get all roundTripIds that have matching In trips
    const completedRoundTripIds = await ShuttleTrip.distinct("roundTripId", {
      status: "In",
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Filter out trips that already have matching In trips
    const actualPendingTrips = pendingTrips.filter(
      (trip) => !completedRoundTripIds.includes(trip.roundTripId)
    );

    console.log("Pending Out trips:", actualPendingTrips); // Debug log
    res.status(200).json(actualPendingTrips);
  } catch (error) {
    console.error("Error getting pending trips:", error);
    res.status(500).json({ error: error.message });
  }
};
