import os from "os";
import { exec } from "child_process";
import util from "util";
import MaintenanceLog from "../models/maintenanceLog.js";
import mongoose from "mongoose";

const execPromise = util.promisify(exec);

// Cache for API stats
let apiStats = {
  requests: 0,
  success: 0,
  startTime: Date.now(),
  logs: [],
};

// Function to log API calls
const logApiCall = (success, details) => {
  apiStats.requests++;
  if (success) apiStats.success++;

  const log = {
    time: new Date().toLocaleTimeString(),
    result: details,
    success,
  };

  apiStats.logs.unshift(log);
  if (apiStats.logs.length > 50) apiStats.logs.pop();
};

const maintenanceController = {
  // Get system health metrics
  getSystemHealth: async (req, res) => {
    try {
      const cpuUsage = getCpuUsage();
      const memoryUsage = getMemoryUsage();
      const storageUsage = getStorageUsage();
      const uptime = getSystemUptime();

      res.json({
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
        },
        memory: memoryUsage,
        storage: storageUsage,
        uptime,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
      });
    } catch (error) {
      console.error("Error getting system health:", error);
      res.status(500).json({ error: "Failed to get system health metrics" });
    }
  },

  // Perform system backup
  backupSystem: async (req, res) => {
    try {
      // Create backups directory if it doesn't exist
      const fs = await import("fs/promises");
      const path = await import("path");

      const backupsDir = path.join(process.cwd(), "backups");
      await fs.mkdir(backupsDir, { recursive: true });

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupsDir, `backup-${timestamp}.json`);

      // Get all collections
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      const backup = {};

      // Backup each collection
      for (const collection of collections) {
        const data = await mongoose.connection.db
          .collection(collection.name)
          .find({})
          .toArray();
        backup[collection.name] = data;
      }

      // Write backup to file
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));

      // Log the backup action
      await MaintenanceLog.create({
        action: "System backup",
        status: "success",
        details: `Backup created: backup-${timestamp}.json`,
        userId: req.user._id,
      });

      res.json({
        message: `Backup created successfully: backup-${timestamp}.json`,
        timestamp,
      });
    } catch (error) {
      console.error("Backup error:", error);

      // Log the error
      await MaintenanceLog.create({
        action: "System backup",
        status: "error",
        details: error.message,
        userId: req.user._id,
      });

      res.status(500).json({ error: "Failed to create backup" });
    }
  },

  // Clear system cache
  clearCache: async (req, res) => {
    try {
      // Clear Mongoose connection cache
      mongoose.connection.db
        .collection("cache")
        .drop()
        .catch(() => {});

      // Clear application cache
      global.cache = {};

      // Log the action
      await MaintenanceLog.create({
        action: "Cache cleared",
        status: "success",
        details: "Application and database cache cleared",
        userId: req.user._id,
      });

      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Cache clear error:", error);

      // Log the error
      await MaintenanceLog.create({
        action: "Cache cleared",
        status: "error",
        details: error.message,
        userId: req.user._id,
      });

      res.status(500).json({ error: "Failed to clear cache" });
    }
  },

  // Optimize database
  optimizeDatabase: async (req, res) => {
    try {
      // Get all collections
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      const stats = [];

      // For each collection, we'll remove and recreate indexes
      for (const collection of collections) {
        const coll = mongoose.connection.db.collection(collection.name);

        // Get existing indexes
        const indexes = await coll.indexes();

        // Drop all indexes except _id
        for (const index of indexes) {
          if (index.name !== "_id_") {
            await coll.dropIndex(index.name);
          }
        }

        // Recreate indexes
        for (const index of indexes) {
          if (index.name !== "_id_") {
            await coll.createIndex(index.key, index.options);
          }
        }

        stats.push(`Optimized ${collection.name}`);
      }

      // Log the action
      await MaintenanceLog.create({
        action: "Database optimization",
        status: "success",
        details: `Optimized ${collections.length} collections`,
        userId: req.user._id,
      });

      res.json({
        message: "Database optimization completed successfully",
        details: stats,
      });
    } catch (error) {
      console.error("Database optimization error:", error);

      // Log the error
      await MaintenanceLog.create({
        action: "Database optimization",
        status: "error",
        details: error.message,
        userId: req.user._id,
      });

      res.status(500).json({ error: "Failed to optimize database" });
    }
  },

  // Check for system updates
  checkUpdates: async (req, res) => {
    try {
      const packageJson = await import("../../package.json", {
        assert: { type: "json" },
      });
      const dependencies = {
        ...packageJson.default.dependencies,
        ...packageJson.default.devDependencies,
      };

      const updates = [];
      for (const [pkg, version] of Object.entries(dependencies)) {
        try {
          const response = await fetch(
            `https://registry.npmjs.org/${pkg}/latest`
          );
          const data = await response.json();
          const currentVersion = version.replace(/[^0-9.]/g, "");
          const latestVersion = data.version;

          if (currentVersion !== latestVersion) {
            updates.push({
              package: pkg,
              current: currentVersion,
              latest: latestVersion,
            });
          }
        } catch (err) {
          console.warn(`Failed to check updates for ${pkg}:`, err);
        }
      }

      // Log the action
      await MaintenanceLog.create({
        action: "System update check",
        status: "success",
        details: `Found ${updates.length} updates available`,
        userId: req.user._id,
      });

      res.json({
        message:
          updates.length > 0
            ? `${updates.length} updates available`
            : "System is up to date",
        updates,
      });
    } catch (error) {
      console.error("Update check error:", error);

      // Log the error
      await MaintenanceLog.create({
        action: "System update check",
        status: "error",
        details: error.message,
        userId: req.user._id,
      });

      res.status(500).json({ error: "Failed to check for updates" });
    }
  },

  // Get API statistics
  getApiStats: async (req, res) => {
    try {
      const currentTime = Date.now();
      const uptime = Math.floor((currentTime - apiStats.startTime) / 1000);

      res.json({
        requests: apiStats.requests,
        success: apiStats.success,
        ping: await getPingTime(),
        uptime,
        logs: apiStats.logs,
      });
    } catch (error) {
      console.error("API stats error:", error);
      res.status(500).json({ error: "Failed to get API statistics" });
    }
  },

  // Get maintenance logs
  getLogs: async (req, res) => {
    try {
      // Get the last 100 maintenance logs from MongoDB
      const logs = await MaintenanceLog.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("userId", "name");

      res.json(
        logs.map((log) => ({
          time: new Date(log.createdAt).toLocaleTimeString(),
          action: log.action,
          status: log.status,
          details: log.details,
          user: log.userId?.name || "System",
        }))
      );
    } catch (error) {
      console.error("Logs error:", error);
      res.status(500).json({ error: "Failed to get maintenance logs" });
    }
  },

  // Get user stats
  getUserStats: async (req, res) => {
    try {
      // Fetch users and their corresponding userdata
      const users = await mongoose.connection.db
        .collection("users")
        .find({})
        .toArray();

      console.log('All users:', users.map(u => ({ email: u.email, userType: u.userType })));
      
      const userEmails = users.map((user) => user.email);
      const userDatas = await mongoose.connection.db
        .collection("userdatas")
        .find({ email: { $in: userEmails } })
        .toArray();

      // Create a map of email to userdata for quick lookup
      const userDataMap = new Map(
        userDatas.map((userData) => [userData.email, userData])
      );

      const adminCount = users.filter((user) => user.userType === "Admin").length;
      console.log('Admin count:', adminCount);
      console.log('Admin users:', users.filter(u => u.userType === "Admin").map(u => ({ email: u.email, userType: u.userType })));

      const stats = {
        totalUsers: users.length,
        commuters: users.filter((user) => user.userType === "Commuter").length,
        drivers: users.filter((user) => user.userType === "Driver").length,
        tellers: users.filter((user) => user.userType === "Teller").length,
        administrators: adminCount,
        usersList: users
          .filter((user) => user.userType === "Commuter")
          .map((user) => ({
            name: user.name,
            email: user.email,
            userType: user.userType,
            status: user.status,
            profilePicture:
              userDataMap.get(user.email)?.profilePicture || "/avatar.png",
          })),
      };

      console.log('Stats being sent:', stats);

      res.json(stats);
    } catch (error) {
      console.error("User stats error:", error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  },

  // Create maintenance log
  createLog: async (req, res) => {
    try {
      const { action, status, details } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: "Action is required" });
      }

      const log = await MaintenanceLog.create({
        action,
        status: status || 'success',
        details,
        userId: req.user?._id || null
      });

      res.json({
        success: true,
        log: {
          id: log._id,
          time: new Date(log.createdAt).toLocaleTimeString(),
          action: log.action,
          status: log.status,
          details: log.details,
        }
      });
    } catch (error) {
      console.error("Log creation error:", error);
      res.status(500).json({ error: "Failed to create maintenance log" });
    }
  },
};

// Helper functions
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = Math.round(100 * (1 - idle / total));

  return usage;
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total: Math.round(total / 1024 / 1024),
    used: Math.round(used / 1024 / 1024),
    free: Math.round(free / 1024 / 1024),
    usagePercentage: Math.round((used / total) * 100),
  };
}

function getStorageUsage() {
  return {
    total: "N/A",
    used: "N/A",
    free: "N/A",
    usagePercentage: "N/A",
  };
}

function getSystemUptime() {
  const uptime = os.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  return {
    days,
    hours,
    minutes,
    formatted: `${days}d ${hours}h ${minutes}m`,
    total: uptime,
  };
}

async function getPingTime() {
  const start = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - start;
}

export default maintenanceController;
