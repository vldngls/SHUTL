import React from 'react';
import '../css/AdministratorShuttleManagementContent.css';

const AdministratorShuttleManagementContent = () => {
  const drivers = [
    { name: 'Juan A', shuttleId: 'Shuttle 001', username: 'shuttle123', password: '*****', status: 'green' },
    { name: 'John B', shuttleId: 'Shuttle 002', username: 'shuttle234', password: '*****', status: 'green' },
    { name: 'Mark C', shuttleId: 'Shuttle 003', username: 'shuttle345', password: '*****', status: 'yellow' },
  ];

  return (
    <div className="AdministratorShuttleManagement-shuttle-management-content">
      {/* Assigned Drivers Table */}
      <div className="AdministratorShuttleManagement-assigned-drivers-table">
        <h3>Assigned drivers</h3>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Shuttle ID</th>
              <th>Login username</th>
              <th>Login password</th>
              <th>
                <button className="AdministratorShuttleManagement-action-btn AdministratorShuttleManagement-edit-btn">✏️</button>
                <button className="AdministratorShuttleManagement-action-btn AdministratorShuttleManagement-delete-btn">🗑️</button>
                <button className="AdministratorShuttleManagement-action-btn AdministratorShuttleManagement-add-btn">➕</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, index) => (
              <tr key={index}>
                <td>{driver.name}</td>
                <td>{driver.shuttleId}</td>
                <td>{driver.username}</td>
                <td>{driver.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Driver Status Section */}
      <div className="AdministratorShuttleManagement-assigned-drivers-status">
        <h3>Assigned drivers</h3>
        {drivers.map((driver, index) => (
          <div key={index} className="AdministratorShuttleManagement-driver-status">
            <span className={`AdministratorShuttleManagement-status-circle ${driver.status}`}></span>
            <span>{driver.name}</span>
            <div className="AdministratorShuttleManagement-status-buttons">
              <button className="AdministratorShuttleManagement-status-btn">Dispatch</button>
              <button className="AdministratorShuttleManagement-status-btn">Idle</button>
              <button className="AdministratorShuttleManagement-status-btn">Pull out</button>
            </div>
          </div>
        ))}
      </div>

      {/* Automated Messages Section */}
      <div className="AdministratorShuttleManagement-automated-messages">
        <h3>Automated messages</h3>
        <div className="AdministratorShuttleManagement-message-box">
          <select className="AdministratorShuttleManagement-message-select">
            <option value="driver">Driver</option>
            {/* Add more options if needed */}
          </select>
          <div className="AdministratorShuttleManagement-message-list">
            <div className="AdministratorShuttleManagement-message-row">
              <span>Emergency</span>
              <button className="AdministratorShuttleManagement-message-action-btn">Call</button>
            </div>
            <div className="AdministratorShuttleManagement-message-row">
              <span>Full passenger</span>
              <button className="AdministratorShuttleManagement-message-action-btn">Dispatch alert</button>
            </div>
            <div className="AdministratorShuttleManagement-message-row">
              <span>Action</span>
              <button className="AdministratorShuttleManagement-message-action-btn">Action</button>
            </div>
            <div className="AdministratorShuttleManagement-message-row">
              <span>Action</span>
              <button className="AdministratorShuttleManagement-message-action-btn">Action</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorShuttleManagementContent;
