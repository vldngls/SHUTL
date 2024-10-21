// src/components/adminComponents/AdministratorFareContent.jsx
import React from 'react';
import '../css/AdministratorFareContent.css';

const AdministratorFareContent = () => {
  const fareMatrix = [
    { id: 1, fare: 'Regular', price: 'PHP 30.00' },
    { id: 2, fare: 'Senior Citizen', price: 'PHP 26.00' },
    { id: 3, fare: 'Student', price: 'PHP 26.00' },
  ];

  const activities = [
    { time: '6:29 PM', trip: 'TRIP 014', shuttle: 'SHUTL. 001' },
    { time: '6:01 PM', trip: 'TRIP 011', shuttle: 'SHUTL. 002' },
    { time: '6:01 PM', trip: 'TRIP 008', shuttle: 'SHUTL. 003' },
  ];

  return (
    <div className="fares-content">
      {/* Fare Matrix */}
      <div className="fare-matrix">
        <h3>Fare Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>FARE</th>
              <th>PRICE</th>
              <th>EDIT</th>
            </tr>
          </thead>
          <tbody>
            {fareMatrix.map((fare, index) => (
              <tr key={index}>
                <td>{fare.id}</td>
                <td>{fare.fare}</td>
                <td>{fare.price}</td>
                <td>
                  <button className="edit-btn">✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-btn">+ Add</button>
      </div>

      {/* Fare Statistics */}
      <div className="fare-statistics">
        <div className="api-stats">
          <h4>Fare Matrix</h4>
          <p>13/08/2024</p>
          <p>Mapbox API</p>
          <h2>6,237</h2>
          <p>as of 12:42 PM</p>
        </div>
        <div className="fare-breakdown">
          <h4>Breakdown</h4>
          <p>Regular: PHP 6,XXX.00</p>
          <p>Discounted: PHP 1,XXX.00</p>
        </div>
      </div>

      {/* Activity */}
      <div className="activity-feed">
        <h4>Activity</h4>
        <ul>
          {activities.map((activity, index) => (
            <li key={index}>
              <span className="activity-icon">💰</span> {activity.shuttle} posted {activity.trip}.
              <span className="activity-time">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdministratorFareContent;
