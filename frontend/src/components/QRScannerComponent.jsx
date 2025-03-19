import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import PropTypes from "prop-types";

const QRScannerComponent = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    // Wait for the component to be fully mounted
    setIsReady(true);
    
    return () => {
      // Clean up scanner on unmount
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear();
        } catch (error) {
          console.error("Error cleaning up QR scanner:", error);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && scannerRef.current && !qrScannerRef.current) {
      try {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
          scannerRef.current.id,
          {
            qrbox: { width: 250, height: 250 },
            fps: 10,
            rememberLastUsedCamera: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );

        qrScannerRef.current = scanner;
      } catch (error) {
        console.error("Error initializing QR scanner:", error);
        if (onScanError) {
          onScanError("Failed to initialize scanner: " + error.message);
        }
      }
    }
  }, [isReady, onScanSuccess, onScanError]);

  return (
    <div className="qr-scanner-wrapper">
      <div 
        ref={scannerRef} 
        id="qr-reader" 
        style={{ 
          width: '100%', 
          minHeight: '300px',
          position: 'relative'
        }}
      ></div>
    </div>
  );
};

QRScannerComponent.propTypes = {
  onScanSuccess: PropTypes.func.isRequired,
  onScanError: PropTypes.func.isRequired
};

export default QRScannerComponent; 