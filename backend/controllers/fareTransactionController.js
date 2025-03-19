import FareTransaction from "../models/fareTransaction.model.js";
import OperationalHours from "../models/operationalHours.model.js";
import { isWithinOperationalHours } from "./operationalHoursController.js";

export const createFareTransaction = async (req, res) => {
  try {
    const {
      shuttleID,
      passengerCounts,
      totalFare,
      tender,
      change,
      commuterEmail,
      date,
      time,
      paymentMethod,
      receiptImage
    } = req.body;

    // Validate required fields
    if (
      !shuttleID ||
      !passengerCounts ||
      !totalFare ||
      !tender ||
      !commuterEmail ||
      !paymentMethod
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Validate payment method
    if (!['CASH', 'GCASH'].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "Invalid payment method. Must be either CASH or GCASH" });
    }

    // Validate GCash receipt requirement
    if (paymentMethod === 'GCASH' && !receiptImage) {
      return res
        .status(400)
        .json({ message: "Receipt image is required for GCash payments" });
    }

    // Validate passenger counts
    const totalPassengers = Object.values(passengerCounts).reduce(
      (sum, count) => sum + (typeof count === 'number' ? count : 0),
      0
    );
    if (totalPassengers === 0) {
      return res
        .status(400)
        .json({ message: "At least one passenger is required" });
    }

    // Create new transaction with Map for passengerCounts
    const fareTransaction = new FareTransaction({
      shuttleID,
      passengerCounts: new Map(Object.entries(passengerCounts)),
      totalFare,
      tender,
      change,
      commuterEmail,
      date: date || new Date().toISOString().split("T")[0],
      time: time || new Date().toTimeString().split(" ")[0].substring(0, 5),
      paymentMethod,
      receiptImage
    });

    const savedTransaction = await fareTransaction.save();
    
    // Convert Map back to object for response
    const response = savedTransaction.toObject();
    response.passengerCounts = Object.fromEntries(response.passengerCounts);
    
    res.status(201).json(response);
  } catch (error) {
    console.error("Error in createFareTransaction:", error);
    res.status(500).json({
      message: "Failed to create fare transaction",
      error: error.message,
    });
  }
};

export const getFareTransactions = async (req, res) => {
  try {
    const transactions = await FareTransaction.find({});
    res.json(transactions);
  } catch (error) {
    console.error("Error in getFareTransactions:", error);
    res.status(500).json({
      message: "Failed to fetch fare transactions",
      error: error.message,
    });
  }
};

export const getFareTransactionsByShuttleId = async (req, res) => {
  try {
    const { shuttleId } = req.params;
    const transactions = await FareTransaction.find({ shuttleID: shuttleId });
    res.json(transactions);
  } catch (error) {
    console.error("Error in getFareTransactionsByShuttleId:", error);
    res.status(500).json({
      message: "Failed to fetch fare transactions",
      error: error.message,
    });
  }
};

export const getFareTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await FareTransaction.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error in getFareTransactionsByDateRange:", error);
    res.status(500).json({
      message: "Failed to fetch fare transactions",
      error: error.message,
    });
  }
};

export const getFareTransactionsByCommuterEmail = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const transactions = await FareTransaction.find({ commuterEmail: req.user.email });
    res.json(transactions);
  } catch (error) {
    console.error("Error in getFareTransactionsByCommuterEmail:", error);
    res.status(500).json({
      message: "Failed to fetch fare transactions",
      error: error.message,
    });
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
          regularCount: { $sum: "$passengerCounts.Regular" },
          pwdCount: { $sum: "$passengerCounts.PWD" },
          studentCount: { $sum: "$passengerCounts.STUDENT" },
          seniorCount: { $sum: "$passengerCounts.SENIOR" },
        },
      },
    ]);

    console.log("Transactions aggregation result:", transactions);

    if (transactions.length > 0) {
      const { totalFare, regularCount, pwdCount, studentCount, seniorCount } =
        transactions[0];
      res.status(200).json({
        totalFare,
        passengerCounts: {
          Regular: regularCount || 0,
          PWD: pwdCount || 0,
          STUDENT: studentCount || 0,
          SENIOR: seniorCount || 0,
        },
        operationalHours: {
          startTime: operationalHours.startTime,
          endTime: operationalHours.endTime,
        },
      });
    } else {
      res.status(200).json({
        totalFare: 0,
        passengerCounts: {
          Regular: 0,
          PWD: 0,
          STUDENT: 0,
          SENIOR: 0,
        },
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
