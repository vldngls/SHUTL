import React, { useState, useEffect, useRef } from "react";
import "../css/TellerSummary.css";
import ShuttleDetails from "./ShuttleDetails"; // Import ShuttleDetails component
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { io } from "socket.io-client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TellerSummary = ({ onClose }) => {
  const [selectedShuttle, setSelectedShuttle] = useState(null); // State to handle open modal
  const [roundTrips, setRoundTrips] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [activeShuttles, setActiveShuttles] = useState(0);
  const [routeMetrics, setRouteMetrics] = useState({});
  const [hourlyPassengers, setHourlyPassengers] = useState(
    new Array(17).fill(0)
  );
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [shuttleStats, setShuttleStats] = useState({});
  const socket = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SOCKET_URL = API_BASE_URL.replace("/api", "");

  // Shuttle data
  const shuttles = [
    {
      id: "001",
      roundTrips: 14,
      regular: 0,
      discounted: 0,
      pickUpNotify: 32,
      routeLog: [
        { time: "12:00 PM", description: "Departed from VistaMall" },
        { time: "12:15 PM", description: "Arrived at Camella Main Gate" },
        { time: "12:21 PM", description: "Entered Cerritos Hills 2 Gate" },
        { time: "12:38 PM", description: "Exited Cerritos Hills 2 Gate" },
        { time: "12:40 PM", description: "Entered Lessandra Gate" },
      ],
    },
    {
      id: "002",
      roundTrips: 12,
      regular: 0,
      discounted: 0,
      pickUpNotify: 20,
      routeLog: [
        { time: "10:00 AM", description: "Departed from Acosta Street" },
        { time: "10:15 AM", description: "Arrived at Madrid Street" },
      ],
    },
    {
      id: "003",
      roundTrips: 15,
      regular: 0,
      discounted: 0,
      pickUpNotify: 10,
      routeLog: [
        { time: "11:00 AM", description: "Idle at Lessandra Gate" },
        { time: "12:00 PM", description: "Waiting for next trip" },
      ],
    },
  ];

  // Initialize socket connection
  useEffect(() => {
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Join tracking for all shuttles
    ["001", "002", "003"].forEach((shuttleId) => {
      socket.current.emit("join_shuttle_tracking", `SHUTL${shuttleId}`);
    });

    socket.current.on("shuttle_location", async (data) => {
      const streetName = await getStreetName(
        data.coordinates[0],
        data.coordinates[1]
      );

      setShuttleLocations((prev) => ({
        ...prev,
        [data.shuttleId]: {
          coordinates: data.coordinates,
          lastUpdate: new Date(),
          streetName: streetName,
        },
      }));
    });

    // Cleanup stale locations
    const cleanupInterval = setInterval(() => {
      setShuttleLocations((prev) => {
        const now = new Date();
        return Object.entries(prev).reduce((acc, [id, data]) => {
          if (now - new Date(data.lastUpdate) < 10000) {
            acc[id] = data;
          }
          return acc;
        }, {});
      });
    }, 5000);

    return () => {
      clearInterval(cleanupInterval);
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Fetch shuttle statistics
  useEffect(() => {
    const fetchShuttleStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/shuttle/stats`);
        setShuttleStats(response.data);
      } catch (error) {
        console.error("Error fetching shuttle stats:", error);
      }
    };

    fetchShuttleStats();
  }, []);

  // Function to get street name from coordinates
  const getStreetName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.address.road || "Unknown location";
    } catch (error) {
      console.error("Error getting street name:", error);
      return "Unknown location";
    }
  };

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${API_BASE_URL}/shuttle/summary`);

        console.log("API Response:", response.data);

        const {
          roundTrips,
          totalPassengers,
          activeShuttles,
          routeMetrics,
          hourlyPassengers,
        } = response.data;

        setRoundTrips(roundTrips);
        setTotalPassengers(totalPassengers);
        setActiveShuttles(activeShuttles);
        setRouteMetrics(routeMetrics || {});
        setHourlyPassengers(hourlyPassengers || new Array(17).fill(0));
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    };

    fetchSummaryData();
  }, []);

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
    labels: Array.from({ length: 17 }, (_, i) => `${i + 6}:00-${i + 7}:00`),
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

  return (
    <div className="TellerSummary-modal" onClick={handleOverlayClick}>
      <div className="TellerSummary-container">
        <div className="TellerSummary-header">
          <h1>Summary</h1>
          <p>Today</p>
        </div>

        {/* Main Content Sections */}
        <div className="TellerSummary-section">
          <h3>Total Stats</h3>
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
          <h3>Total Passenger</h3>
          <div className="TellerSummary-chart">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Route Time Section */}
        <div className="TellerSummary-section">
          <h3>Route Time</h3>
          <div className="TellerSummary-route">
            {Object.entries(routeMetrics).map(([shuttleNumber, metrics]) => (
              <div key={shuttleNumber}>
                <strong>SHUTL {shuttleNumber}</strong>
                <p>
                  <span>{metrics.averageRouteMinutes} min</span> average route
                  time
                  <br />
                  <span>{metrics.averageDepartureMinutes} min</span> average
                  departure time
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Status Section */}
        <div className="TellerSummary-section">
          <h3>Current Status</h3>
          <div className="TellerSummary-status">
            {["001", "002", "003"].map((shuttleId) => {
              const fullId = `SHUTL${shuttleId}`;
              const locationData = shuttleLocations[fullId];
              const stats = shuttleStats[shuttleId] || {
                totalPassengers: 0,
                roundTrips: 0,
              };

              return (
                <div className="status-item" key={shuttleId}>
                  <strong>SHUTL {shuttleId}</strong>
                  <p>
                    Currently at{" "}
                    {locationData?.streetName || "Unknown Location"}
                  </p>
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
          <div className="TellerSummary-fare">
            <p>
              <strong>16,880</strong> Net Earning
            </p>
            <p>
              <strong>463</strong> Regular
            </p>
            <p>
              <strong>115</strong> Discounted
            </p>
            <p>
              <strong>578</strong> Pick-up
            </p>
          </div>
          <p>Posted SHUTL. 002 | Trip 12</p>
          <button className="transaction-btn">Transaction History</button>
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
