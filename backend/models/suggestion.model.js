import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["new", "in-progress", "resolved"],
    default: "new",
  },
});

const Suggestion = mongoose.model("Suggestion", suggestionSchema);

export default Suggestion;
