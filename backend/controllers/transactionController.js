import Transaction from "../models/transaction.model.js";

export const createTransaction = async (req, res) => {
  try {
    const { userId, paymentMethod, referenceNumber } = req.body;

    const transaction = await Transaction.create({
      userId,
      paymentMethod,
      referenceNumber,
      date: new Date(),
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
