import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import PropTypes from "prop-types";

const QRScannerComponent = forwardRef(({ onScanSuccess, onScanError }, ref) => {
  const scannerRef = useRef(null);
  const isInitialized = useRef(false);
  const containerRef = useRef(null);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState([]);

  // Expose stopScanning through ref
  useImperativeHandle(ref, () => ({
    stopScanning
  }));

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        console.log('Scanner stopped successfully');
        scannerRef.current = null;
        isInitialized.current = false;
        setIsContainerReady(false);
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  useEffect(() => {
    // Check if we're in a secure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('Camera access requires HTTPS or localhost');
      if (onScanError) {
        onScanError('Camera access requires HTTPS or localhost');
      }
      return;
    }

    // Check camera permissions
    const checkCameraPermissions = async () => {
      try {
        // First check if we're on a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // For mobile devices, we need to handle permissions differently
        if (isMobile) {
          // On mobile, we need to request permissions first
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          stream.getTracks().forEach(track => track.stop());
          setPermissionStatus('granted');
        } else {
          // For desktop, proceed with normal permission check
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionStatus('granted');
        }
        
        // Check the permissions API if available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' });
          setPermissionStatus(result.state);
          
          result.addEventListener('change', () => {
            setPermissionStatus(result.state);
          });
        }
      } catch (error) {
        console.error('Error checking camera permissions:', error);
        setPermissionStatus('denied');
        onScanError('Camera permission was denied. Please allow camera access in your browser settings.');
      }
    };

    checkCameraPermissions();

    // Initialize Scanner
    const initializeScanner = async () => {
      // Prevent multiple initializations
      if (isInitialized.current) {
        return;
      }

      try {
        // First, ensure the container is mounted and visible
        if (!containerRef.current) {
          throw new Error('Scanner container not found');
        }

        // Make sure the container is visible before initialization
        containerRef.current.style.display = 'block';
        containerRef.current.style.opacity = '1';

        // Add a small delay to ensure the container is properly rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if we're on a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Initialize the scanner with mobile-specific settings
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: isMobile ? 10 : 30, // Lower FPS for mobile devices
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: isMobile ? "environment" : "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          false
        );

        // Start scanning with enhanced error reporting
        await scanner.render(
          (decodedText, result) => {
            // Stop scanning immediately to prevent multiple detections
            stopScanning();
            
            console.log('Code detected:', {
              text: decodedText,
              format: result.format,
              formatName: result.formatName
            });
            onScanSuccess(decodedText);
            setIsScanning(true);
          },
          (errorMessage, error) => {
            // Enhanced error reporting
            const errorDetails = {
              message: errorMessage,
              type: error?.type,
              stack: error?.stack
            };

            // Only log meaningful errors that aren't related to normal scanning attempts
            if (!errorMessage.includes("No MultiFormat Readers") && 
                !errorMessage.includes("IndexSizeError") &&
                !errorMessage.includes("QR code parse error")) {
              console.log('Scan error:', errorDetails);
            }
            
            // Only report meaningful errors to the user
            if (!errorMessage.includes("No MultiFormat Readers") && 
                !errorMessage.includes("IndexSizeError") &&
                !errorMessage.includes("QR code parse error")) {
              onScanError(errorMessage);
            }
          }
        );

        isInitialized.current = true;
        setIsContainerReady(true);
        setInitializationError(null);
        setIsScanning(true);
      } catch (error) {
        console.error('Error initializing scanner:', error);
        setInitializationError(error.message);
        onScanError('Failed to initialize scanner: ' + error.message);
        setIsScanning(false);
      }
    };

    // Only initialize if we have permission
    if (permissionStatus === 'granted') {
      // Add a delay to ensure the container is mounted and visible
      const initTimer = setTimeout(() => {
        initializeScanner();
      }, 500);

      return () => clearTimeout(initTimer);
    }

    // Cleanup
    return () => {
      stopScanning();
    };
  }, [permissionStatus, onScanSuccess, onScanError]);

  const handlePermissionRequest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setPermissionStatus('granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setPermissionStatus('denied');
      onScanError('Camera permission was denied');
    }
  };

  const handleRetry = () => {
    setIsContainerReady(false);
    setInitializationError(null);
    setIsScanning(false);
    stopScanning();
  };

  return (
    <div className="qr-scanner-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '400px'
    }}>
      {permissionStatus === 'denied' ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fff3f3',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#dc2626', marginBottom: '10px' }}>
            Camera access was denied. Please enable camera access in your browser settings.
          </p>
          <button
            onClick={handlePermissionRequest}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Request Camera Access
          </button>
        </div>
      ) : permissionStatus === 'prompt' ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ marginBottom: '10px' }}>
            Please allow camera access to scan QR codes.
          </p>
          <button
            onClick={handlePermissionRequest}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Allow Camera Access
          </button>
        </div>
      ) : null}
      <div
        id="qr-reader"
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '400px',
          minHeight: '300px',
          display: 'block',
          opacity: isContainerReady ? 1 : 0,
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease'
        }}
      />
      {!isContainerReady && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666'
        }}>
          {initializationError ? (
            <div>
              <p style={{ color: '#dc2626', marginBottom: '10px' }}>
                {initializationError}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            'Initializing scanner...'
          )}
        </div>
      )}
      {isScanning && (
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p>Tips for better scanning:</p>
          <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
            <li>Hold the QR code steady</li>
            <li>Ensure good lighting</li>
            <li>Keep the code within the scanning box</li>
            <li>Try different distances</li>
          </ul>
        </div>
      )}
    </div>
  );
});

QRScannerComponent.propTypes = {
  onScanSuccess: PropTypes.func.isRequired,
  onScanError: PropTypes.func.isRequired
};

export default QRScannerComponent; 