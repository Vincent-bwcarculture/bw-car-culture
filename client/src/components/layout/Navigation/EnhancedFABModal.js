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
  Info,
  Search,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../../QRScanner/QRCodeScanner.js';
import './EnhancedFABModal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

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

  // Plate review flow state
  const [plateStep, setPlateStep] = useState('input'); // 'input' | 'form' | 'done'
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState(null); // { found, provider, ghostId, normalizedPlate }
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (showModal) {
      fetchTopServices();
    }
  }, [showModal]);

  const fetchTopServices = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch(`${API_BASE}/reviews/leaderboard`);
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
    if (e.target === e.currentTarget) handleCloseAll();
  };

  const handleCloseAll = () => {
    setShowQRScanner(false);
    setReviewMethod(null);
    setServiceCode('');
    setPlateNumber('');
    setPlateStep('input');
    setLookupResult(null);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSubmitError('');
    onClose();
  };

  const resetPlateFlow = () => {
    setPlateStep('input');
    setLookupResult(null);
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSubmitError('');
  };

  const handleMethodSelect = (method) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: window.location.pathname, message: 'Please log in to leave a review' }
      });
      return;
    }
    setReviewMethod(method);
    if (method === 'qr') setShowQRScanner(true);
  };

  const handleQRScanResult = (result) => {
    setShowQRScanner(false);
    if (onReviewSubmit) onReviewSubmit('qr', { qrData: result });
    handleCloseAll();
  };

  const handleServiceCodeSubmit = () => {
    if (serviceCode.trim().length >= 4) {
      if (onReviewSubmit) onReviewSubmit('service_code', { serviceCode: serviceCode.trim() });
      handleCloseAll();
    }
  };

  // ── Plate lookup ──────────────────────────────────────────────────────────
  const handlePlateLookup = async () => {
    const plate = plateNumber.trim();
    if (plate.length < 3) return;
    setSearching(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API_BASE}/transport/lookup?plate=${encodeURIComponent(plate)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLookupResult(data.data || { found: false, normalizedPlate: plate.toUpperCase().replace(/\s+/g,'') });
      setPlateStep('form');
    } catch (err) {
      setLookupResult({ found: false, normalizedPlate: plate.toUpperCase().replace(/\s+/g,'') });
      setPlateStep('form');
    } finally {
      setSearching(false);
    }
  };

  // ── Submit plate review ────────────────────────────────────────────────────
  const handleSubmitPlateReview = async () => {
    if (!rating) { setSubmitError('Please select a star rating.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const body = {
        identifier: lookupResult?.normalizedPlate || plateNumber.trim().toUpperCase().replace(/\s+/g,''),
        identifierType: 'plate',
        rating,
        comment: comment.trim()
      };
      if (lookupResult?.provider?._id) body.providerId = lookupResult.provider._id;
      if (lookupResult?.ghostId) body.ghostId = lookupResult.ghostId;

      const res = await fetch(`${API_BASE}/transport/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        setPlateStep('done');
      } else {
        setSubmitError(result.message || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Leaderboard ───────────────────────────────────────────────────────────
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

  // ── Star rating row ────────────────────────────────────────────────────────
  const renderStarRow = () => (
    <div className="efab-star-row">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className="efab-star-btn"
          onMouseEnter={() => setHoverRating(n)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(n)}
        >
          <Star
            size={28}
            fill={(hoverRating || rating) >= n ? '#f59e0b' : 'none'}
            color={(hoverRating || rating) >= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="efab-star-label">
          {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
        </span>
      )}
    </div>
  );

  // ── Plate method content ───────────────────────────────────────────────────
  const renderPlateFlow = () => {
    if (plateStep === 'done') {
      return (
        <div className="efab-input-section efab-done-section">
          <CheckCircle size={40} color="#22c55e" />
          <h4>Review Submitted!</h4>
          <p>Thank you for your feedback. Your review has been recorded
            {lookupResult?.provider ? ` for ${lookupResult.provider.businessName || lookupResult.provider.name}` : ''}.
          </p>
          {!lookupResult?.found && (
            <p className="efab-ghost-note">
              This vehicle isn't registered yet. Your review will be automatically linked when the provider joins the platform.
            </p>
          )}
          <button className="efab-continue-button" onClick={handleCloseAll}>Done</button>
        </div>
      );
    }

    if (plateStep === 'form') {
      return (
        <div className="efab-input-section">
          <button className="efab-back-button" onClick={() => { resetPlateFlow(); }}>← Back</button>

          {lookupResult?.found ? (
            <div className="efab-lookup-found">
              <CheckCircle size={16} color="#22c55e" />
              <div>
                <div className="efab-lookup-name">{lookupResult.provider?.businessName || lookupResult.provider?.name || 'Provider found'}</div>
                <div className="efab-lookup-sub">{lookupResult.provider?.serviceType || 'Transport service'}</div>
              </div>
            </div>
          ) : (
            <div className="efab-lookup-notfound">
              <AlertCircle size={16} color="#f59e0b" />
              <div>
                <div className="efab-lookup-name">{lookupResult?.normalizedPlate}</div>
                <div className="efab-lookup-sub">Not registered yet — review will be linked when they join</div>
              </div>
            </div>
          )}

          <h4>Rate your experience</h4>
          {renderStarRow()}

          <div className="efab-comment-field">
            <textarea
              className="efab-textarea"
              rows={3}
              placeholder="Describe your experience (optional)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
            />
            <span className="efab-char-count">{comment.length}/500</span>
          </div>

          {submitError && (
            <div className="efab-submit-error">{submitError}</div>
          )}

          <div className="efab-input-actions">
            <button className="efab-cancel-button" onClick={() => setReviewMethod(null)}>Cancel</button>
            <button
              className="efab-continue-button"
              onClick={handleSubmitPlateReview}
              disabled={submitting || !rating}
            >
              <Send size={15} />
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      );
    }

    // plateStep === 'input'
    return (
      <div className="efab-input-section">
        <button className="efab-back-button" onClick={() => setReviewMethod(null)}>← Back</button>
        <h4>Enter Number Plate</h4>
        <p>Enter the vehicle registration number to review a transport service:</p>
        <div className="efab-plate-input-row">
          <input
            type="text"
            className="efab-input efab-plate-input"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            placeholder="e.g. B 123 ABC"
            maxLength={12}
            onKeyDown={e => e.key === 'Enter' && plateNumber.trim().length >= 3 && handlePlateLookup()}
          />
          <button
            className="efab-lookup-btn"
            onClick={handlePlateLookup}
            disabled={searching || plateNumber.trim().length < 3}
          >
            {searching ? <div className="efab-loading-spinner small" /> : <Search size={16} />}
          </button>
        </div>
        <div className="efab-plate-hint">We'll look up the registered provider automatically.</div>
      </div>
    );
  };

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
              <div className="efab-methods-section">
                <h4>How would you like to review?</h4>
                <div className="efab-method-buttons">
                  <button className="efab-method-button" onClick={() => handleMethodSelect('qr')}>
                    <div className="efab-method-icon"><QrCode size={24} /></div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Scan QR Code</span>
                      <span className="efab-method-desc">Quick service verification</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button className="efab-method-button" onClick={() => handleMethodSelect('service_code')}>
                    <div className="efab-method-icon"><Hash size={24} /></div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Service Code</span>
                      <span className="efab-method-desc">Enter code from receipt</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button className="efab-method-button" onClick={() => handleMethodSelect('plate_number')}>
                    <div className="efab-method-icon"><Car size={24} /></div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">Number Plate</span>
                      <span className="efab-method-desc">Review transport service</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>

                  <button className="efab-method-button" onClick={() => handleMethodSelect('general')}>
                    <div className="efab-method-icon"><MessageSquare size={24} /></div>
                    <div className="efab-method-info">
                      <span className="efab-method-title">General Review</span>
                      <span className="efab-method-desc">Share general feedback</span>
                    </div>
                    <ChevronRight size={16} className="efab-method-arrow" />
                  </button>
                </div>
              </div>
              {renderLeaderboard()}
            </>
          )}

          {/* Service Code */}
          {reviewMethod === 'service_code' && (
            <div className="efab-input-section">
              <button className="efab-back-button" onClick={() => setReviewMethod(null)}>← Back</button>
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
                <button className="efab-cancel-button" onClick={() => setReviewMethod(null)}>Cancel</button>
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

          {/* Plate Number — multi-step */}
          {reviewMethod === 'plate_number' && renderPlateFlow()}

          {/* General Review */}
          {reviewMethod === 'general' && (
            <div className="efab-input-section">
              <button className="efab-back-button" onClick={() => setReviewMethod(null)}>← Back</button>
              <h4>General Review</h4>
              <p>Share your general experience with a business or service.</p>
              <div className="efab-input-actions">
                <button className="efab-cancel-button" onClick={() => setReviewMethod(null)}>Cancel</button>
                <button className="efab-continue-button" onClick={() => { if (onReviewSubmit) onReviewSubmit('general', {}); handleCloseAll(); }}>
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
