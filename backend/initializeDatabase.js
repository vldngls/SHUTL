import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/user.model.js";
import UserData from "./models/userData.model.js";
import ShuttleAssignment from "./models/shuttleAssignment.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const DEFAULT_PASSWORD = "shutl123"; // Using one password for all accounts
const DEFAULT_PROFILE = "/profile.png"; // Using the profile.png from frontend/public

const initializeDatabase = async () => {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // First, clear existing data
    await User.deleteMany({});
    await UserData.deleteMany({});
    await ShuttleAssignment.deleteMany({});
    console.log("Cleared existing data");

    // Create admin account
    const admin = {
      username: "admin",
      email: "admin@shutl.com",
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      userType: "Admin",
      name: "System Admin",
      status: "active",
    };

    // Create teller account
    const teller = {
      username: "teller",
      email: "teller@shutl.com",
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      userType: "Teller",
      name: "System Teller",
      status: "active",
    };

    // Create drivers
    const drivers = [
      {
        username: "driver1",
        email: "driver1@shutl.com",
        password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        userType: "Driver",
        name: "Driver One",
        status: "active",
      },
      {
        username: "driver2",
        email: "driver2@shutl.com",
        password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        userType: "Driver",
        name: "Driver Two",
        status: "active",
      },
      {
        username: "driver3",
        email: "driver3@shutl.com",
        password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        userType: "Driver",
        name: "Driver Three",
        status: "active",
      },
      {
        username: "driver4",
        email: "driver4@shutl.com",
        password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        userType: "Driver",
        name: "Driver Four",
        status: "active",
      },
    ];

    // Insert all users
    const createdUsers = await User.insertMany([admin, teller, ...drivers]);
    console.log("Users created successfully");

    // Create UserData for each user
    const userDataDocs = createdUsers.map((user) => ({
      email: user.email,
      name: user.name,
      profilePicture: DEFAULT_PROFILE,
      discountType: "REGULAR",
      discount: 0,
      paymentMethod: "Cash",
      preferences: {
        notifications: true,
        language: "en",
      },
    }));

    await UserData.insertMany(userDataDocs);
    console.log("User data created successfully");

    // Create shuttle assignments
    const assignments = drivers.map((driver, index) => ({
      driverEmail: driver.email,
      shuttleId: `00${index + 1}`,
      status: "active",
    }));

    await ShuttleAssignment.insertMany(assignments);
    console.log("Shuttle assignments created successfully");

    console.log("\nInitial data created successfully:");
    console.log("\nAll accounts use the same password:", DEFAULT_PASSWORD);
    console.log("\nAccounts created:");
    console.log("1. Admin - Username: admin, Email: admin@shutl.com");
    console.log("2. Teller - Username: teller, Email: teller@shutl.com");
    console.log(
      "3. Driver One - Username: driver1, Email: driver1@shutl.com, Shuttle: 001"
    );
    console.log(
      "4. Driver Two - Username: driver2, Email: driver2@shutl.com, Shuttle: 002"
    );
    console.log(
      "5. Driver Three - Username: driver3, Email: driver3@shutl.com, Shuttle: 003"
    );
    console.log(
      "6. Driver Four - Username: driver4, Email: driver4@shutl.com, Shuttle: 004"
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
