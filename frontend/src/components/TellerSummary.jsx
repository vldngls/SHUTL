import React, { useState, useEffect, useRef } from "react";
import "../css/TellerSummary.css";
import ShuttleDetails from "./ShuttleDetails"; // Import ShuttleDetails component
import axios from "axios";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { io } from "socket.io-client";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { connectSocket } from "../utils/websocketService";
import { reverseGeocode } from "../utils/locationUtils";
import { useOptimizedLocations } from "../hooks/useOptimizedLocations";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

const TellerSummary = ({ onClose, shuttleLocations }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null); // State to handle open modal
  const [roundTrips, setRoundTrips] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [activeShuttles, setActiveShuttles] = useState(0);
  const [routeMetrics, setRouteMetrics] = useState({});
  const [hourlyPassengers, setHourlyPassengers] = useState(
    new Array(17).fill(0)
  );
  const [shuttleStats, setShuttleStats] = useState({});
  const [shuttleAssignments, setShuttleAssignments] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [operationalHours, setOperationalHours] = useState({
    startTime: "05:00",
    endTime: "22:00",
  });
  const [earningsData, setEarningsData] = useState({
    regular: 0,
    discounted: 0,
  });
  const [streetNames, setStreetNames] = useState({});
  const geocodeTimeoutRef = useRef(null);
  const optimizedLocations = useOptimizedLocations(shuttleLocations);

  // Helper function to get auth token
  const getAuthToken = () => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    return getCookie("token");
  };

  // Helper function to create axios config with auth header
  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    };
  };

  // Log the received locations for debugging
  useEffect(() => {
    console.log("TellerSummary received locations:", shuttleLocations);
  }, [shuttleLocations]);

  // Update street names when shuttle locations change
  useEffect(() => {
    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Add a small delay to prevent too frequent updates
    geocodeTimeoutRef.current = setTimeout(async () => {
      const updateStreetNames = async () => {
        const newStreetNames = {};
        for (const [shuttleId, data] of Object.entries(shuttleLocations)) {
          if (data.coordinates) {
            try {
              const streetName = await reverseGeocode(
                data.coordinates[0],
                data.coordinates[1]
              );
              newStreetNames[shuttleId] = streetName;
            } catch (error) {
              console.error(
                `Error getting street name for shuttle ${shuttleId}:`,
                error
              );
              newStreetNames[shuttleId] = "Location available";
            }
          }
        }
        setStreetNames(newStreetNames);
      };

      updateStreetNames();
    }, 1000); // 1 second delay

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [shuttleLocations]);

  // Fetch shuttle assignments
  useEffect(() => {
    const fetchShuttleAssignments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/shuttle-assignments`,
          getAuthConfig()
        );
        setShuttleAssignments(response.data);
        console.log("Shuttle assignments:", response.data);
      } catch (error) {
        console.error("Error fetching shuttle assignments:", error);
      }
    };

    fetchShuttleAssignments();
  }, [API_BASE_URL]);

  // Fetch shuttle statistics
  useEffect(() => {
    const fetchShuttleStats = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/shuttle/stats`,
          getAuthConfig()
        );
        setShuttleStats(response.data);
      } catch (error) {
        console.error("Error fetching shuttle stats:", error);
      }
    };

    fetchShuttleStats();
  }, [API_BASE_URL]);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/shuttle/summary`,
          getAuthConfig()
        );

        console.log("API Response:", response.data);

        const {
          roundTrips,
          totalPassengers,
          activeShuttles,
          routeMetrics,
          hourlyPassengers,
          operationalHours: hours,
        } = response.data;

        setRoundTrips(roundTrips);
        setTotalPassengers(totalPassengers);
        setActiveShuttles(activeShuttles);
        setRouteMetrics(routeMetrics || {});
        setHourlyPassengers(hourlyPassengers || []);
        setOperationalHours(hours);
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    };

    fetchSummaryData();
  }, [API_BASE_URL]);

  // Fetch earnings data
  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/fare-transactions/earnings`,
          getAuthConfig()
        );
        setEarningsData(response.data);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      }
    };

    fetchEarningsData();
  }, [API_BASE_URL]);

  const handleOverlayClick = (e) => {
    if (e.target.className === "TellerSummary-modal") {
      onClose();
    }
  };

  const handleOpenShuttle = (shuttle) => {
    setSelectedShuttle(shuttle); // Open the selected shuttle modal
  };

  const handleCloseShuttle = () => {
    setSelectedShuttle(null); // Close the modal
  };

  // Chart configuration
  const chartData = {
    labels: Array.from({ length: hourlyPassengers.length }, (_, i) => {
      const hour = parseInt(operationalHours.startTime.split(":")[0]) + i;
      return `${hour}:00-${hour + 1}:00`;
    }),
    datasets: [
      {
        label: "Passengers per Hour",
        data: hourlyPassengers,
        fill: false,
        borderColor: "#4A90E2",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => `Time: ${context[0].label}`,
          label: (context) => `Passengers: ${context.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
    },
    layout: {
      padding: {
        right: 30,
        left: 10,
        top: 10,
        bottom: 10,
      },
    },
  };

  // Prepare data for the pie chart
  const pieChartData = {
    labels: ["Regular", "Discounted"],
    datasets: [
      {
        data: [earningsData.regular || 0, earningsData.discounted || 0],
        backgroundColor: ["#4A90E2", "#E27A4A"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  // Add these options for the pie chart
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    width: 200,
    height: 200,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 10,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc, data) => acc + data, 0);
            const value = dataset.data[context.dataIndex];
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 12,
        },
        formatter: (value, context) => {
          const dataset = context.dataset;
          const total = dataset.data.reduce((acc, data) => acc + data, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
      },
    },
  };

  // Combine shuttle assignments with location data to show all shuttles
  const getAllShuttles = () => {
    const allShuttles = {};

    // First add all shuttles from assignments
    shuttleAssignments.forEach((assignment) => {
      if (assignment.status === "active") {
        allShuttles[assignment.shuttleId] = {
          id: assignment.shuttleId,
          status: "offline",
          lastUpdate: new Date(0), // Default to epoch time
          streetName: "Not broadcasting location",
        };
      }
    });

    // Then override with location data for shuttles that are broadcasting
    Object.entries(optimizedLocations).forEach(([shuttleId, data]) => {
      allShuttles[shuttleId] = {
        ...allShuttles[shuttleId],
        ...data,
        id: shuttleId,
        streetName:
          data.streetName || streetNames[shuttleId] || "Location unavailable",
        lastUpdate: data.lastUpdate || new Date(),
        status: data.status || "online",
      };
    });

    return allShuttles;
  };

  const allShuttles = getAllShuttles();

  return (
    <div className="TellerSummary-modal" onClick={handleOverlayClick}>
      <div className="TellerSummary-container">
        <div className="TellerSummary-header">
          <h1>Summary</h1>
          <p>
            Today ({operationalHours.startTime} - {operationalHours.endTime})
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="TellerSummary-section">
          <h3>Total Stats (Within Operational Hours)</h3>
          <div className="TellerSummary-stats">
            <div>
              <strong>{roundTrips}</strong>
              <br />
              Round Trips
            </div>
            <div>
              <strong>{totalPassengers}</strong>
              <br />
              Passengers
            </div>
            <div>
              <strong>{activeShuttles}</strong>
              <br />
              Shuttles
            </div>
          </div>
        </div>

        {/* Total Passenger Section */}
        <div className="TellerSummary-section">
          <h3>Total Passenger (Within Operational Hours)</h3>
          <div className="TellerSummary-chart">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Route Statistics Section (formerly Route Time) */}
        <div className="TellerSummary-section">
          <h3>Route Statistics (Within Operational Hours)</h3>
          <div className="TellerSummary-route">
            {Object.entries(routeMetrics).map(([shuttleId, metrics]) => {
              // Get shuttle stats for this shuttle ID
              const shuttleStat = shuttleStats[shuttleId] || {};
              const avgPassengers = shuttleStat.averagePassengers || 0;

              return (
                <div key={shuttleId}>
                  <strong>SHUTL {shuttleId}</strong>
                  <p>
                    <span>{metrics.averageRouteMinutes} min</span> average route
                    time
                    <br />
                    <span>{metrics.averageDepartureMinutes} min</span> average
                    departure time
                    <br />
                    <span>{avgPassengers} passengers</span> average per trip
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status Section */}
        <div className="TellerSummary-section">
          <h3>Current Status</h3>
          <div className="TellerSummary-status">
            {Object.entries(allShuttles).map(([shuttleId, data]) => {
              const stats = shuttleStats[shuttleId] || {
                totalPassengers: 0,
                roundTrips: 0,
              };

              const isOffline = data.status === "offline";
              const locationText = isOffline
                ? "Not broadcasting location"
                : data.streetName || "Fetching location...";
              const lastUpdateText = isOffline
                ? "No recent updates"
                : `Last Updated: ${data.lastUpdate.toLocaleTimeString()}`;

              return (
                <div
                  className={`status-item ${
                    isOffline ? "offline-shuttle" : ""
                  }`}
                  key={shuttleId}
                  style={{ opacity: isOffline ? 0.7 : 1 }}
                >
                  <strong>SHUTL {shuttleId}</strong>
                  <p>Currently at {locationText}</p>
                  <p>{lastUpdateText}</p>
                  <p>
                    {stats.totalPassengers} Passengers | {stats.roundTrips}{" "}
                    Trips
                  </p>
                  <button onClick={() => handleOpenShuttle({ id: shuttleId })}>
                    Open
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fare Breakdown Section */}
        <div className="TellerSummary-section">
          <h3>Fare Breakdown</h3>
          <p className="operational-hours-note">
            (Data for operational hours:{" "}
            {earningsData.operationalHours?.startTime} -{" "}
            {earningsData.operationalHours?.endTime})
          </p>
          <div style={{ width: "300px", height: "300px", margin: "auto" }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
          <div className="TellerSummary-fare">
            <p>
              <strong>Total Earnings: ₱{earningsData.totalFare || 0}</strong>
            </p>
            <p>
              Regular Passengers: <strong>{earningsData.regular || 0}</strong>
            </p>
            <p>
              Discounted Passengers:{" "}
              <strong>{earningsData.discounted || 0}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Shuttle Details Modal */}
      {selectedShuttle && (
        <ShuttleDetails
          shuttle={selectedShuttle}
          onClose={handleCloseShuttle}
        />
      )}
    </div>
  );
};

export default TellerSummary;
