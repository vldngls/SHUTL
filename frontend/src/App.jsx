import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import ShutlIntro from './pages/Intro';
import ShutlLoggedOut from './pages/shutlLoggedOut';
import ShutlLoggedIn from './pages/shutlLoggedIn';
import LoginForm from './components/LoginForm';
import DriverMain from './pages/DriverMain';
import AdministratorMain from './pages/AdministratorMain';
import TellerMain from './pages/TellerMain';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/ShutlIntro" element={<ShutlIntro />} />
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
        <Route path="/LoginForm" element={<LoginForm />} />
        <Route path="/ShutlLoggedIn" element={<ProtectedRoute element={<ShutlLoggedIn />} allowedRoles={['Commuter']} />} />
        <Route path="/DriverMain" element={<ProtectedRoute element={<DriverMain />} allowedRoles={['Driver']} />} />
        <Route path="/AdministratorMain" element={<ProtectedRoute element={<AdministratorMain />} allowedRoles={['Admin']} />} />
        <Route path="/TellerMain" element={<ProtectedRoute element={<TellerMain />} allowedRoles={['Teller']} />} />
      </Routes>
    </div>
  );
}

export default App;
