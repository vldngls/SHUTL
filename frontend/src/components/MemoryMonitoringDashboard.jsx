// frontend/src/components/MemoryMonitoringDashboard.jsx
import React, { useEffect, useState } from "react";
import { MemoryMonitor } from "../utils/memoryMonitor";
import "../css/MemoryMonitoringDashboard.css";

export const MemoryMonitoringDashboard = () => {
  const [memoryStats, setMemoryStats] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      const stats = await MemoryMonitor.getMemoryUsage();
      setMemoryStats(stats);
    };

    const intervalId = setInterval(updateStats, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!memoryStats) return null;

  return (
    <div className={`memory-dashboard ${showDashboard ? "expanded" : ""}`}>
      <button
        className="toggle-button"
        onClick={() => setShowDashboard(!showDashboard)}
      >
        {showDashboard ? "Hide Memory Stats" : "Show Memory Stats"}
      </button>
      {showDashboard && (
        <div className="stats-container">
          <h3>Memory Usage</h3>
          <div className="stat-row">
            <span>Used:</span>
            <span>{(memoryStats.used / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="stat-row">
            <span>Total:</span>
            <span>{(memoryStats.total / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="stat-row">
            <span>Usage:</span>
            <span className={memoryStats.percent > 80 ? "warning" : ""}>
              {memoryStats.percent.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
