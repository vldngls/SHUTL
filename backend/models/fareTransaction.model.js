import mongoose from "mongoose";

const fareTransactionSchema = mongoose.Schema(
  {
    commuterEmail: { type: String, required: true },
    regularCount: { type: Number, required: true },
    discountedCount: { type: Number, required: true },
    totalFare: { type: Number, required: true },
    tender: { type: Number, required: true },
    change: { type: Number, required: true },
    shuttleID: { type: String, required: true },
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
