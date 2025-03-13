import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import "../css/ShuttleDetails.css";
import CollectFare from "./CollectFare";

const ShuttleDetails = ({ shuttle, onClose }) => {
  const [showCollectFare, setShowCollectFare] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shuttleStats, setShuttleStats] = useState({
    roundTrips: 0,
    averagePassengers: 0,
  });
  const [shuttleStatus, setShuttleStatus] = useState("offline");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const modalRef = useRef(null);
  const collectFareRef = useRef(null);
  const transactionsPerPage = 2;

  // Add viewport height fix for mobile browsers
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

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

  // Helper function to create fetch options with auth header
  const getAuthOptions = () => {
    return {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    };
  };

  const fetchTransactions = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      const response = await fetch(
        `${API_BASE_URL}/fare-transactions?shuttleID=${shuttle.id}&date=${formattedDate}`,
        getAuthOptions()
      );
      const data = await response.json();
      setTransactions(data);
      console.log("Today's transactions:", data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchShuttleStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/shuttle/stats`,
        getAuthOptions()
      );
      const data = await response.json();
      console.log("Shuttle stats:", data);

      // Get stats for this specific shuttle
      const stats = data[shuttle.id] || {
        roundTrips: 0,
        averagePassengers: 0,
      };

      setShuttleStats(stats);
      console.log(`Stats for shuttle ${shuttle.id}:`, stats);
    } catch (error) {
      console.error("Error fetching shuttle stats:", error);
    }
  };

  // Check shuttle status
  const checkShuttleStatus = async () => {
    try {
      // Check if the shuttle is broadcasting location
      const response = await fetch(
        `${API_BASE_URL}/shuttle/locations/${shuttle.id}`,
        getAuthOptions()
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Shuttle location data:", data);

        if (data && data.hasLocationData) {
          setShuttleStatus("online");
        } else if (data && data.lastUpdate) {
          // Check if the last update was within the last 30 minutes
          const lastUpdate = new Date(data.lastUpdate);
          const now = new Date();
          const diffMinutes = (now - lastUpdate) / (1000 * 60);

          if (diffMinutes < 30) {
            setShuttleStatus("recent");
          } else {
            setShuttleStatus("offline");
          }
        } else {
          setShuttleStatus("offline");
        }
      } else {
        console.error("Failed to fetch shuttle location:", response.status);
        setShuttleStatus("offline");
      }
    } catch (error) {
      console.error("Error checking shuttle status:", error);
      setShuttleStatus("offline");
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchShuttleStats();
    checkShuttleStatus();

    // Set up interval to check shuttle status every 30 seconds
    const statusInterval = setInterval(() => {
      checkShuttleStatus();
    }, 30000);

    // Clean up interval on component unmount
    return () => {
      clearInterval(statusInterval);
    };
  }, [API_BASE_URL, shuttle.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        (!collectFareRef.current ||
          !collectFareRef.current.contains(event.target))
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const totalRegular = transactions.reduce(
    (sum, t) => sum + (t.passengerCounts?.Regular || 0),
    0
  );
  const totalPWD = transactions.reduce(
    (sum, t) => sum + (t.passengerCounts?.PWD || 0),
    0
  );
  const totalStudent = transactions.reduce(
    (sum, t) => sum + (t.passengerCounts?.STUDENT || 0),
    0
  );
  const totalSenior = transactions.reduce(
    (sum, t) => sum + (t.passengerCounts?.SENIOR || 0),
    0
  );
  const totalFare = transactions.reduce((sum, t) => sum + t.totalFare, 0);

  // Calculate pagination values
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  // Reverse the transactions array to show newest first
  const sortedTransactions = [...transactions].reverse();
  const currentTransactions = sortedTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "ShuttleDetails-modal") {
      onClose();
    }
  };

  // Format timestamp for better readability
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ShuttleDetails-modal" onClick={handleOverlayClick}>
      <div className="ShuttleDetails-container" ref={modalRef}>
        <div className="ShuttleDetails-header">
          <h1>SHUTL. {shuttle.id}</h1>
          {shuttleStatus === "offline" && (
            <span className="shuttle-status offline">OFFLINE</span>
          )}
          {shuttleStatus === "online" && (
            <span className="shuttle-status online">ONLINE</span>
          )}
          {shuttleStatus === "recent" && (
            <span className="shuttle-status recent">RECENT</span>
          )}
        </div>

        <div className="ShuttleDetails-content">
          <div className="ShuttleDetails-stats">
            <div>
              <strong>{shuttleStats.roundTrips}</strong>
              Round Trips
            </div>
            <div>
              <strong>{totalRegular}</strong>
              Regular
            </div>
            <div>
              <strong>{totalPWD}</strong>
              PWD
            </div>
            <div>
              <strong>{totalStudent}</strong>
              Student
            </div>
            <div>
              <strong>{totalSenior}</strong>
              Senior
            </div>
            <div>
              <strong>₱{totalFare}</strong>
              Total Fare
            </div>
            <div>
              <strong>{shuttleStats.averagePassengers || 0}</strong>
              Avg. Passengers
            </div>
          </div>

          <div className="ShuttleDetails-log">
            <h3>Transaction Log</h3>
            {transactions.length > 0 ? (
              <>
                <ul>
                  {currentTransactions.map((transaction, index) => (
                    <li key={transaction._id || index}>
                      <div className="transaction-details">
                        <div className="transaction-counts">
                          <span className="transaction-type">
                            Regular: {transaction.passengerCounts?.Regular || 0}
                          </span>
                          <span className="transaction-type">
                            PWD: {transaction.passengerCounts?.PWD || 0}
                          </span>
                          <span className="transaction-type">
                            Student: {transaction.passengerCounts?.STUDENT || 0}
                          </span>
                          <span className="transaction-type">
                            Senior: {transaction.passengerCounts?.SENIOR || 0}
                          </span>
                        </div>
                        <div className="transaction-email">
                          <span>{transaction.commuterEmail}</span>
                        </div>
                        <div className="transaction-total">
                          <span className="transaction-amount">
                            ₱{transaction.totalFare}
                          </span>
                          {transaction.timestamp && (
                            <span className="transaction-time">
                              {formatTime(transaction.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="no-transactions">No transactions recorded today</p>
            )}
          </div>
        </div>

        <button
          className="collect-fare-btn"
          onClick={() => setShowCollectFare(true)}
        >
          Collect Fare
        </button>
      </div>

      {showCollectFare && (
        <div ref={collectFareRef}>
          <CollectFare
            onClose={() => setShowCollectFare(false)}
            shuttleID={shuttle.id}
            onTransactionSaved={fetchTransactions}
          />
        </div>
      )}
    </div>
  );
};

ShuttleDetails.propTypes = {
  shuttle: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ShuttleDetails;
