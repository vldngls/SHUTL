import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SplashScreen from "./pages/SplashScreen";
import ShutlIntro from "./pages/Intro";
import ShutlLoggedOut from "./pages/ShutlLoggedOut";
import ShutlLoggedIn from "./pages/ShutlLoggedIn";
import LoginForm from "./components/LoginForm";
import DriverMain from "./pages/DriverMain";
import AdministratorMain from "./pages/AdministratorMain";
import TellerMain from "./pages/TellerMain";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { MemoryMonitor } from "./utils/memoryMonitor";
import { MemoryMonitoringDashboard } from "./components/MemoryMonitoringDashboard";

function App() {
  useEffect(() => {
    // Start memory monitoring
    const monitorId = MemoryMonitor.startMonitoring();

    return () => {
      clearInterval(monitorId);
    };
  }, []);

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
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
          },
        }}
      />
      {process.env.NODE_ENV === "development" && <MemoryMonitoringDashboard />}
    </div>
  );
}

export default App;
