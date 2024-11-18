import mongoose from "mongoose";

const tellerProfileSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthday: { type: Date, required: true },
    position: { type: String, required: true },
    profileImage: { type: String, default: "/teller-profile.png" },
  },
  {
    timestamps: true,
  }
);

const TellerProfile = mongoose.model("TellerProfile", tellerProfileSchema);

export default TellerProfile;
