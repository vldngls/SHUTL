import React, { useState, useEffect } from "react";
import "../css/AdministratorTransactionsContent.css";
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
import ChartDataLabels from "chartjs-plugin-datalabels";

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

const AdministratorTransactionsContent = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [dateRange, setDateRange] = useState("today"); // today, week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalFare: 0,
    passengerCounts: {
      Regular: 0,
      PWD: 0,
      STUDENT: 0,
      SENIOR: 0,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const response = await fetch(
        `${API_BASE_URL}/fare-transactions/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setTransactions(data);

      // Calculate statistics
      const stats = data.reduce(
        (acc, transaction) => {
          acc.totalFare += transaction.totalFare;
          Object.entries(transaction.passengerCounts).forEach(
            ([type, count]) => {
              acc.passengerCounts[type] =
                (acc.passengerCounts[type] || 0) + count;
            }
          );
          return acc;
        },
        {
          totalFare: 0,
          passengerCounts: {
            Regular: 0,
            PWD: 0,
            STUDENT: 0,
            SENIOR: 0,
          },
        }
      );
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the pie chart
  const pieChartData = {
    labels: ["Regular", "PWD", "Student", "Senior"],
    datasets: [
      {
        data: [
          statistics.passengerCounts.Regular,
          statistics.passengerCounts.PWD,
          statistics.passengerCounts.STUDENT,
          statistics.passengerCounts.SENIOR,
        ],
        backgroundColor: ["#4A90E2", "#E27A4A", "#50E3C2", "#F5A623"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 10,
        },
      },
      tooltip: {
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

  return (
    <div className="AdministratorTransactions-transactions-content">
      {/* Date Range Selection */}
      <div className="AdministratorTransactions-date-range">
        <h3>Select Date Range</h3>
        <div className="date-range-buttons">
          <button
            className={dateRange === "today" ? "active" : ""}
            onClick={() => setDateRange("today")}
          >
            Today
          </button>
          <button
            className={dateRange === "week" ? "active" : ""}
            onClick={() => setDateRange("week")}
          >
            Last Week
          </button>
          <button
            className={dateRange === "month" ? "active" : ""}
            onClick={() => setDateRange("month")}
          >
            Last Month
          </button>
          <button
            className={dateRange === "year" ? "active" : ""}
            onClick={() => setDateRange("year")}
          >
            Last Year
          </button>
          <button
            className={dateRange === "custom" ? "active" : ""}
            onClick={() => setDateRange("custom")}
          >
            Custom
          </button>
        </div>
        {dateRange === "custom" && (
          <div className="custom-date-range">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Statistics Section */}
      <div className="AdministratorTransactions-statistics">
        <h3>Transaction Statistics</h3>
        <div className="statistics-grid">
          <div className="stat-card total-earnings">
            <h4>Total Earnings</h4>
            <p>₱{statistics.totalFare.toFixed(2)}</p>
          </div>
          <div className="stat-card total-passengers">
            <h4>Total Passengers</h4>
            <p>
              {Object.values(statistics.passengerCounts).reduce(
                (a, b) => a + b,
                0
              )}
            </p>
          </div>
          <div className="stat-card total-transactions">
            <h4>Total Transactions</h4>
            <p>{transactions.length}</p>
          </div>
        </div>

        {/* Passenger Distribution Chart */}
        <div className="passenger-distribution">
          <h4>Passenger Distribution</h4>
          <div style={{ width: "300px", height: "300px", margin: "auto" }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="AdministratorTransactions-payments-section">
        <h3>Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Shuttle ID</th>
              <th>Regular</th>
              <th>PWD</th>
              <th>Student</th>
              <th>Senior</th>
              <th>Total Fare</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-message">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.date}</td>
                  <td>{transaction.time}</td>
                  <td>{transaction.shuttleID}</td>
                  <td>{transaction.passengerCounts.Regular || 0}</td>
                  <td>{transaction.passengerCounts.PWD || 0}</td>
                  <td>{transaction.passengerCounts.STUDENT || 0}</td>
                  <td>{transaction.passengerCounts.SENIOR || 0}</td>
                  <td>₱{transaction.totalFare.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data-message">
                  No transactions found for the selected date range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdministratorTransactionsContent;
