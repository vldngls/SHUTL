// Safari toolbar auto-closing utility
export const initSafariToolbar = () => {
  // Check if the device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    // Function to handle the initial scroll
    const handleInitialScroll = () => {
      // Scroll to the top of the page
      window.scrollTo(0, 0);
      
      // Add a small delay to ensure the scroll takes effect
      setTimeout(() => {
        // Scroll back to the original position
        window.scrollTo(0, 1);
      }, 100);
    };

    // Add event listener for when the page is fully loaded
    window.addEventListener('load', handleInitialScroll);
    
    // Also handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(handleInitialScroll, 100);
    });

    // Cleanup function
    return () => {
      window.removeEventListener('load', handleInitialScroll);
      window.removeEventListener('orientationchange', handleInitialScroll);
    };
  }
}; 