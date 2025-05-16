import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  nature: {
    type: String,
    required: true,
    enum: ["bug", "feature", "improvement", "driver", "shuttle", "teller", "other"]
  },
  email: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String, // Base64 encoded image
    required: false
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
issueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Issue = mongoose.model("Issue", issueSchema);

export default Issue; 