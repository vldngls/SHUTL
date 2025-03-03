import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true },
    name: String,
    birthday: Date,
    address: String,
    discountType: {
      type: String,
      enum: ["REGULAR", "PWD", "STUDENT", "SENIOR"],
      default: "REGULAR",
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
    },
    idPicture: String,
    paymentMethod: String,
    contactNumber: String,
    profilePicture: String,
    phoneNumber: String,
    preferences: {
      notifications: { type: Boolean, default: true },
      language: { type: String, default: "en" },
    },
  },
  {
    timestamps: true,
    collection: "userdatas",
  }
);

export default mongoose.model("UserData", userDataSchema);
