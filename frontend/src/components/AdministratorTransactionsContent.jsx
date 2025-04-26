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
import { toast } from "react-hot-toast";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    // Create CSV header
    const headers = [
      "Date",
      "Time",
      "Shuttle ID",
      "Regular Passengers",
      "PWD Passengers",
      "Student Passengers",
      "Senior Passengers",
      "Total Fare",
      "Tendered Amount",
      "Change"
    ];

    // Create CSV rows
    const rows = transactions.map(transaction => [
      transaction.date,
      transaction.time,
      transaction.shuttleID,
      transaction.passengerCounts.Regular || transaction.passengerCounts.REGULAR || 0,
      transaction.passengerCounts.PWD || 0,
      transaction.passengerCounts.STUDENT || 0,
      transaction.passengerCounts.SENIOR || 0,
      `₱${transaction.totalFare.toFixed(2)}`,
      `₱${transaction.tender.toFixed(2)}`,
      `₱${transaction.change.toFixed(2)}`
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          className="adm-pagination-btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="adm-pagination-ellipsis">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`adm-pagination-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="adm-pagination-ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key="last"
          className="adm-pagination-btn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="adm-transactions-pagination">
        <button
          className="adm-pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {pages}
        <button
          className="adm-pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    );
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
          <button className="adm-transactions-export" onClick={handleExportCSV}>
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
              ) : currentTransactions.length > 0 ? (
                currentTransactions.map((transaction, index) => (
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
        {transactions.length > 0 && renderPagination()}
      </div>
    </div>
  );
};

export default AdministratorTransactionsContent;
