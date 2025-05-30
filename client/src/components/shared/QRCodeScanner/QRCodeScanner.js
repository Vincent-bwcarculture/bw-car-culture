// src/components/shared/QRCodeScanner/QRCodeScanner.js
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRCodeScanner.css';

const QRCodeScanner = ({ onResult, onCancel }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  useEffect(() => {
    // Initialize QR scanner
    const initializeScanner = () => {
      try {
        // Create a new scanner instance
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          formatsToSupport: [ 
            Html5QrcodeScanner.FORMATS.QR_CODE,
            Html5QrcodeScanner.FORMATS.CODE_39,
            Html5QrcodeScanner.FORMATS.CODE_128
          ]
        };

        // Create scanner instance
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          config,
          /* verbose= */ false
        );

        // Save to ref
        scannerRef.current = scanner;

        // Start scanning
        scanner.render(
          // Success callback
          (decodedText) => {
            console.log(`QR Code detected: ${decodedText}`);
            setScanning(false);
            
            // Stop the scanner
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            
            // Call the parent callback with the result
            if (onResult) {
              onResult(decodedText);
            }
          },
          // Error callback
          (errorMessage) => {
            // Don't set error for normal scan failures (too verbose)
            if (errorMessage.includes('No QR code found')) {
              return;
            }
            
            console.warn(`QR Code scanning error: ${errorMessage}`);
            
            // Only set an error for severe issues
            if (errorMessage.includes('camera access')) {
              setError('Camera access denied. Please check your browser permissions.');
            }
          }
        );

        setScanning(true);
      } catch (err) {
        console.error('Error initializing QR scanner:', err);
        setError(`Error initializing scanner: ${err.message}`);
      }
    };

    // Initialize the scanner
    initializeScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onResult]);

  const handleCancel = () => {
    // Stop scanning
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    
    // Call the parent cancel callback
    if (onCancel) {
      onCancel();
    }
  };

  const handleRetry = () => {
    // Reset error state
    setError(null);
    
    // Re-initialize scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
      
      // Short delay to ensure DOM is updated
      setTimeout(() => {
        // Initialize a new scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        };
        
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          config,
          /* verbose= */ false
        );
        
        // Start scanning again
        scannerRef.current.render(
          // Success callback
          (decodedText) => {
            console.log(`QR Code detected: ${decodedText}`);
            setScanning(false);
            
            // Stop the scanner
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            
            // Call the parent callback with the result
            if (onResult) {
              onResult(decodedText);
            }
          },
          // Error callback
          (errorMessage) => {
            // Don't set error for normal scan failures (too verbose)
            if (errorMessage.includes('No QR code found')) {
              return;
            }
            
            console.warn(`QR Code scanning error: ${errorMessage}`);
            
            // Only set an error for severe issues
            if (errorMessage.includes('camera access')) {
              setError('Camera access denied. Please check your browser permissions.');
            }
          }
        );
        
        setScanning(true);
      }, 100);
    }
  };

  return (
    <div className="qr-scanner-container" ref={scannerContainerRef}>
      {error ? (
        <div className="qr-scanner-error">
          <p className="error-message">{error}</p>
          <div className="qr-scanner-buttons">
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
            <button onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div id="qr-reader"></div>
          <div className="qr-scanner-buttons">
            <button onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
          </div>
          <div className="qr-scanner-instructions">
            <div className="scanner-tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">Position the QR code within the square frame</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QRCodeScanner;