/* eslint-disable no-unused-vars */
// frontend/src/App.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import SplashScreen from './pages/SplashScreen';
import ShutlIntro from './pages/Intro';
import ShutlLoggedOut from './pages/ShutlLoggedOut';
import ShutlLoggedIn from './pages/ShutlLoggedIn'; // Import the ShutlLoggedIn page
import LoginForm from './components/LoginForm';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/ShutlIntro" element={<ShutlIntro />} />
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
        <Route path="/ShutlLoggedIn" element={<ShutlLoggedIn />} /> {/* Add this route */}
        <Route path="/LoginForm" element={<LoginForm />} />
      </Routes>
    </div>
  );
}

export default App;
