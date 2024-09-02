import React from "react";
import { Route, Routes } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import ShutlIntro from "./pages/Intro";
import ShutlLoggedOut from "./pages/ShutlLoggedOut";

function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* <Navbar />*/} 
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/ShutlIntro" element={<ShutlIntro />} />
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
      </Routes>
    </div>
  );
}

export default App;
