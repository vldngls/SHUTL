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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .sort({ time: 1 })
      .lean();

    // Calculate basic metrics
    const roundTrips = Math.floor(
      todayTrips.filter((trip) => trip.status === "In").length
    );
    const totalPassengers = todayTrips.reduce(
      (sum, trip) => sum + (trip.passengerCount || 0),
      0
    );
    const activeShuttles = new Set(todayTrips.map((trip) => trip.shuttleNumber))
      .size;

    // Calculate hourly passengers (for the line chart)
    const hourlyPassengers = new Array(17).fill(0); // 6am to 10pm (17 hours)
    todayTrips.forEach((trip) => {
      const [hour] = trip.time.split(":").map(Number);
      if (hour >= 6 && hour <= 22) {
        // Only count between 6am and 10pm
        const index = hour - 6;
        hourlyPassengers[index] += trip.passengerCount || 0;
      }
    });

    // Calculate route metrics
    const shuttleTrips = {};
    todayTrips.forEach((trip) => {
      if (!shuttleTrips[trip.shuttleNumber]) {
        shuttleTrips[trip.shuttleNumber] = [];
      }
      shuttleTrips[trip.shuttleNumber].push(trip);
    });

    const routeMetrics = {};

    for (const [shuttleNumber, trips] of Object.entries(shuttleTrips)) {
      const routeTimes = [];
      const departureTimes = [];

      for (let i = 0; i < trips.length - 1; i++) {
        const currentTrip = trips[i];
        const nextTrip = trips[i + 1];

        if (currentTrip.status === "Out" && nextTrip.status === "In") {
          // Calculate route time
          const [outHour, outMin] = currentTrip.time.split(":").map(Number);
          const [inHour, inMin] = nextTrip.time.split(":").map(Number);

          const routeTimeMinutes =
            inHour * 60 + inMin - (outHour * 60 + outMin);
          if (routeTimeMinutes >= 0) {
            routeTimes.push(routeTimeMinutes);
          }

          // Calculate departure time
          if (i < trips.length - 2) {
            const nextOutTrip = trips[i + 2];
            if (nextOutTrip.status === "Out") {
              const [nextOutHour, nextOutMin] = nextOutTrip.time
                .split(":")
                .map(Number);
              const departureTimeMinutes =
                nextOutHour * 60 + nextOutMin - (inHour * 60 + inMin);
              if (departureTimeMinutes >= 0) {
                departureTimes.push(departureTimeMinutes);
              }
            }
          }
        }
      }

      const avgRouteTime =
        routeTimes.length > 0
          ? routeTimes.reduce((a, b) => a + b, 0) / routeTimes.length
          : 0;

      const avgDepartureTime =
        departureTimes.length > 0
          ? departureTimes.reduce((a, b) => a + b, 0) / departureTimes.length
          : 0;

      routeMetrics[shuttleNumber] = {
        averageRouteMinutes: Math.round(avgRouteTime),
        averageDepartureMinutes: Math.round(avgDepartureTime),
      };
    }

    // Send combined response including hourlyPassengers
    res.status(200).json({
      roundTrips,
      totalPassengers,
      activeShuttles,
      routeMetrics,
      hourlyPassengers,
    });
  } catch (error) {
    console.error("Error getting shuttle summary:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update the getPendingOutTrips function
export const getPendingOutTrips = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // First, get all Out trips for today
    const outTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      status: "Out",
    }).lean();

    // Get all In trips for today
    const inTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      status: "In",
    }).lean();

    // Filter out trips that already have matching In trips
    const pendingOutTrips = outTrips.filter((outTrip) => {
      // Check if there's no matching In trip for this Out trip
      const hasMatchingInTrip = inTrips.some((inTrip) => {
        // Check both roundTripId scenarios:
        // 1. When In trip references Out trip's ID
        // 2. When they share the same roundTripId
        return (
          inTrip.roundTripId === outTrip._id.toString() ||
          (outTrip.roundTripId &&
            inTrip.roundTripId &&
            outTrip.roundTripId === inTrip.roundTripId)
        );
      });
      return !hasMatchingInTrip;
    });

    // Debug logs
    console.log("Out trips:", outTrips);
    console.log("In trips:", inTrips);
    console.log("Pending Out trips:", pendingOutTrips);

    res.status(200).json(pendingOutTrips);
  } catch (error) {
    console.error("Error getting pending trips:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add this new controller function
export const getHourlyPassengers = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).lean();

    // Initialize array for 6 AM to 10 PM (17 hours)
    const hourlyData = new Array(17).fill(0);

    // Process each trip and add passengers to the corresponding hour
    todayTrips.forEach((trip) => {
      // Parse the time string (format: "HH:mm")
      const [hours] = trip.time.split(":").map(Number);

      // Only count trips between 6 AM (6) and 10 PM (22)
      if (hours >= 6 && hours <= 22) {
        const index = hours - 6; // Convert hour to array index (6 AM = index 0)
        hourlyData[index] += trip.passengerCount || 0;
      }
    });

    res.status(200).json(hourlyData);
  } catch (error) {
    console.error("Error getting hourly passengers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add this new function to calculate route times
export const getShuttleRouteTimes = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .sort({ time: 1 })
      .lean(); // Sort by time to ensure proper sequence

    // Group trips by shuttle number
    const shuttleTrips = {};
    todayTrips.forEach((trip) => {
      if (!shuttleTrips[trip.shuttleNumber]) {
        shuttleTrips[trip.shuttleNumber] = [];
      }
      shuttleTrips[trip.shuttleNumber].push(trip);
    });

    // Calculate metrics for each shuttle
    const routeMetrics = {};

    for (const [shuttleNumber, trips] of Object.entries(shuttleTrips)) {
      const routeTimes = [];
      const departureTimes = [];

      // Find matching Out-In pairs and calculate route times
      for (let i = 0; i < trips.length - 1; i++) {
        const currentTrip = trips[i];
        const nextTrip = trips[i + 1];

        if (
          currentTrip.status === "Out" &&
          nextTrip.status === "In" &&
          currentTrip.roundTripId === nextTrip.roundTripId
        ) {
          // Calculate route time
          const [outHour, outMin] = currentTrip.time.split(":").map(Number);
          const [inHour, inMin] = nextTrip.time.split(":").map(Number);

          const routeTimeMinutes =
            inHour * 60 + inMin - (outHour * 60 + outMin);
          routeTimes.push(routeTimeMinutes);

          // Calculate departure time (gap between this In and next Out)
          if (i < trips.length - 2) {
            const nextOutTrip = trips[i + 2];
            if (nextOutTrip.status === "Out") {
              const [nextOutHour, nextOutMin] = nextOutTrip.time
                .split(":")
                .map(Number);
              const departureTimeMinutes =
                nextOutHour * 60 + nextOutMin - (inHour * 60 + inMin);
              departureTimes.push(departureTimeMinutes);
            }
          }
        }
      }

      // Calculate averages
      const avgRouteTime =
        routeTimes.length > 0
          ? routeTimes.reduce((a, b) => a + b, 0) / routeTimes.length
          : 0;

      const avgDepartureTime =
        departureTimes.length > 0
          ? departureTimes.reduce((a, b) => a + b, 0) / departureTimes.length
          : 0;

      routeMetrics[shuttleNumber] = {
        averageRouteMinutes: Math.round(avgRouteTime),
        averageDepartureMinutes: Math.round(avgDepartureTime),
      };
    }

    res.status(200).json(routeMetrics);
  } catch (error) {
    console.error("Error calculating route times:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add this new controller function
export const getRecentTrips = async (req, res) => {
  try {
    const recentTrips = await ShuttleTrip.find()
      .sort({ createdAt: -1 }) // Sort by most recent first
      .limit(10) // Get only 10 most recent trips
      .lean();

    res.status(200).json(recentTrips);
  } catch (error) {
    console.error("Error getting recent trips:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getShuttleStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).lean();

    // Calculate stats per shuttle
    const stats = todayTrips.reduce((acc, trip) => {
      const shuttleId = trip.shuttleNumber;
      if (!acc[shuttleId]) {
        acc[shuttleId] = {
          totalPassengers: 0,
          roundTrips: 0,
        };
      }

      // Add passengers
      acc[shuttleId].totalPassengers += trip.passengerCount || 0;

      // Count round trips (when status is "In")
      if (trip.status === "In") {
        acc[shuttleId].roundTrips += 1;
      }

      return acc;
    }, {});

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting shuttle stats:", error);
    res.status(500).json({ error: error.message });
  }
};
