// components/GION/hooks/useQRScanner.js
import { useState, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useQRScanner = () => {
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const startScanner = useCallback(() => {
    setError(null);
    setIsScanning(true);
    
    if (scanner) {
      // Scanner already exists
      try {
        if (!scanner.isScanning) {
          scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              console.log(`QR Code detected: ${decodedText}`);
              setScanResult(decodedText);
              
              // Stop scanning after a successful scan
              scanner.stop();
              setIsScanning(false);
            },
            (errorMessage) => {
              console.warn(`QR scan warning: ${errorMessage}`);
              // Don't set error on warnings - only on failures
            }
          ).catch((err) => {
            setError(`Unable to start scanner: ${err.message || 'Unknown error'}`);
            setIsScanning(false);
          });
        }
      } catch (error) {
        setError(`Scanner error: ${error.message || 'Unknown error'}`);
        setIsScanning(false);
      }
      return;
    }
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          console.log(`QR Code detected: ${decodedText}`);
          setScanResult(decodedText);
          
          // Stop scanning after a successful scan
          html5QrCode.stop();
          setIsScanning(false);
        },
        (errorMessage) => {
          console.warn(`QR scan warning: ${errorMessage}`);
          // Don't set error on warnings - only on failures
        }
      ).catch((err) => {
        setError(`Unable to start scanner: ${err.message || 'Unknown error'}`);
        setIsScanning(false);
      });
    } catch (error) {
      setError(`Error initializing QR scanner: ${error.message || 'Unknown error'}`);
      setIsScanning(false);
    }
  }, [scanner]);
  
  const stopScanner = useCallback(() => {
    if (scanner && scanner.isScanning) {
      scanner.stop()
        .then(() => {
          console.log('QR scanner stopped');
          setIsScanning(false);
        })
        .catch(err => {
          console.error('Error stopping QR scanner:', err);
          setIsScanning(false);
        });
    }
  }, [scanner]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => {
          console.error('Error stopping QR scanner during cleanup:', err);
        });
      }
    };
  }, [scanner]);
  
  return {
    startScanner,
    stopScanner,
    scanResult,
    error,
    isScanning,
    resetScanResult: () => setScanResult(null),
    resetError: () => setError(null)
  };
};