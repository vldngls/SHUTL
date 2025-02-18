import mongoose from "mongoose";

const driverProfileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    identifier: { type: String, required: true },
    name: { type: String },
    address: { type: String },
    sex: { type: String },
    eyeColor: { type: String },
    dob: { type: String },
    profilePic: { type: String, default: null },
    signature: { type: String, default: null },
  },
  { timestamps: true }
);

driverProfileSchema.pre("save", function (next) {
  this.identifier = this.email;
  next();
});

export default mongoose.model("DriverProfile", driverProfileSchema);
