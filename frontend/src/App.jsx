import React from 'react';
import { Route, Routes } from 'react-router-dom';

import SplashScreen from './pages/SplashScreen';
import ShutlIntro from './pages/Intro';
import ShutlLoggedOut from './pages/ShutlLoggedOut';
import ShutlLoggedIn from './pages/ShutlLoggedIn';
import LoginForm from './components/LoginForm';
import DriverMain from './pages/DriverMain';
import AdministratorMain from './pages/AdministratorMain'; // Create Admin page
import TellerMain from './pages/TellerMain'; // Create Teller page

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/ShutlIntro" element={<ShutlIntro />} />
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
        <Route path="/ShutlLoggedIn" element={<ShutlLoggedIn />} />
        <Route path="/LoginForm" element={<LoginForm />} />
        <Route path="/DriverMain" element={<DriverMain />} />
        <Route path="/AdministratorMain" element={<AdministratorMain />} /> {/* Admin route */}
        <Route path="/TellerMain" element={<TellerMain />} /> {/* Teller route */}
      </Routes>
    </div>
  );
}

export default App;
