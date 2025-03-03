import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import TellerForm from "./TellerForm";
import TellerList from "./TellerList";
import { getCookie } from "../utils/cookieUtils.js";
import { fetchTellers, saveTeller } from "../utils/tellerservice";
import {
  connectSocket,
  subscribeToEvent,
  disconnectSocket,
} from "../utils/websocketService";
import { get as apiGet } from "../services/api";
import { MemoryMonitor } from "../utils/memoryMonitor";

// Cache TTL constants
const USER_COUNT_CACHE_TTL = 30 * 1000; // 30 seconds

const AdministratorMain = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [tellers, setTellers] = useState([]);
  const [editingTeller, setEditingTeller] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const cleanupFunctionsRef = useRef([]);
  const intervalsRef = useRef([]);

  // Ensure userId is properly retrieved before connecting WebSocket
  const userId = useMemo(() => {
    return localStorage.getItem("userId") || getCookie("userId");
  }, []);

  // Initialize socket connection
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      try {
        // Connect to socket using our improved service
        const socketInstance = await connectSocket();
        if (!socketInstance || !isMounted) return;

        socketRef.current = socketInstance;

        // Set status to active
        if (userId) {
          socketInstance.emit("set_status", { userId, status: "active" });
        }

        // Subscribe to status updates
        const statusUpdateCleanup = await subscribeToEvent(
          "status_update",
          (data) => {
            if (!isMounted) return;

            console.log("Status update received:", data);
            // Refresh user counts when status updates are received
            fetchUserCounts();
          }
        );

        cleanupFunctionsRef.current.push(statusUpdateCleanup);
      } catch (error) {
        console.error("Socket connection error:", error);
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;

      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
      cleanupFunctionsRef.current = [];

      // Set status to idle before disconnecting
      if (socketRef.current && userId) {
        socketRef.current.emit("set_status", { userId, status: "idle" });
      }
    };
  }, [userId]);

  // Fetch Total & Active Users with memoized function
  const fetchUserCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use our cached API service
      const data = await apiGet("/users/active-users", USER_COUNT_CACHE_TTL);

      console.log("Fetched User Data:", data);
      setTotalUsers(data.totalUsers);
      setActiveUsers(data.activeUsers);
    } catch (error) {
      console.error("Error fetching user counts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up user count polling
  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    fetchUserCounts();

    // Set up polling interval - reduced from 10s to 30s to reduce server load
    const interval = setInterval(() => {
      if (isMounted) {
        fetchUserCounts();
      }
    }, 30000);

    intervalsRef.current.push(interval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchUserCounts]);

  // Fetch Tellers with optimized loading
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout;

    const loadTellers = async () => {
      try {
        // Show loading state only if it takes more than 300ms
        loadingTimeout = setTimeout(() => {
          if (isMounted) setIsLoading(true);
        }, 300);

        const data = await fetchTellers();

        clearTimeout(loadingTimeout);

        if (isMounted) {
          setTellers(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching tellers:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    loadTellers();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Optimized save handler with error handling
  const handleSaveTeller = async (tellerData) => {
    try {
      setIsLoading(true);
      const savedTeller = await saveTeller(tellerData);

      if (editingTeller) {
        setTellers((prev) =>
          prev.map((teller) =>
            teller._id === savedTeller._id ? savedTeller : teller
          )
        );
      } else {
        setTellers((prev) => [...prev, savedTeller]);
      }

      setEditingTeller(null);

      // Log memory usage after state update
      const memoryUsage = await MemoryMonitor.getMemoryUsage();
      if (memoryUsage) {
        console.log(`Memory after teller save: ${memoryUsage.formattedUsed}`);
      }
    } catch (error) {
      console.error("Error saving teller:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useCallback((teller) => {
    setEditingTeller(teller);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTeller(null);
  }, []);

  // Final cleanup
  useEffect(() => {
    return () => {
      // Clear all intervals
      intervalsRef.current.forEach((interval) => clearInterval(interval));
      intervalsRef.current = [];

      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {isLoading ? (
        <div className="loading-indicator">Loading data...</div>
      ) : (
        <>
          <p>
            Current Users: <strong>{totalUsers}</strong>
          </p>
          <p>
            Active Users:{" "}
            <strong style={{ color: activeUsers > 0 ? "green" : "red" }}>
              {activeUsers}
            </strong>
          </p>
          <div className="account-management">
            <h2>Account Management</h2>
            <div className="account-management-container">
              <TellerForm
                onTellerSaved={handleSaveTeller}
                editingTeller={editingTeller}
                onCancelEdit={handleCancelEdit}
                isLoading={isLoading}
              />
              <TellerList
                tellers={tellers}
                onEditTeller={handleEdit}
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(AdministratorMain);
