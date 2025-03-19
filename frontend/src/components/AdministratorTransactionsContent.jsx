import { useState, useEffect } from "react";
import "../css/AdministratorTransactionsContent.css";
import { Pie } from "react-chartjs-2";
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
  const [dateRange, setDateRange] = useState("today"); // today, week, month, year, all, custom
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
      case "all":
        // Set to a very old date to get all records
        startDate.setFullYear(2000);
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
          
          // Handle Regular with case sensitivity
          acc.passengerCounts.Regular += 
            (transaction.passengerCounts?.Regular || 0) + 
            (transaction.passengerCounts?.REGULAR || 0);
          
          // Handle other passenger types
          acc.passengerCounts.PWD += transaction.passengerCounts?.PWD || 0;
          acc.passengerCounts.STUDENT += transaction.passengerCounts?.STUDENT || 0;
          acc.passengerCounts.SENIOR += transaction.passengerCounts?.SENIOR || 0;
          
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
    <div className="adm-transactions">
      <div className="adm-transactions-header">
        <h2 className="adm-transactions-title">Transactions</h2>
        <p className="adm-transactions-description">Track fare payments and analyze transaction data</p>
      </div>
      
      {/* Date Range Selection */}
      <div className="adm-transactions-filters">
        <h3 className="adm-filters-title">Select Date Range</h3>
        <div className="adm-filters-form">
          <div className="adm-filter-actions">
            <button
              className={`adm-filter-btn ${dateRange === "today" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("today")}
            >
              Today
            </button>
            <button
              className={`adm-filter-btn ${dateRange === "week" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("week")}
            >
              Last Week
            </button>
            <button
              className={`adm-filter-btn ${dateRange === "month" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("month")}
            >
              Last Month
            </button>
            <button
              className={`adm-filter-btn ${dateRange === "year" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("year")}
            >
              Last Year
            </button>
            <button
              className={`adm-filter-btn ${dateRange === "all" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("all")}
            >
              All Time
            </button>
            <button
              className={`adm-filter-btn ${dateRange === "custom" ? "adm-filter-btn-apply" : "adm-filter-btn-reset"}`}
              onClick={() => setDateRange("custom")}
            >
              Custom
            </button>
          </div>
          
          {dateRange === "custom" && (
            <div className="adm-filters-form" style={{ marginTop: 'var(--adm-spacing-4)' }}>
              <div className="adm-filter-group">
                <label className="adm-filter-label">Start Date</label>
                <input
                  type="date"
                  className="adm-filter-input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="adm-filter-group">
                <label className="adm-filter-label">End Date</label>
                <input
                  type="date"
                  className="adm-filter-input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="adm-transactions-stats">
        <div className="adm-transactions-stat-card">
          <div className="adm-transactions-stat-icon">
            <i>₱</i>
          </div>
          <div className="adm-transactions-stat-content">
            <div className="adm-transactions-stat-value">₱{statistics.totalFare.toFixed(2)}</div>
            <div className="adm-transactions-stat-label">Total Earnings</div>
          </div>
        </div>
        
        <div className="adm-transactions-stat-card">
          <div className="adm-transactions-stat-icon">
            <i>👥</i>
          </div>
          <div className="adm-transactions-stat-content">
            <div className="adm-transactions-stat-value">
              {Object.values(statistics.passengerCounts).reduce(
                (a, b) => a + b,
                0
              )}
            </div>
            <div className="adm-transactions-stat-label">Total Passengers</div>
          </div>
        </div>
        
        <div className="adm-transactions-stat-card">
          <div className="adm-transactions-stat-icon">
            <i>📊</i>
          </div>
          <div className="adm-transactions-stat-content">
            <div className="adm-transactions-stat-value">{transactions.length}</div>
            <div className="adm-transactions-stat-label">Total Transactions</div>
          </div>
        </div>
        
        <div className="adm-transactions-stat-card">
          <div className="adm-transactions-stat-icon">
            <i>📈</i>
          </div>
          <div className="adm-transactions-stat-content">
            <div className="adm-transactions-stat-value">
              <button className="adm-filter-btn adm-filter-btn-apply" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                Export Data
              </button>
            </div>
            <div className="adm-transactions-stat-label">Generate Reports</div>
          </div>
        </div>
      </div>

      {/* Transaction Chart Section */}
      <div className="adm-transaction-chart-section">
        <div className="adm-transaction-chart-header">
          <h3 className="adm-transaction-chart-title">Passenger Distribution</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--adm-spacing-4)' }}>
          <div style={{ width: "300px", height: "300px" }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="adm-transactions-list">
        <div className="adm-transactions-list-header">
          <h3 className="adm-transactions-list-title">Transaction History</h3>
          <button className="adm-transactions-export">
            <i>📥</i> Export CSV
          </button>
        </div>
        
        <div className="adm-transactions-table-container">
          <table className="adm-transactions-table">
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
                <th>Tendered</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--adm-spacing-6)' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.date}</td>
                    <td>{transaction.time}</td>
                    <td>{transaction.shuttleID}</td>
                    <td>{transaction.passengerCounts.Regular || transaction.passengerCounts.REGULAR || 0}</td>
                    <td>{transaction.passengerCounts.PWD || 0}</td>
                    <td>{transaction.passengerCounts.STUDENT || 0}</td>
                    <td>{transaction.passengerCounts.SENIOR || 0}</td>
                    <td>
                      <span className="adm-transaction-amount positive">₱{transaction.totalFare.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="adm-transaction-amount tender">₱{transaction.tender.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="adm-transaction-amount change">₱{transaction.change.toFixed(2)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--adm-spacing-6)' }}>
                    No transactions found for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdministratorTransactionsContent;
