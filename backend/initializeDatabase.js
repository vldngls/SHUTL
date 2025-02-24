import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/user.model.js";
import ShuttleAssignment from "./models/shuttleAssignment.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // First, clear existing data
    await User.deleteMany({ userType: { $in: ["Driver", "Admin", "Teller"] } });
    await ShuttleAssignment.deleteMany({});

    // Create admin account
    const admin = {
      username: "admin",
      email: "admin@shutl.com",
      password: await bcrypt.hash("admin123", 10),
      userType: "Admin",
      name: "System Admin",
      firstName: "System",
      lastName: "Admin",
      status: "active",
    };

    // Create teller account
    const teller = {
      username: "teller",
      email: "teller@shutl.com",
      password: await bcrypt.hash("teller123", 10),
      userType: "Teller",
      name: "System Teller",
      firstName: "System",
      lastName: "Teller",
      status: "active",
    };

    // Create three drivers
    const drivers = [
      {
        username: "SHUTL001",
        email: "shutl001@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "SHUTL 001",
        firstName: "SHUTL",
        lastName: "001",
      },
      {
        username: "SHUTL002",
        email: "shutl002@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "SHUTL 002",
        firstName: "SHUTL",
        lastName: "002",
      },
      {
        username: "SHUTL003",
        email: "shutl003@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "SHUTL 003",
        firstName: "SHUTL",
        lastName: "003",
      },
    ];

    // Insert all users
    await User.insertMany([admin, teller, ...drivers]);
    console.log("Users created successfully");

    // Create shuttle assignments
    const assignments = [
      {
        driverEmail: "shutl001@shutl.com",
        shuttleId: "SHUTL001",
        status: "active",
      },
      {
        driverEmail: "shutl002@shutl.com",
        shuttleId: "SHUTL002",
        status: "active",
      },
      {
        driverEmail: "shutl003@shutl.com",
        shuttleId: "SHUTL003",
        status: "active",
      },
    ];

    await ShuttleAssignment.insertMany(assignments);
    console.log("Shuttle assignments created successfully");

    console.log("\nInitial data created successfully:");
    console.log("\nAdmin Account:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("\nTeller Account:");
    console.log("Username: teller");
    console.log("Password: teller123");
    console.log("\nDriver Accounts:");
    console.log(
      "1. Username: SHUTL001, Password: password123, Shuttle: SHUTL001"
    );
    console.log(
      "2. Username: SHUTL002, Password: password123, Shuttle: SHUTL002"
    );
    console.log(
      "3. Username: SHUTL003, Password: password123, Shuttle: SHUTL003"
    );

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initializeDatabase();
