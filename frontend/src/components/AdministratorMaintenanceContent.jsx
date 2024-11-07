/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import '../css/AdministratorMaintenanceContent.css';

const AdministratorMaintenanceContent = () => {
  const [users, setUsers] = useState([]); // State to hold the list of users

  // Fetch users from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/admin/users');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setUsers(data); // Set the fetched users
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array to run this once on component mount

  const apiData = {
    requests: 1065,
    success: 1007,
    ping: 47.2,
    logs: [
      { time: '6:19 PM', result: 'success' },
      { time: '6:17 PM', result: 'paymentId: 1218. granted' },
      { time: '6:15 PM', result: 'denied' },
    ],
  };

  const stats = {
    users: 157,
    drivers: 21,
    tellers: 12,
  };

  const groups = ['Commuters', 'Tellers', 'Administrators', 'Drivers'];

  return (
    <div className="AdministratorMaintenance-maintenance-content">
      {/* API and Stats Panels */}
      <div className="AdministratorMaintenance-top-panels">
        <div className="AdministratorMaintenance-api-panel">
          <h3>API</h3>
          <div className="AdministratorMaintenance-api-stats">
            <div>
              <span>{apiData.requests}</span>
              <p>Requests</p>
            </div>
            <div>
              <span>{apiData.success}</span>
              <p>Success</p>
            </div>
            <div>
              <span>{apiData.ping}</span>
              <p>Ping</p>
            </div>
          </div>
          <div className="AdministratorMaintenance-api-log">
            {apiData.logs.map((log, index) => (
              <p key={index}>
                {log.time} - result: {log.result}
              </p>
            ))}
            <p className="AdministratorMaintenance-last-update">Last Update: 6:19 PM</p>
          </div>
        </div>

        <div className="AdministratorMaintenance-stats-panel">
          <h3>Stats</h3>
          <div className="AdministratorMaintenance-stats-details">
            <div>
              <span>{stats.users}</span>
              <p>Users</p>
            </div>
            <div>
              <span>{stats.drivers}</span>
              <p>Drivers</p>
            </div>
            <div>
              <span>{stats.tellers}</span>
              <p>Teller</p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="AdministratorMaintenance-control-panel">
          <button className="AdministratorMaintenance-control-btn play">&#9654;</button>
          <button className="AdministratorMaintenance-control-btn pause">&#10074;&#10074;</button>
          <button className="AdministratorMaintenance-control-btn refresh">&#8635;</button>
          <button className="AdministratorMaintenance-control-btn key">&#128273;</button>
        </div>
      </div>

      {/* Users and Groups Panels */}
      <div className="AdministratorMaintenance-bottom-panels">
        <div className="AdministratorMaintenance-users-panel">
          <h3>Users</h3>
          <div className="AdministratorMaintenance-user-list">
            {users.map((user, index) => (
              <div key={index} className="AdministratorMaintenance-user-item">
                <img src="/avatar.png" alt="User Avatar" className="AdministratorMaintenance-user-avatar" />
                <p>{user.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="AdministratorMaintenance-group-panel">
          <h3>Group</h3>
          <ul>
            {groups.map((group, index) => (
              <li key={index}>
                <span className="AdministratorMaintenance-group-icon">&#128100;</span> {group}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdministratorMaintenanceContent;
