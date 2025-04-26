import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/adminService.js';
import '../css/AdministratorDashboardContent.css';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShuttles: 0,
    totalDrivers: 0,
    totalTransactions: 0,
    totalTrips: 0,
    roundTrips: 0,
    activeShuttles: 0,
    totalPassengers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="adm-dashboard">Loading statistics...</div>;
  }

  if (error) {
    return <div className="adm-dashboard">{error}</div>;
  }

  return (
    <div className="adm-dashboard">
      <div className="adm-status-section">
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalUsers}</div>
          <div className="adm-status-card-label">Total Users</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalShuttles}</div>
          <div className="adm-status-card-label">Total Shuttles</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalDrivers}</div>
          <div className="adm-status-card-label">Total Drivers</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalTransactions}</div>
          <div className="adm-status-card-label">Total Transactions</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalTrips}</div>
          <div className="adm-status-card-label">Total Trips</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.roundTrips}</div>
          <div className="adm-status-card-label">Round Trips</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.activeShuttles}</div>
          <div className="adm-status-card-label">Active Shuttles</div>
        </div>
        <div className="adm-status-card">
          <div className="adm-status-card-value">{stats.totalPassengers}</div>
          <div className="adm-status-card-label">Total Passengers</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats; 