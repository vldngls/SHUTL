import mongoose from "mongoose";

const fareTransactionSchema = mongoose.Schema(
  {
    commuterEmail: {
      type: String,
      required: true,
    },
    passengerCounts: {
      type: Map,
      of: Number,
      required: true,
      default: {}
    },
    totalFare: { type: Number, required: true },
    tender: { type: Number, required: true },
    change: { type: Number, required: true },
    shuttleID: { type: String, required: true },
    date: { type: String }, // YYYY-MM-DD format
    time: { type: String }, // HH:MM format
    paymentMethod: {
      type: String,
      enum: ['CASH', 'DIGITAL'],
      required: true,
      default: 'CASH'
    },
    receiptImage: {
      type: String, // Base64 encoded image for digital payment receipts
      required: function() {
        return this.paymentMethod === 'DIGITAL';
      }
    }
  },
  {
    timestamps: true,
  }
);

// Add virtual properties for backward compatibility
fareTransactionSchema.virtual("regularCount").get(function () {
  return this.passengerCounts.get('Regular') || 0;
});

fareTransactionSchema.virtual("pwdCount").get(function () {
  return this.passengerCounts.get('PWD') || 0;
});

fareTransactionSchema.virtual("studentCount").get(function () {
  return this.passengerCounts.get('Student') || 0;
});

fareTransactionSchema.virtual("seniorCount").get(function () {
  return this.passengerCounts.get('Senior') || 0;
});

// Ensure virtuals are included in JSON output
fareTransactionSchema.set("toJSON", { virtuals: true });
fareTransactionSchema.set("toObject", { virtuals: true });

const FareTransaction = mongoose.model(
  "FareTransaction",
  fareTransactionSchema
);

export default FareTransaction;
