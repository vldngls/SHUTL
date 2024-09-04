/* eslint-disable no-unused-vars */
import React from "react";
import { Route, Routes } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import ShutlIntro from "./pages/Intro";
import ShutlLoggedOut from "./pages/ShutlLoggedOut";
import LoginForm from "./components/LoginForm";

function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/*Add routes here, make sure to import them above.*/} 
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/ShutlIntro" element={<ShutlIntro />} />
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
        <Route path="/LoginForm" element={<LoginForm/>} />
      </Routes>
    </div>
  );
}

export default App;
