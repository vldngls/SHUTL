// models/fares.model.js
import mongoose from 'mongoose';

const fareSchema = new mongoose.Schema(
  {
    fare: { type: String, required: true },
    price: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Fare = mongoose.model('Fare', fareSchema);

export default Fare;
