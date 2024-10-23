import React from 'react';
import '../css/AdministratorTransactionsContent.css';

const AdministratorTransactionsContent = () => {
  const payments = [
    // Example data structure
    // { transactionId: '001', shuttleId: 'Shuttle 001', regular: 'PHP 200', discounted: 'PHP 100', total: 'PHP 300' }
  ];

  const shuttleTrips = [
    // Example data structure
    // { shuttleId: 'Shuttle 001', time: '10:30 AM', passengerCount: 12, driver: 'Salcedo A.' }
  ];

  return (
    <div className="AdministratorTransactions-transactions-content">
      {/* Payments Section */}
      <div className="AdministratorTransactions-payments-section">
        <h3>Payments</h3>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Shuttle ID</th>
              <th>Regular</th>
              <th>Discounted</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.transactionId}</td>
                  <td>{payment.shuttleId}</td>
                  <td>{payment.regular}</td>
                  <td>{payment.discounted}</td>
                  <td>{payment.total}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="AdministratorTransactions-no-data">No payment data available</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="AdministratorTransactions-table-actions">
          <button className="AdministratorTransactions-edit-btn">✏️</button>
          <button className="AdministratorTransactions-add-btn">➕</button>
        </div>
      </div>

      {/* Shuttle Trips Section */}
      <div className="AdministratorTransactions-shuttle-trips-section">
        <h3>Shuttle Trips</h3>
        <table>
          <thead>
            <tr>
              <th>Shuttle ID</th>
              <th>Time</th>
              <th>Passenger Count</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {shuttleTrips.length > 0 ? (
              shuttleTrips.map((trip, index) => (
                <tr key={index}>
                  <td>{trip.shuttleId}</td>
                  <td>{trip.time}</td>
                  <td>{trip.passengerCount}</td>
                  <td>{trip.driver}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="AdministratorTransactions-no-data">No shuttle trip data available</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="AdministratorTransactions-table-actions">
          <button className="AdministratorTransactions-edit-btn">✏️</button>
          <button className="AdministratorTransactions-add-btn">➕</button>
        </div>
      </div>
    </div>
  );
};

export default AdministratorTransactionsContent;
