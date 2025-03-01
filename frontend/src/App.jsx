import React, { useEffect, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { MemoryMonitor } from "./utils/memoryMonitor";
import ProtectedRoute from "./components/ProtectedRoute";
// import { MemoryMonitoringDashboard } from "./components/MemoryMonitoringDashboard";

// Lazy load components
const SplashScreen = React.lazy(() => import("./pages/SplashScreen"));
const ShutlIntro = React.lazy(() => import("./pages/Intro"));
const ShutlLoggedOut = React.lazy(() => import("./pages/ShutlLoggedOut"));
const LoginForm = React.lazy(() => import("./components/LoginForm"));
const ShutlLoggedIn = React.lazy(() => import("./pages/ShutlLoggedIn"));
const DriverMain = React.lazy(() => import("./pages/DriverMain"));
const AdministratorMain = React.lazy(() => import("./pages/AdministratorMain"));
const TellerMain = React.lazy(() => import("./pages/TellerMain"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Loading component
const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f5f5f5",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        border: "5px solid #f3f3f3",
        borderTop: "5px solid #232323",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    ></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  useEffect(() => {
    const monitorId = MemoryMonitor.startMonitoring();
    return () => {
      clearInterval(monitorId);
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
