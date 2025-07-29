import React, { useState, useEffect } from 'react';
import { 
  Star, 
  X, 
  QrCode, 
  Hash, 
  Car,
  MessageSquare,
  Trophy,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../../QRScanner/QRCodeScanner.js';
import './EnhancedFABModal.css';

const EnhancedFABModal = ({ 
  showModal, 
  onClose, 
  isAuthenticated, 
  onReviewSubmit 
}) => {
  const [reviewMethod, setReviewMethod] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [serviceCode, setServiceCode] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [topServices, setTopServices] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const navigate = useNavigate();

  // Fetch top-rated services for leaderboard
  useEffect(() => {
    if (showModal) {
      fetchTopServices();
    }
  }, [showModal]);

  const fetchTopServices = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch('/api/reviews/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setTopServices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseAll();
    }
  };

  const handleCloseAll = () => {
    setShowQRScanner(false);
    setReviewMethod(null);
    setServiceCode('');
    setPlateNumber('');
    onClose();
  };

  const handleMethodSelect = (method) => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please log in to leave a review'
        }
      });
      return;
    }

    setReviewMethod(method);
    
    if (method === 'qr') {
      setShowQRScanner(true);
    }
  };

  const handleQRScanResult = (result) => {
    setShowQRScanner(false);
    if (onReviewSubmit) {
      onReviewSubmit('qr', { qrData: result });
    }
    handleCloseAll();
  };

  const handleServiceCodeSubmit = () => {
    if (serviceCode.trim().length >= 4) {
      if (onReviewSubmit) {
        onReviewSubmit('service_code', { serviceCode: serviceCode.trim() });
      }
      handleCloseAll();
    }
  };

  const handlePlateNumberSubmit = () => {
    if (plateNumber.trim().length >= 4) {
      if (onReviewSubmit) {
        onReviewSubmit('plate_number', { plateNumber: plateNumber.trim() });
      }
      handleCloseAll();
    }
  };

  const handleGeneralReview = () => {
    if (onReviewSubmit) {
      onReviewSubmit('general', {});
    }
    handleCloseAll();
  };

  const renderLeaderboard = () => (
    <div className="efab-leaderboard-section">
      <div className="efab-leaderboard-header">
        <Trophy size={20} />
        <h4>Top Rated Services</h4>
      </div>
      
      {loadingLeaderboard ? (
        <div className="efab-leaderboard-loading">
          <div className="efab-loading-spinner"></div>
          <span>Loading top services...</span>
        </div>
      ) : topServices.length > 0 ? (
        <div className="efab-leaderboard-list">
          {topServices.slice(0, 5).map((service, index) => (
            <div key={service._id || index} className="efab-leaderboard-item">
              <div className="efab-rank-badge">
                <span className="efab-rank-number">#{index + 1}</span>
                {index === 0 && <Award size={14} className="efab-crown" />}
              </div>
              
              <div className="efab-service-info">
                <span className="efab-service-name">{service.businessName}</span>
                <span className="efab-service-type">{service.serviceType}</span>
              </div>
              
              <div className="efab-rating-info">
                <div className="efab-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      size={12}
                      className={`efab-star ${star <= Math.round(service.averageRating) ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <span className="efab-rating-number">{service.averageRating.toFixed(1)}</span>
                <span className="efab-review-count">({service.totalReviews})</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="efab-leaderboard-empty">
          <Trophy size={24} />
          <span>No ratings yet. Be the first to review!</span>
        </div>
      )}
    </div>
  );

 return null;

  return (
    <div className="efab-modal-overlay" onClick={handleOverlayClick}>
      {showQRScanner && (
        <div className="efab-qr-scanner-container">
          <QRCodeScanner
            onScanResult={handleQRScanResult}
            onClose={() => setShowQRScanner(false)}
          />
        </div>
      )}

      {!showQRScanner && (
        <div className="efab-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="efab-modal-header">
            <h3>Share Your Experience</h3>
            <button className="efab-close-button" onClick={handleCloseAll}>
              <X size={20} />
            </button>
          </div>

          {/* Why Reviews Matter Section */}
          <div className="efab-info-section">
            <div className="efab-info-badge">
              <Info size={16} />
            </div>
            <div className="efab-info-content">
              <p>Your reviews help other customers make informed decisions and help businesses improve their services. Every review counts!</p>
            </div>
          </div>

          {!reviewMethod && (
            <>
              {/* Review Method Selection */}
              <div className="efab-methods-section">
                <h4>How would you like to review?</h4>
                <div className="efab-method-buttons">
                  <button 
                    className="efab-method-button"
                    onClick={() => handleMethodSelect('qr')}
                  >
                    <div className="efab-method-icon">
                      <QrCode size={24} />
                    </div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Scan QR Code</span>
                      <span className="efab-method-desc">Quick service verification</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button 
                    className="efab-method-button"
                    onClick={() => handleMethodSelect('service_code')}
                  >
                    <div className="efab-method-icon">
                      <Hash size={24} />
                    </div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Service Code</span>
                      <span className="efab-method-desc">Enter code from receipt</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button 
                    className="efab-method-button"
                    onClick={() => handleMethodSelect('plate_number')}
                  >
                    <div className="efab-method-icon">
                      <Car size={24} />
                    </div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Number Plate</span>
                      <span className="efab-method-desc">Review transport service</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button 
                    className="efab-method-button"
                    onClick={() => handleMethodSelect('general')}
                  >
                    <div className="efab-method-icon">
                      <MessageSquare size={24} />
                    </div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">General Review</span>
                      <span className="efab-method-desc">Share general feedback</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>
                </div>
              </div>

              {/* Leaderboard Section */}
              {renderLeaderboard()}
            </>
          )}

          {/* Service Code Input */}
          {reviewMethod === 'service_code' && (
            <div className="efab-input-section">
              <button 
                className="efab-back-button"
                onClick={() => setReviewMethod(null)}
              >
                ← Back
              </button>
              <h4>Enter Service Code</h4>
              <p>Enter the service code from your receipt or service card:</p>
              <input
                type="text"
                className="efab-input"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                placeholder="e.g. SVC123"
                maxLength={10}
              />
              <div className="efab-input-actions">
                <button 
                  className="efab-cancel-button"
                  onClick={() => setReviewMethod(null)}
                >
                  Cancel
                </button>
                <button 
                  className="efab-continue-button"
                  onClick={handleServiceCodeSubmit}
                  disabled={serviceCode.trim().length < 4}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Plate Number Input */}
          {reviewMethod === 'plate_number' && (
            <div className="efab-input-section">
              <button 
                className="efab-back-button"
                onClick={() => setReviewMethod(null)}
              >
                ← Back
              </button>
              <h4>Enter Number Plate</h4>
              <p>Enter the vehicle number plate to review transport service:</p>
              <input
                type="text"
                className="efab-input"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={10}
              />
              <div className="efab-input-actions">
                <button 
                  className="efab-cancel-button"
                  onClick={() => setReviewMethod(null)}
                >
                  Cancel
                </button>
                <button 
                  className="efab-continue-button"
                  onClick={handlePlateNumberSubmit}
                  disabled={plateNumber.trim().length < 4}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* General Review */}
          {reviewMethod === 'general' && (
            <div className="efab-input-section">
              <button 
                className="efab-back-button"
                onClick={() => setReviewMethod(null)}
              >
                ← Back
              </button>
              <h4>General Review</h4>
              <p>Share your general experience with a business or service.</p>
              <div className="efab-input-actions">
                <button 
                  className="efab-cancel-button"
                  onClick={() => setReviewMethod(null)}
                >
                  Cancel
                </button>
                <button 
                  className="efab-continue-button"
                  onClick={handleGeneralReview}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedFABModal;
