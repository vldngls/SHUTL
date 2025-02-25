import FareTransaction from "../models/fareTransaction.model.js";
import OperationalHours from "../models/operationalHours.model.js";
import { isWithinOperationalHours } from "./operationalHoursController.js";

export const createFareTransaction = async (req, res) => {
  const {
    commuterEmail,
    regularCount,
    discountedCount,
    totalFare,
    tender,
    change,
    shuttleID,
  } = req.body;

  try {
    // Check if the current time is within operational hours
    const currentTime = new Date();
    const localTime = new Date(currentTime.getTime() + 8 * 60 * 60 * 1000); // Convert to GMT+8
    const timeString = localTime.toTimeString().slice(0, 5); // Format as "HH:mm"

    const isWithinHours = await isWithinOperationalHours(timeString);
    if (!isWithinHours) {
      return res.status(400).json({
        error: "Transaction cannot be created outside operational hours",
      });
    }

    const newTransaction = new FareTransaction({
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
      createdAt: localTime, // Save the adjusted time
      date: localTime.toISOString().split('T')[0], // Save the date in YYYY-MM-DD format
      time: timeString, // Save the time in HH:mm format
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating fare transaction:", error);
    res.status(500).json({ message: "Error creating fare transaction", error });
  }
};

export const getTransactionsByShuttleID = async (req, res) => {
  const { shuttleID } = req.query;
  try {
    const transactions = await FareTransaction.find({ shuttleID });
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
    
    const transactions = await FareTransaction.find({ commuterEmail })
      .sort({ createdAt: -1 });
    
    console.log("Found transactions:", transactions); // Debug log
    
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

export const getTotalEarnings = async (req, res) => {
  try {
    // Get current operational hours
    const operationalHours = await OperationalHours.findOne({ isActive: true }) || { 
      startTime: "05:00", 
      endTime: "22:00" 
    };

    // Create Date objects for today's operational hours
    const today = new Date();
    const [startHour, startMinute] = operationalHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = operationalHours.endTime.split(':').map(Number);
    
    const startDate = new Date(today);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(today);
    endDate.setHours(endHour, endMinute, 59, 999);

    const transactions = await FareTransaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalFare: { $sum: "$totalFare" },
          regularCount: { $sum: "$regularCount" },
          discountedCount: { $sum: "$discountedCount" }
        },
      },
    ]);

    if (transactions.length > 0) {
      const { totalFare, regularCount, discountedCount } = transactions[0];
      res.status(200).json({
        totalFare,
        regular: regularCount,
        discounted: discountedCount,
        operationalHours: {
          startTime: operationalHours.startTime,
          endTime: operationalHours.endTime
        }
      });
    } else {
      res.status(200).json({
        totalFare: 0,
        regular: 0,
        discounted: 0,
        operationalHours: {
          startTime: operationalHours.startTime,
          endTime: operationalHours.endTime
        }
      });
    }
  } catch (error) {
    console.error("Error fetching total earnings:", error);
    res.status(500).json({ message: "Error fetching total earnings", error });
  }
};