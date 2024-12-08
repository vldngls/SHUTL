import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: ''
    },
    birthday: {
      type: Date,
      default: null,
      required: false
    },
    address: {
      type: String,
      default: '',
      required: false
    },
    discount: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      default: '',
      required: false
    },
    contactNumber: {
      type: String,
      default: '',
      required: false
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserData", userDataSchema);
