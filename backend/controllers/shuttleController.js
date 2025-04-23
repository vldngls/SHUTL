import ShuttleTrip from "../models/shuttleTrip.model.js";
import ShuttleAssignment from "../models/shuttleAssignment.model.js";
import { isWithinOperationalHours } from "./operationalHoursController.js";
import OperationalHours from "../models/operationalHours.model.js";

// Add new shuttle trip record
export const createTrip = async (req, res) => {
  try {
    const tripData = req.body;

    // Check if the trip time is within operational hours
    const isWithinHours = await isWithinOperationalHours(tripData.time);
    if (!isWithinHours) {
      return res.status(400).json({
        error: "Trip cannot be created outside operational hours",
      });
    }

    // Ensure passengerCount is a number
    tripData.passengerCount = Number(tripData.passengerCount);

    // Parse the ISO date string directly
    const date = new Date(tripData.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    // Create new trip with the parsed date
    const trip = new ShuttleTrip({
      ...tripData,
      date: date,
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
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
    // Get operational hours
    const operationalHours = (await OperationalHours.findOne({
      isActive: true,
    })) || { startTime: "05:00", endTime: "22:00" }; // Default hours

    // Get today's date in UTC
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const tomorrowUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: todayUTC,
        $lt: tomorrowUTC,
      },
    })
      .sort({ time: 1 })
      .lean();

    // Parse operational hours
    const [startHour, startMinute] = operationalHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = operationalHours.endTime
      .split(":")
      .map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Filter trips within operational hours
    const operationalTrips = todayTrips.filter((trip) => {
      const [tripHour, tripMinute] = trip.time.split(":").map(Number);
      const tripMinutes = tripHour * 60 + tripMinute;
      return tripMinutes >= startMinutes && tripMinutes <= endMinutes;
    });

    // Calculate basic metrics using filtered trips
    const roundTrips = Math.floor(
      operationalTrips.filter((trip) => trip.status === "In").length
    );
    const totalPassengers = operationalTrips.reduce(
      (sum, trip) => sum + (trip.passengerCount || 0),
      0
    );
    const activeShuttles = new Set(
      operationalTrips.map((trip) => trip.shuttleNumber)
    ).size;

    // Calculate hourly passengers
    const hoursRange = endHour - startHour + 1;
    const hourlyPassengers = new Array(hoursRange).fill(0);

    operationalTrips.forEach((trip) => {
      const [hour] = trip.time.split(":").map(Number);
      if (hour >= startHour && hour <= endHour) {
        const index = hour - startHour;
        hourlyPassengers[index] += trip.passengerCount || 0;
      }
    });

    // Calculate route metrics for operational hours only
    const shuttleTrips = {};
    operationalTrips.forEach((trip) => {
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
          const [outHour, outMin] = currentTrip.time.split(":").map(Number);
          const [inHour, inMin] = nextTrip.time.split(":").map(Number);

          const routeTimeMinutes =
            inHour * 60 + inMin - (outHour * 60 + outMin);
          if (routeTimeMinutes >= 0) {
            routeTimes.push(routeTimeMinutes);
          }

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

    res.status(200).json({
      roundTrips,
      totalPassengers,
      activeShuttles,
      routeMetrics,
      hourlyPassengers,
      operationalHours: {
        startTime: operationalHours.startTime,
        endTime: operationalHours.endTime,
      },
    });
  } catch (error) {
    console.error("Error getting shuttle summary:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update the getPendingOutTrips function
export const getPendingOutTrips = async (req, res) => {
  try {
    // Get today's date in local timezone
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const tomorrowUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    // First, get all Out trips for today
    const outTrips = await ShuttleTrip.find({
      date: {
        $gte: todayUTC,
        $lt: tomorrowUTC,
      },
      status: "Out",
    }).lean();

    // Get all In trips for today
    const inTrips = await ShuttleTrip.find({
      date: {
        $gte: todayUTC,
        $lt: tomorrowUTC,
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

// Update the getHourlyPassengers function
export const getHourlyPassengers = async (req, res) => {
  try {
    // Get today's date in UTC
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const tomorrowUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: todayUTC,
        $lt: tomorrowUTC,
      },
    }).lean();

    // Initialize array for 5 AM to 10 PM (18 hours)
    const hourlyData = new Array(18).fill(0);

    // Process each trip and add passengers to the corresponding hour
    todayTrips.forEach((trip) => {
      // Use the stored local time
      const [hours] = trip.time.split(":").map(Number);

      // Only count trips between 5 AM (5) and 10 PM (22)
      if (hours >= 5 && hours <= 22) {
        const index = hours - 5; // Convert hour to array index (5 AM = index 0)
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

    console.log("Today's trips:", todayTrips);

    // Group trips by shuttle
    const shuttleTripsMap = {};
    todayTrips.forEach((trip) => {
      if (!shuttleTripsMap[trip.shuttleNumber]) {
        shuttleTripsMap[trip.shuttleNumber] = [];
      }
      shuttleTripsMap[trip.shuttleNumber].push(trip);
    });

    // Calculate stats per shuttle
    const stats = {};

    for (const [shuttleId, trips] of Object.entries(shuttleTripsMap)) {
      // Initialize stats for this shuttle
      stats[shuttleId] = {
        totalPassengers: 0,
        roundTrips: 0,
        inTrips: 0,
        outTrips: 0,
        tripCount: 0,
        averagePassengers: 0,
        completedRoundTrips: new Set(), // To track completed round trips
      };

      // Count in and out trips and passengers
      trips.forEach((trip) => {
        // Add passengers
        stats[shuttleId].totalPassengers += trip.passengerCount || 0;

        // Increment trip count
        stats[shuttleId].tripCount += 1;

        // Count in and out trips
        if (trip.status === "In") {
          stats[shuttleId].inTrips += 1;
        } else if (trip.status === "Out") {
          stats[shuttleId].outTrips += 1;
        }

        // Track round trips by roundTripId
        if (trip.roundTripId) {
          stats[shuttleId].completedRoundTrips.add(trip.roundTripId);
        }
      });

      // Find matching In/Out pairs to count completed round trips
      const outTrips = trips.filter((trip) => trip.status === "Out");
      const inTrips = trips.filter((trip) => trip.status === "In");

      // Count completed round trips
      let completedTrips = 0;

      // Method 1: Count by matching roundTripId between In and Out trips
      outTrips.forEach((outTrip) => {
        const hasMatchingInTrip = inTrips.some(
          (inTrip) =>
            inTrip.roundTripId === outTrip._id.toString() ||
            (outTrip.roundTripId &&
              inTrip.roundTripId &&
              outTrip.roundTripId === inTrip.roundTripId)
        );

        if (hasMatchingInTrip) {
          completedTrips++;
        }
      });

      // Set the round trips count
      stats[shuttleId].roundTrips = completedTrips;

      // Calculate average passengers per trip
      if (stats[shuttleId].tripCount > 0) {
        stats[shuttleId].averagePassengers = Math.round(
          stats[shuttleId].totalPassengers / stats[shuttleId].tripCount
        );
      }

      // Remove the Set before sending to client
      delete stats[shuttleId].completedRoundTrips;
    }

    console.log("Shuttle stats for today:", stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting shuttle stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get shuttle location by ID
export const getShuttleLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if we have this shuttle's location in memory
    // This assumes you have a global shuttleLocations object that stores the latest locations
    if (!global.shuttleLocations) {
      global.shuttleLocations = {};
    }

    if (global.shuttleLocations[id]) {
      return res.status(200).json({
        shuttleId: id,
        coordinates: global.shuttleLocations[id].coordinates,
        lastUpdate: global.shuttleLocations[id].lastUpdate,
        metadata: global.shuttleLocations[id].metadata,
        hasLocationData: true,
      });
    }

    // If not found in memory, check if there's a recent trip for this shuttle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const recentTrip = await ShuttleTrip.findOne({
      shuttleNumber: id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ date: -1 });

    if (recentTrip) {
      // Return basic info without location data
      return res.status(200).json({
        shuttleId: id,
        lastUpdate: recentTrip.date,
        hasLocationData: false,
      });
    }

    // If no location data found
    return res.status(404).json({
      message: "No location data found for this shuttle",
      shuttleId: id,
      hasLocationData: false,
    });
  } catch (error) {
    console.error("Error getting shuttle location:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get shuttle routes
export const getShuttleRoutes = async (req, res) => {
  try {
    // Get today's date in UTC
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const tomorrowUTC = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    // Get all trips for today
    const todayTrips = await ShuttleTrip.find({
      date: {
        $gte: todayUTC,
        $lt: tomorrowUTC,
      },
    }).lean();

    // Group trips by shuttle number and calculate route metrics
    const routeMetrics = {};
    todayTrips.forEach((trip) => {
      if (!routeMetrics[trip.shuttleNumber]) {
        routeMetrics[trip.shuttleNumber] = {
          totalPassengers: 0,
          roundTrips: 0,
          averagePassengers: 0,
        };
      }

      // Add passengers
      routeMetrics[trip.shuttleNumber].totalPassengers += trip.passengerCount || 0;

      // Count round trips
      if (trip.status === "In") {
        routeMetrics[trip.shuttleNumber].roundTrips += 1;
      }
    });

    // Calculate average passengers per trip
    Object.keys(routeMetrics).forEach((shuttleNumber) => {
      const metrics = routeMetrics[shuttleNumber];
      const totalTrips = metrics.roundTrips * 2; // Each round trip has 2 trips (out and in)
      metrics.averagePassengers = totalTrips > 0 
        ? Math.round(metrics.totalPassengers / totalTrips) 
        : 0;
    });

    res.status(200).json(routeMetrics);
  } catch (error) {
    console.error("Error fetching shuttle routes:", error);
    res.status(500).json({
      message: "Failed to fetch shuttle routes",
      error: error.message,
    });
  }
};
