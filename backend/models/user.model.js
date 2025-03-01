import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["Commuter", "Driver", "Admin", "Teller"],
      default: "Commuter",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    duty_status: {
      type: String,
      enum: ["on_duty", "off_duty", "idle"],
      default: "idle",
    },
    last_active: {
      type: Date,
      default: Date.now,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetOTP: {
      type: String,
    },
    resetOTPExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
