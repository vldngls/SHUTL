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
      default: "Commuter",
      enum: ["Commuter", "Driver", "Teller", "Admin"],
    },
    status: {
      type: String,
      enum: ["active", "idle", "offline"],
      default: "offline",
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
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);

export default User;
