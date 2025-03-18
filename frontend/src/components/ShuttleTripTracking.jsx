ShuttleTripTracking

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import axios from "axios";
import "../css/ShuttleTripTracking.css"; // Import the CSS file

const ShuttleTripTracking = ({ onClose, socket, shuttleId }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [tripData, setTripData] = useState({
    date: new Date().toLocaleDateString("en-CA"),
    time: getCurrentTime(),
    shuttleNumber: "",
    driver: "",
    status: "Out",
    passengerCount: 0,
    roundTripId: "",
  });

  const [pendingOutTrips, setPendingOutTrips] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [shuttleDetails, setShuttleDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationalHours, setOperationalHours] = useState(null);
  const [isWithinHours, setIsWithinHours] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 5;

  const showToast = (message, type = "info") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  };

  useEffect(() => {
    if (!socket) {
      showToast("Socket connection not available", "error");
      return;
    }

    socket.on("trip_created", (data) => {
      showToast("New trip created successfully", "success");
      setPendingOutTrips((prev) => [...prev, data]);
    });

    socket.on("trip_updated", (data) => {
      showToast(`Trip ${data.tripId} updated successfully`, "success");
      setPendingOutTrips((prev) =>
        prev.map((trip) => (trip._id === data.tripId ? data : trip))
      );
    });

    socket.on("trip_error", (error) => {
      showToast(error.message || "An error occurred with the trip", "error");
    });

    return () => {
      socket.off("trip_created");
      socket.off("trip_updated");
      socket.off("trip_error");
    };
  }, [socket]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingTripsRes, recentTripsRes, operationalHoursRes, shuttleDetailsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/shuttle/pending-trips`).catch((error) => {
          console.error("Error fetching pending trips:", error);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/shuttle/recent-trips`).catch((error) => {
          console.error("Error fetching recent trips:", error);
          return { data: [] };
        }),
        axios.get(`${API_BASE_URL}/operational-hours`).catch((error) => {
          console.error("Error fetching operational hours:", error);
          return { data: null };
        }),
        axios.get(`${API_BASE_URL}/shuttle-details/shuttles`).catch((error) => {
          console.error("Error fetching shuttle details:", error);
          return { data: [] };
        }),
      ]);

      setPendingOutTrips(pendingTripsRes.data);
      setRecentTrips(recentTripsRes.data);
      setOperationalHours(operationalHoursRes.data);
      setShuttleDetails(shuttleDetailsRes.data.shuttles || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getShuttleDetails = (shuttleNumber) => {
    return shuttleDetails.find((shuttle) => shuttle.shuttleId === shuttleNumber) || {};
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const currentTrips = recentTrips.slice(
    (currentPage - 1) * tripsPerPage,
    currentPage * tripsPerPage
  );

  return (
    <div className="TellerMain-TripTracking-popup" onClick={(e) => e.target.className === "TellerMain-TripTracking-popup" && onClose()}>
      <div className="shuttle-tracking-container">
        <div className="tables-section">
          <div className="pending-trips-table">
            <h3>Pending Out Trips</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Shuttle Number</th>
                  <th>Driver</th>
                  <th>Passengers</th>
                </tr>
              </thead>
              <tbody>
                {pendingOutTrips.map((trip) => (
                  <tr key={trip._id}>
                    <td>{trip.time}</td>
                    <td>{trip.shuttleNumber}</td>
                    <td>{trip.driver}</td>
                    <td>{trip.passengerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingOutTrips.length === 0 && <p className="no-pending">No pending out trips</p>}
          </div>

          <div className="recent-trips-table">
            <h3>Recent Trips with Shuttle Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Shuttle Number</th>
                  <th>License Plate</th>
                  <th>Year Model</th>
                  <th>Current Location</th>
                  <th>Status</th>
                  <th>Driver</th>
                  <th>Passengers</th>
                </tr>
              </thead>
              <tbody>
                {currentTrips.map((trip) => {
                  const shuttleInfo = getShuttleDetails(trip.shuttleNumber);
                  return (
                    <tr key={trip._id}>
                      <td>{trip.time}</td>
                      <td>{trip.shuttleNumber}</td>
                      <td>{shuttleInfo.licensePlate || "N/A"}</td>
                      <td>{shuttleInfo.yearModel || "N/A"}</td>
                      <td>{shuttleInfo.currentLocation || "N/A"}</td>
                      <td>
                        <span className={`status-badge ${shuttleInfo.status ? shuttleInfo.status.toLowerCase() : "unknown"}`}>
                          {shuttleInfo.status || "Unknown"}
                        </span>
                      </td>
                      <td>{trip.driver}</td>
                      <td>{trip.passengerCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Array.from({ length: Math.ceil(recentTrips.length / tripsPerPage) }, (_, i) => i + 1).map((pageNumber) => (
            <button key={pageNumber} onClick={() => handlePageChange(pageNumber)} className={pageNumber === currentPage ? "active" : ""}>
              {pageNumber}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="TellerMain-close-popup-btn">
        Close
      </button>
    </div>
  );
};

ShuttleTripTracking.propTypes = {
  onClose: PropTypes.func.isRequired,
  socket: PropTypes.object,
  shuttleId: PropTypes.string,
};

export default ShuttleTripTracking;
