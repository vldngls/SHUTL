import React from "react";
import { Route, Routes } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import IntroOne from "./pages/IntroOne";
import IntroTwo from "./pages/IntroTwo";
import ShutlLoggedOut from "./pages/ShutlLoggedOut";
import Navbar from "./components/Navbar";
import IntroThree from "./pages/IntroThree";

function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* <Navbar />*/} 
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/introOne" element={<IntroOne />} />
        <Route path="/introTwo" element={<IntroTwo />} />
        <Route path="/introThree" element={<IntroThree />}/>
        <Route path="/ShutlLoggedOut" element={<ShutlLoggedOut />} />
      </Routes>
    </div>
  );
}

export default App;
