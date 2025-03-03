// Memory Monitor Utility
const MAX_SNAPSHOTS = 100;
const DEFAULT_INTERVAL = 30000; // 30 seconds
const LEAK_DETECTION_THRESHOLD = 10; // 10% growth over 5 consecutive readings

let memorySnapshots = [];
let monitoringInterval = null;
let isMonitoring = false;
let leakDetectionEnabled = false;

const formatSize = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;

const takeMemorySnapshot = () => {
  if (!window?.performance?.memory) {
    console.warn("Memory API not available in this browser");
    return null;
  }

  const memory = window.performance.memory;
  const snapshot = {
    timestamp: Date.now(),
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };

  memorySnapshots.push(snapshot);
  if (memorySnapshots.length > MAX_SNAPSHOTS) {
    memorySnapshots.shift();
  }

  return snapshot;
};

const formatMemoryUsage = (snapshot) => {
  if (!snapshot) return "Memory data not available";

  return [
    `Used: ${formatSize(snapshot.usedJSHeapSize)}`,
    `Total: ${formatSize(snapshot.totalJSHeapSize)}`,
    `Limit: ${formatSize(snapshot.jsHeapSizeLimit)}`,
    `Usage: ${snapshot.usagePercentage.toFixed(2)}%`,
  ].join(" | ");
};

const detectMemoryLeaks = () => {
  if (memorySnapshots.length < 5) return;

  const recentSnapshots = memorySnapshots.slice(-5);
  const firstSnapshot = recentSnapshots[0];
  const lastSnapshot = recentSnapshots[4];

  const growthPercentage =
    ((lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize) /
      firstSnapshot.usedJSHeapSize) *
    100;

  const consistentGrowth = recentSnapshots.every(
    (snapshot, index) =>
      index === 0 ||
      snapshot.usedJSHeapSize > recentSnapshots[index - 1].usedJSHeapSize
  );

  if (consistentGrowth && growthPercentage > LEAK_DETECTION_THRESHOLD) {
    console.warn(
      `Potential memory leak detected! Memory grew by ${growthPercentage.toFixed(
        2
      )}% over last 5 measurements`
    );
    console.warn("Memory trend:", recentSnapshots.map(formatMemoryUsage));

    if (typeof window.gc === "function") {
      console.log("Suggesting garbage collection...");
      window.gc();
    }
  }
};

const startMemoryMonitoring = (options = {}) => {
  const { interval = DEFAULT_INTERVAL, detectLeaks = false } = options;

  if (isMonitoring) {
    stopMemoryMonitoring();
  }

  isMonitoring = true;
  leakDetectionEnabled = detectLeaks;

  const initialSnapshot = takeMemorySnapshot();
  if (initialSnapshot) {
    console.log(
      "Memory monitoring started:",
      formatMemoryUsage(initialSnapshot)
    );
  }

  monitoringInterval = setInterval(() => {
    const snapshot = takeMemorySnapshot();
    if (snapshot) {
      if (memorySnapshots.length % 5 === 0) {
        console.log("Memory usage:", formatMemoryUsage(snapshot));
      }

      if (leakDetectionEnabled && memorySnapshots.length >= 5) {
        detectMemoryLeaks();
      }
    }
  }, interval);

  return initialSnapshot;
};

const stopMemoryMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    isMonitoring = false;
    console.log("Memory monitoring stopped");
  }
};

const getMemoryTrend = () => {
  if (memorySnapshots.length < 2) {
    return { trend: "insufficient data", snapshots: memorySnapshots };
  }

  const first = memorySnapshots[0];
  const last = memorySnapshots[memorySnapshots.length - 1];
  const growthMB = (last.usedJSHeapSize - first.usedJSHeapSize) / 1048576;
  const growthPercentage =
    ((last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize) * 100;
  const timeSpanMinutes = (last.timestamp - first.timestamp) / 60000;

  let trend = "stable";
  if (growthPercentage > 20) {
    trend = "significant growth";
  } else if (growthPercentage > 5) {
    trend = "moderate growth";
  } else if (growthPercentage < -5) {
    trend = "decreasing";
  }

  return {
    trend,
    growthMB: growthMB.toFixed(2),
    growthPercentage: growthPercentage.toFixed(2),
    timeSpanMinutes: timeSpanMinutes.toFixed(2),
    snapshots: memorySnapshots.length,
    currentUsage: formatMemoryUsage(last),
  };
};

const logMemoryTrend = () => {
  const trend = getMemoryTrend();
  console.log("Memory usage trend analysis:");
  console.log(`- Trend: ${trend.trend}`);
  console.log(`- Growth: ${trend.growthMB} MB (${trend.growthPercentage}%)`);
  console.log(`- Time span: ${trend.timeSpanMinutes} minutes`);
  console.log(`- Current usage: ${trend.currentUsage}`);
  return trend;
};

const cleanupMemoryMonitor = () => {
  stopMemoryMonitoring();
  memorySnapshots = [];
};

export {
  takeMemorySnapshot,
  formatMemoryUsage,
  startMemoryMonitoring,
  stopMemoryMonitoring,
  getMemoryTrend,
  logMemoryTrend,
  cleanupMemoryMonitor,
};
