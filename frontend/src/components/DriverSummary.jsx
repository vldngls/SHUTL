import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../css/DriverSummary.css";
import { getTokenFromCookies } from '../utils/tokenUtils';

const DriverSummary = ({ onClose }) => {
  const [shuttleDetails, setShuttleDetails] = useState(null);
  const [trips, setTrips] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const socket = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SOCKET_URL = API_BASE_URL.replace("/api", "");

  useEffect(() => {
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.current.on("connect", () => {
      console.log("Socket connected in DriverSummary");
    });

    socket.current.on("pickup_request", (request) => {
      console.log("Received pickup request:", request);
      setPickupRequests(prev => [...prev, request]);
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [SOCKET_URL]);

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
        <h3>Pickup Requests</h3>
        {pickupRequests.length > 0 ? (
          <div className="pickup-requests-list">
            {pickupRequests.map((request, index) => (
              <div key={index} className="pickup-request-item">
                <p>Pickup Request at {new Date(request.timestamp).toLocaleTimeString()}</p>
                <p>ETA: {request.eta} minutes</p>
                <button onClick={() => {
                  setPickupRequests(prev => prev.filter((_, i) => i !== index));
                  socket.current.emit("pickup_accepted", request);
                }}>
                  Accept
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No pickup requests</p>
        )}
      </div>
    </div>
  );
};

export default DriverSummary;
