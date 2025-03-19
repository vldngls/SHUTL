import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import PropTypes from "prop-types";

const QRScannerComponent = forwardRef(({ onScanSuccess, onScanError }, ref) => {
  const scannerRef = useRef(null);
  const isInitialized = useRef(false);
  const containerRef = useRef(null);
  const lastScannedCode = useRef(null);
  const lastScanTime = useRef(0);
  const [permissionStatus, setPermissionStatus] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('cameraPermission') || null;
  });
  const [isContainerReady, setIsContainerReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState([]);

  // Expose stopScanning through ref
  useImperativeHandle(ref, () => ({
    stopScanning
  }));

  // Add a function to check container dimensions
  const checkContainerDimensions = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    return false;
  };

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
        // If we already have a stored permission status, use it
        const storedStatus = localStorage.getItem('cameraPermission');
        if (storedStatus === 'granted') {
          setPermissionStatus('granted');
          return;
        }

        const result = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(result.state);
        
        // Store permission status
        localStorage.setItem('cameraPermission', result.state);
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
          localStorage.setItem('cameraPermission', result.state);
        });
      } catch (error) {
        console.error('Error checking camera permissions:', error);
        // If we have a stored status, use it as fallback
        const storedStatus = localStorage.getItem('cameraPermission');
        if (storedStatus) {
          setPermissionStatus(storedStatus);
        }
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

        // Enhanced scanner configuration
        scannerRef.current = new Html5QrcodeScanner('qr-reader', {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: { ideal: "environment" }
          },
          // Add support for more formats
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ],
          // Add experimental features
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });

        // Start scanning with enhanced error reporting
        await scannerRef.current.render(
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
      localStorage.setItem('cameraPermission', 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setPermissionStatus('denied');
      localStorage.setItem('cameraPermission', 'denied');
      onScanError('Camera permission was denied');
    }
  };

  const handleRetry = () => {
    setIsContainerReady(false);
    setInitializationError(null);
    setIsScanning(false);
    stopScanning();
  };

  // Only show permission request UI if we don't have a stored permission status
  const showPermissionRequest = !localStorage.getItem('cameraPermission');

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
      {showPermissionRequest && permissionStatus === 'denied' ? (
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
      ) : showPermissionRequest && permissionStatus === 'prompt' ? (
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