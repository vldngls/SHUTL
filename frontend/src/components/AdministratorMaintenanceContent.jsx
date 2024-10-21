// src/components/adminComponents/AdministratorMaintenanceContent.jsx
import React from 'react';
import '../css/AdministratorMaintenanceContent.css'; // Ensure to style properly

const AdministratorMaintenanceContent = () => {
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

  const users = [
    { name: 'Angeles, Vlyde Alec P.' },
    { name: 'Fuentes, Dolcielo B.' },
    { name: 'Sacman, Lebrone James' },
    { name: 'Dominguez, Erica Therese B.' },
    { name: 'Cortez, James A.' },
  ];

  const groups = ['Commuters', 'Tellers', 'Administrators', 'Drivers'];

  return (
    <div className="maintenance-content">
      {/* API and Stats Panels */}
      <div className="top-panels">
        <div className="api-panel">
          <h3>API</h3>
          <div className="api-stats">
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
          <div className="api-log">
            {apiData.logs.map((log, index) => (
              <p key={index}>
                {log.time} - result: {log.result}
              </p>
            ))}
            <p className="last-update">Last Update: 6:19 PM</p>
          </div>
        </div>

        <div className="stats-panel">
          <h3>Stats</h3>
          <div className="stats-details">
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
        <div className="control-panel">
          <button className="control-btn play">&#9654;</button>
          <button className="control-btn pause">&#10074;&#10074;</button>
          <button className="control-btn refresh">&#8635;</button>
          <button className="control-btn key">&#128273;</button>
        </div>
      </div>

      {/* Users and Groups Panels */}
      <div className="bottom-panels">
        <div className="users-panel">
          <h3>Users</h3>
          <div className="user-list">
            {users.map((user, index) => (
              <div key={index} className="user-item">
                <img src="/avatar.png" alt="User Avatar" className="user-avatar" />
                <p>{user.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="group-panel">
          <h3>Group</h3>
          <ul>
            {groups.map((group, index) => (
              <li key={index}>
                <span className="group-icon">&#128100;</span> {group}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdministratorMaintenanceContent;
