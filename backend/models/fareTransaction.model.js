import mongoose from "mongoose";

const fareTransactionSchema = mongoose.Schema(
  {
    commuterEmail: {
      type: String,
      required: true,
    },
    regularCount: { type: Number, required: true, default: 0 },
    discountedCount: { type: Number, required: true, default: 0 },
    totalFare: { type: Number, required: true },
    tender: { type: Number, required: true },
    change: { type: Number, required: true },
    shuttleID: { type: String, required: true },
    date: { type: String }, // YYYY-MM-DD format
    time: { type: String }, // HH:MM format
  },
  {
    timestamps: true,
  }
);

const FareTransaction = mongoose.model(
  "FareTransaction",
  fareTransactionSchema
);

export default FareTransaction;
