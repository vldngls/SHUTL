import React, { useState, useEffect } from "react";
import "../css/DriverSummary.css";
import { getTokenFromCookies } from '../utils/tokenUtils';

const DriverSummary = ({ onClose }) => {
  const [shuttleDetails, setShuttleDetails] = useState(null);
  const [trips, setTrips] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchAssignedShuttle = async () => {
      try {
        const token = getTokenFromCookies();
        const response = await fetch(`${API_BASE_URL}/shuttle-assignments/driver`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.shuttleId) {
          // Fetch shuttle trips for this shuttle
          const tripsResponse = await fetch(`${API_BASE_URL}/shuttle/trips?shuttleNumber=${data.shuttleId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const tripsData = await tripsResponse.json();
          setTrips(tripsData);

          // Calculate summary
          const summary = {
            roundTrips: tripsData.length,
            totalPassengers: tripsData.reduce((sum, trip) => sum + (trip.passengerCount || 0), 0),
            inTrips: tripsData.filter(trip => trip.status === "In").length,
            outTrips: tripsData.filter(trip => trip.status === "Out").length
          };
          
          setShuttleDetails(summary);
        }
      } catch (error) {
        console.error("Error fetching assigned shuttle:", error);
      }
    };

    fetchAssignedShuttle();
  }, [API_BASE_URL]);

  return (
    <div className="DriverSummary">
      <div className="DriverSummary-header">
        <h2>Shuttle Summary</h2>
        <button onClick={onClose} className="DriverSummary-close-btn">X</button>
      </div>

      {shuttleDetails && (
        <div className="DriverSummary-section">
          <div className="DriverSummary-stats">
            <div>
              <strong>{shuttleDetails.roundTrips}</strong>
              <span>
                Round Trips
              </span>
            </div>
            <div>
              <strong>{shuttleDetails.inTrips}</strong>
              <span>
                In Trips
              </span>
            </div>
            <div>
              <strong>{shuttleDetails.outTrips}</strong>
              <span>
                Out Trips
              </span>
            </div>
            <div>
              <strong>{shuttleDetails.totalPassengers}</strong>
              <span>
                Total Passengers
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSummary;
