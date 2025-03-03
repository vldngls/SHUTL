import React, { useEffect, Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  startMemoryMonitoring,
  takeMemorySnapshot,
  formatMemoryUsage,
  logMemoryTrend,
  cleanupMemoryMonitor,
} from "./utils/memoryMonitor";
import { cleanupImageOptimizer } from "./utils/imageOptimizer";
import ProtectedRoute from "./components/ProtectedRoute";
import { cleanupSocketService } from "./utils/websocketService";
// import { MemoryMonitoringDashboard } from "./components/MemoryMonitoringDashboard";

// Implement more granular code splitting with prefetching
const SplashScreen = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/SplashScreen")
);
const ShutlIntro = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/Intro")
);
const ShutlLoggedOut = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/ShutlLoggedOut")
);
const LoginForm = lazy(() =>
  import(/* webpackPrefetch: true */ "./components/LoginForm")
);
const ShutlLoggedIn = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/ShutlLoggedIn")
);
const DriverMain = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/DriverMain")
);
const AdministratorMain = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/AdministratorMain")
);
const TellerMain = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/TellerMain")
);
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

// Improved loading component with progress indication
const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f5f5f5",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        width: "60px",
        height: "60px",
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #232323",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px",
      }}
    ></div>
    <p style={{ fontFamily: "Inter, sans-serif", color: "#232323" }}>
      Loading...
    </p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // Preload critical components after initial render
  useEffect(() => {
    const preloadComponents = async () => {
      // Preload components that are likely to be used soon
      const preloadPromises = [
        import("./pages/ShutlLoggedIn"),
        import("./components/LoginForm"),
      ];

      try {
        await Promise.all(preloadPromises);
        console.log("Critical components preloaded successfully");
      } catch (error) {
        console.error("Error preloading components:", error);
      }
    };

    // Start preloading after a short delay to prioritize initial render
    const preloadTimeout = setTimeout(preloadComponents, 2000);

    // Start memory monitoring with a more frequent interval (20 seconds)
    startMemoryMonitoring(20000, true); // Enable leak detection

    // Log initial memory usage
    const initialSnapshot = takeMemorySnapshot();
    if (initialSnapshot) {
      console.log("Initial memory usage:", formatMemoryUsage(initialSnapshot));
    }

    // Setup periodic memory trend reporting
    const trendReportInterval = setInterval(() => {
      logMemoryTrend();
    }, 60000); // Report every minute

    return () => {
      // Clean up all resources
      cleanupMemoryMonitor();
      cleanupImageOptimizer();
      cleanupSocketService();

      // Clear intervals and timeouts
      clearInterval(trendReportInterval);
      clearTimeout(preloadTimeout);

      console.log("All resources cleaned up on app unmount");
    };
  }, []);

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/ShutlIntro" element={<ShutlIntro />} />
          <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
          <Route path="/LoginForm" element={<LoginForm />} />
          <Route
            path="/ShutlLoggedIn"
            element={
              <ProtectedRoute
                element={<ShutlLoggedIn />}
                allowedRoles={["Commuter"]}
              />
            }
          />
          <Route
            path="/DriverMain"
            element={
              <ProtectedRoute
                element={<DriverMain />}
                allowedRoles={["Driver"]}
              />
            }
          />
          <Route
            path="/AdministratorMain"
            element={
              <ProtectedRoute
                element={<AdministratorMain />}
                allowedRoles={["Admin"]}
              />
            }
          />
          <Route
            path="/TellerMain"
            element={
              <ProtectedRoute
                element={<TellerMain />}
                allowedRoles={["Teller"]}
              />
            }
          />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#232323",
            color: "#fff",
            fontSize: "14px",
            padding: "12px 16px",
            borderRadius: "24px",
            width: "220px",
            maxWidth: "220px",
            textAlign: "center",
            marginBottom: "30px",
          },
        }}
      />
    </div>
  );
}

export default App;
