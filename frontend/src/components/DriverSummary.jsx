import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../css/DriverSummary.css";
import { getTokenFromCookies } from '../utils/tokenUtils';

const DriverSummary = ({ 
  onClose, 
  pickupRequests, 
  activePickups, 
  onAcceptPickup, 
  onCompletePickup, 
  onCancelPickup 
}) => {
  const [shuttleDetails, setShuttleDetails] = useState(null);
  const socket = useRef(null);
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
          setShuttleDetails({
            roundTrips: tripsData.length,
            totalPassengers: tripsData.reduce((sum, trip) => sum + (trip.passengerCount || 0), 0),
            inTrips: tripsData.filter(trip => trip.status === "In").length,
            outTrips: tripsData.filter(trip => trip.status === "Out").length
          });
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
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {shuttleDetails && (
        <div className="DriverSummary-section">
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
                <button onClick={() => onCompletePickup(pickup)}>Complete</button>
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
