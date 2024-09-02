import { Box, Button } from '@chakra-ui/react'

function App() {

  return (
    <Box minH={"100vh"}>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element ={<SplashScreen />} />
        <Route path="/LoginPage" element ={<IntroOne />} />
      </Routes>
    </Box>
  );
}

export default App;
