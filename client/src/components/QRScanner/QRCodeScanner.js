// client/src/components/QRScanner/QRCodeScanner.js
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import './QRCodeScanner.css';

const QRCodeScanner = ({ onResult, onCancel, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [permission, setPermission] = useState('requesting');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [selectedDevice]);

  const startCamera = async () => {
    try {
      setError(null);
      setPermission('requesting');

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Try to use back camera first
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      if (selectedDevice) {
        // Stop current stream and start with selected device
        stream.getTracks().forEach(track => track.stop());
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDevice }
        });
        setupVideo(newStream);
      } else {
        setupVideo(stream);
      }

      setPermission('granted');

    } catch (err) {
      console.error('Camera access error:', err);
      
      let errorMessage = 'Unable to access camera. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please grant camera permission and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += 'Please check your camera settings.';
      }
      
      setError(errorMessage);
      setPermission('denied');
      onError?.(errorMessage);
    }
  };

  const setupVideo = (stream) => {
    streamRef.current = stream;
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      videoRef.current.onloadedmetadata = () => {
        startScanning();
      };
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    scanFrame();
  };

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // Try to detect QR code using canvas ImageData
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = detectQRCode(imageData);
        
        if (qrResult) {
          handleQRDetected(qrResult);
          return;
        }
      } catch (err) {
        console.error('QR detection error:', err);
      }
    }

    // Continue scanning
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  // Simple QR code detection using pattern recognition
  const detectQRCode = (imageData) => {
    // This is a simplified QR detection
    // In production, you'd use a library like jsQR or qr-scanner
    
    // For demo purposes, we'll simulate QR detection
    // In real implementation, use: import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    // Mock QR detection for demo - remove in production
    if (Math.random() < 0.1) { // 10% chance to simulate detection
      return {
        data: 'car_rental|507f1f77bcf86cd799439011|60b5d0b3a1c4c5d6e7f8a9b0|ABC Car Rental'
      };
    }
    
    return null;
  };

  const handleQRDetected = (result) => {
    setIsScanning(false);
    setScanResult(result.data);
    
    // Validate QR code format
    if (validateQRCode(result.data)) {
      setTimeout(() => {
        onResult(result.data);
      }, 1000); // Show success message briefly
    } else {
      setError('Invalid QR code format. Please scan a service QR code.');
      setTimeout(() => {
        setError(null);
        setScanResult(null);
        startScanning();
      }, 2000);
    }
  };

  const validateQRCode = (data) => {
    // Validate QR code format: serviceType|serviceId|providerId|serviceName
    const parts = data.split('|');
    return parts.length >= 3 && parts[0] && parts[1] && parts[2];
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDevice(devices[nextIndex].deviceId);
    }
  };

  const retryCamera = () => {
    setError(null);
    setScanResult(null);
    startCamera();
  };

  if (permission === 'requesting') {
    return (
      <div className="qr-scanner-container">
        <div className="scanner-loading">
          <Camera size={48} />
          <p>Requesting camera access...</p>
        </div>
      </div>
    );
  }

  if (permission === 'denied' || error) {
    return (
      <div className="qr-scanner-container">
        <div className="scanner-error">
          <AlertTriangle size={48} />
          <h3>Camera Access Required</h3>
          <p>{error || 'Camera permission is required to scan QR codes.'}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={retryCamera}>
              <RotateCcw size={16} />
              Try Again
            </button>
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      {/* Scanner Header */}
      <div className="scanner-header">
        <h3>Scan Service QR Code</h3>
        <button className="close-scanner" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      {/* Video Container */}
      <div className="video-container">
        <video
          ref={videoRef}
          className="scanner-video"
          autoPlay
          muted
          playsInline
        />
        
        {/* Scanning Overlay */}
        <div className="scanner-overlay">
          <div className="scan-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
            
            {isScanning && !scanResult && (
              <div className="scanning-line"></div>
            )}
          </div>
          
          {/* Success Overlay */}
          {scanResult && (
            <div className="scan-success">
              <CheckCircle size={48} />
              <p>QR Code Detected!</p>
            </div>
          )}
        </div>

        {/* Hidden Canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Scanner Controls */}
      <div className="scanner-controls">
        {devices.length > 1 && (
          <button className="camera-switch" onClick={switchCamera}>
            <RotateCcw size={16} />
            Switch Camera
          </button>
        )}
        
        <div className="scanner-status">
          {isScanning && !scanResult && (
            <div className="status-indicator scanning">
              <div className="pulse"></div>
              Scanning...
            </div>
          )}
          
          {scanResult && (
            <div className="status-indicator success">
              <CheckCircle size={16} />
              Code Detected
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="scanner-instructions">
        <p>Point your camera at a service QR code</p>
        <div className="instruction-tips">
          <span>• Hold steady for better detection</span>
          <span>• Ensure good lighting</span>
          <span>• Keep QR code within the frame</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="scanner-error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
