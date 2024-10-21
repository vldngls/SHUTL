// src/components/adminComponents/AdministratorShuttlesRoutesContent.jsx
import React from 'react';
import '../css/AdministratorShuttlesRoutesContent.css';

const AdministratorShuttlesRoutesContent = () => {
  const shuttleData = [
    { status: 'green', busName: 'SHUTL. 001', deploymentTime: '23 mins', routeTime: '40 mins', driver: 'Salceda A.', location: 'Acosta Street', avgPassengers: '11.7 pax' },
    { status: 'green', busName: 'SHUTL. 002', deploymentTime: '30 mins', routeTime: '48 mins', driver: 'Salceda A.', location: 'Madrid Street', avgPassengers: '11.7 pax' },
    { status: 'yellow', busName: 'SHUTL. 003', deploymentTime: '-', routeTime: '-', driver: '-', location: 'Vistamall DH', avgPassengers: '-' },
  ];

  const routeData = [
    { status: 'green', routeName: 'Vistamall Daang Hari - Camella Daang Hari', shuttles: 3, totalPassengers: '176 pax', avgRouteTime: '1hr 21mins', trips: 76 },
  ];

  return (
    <div className="shuttles-routes-content">
      {/* Summary Section */}
      <div className="summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div>
            <span>287</span>
            <p>Passengers</p>
          </div>
          <div>
            <span>32</span>
            <p>Trips</p>
          </div>
          <div>
            <span>44 min</span>
            <p>Duration</p>
          </div>
        </div>
        <div className="logs">
          <p>6:19 PM - result: success.</p>
          <p>6:17 PM - paymentId: 1218. granted.</p>
          <p>6:15 PM - result: denied.</p>
        </div>
        <button className="refresh-btn">🔄</button>
      </div>

      {/* Shuttles Section */}
      <div className="shuttles">
        <h3>Shuttles</h3>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Bus Name</th>
              <th>Deployment Time</th>
              <th>Route Time</th>
              <th>Driver</th>
              <th>Current Location</th>
              <th>Average Passengers</th>
            </tr>
          </thead>
          <tbody>
            {shuttleData.map((shuttle, index) => (
              <tr key={index}>
                <td><span className={`status-circle ${shuttle.status}`}></span></td>
                <td>{shuttle.busName}</td>
                <td>{shuttle.deploymentTime}</td>
                <td>{shuttle.routeTime}</td>
                <td>{shuttle.driver}</td>
                <td>{shuttle.location}</td>
                <td>{shuttle.avgPassengers}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-btn">+ Add</button>
      </div>

      {/* Routes Section */}
      <div className="routes">
        <h3>Routes</h3>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Route Name</th>
              <th>Shuttles</th>
              <th>Total Passenger</th>
              <th>Avg. Route Time</th>
              <th>Trips</th>
            </tr>
          </thead>
          <tbody>
            {routeData.map((route, index) => (
              <tr key={index}>
                <td><span className={`status-circle ${route.status}`}></span></td>
                <td>{route.routeName}</td>
                <td>{route.shuttles}</td>
                <td>{route.totalPassengers}</td>
                <td>{route.avgRouteTime}</td>
                <td>{route.trips}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-btn">+ Add</button>
      </div>
    </div>
  );
};

export default AdministratorShuttlesRoutesContent;
