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
        username: "driver1",
        email: "driver1@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "Driver 1",
      },
      {
        username: "driver2",
        email: "driver2@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "Driver 2",
      },
      {
        username: "driver3",
        email: "driver3@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "Driver 3",
      },
      {
        username: "driver4",
        email: "driver4@shutl.com",
        password: await bcrypt.hash("password123", 10),
        userType: "Driver",
        name: "Driver 4",
      },
    ];

    // Insert all users
    await User.insertMany([admin, teller, ...drivers]);
    console.log("Users created successfully");

    // Create shuttle assignments
    const assignments = [
      {
        driverEmail: "driver1@shutl.com",
        shuttleId: "001",
        status: "active",
      },
      {
        driverEmail: "driver2@shutl.com",
        shuttleId: "002",
        status: "active",
      },
      {
        driverEmail: "driver3@shutl.com",
        shuttleId: "003",
        status: "active",
      },
      {
        driverEmail: "driver4@shutl.com",
        shuttleId: "004",
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
    console.log("1. Username: driver1, Password: password123, Shuttle: 001");
    console.log("2. Username: driver2, Password: password123, Shuttle: 002");
    console.log("3. Username: driver3, Password: password123, Shuttle: 003");
    console.log("4. Username: driver4, Password: password123, Shuttle: 004");

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initializeDatabase();
