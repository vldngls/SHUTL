import FareTransaction from "../models/fareTransaction.model.js";

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
    const newTransaction = new FareTransaction({
      commuterEmail,
      regularCount,
      discountedCount,
      totalFare,
      tender,
      change,
      shuttleID,
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
