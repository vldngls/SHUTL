import FareTransaction from "../models/fareTransaction.model.js";
import OperationalHours from "../models/operationalHours.model.js";
import { isWithinOperationalHours } from "./operationalHoursController.js";

export const createFareTransaction = async (req, res) => {
  try {
    const {
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
    } = req.body;

    // Validate required fields
    if (!shuttleID) {
      return res.status(400).json({ message: "Shuttle ID is required" });
    }

    if (!commuterEmail) {
      return res.status(400).json({ message: "Commuter email is required" });
    }

    if (regularCount === undefined || discountedCount === undefined) {
      return res.status(400).json({ message: "Passenger counts are required" });
    }

    if (
      totalFare === undefined ||
      tender === undefined ||
      change === undefined
    ) {
      return res.status(400).json({ message: "Fare details are required" });
    }

    // Get current time in Philippines (GMT+8)
    const now = new Date();
    // Create a date string in ISO format with the Philippines timezone offset
    const philippinesDateString = new Date(
      now.getTime() + 8 * 60 * 60 * 1000
    ).toISOString();
    // Extract just the time portion in HH:MM format
    const timeString = philippinesDateString.substring(11, 16);

    console.log("Current time (UTC):", now.toISOString());
    console.log("Philippines time string:", timeString);

    // Get operational hours for debugging
    const operationalHours = (await OperationalHours.findOne({
      isActive: true,
    })) || { startTime: "05:00", endTime: "22:00" };
    console.log(
      "Operational hours:",
      operationalHours.startTime,
      "to",
      operationalHours.endTime
    );

    // Check if the current time is within operational hours
    const isWithinHours = await isWithinOperationalHours(timeString);
    console.log("Is within operational hours:", isWithinHours);

    // For testing purposes, temporarily bypass the operational hours check
    // Comment out this section when going to production
    /*
    if (!isWithinHours) {
      return res.status(400).json({
        message: "Transaction cannot be created outside operational hours",
      });
    }
    */

    // Get current Philippine time (GMT+8)
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const newTransaction = new FareTransaction({
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
      createdAt: philippineTime,
      date: philippineTime.toISOString().split("T")[0], // Save the date in YYYY-MM-DD format
      time: timeString, // Save the time in HH:mm format
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating fare transaction:", error);
    res.status(500).json({
      message: "Error creating fare transaction",
      error: error.message,
    });
  }
};

export const getTransactionsByShuttleID = async (req, res) => {
  const { shuttleID, date } = req.query;
  try {
    let query = { shuttleID };

    // If date is provided, filter by that date
    if (date) {
      query.date = date;
      console.log(
        `Filtering transactions for shuttle ${shuttleID} on date ${date}`
      );
    }

    const transactions = await FareTransaction.find(query).sort({
      createdAt: -1,
    });
    console.log(
      `Found ${transactions.length} transactions for shuttle ${shuttleID}`
    );

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

export const getTransactionsByCommuterEmail = async (req, res) => {
  const { commuterEmail } = req.query;
  try {
    console.log("Searching for transactions with email:", commuterEmail); // Debug log

    const transactions = await FareTransaction.find({ commuterEmail }).sort({
      createdAt: -1,
    });

    console.log("Found transactions:", transactions); // Debug log

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

export const getTotalEarnings = async (req, res) => {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    console.log("Getting total earnings for date:", formattedDate);

    // Get current operational hours
    const operationalHours = (await OperationalHours.findOne({
      isActive: true,
    })) || {
      startTime: "05:00",
      endTime: "22:00",
    };

    // Query transactions for today using the date field
    const transactions = await FareTransaction.aggregate([
      {
        $match: {
          date: formattedDate,
        },
      },
      {
        $group: {
          _id: null,
          totalFare: { $sum: "$totalFare" },
          regularCount: { $sum: "$regularCount" },
          discountedCount: { $sum: "$discountedCount" },
        },
      },
    ]);

    console.log("Transactions aggregation result:", transactions);

    if (transactions.length > 0) {
      const { totalFare, regularCount, discountedCount } = transactions[0];
      res.status(200).json({
        totalFare,
        regular: regularCount,
        discounted: discountedCount,
        operationalHours: {
          startTime: operationalHours.startTime,
          endTime: operationalHours.endTime,
        },
      });
    } else {
      res.status(200).json({
        totalFare: 0,
        regular: 0,
        discounted: 0,
        operationalHours: {
          startTime: operationalHours.startTime,
          endTime: operationalHours.endTime,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching total earnings:", error);
    res.status(500).json({ message: "Error fetching total earnings", error });
  }
};
