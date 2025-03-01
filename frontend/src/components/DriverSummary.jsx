import React, { useState, useEffect } from "react";
import "../css/DriverSummary.css";
import { getTokenFromCookies } from "../utils/tokenUtils";

const DriverSummary = ({
  onClose,
  pickupRequests,
  activePickups,
  onAcceptPickup,
  onCompletePickup,
  onCancelPickup,
}) => {
  const [shuttleDetails, setShuttleDetails] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchAssignedShuttle = async () => {
      try {
        const token = getTokenFromCookies();
        // Get the driver's assigned shuttle
        const response = await fetch(
          `${API_BASE_URL}/shuttle-assignments/driver`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.shuttleId) {
          // Fetch shuttle stats and fare transactions for this shuttle
          const [statsResponse, fareResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/shuttle/stats`, {
              credentials: "include",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(
              `${API_BASE_URL}/fare-transactions?shuttleID=${data.shuttleId}`,
              {
                credentials: "include",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),
          ]);

          const [statsData, fareData] = await Promise.all([
            statsResponse.json(),
            fareResponse.json(),
          ]);

          // Calculate total earnings from fare transactions
          const earnings = fareData.reduce(
            (total, transaction) => total + transaction.totalFare,
            0
          );
          setTotalEarnings(earnings);

          // Get stats for this specific shuttle
          const shuttleStats = statsData[data.shuttleId] || {
            totalPassengers: 0,
            roundTrips: 0,
          };

          // Set shuttle details
          setShuttleDetails({
            shuttleId: data.shuttleId,
            roundTrips: shuttleStats.roundTrips,
            totalPassengers: shuttleStats.totalPassengers,
            inTrips: shuttleStats.inTrips || shuttleStats.roundTrips,
            outTrips: shuttleStats.outTrips || shuttleStats.roundTrips,
            averagePassengers: shuttleStats.averagePassengers || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching assigned shuttle:", error);
      }
    };

    fetchAssignedShuttle();

    // Fetch data every 5 seconds
    const interval = setInterval(fetchAssignedShuttle, 5000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  return (
    <div className="DriverSummary">
      <div className="DriverSummary-header">
        <h2>Shuttle Summary</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {shuttleDetails && (
        <div className="DriverSummary-section">
          <h3>SHUTL {shuttleDetails.shuttleId}</h3>
          <div className="DriverSummary-stats">
            <div>
              <strong>{shuttleDetails.roundTrips}</strong>
              <br />
              Round Trips
            </div>
            <div>
              <strong>{shuttleDetails.inTrips}</strong>
              <br />
              In Trips
            </div>
            <div>
              <strong>{shuttleDetails.outTrips}</strong>
              <br />
              Out Trips
            </div>
            <div>
              <strong>{shuttleDetails.totalPassengers}</strong>
              <br />
              Total Passengers
            </div>
            <div>
              <strong>{shuttleDetails.averagePassengers}</strong>
              <br />
              Avg. Passengers
            </div>
            <div>
              <strong>₱{totalEarnings.toFixed(2)}</strong>
              <br />
              Total Earnings
            </div>
          </div>
        </div>
      )}

      <div className="DriverSummary-pickup-requests">
        <h3>Pending Pickup Requests</h3>
        {pickupRequests.length > 0 ? (
          pickupRequests.map((request) => (
            <div key={request.requestId} className="pickup-request-item">
              <p>Location: {request.location.streetName}</p>
              <button onClick={() => onAcceptPickup(request)}>Accept</button>
            </div>
          ))
        ) : (
          <p className="no-requests">No pending pickup requests</p>
        )}
      </div>

      <div className="DriverSummary-active-pickups">
        <h3>Active Pickups</h3>
        {activePickups.length > 0 ? (
          activePickups.map((pickup) => (
            <div key={pickup.requestId} className="active-pickup-item">
              <p>Location: {pickup.location.streetName}</p>
              <div className="pickup-buttons">
                <button onClick={() => onCompletePickup(pickup)}>
                  Complete
                </button>
                <button onClick={() => onCancelPickup(pickup)}>Cancel</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-pickups">No active pickups</p>
        )}
      </div>
    </div>
  );
};

export default DriverSummary;
