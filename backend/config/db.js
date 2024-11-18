import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.name}`); // Show the database name
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if there's a connection error
  }
};

export default connectDB;
