import { Box, Button } from "@chakra-ui/react";
import { Route, Routes } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import IntroOne from "./pages/IntroOne";
import shutlLoggedOut from "./pages/shutlLoggedOut";


function App() {

  return (
    <Box minH={"100vh"}>
      <Navbar />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/LoginPage" element={<IntroOne />} />
        <Route path="/shutlLoggedOut" element={<shutlLoggedOut />}/>
      </Routes>
    </Box>
  );
}

export default App;
