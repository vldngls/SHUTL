import mongoose from "mongoose";

const fareTransactionSchema = mongoose.Schema(
  {
    commuterEmail: {
      type: String,
      required: true,
    },
    passengerCounts: {
      Regular: { type: Number, required: true, default: 0 },
      PWD: { type: Number, required: true, default: 0 },
      STUDENT: { type: Number, required: true, default: 0 },
      SENIOR: { type: Number, required: true, default: 0 },
    },
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

// Add virtual properties for backward compatibility
fareTransactionSchema.virtual("regularCount").get(function () {
  return this.passengerCounts.Regular || 0;
});

fareTransactionSchema.virtual("discountedCount").get(function () {
  return (
    (this.passengerCounts.PWD || 0) +
    (this.passengerCounts.STUDENT || 0) +
    (this.passengerCounts.SENIOR || 0)
  );
});

// Ensure virtuals are included in JSON output
fareTransactionSchema.set("toJSON", { virtuals: true });
fareTransactionSchema.set("toObject", { virtuals: true });

const FareTransaction = mongoose.model(
  "FareTransaction",
  fareTransactionSchema
);

export default FareTransaction;
