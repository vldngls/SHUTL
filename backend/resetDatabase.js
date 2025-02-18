import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const resetDatabase = async () => {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Drop the database
    await mongoose.connection.dropDatabase();
    console.log("Database reset successfully");

    // Close the connection
    await mongoose.connection.close();
    console.log("Connection closed");

    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    console.error(
      "Please make sure your .env file exists and contains MONGO_URI"
    );
    process.exit(1);
  }
};

resetDatabase();
