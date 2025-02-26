export class MemoryMonitor {
  static instance = null;
  static memoryHistory = [];
  static maxHistoryLength = 100;
  static warningThreshold = 80; // 80% of available memory

  static getInstance() {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  static async getMemoryUsage() {
    if ("memory" in performance) {
      const memory = performance.memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.jsHeapSizeLimit;
      const percentUsed = (usedMemory / totalMemory) * 100;

      // Store in history
      MemoryMonitor.memoryHistory.push({
        timestamp: Date.now(),
        usedMemory,
        percentUsed,
      });

      // Keep history length in check
      if (MemoryMonitor.memoryHistory.length > MemoryMonitor.maxHistoryLength) {
        MemoryMonitor.memoryHistory.shift();
      }

      return {
        used: usedMemory,
        total: totalMemory,
        percent: percentUsed,
      };
    }
    return null;
  }

  static startMonitoring(interval = 30000) {
    const monitor = setInterval(async () => {
      const usage = await MemoryMonitor.getMemoryUsage();
      if (usage && usage.percent > MemoryMonitor.warningThreshold) {
        console.warn(`High memory usage: ${usage.percent.toFixed(2)}%`);
        // Trigger garbage collection hint
        if (global.gc) {
          global.gc();
        }
      }
    }, interval);
    return monitor;
  }

  static getMemoryHistory() {
    return MemoryMonitor.memoryHistory;
  }
}
