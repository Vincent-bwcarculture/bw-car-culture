import React, { useState } from 'react';
import './CarpoolCard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';

const RECURRENCE_LABEL = {
  once: 'One-time',
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  weekly: 'Weekly',
};

const formatTime = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-BW', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatPrice = (p) => `P${Number(p).toLocaleString()}`;

const CarpoolCard = ({ ride, onReserved }) => {
  const [showReserve, setShowReserve] = useState(false);
  const [seats, setSeats] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName]   = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isFull = ride.status === 'full' || ride.seatsAvailable === 0;

  const handleReserve = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Please log in to reserve a seat.' });
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/rides/${ride._id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seats, phone, name })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Seat reserved! Contact the driver on WhatsApp to confirm.` });
        if (onReserved) onReserved(ride._id, data.seatsAvailable);
        setTimeout(() => setShowReserve(false), 2500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Could not reserve seat.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi, I found your ride on BW Car Culture — ${ride.origin} → ${ride.destination} on ${formatTime(ride.departureTime)}. Is a seat still available?`
    );
    const num = ride.driverPhone?.replace(/\D/g, '');
    const wa = num ? `https://wa.me/267${num.replace(/^267/, '')}?text=${text}` : `https://wa.me/26774122453?text=${text}`;
    window.open(wa, '_blank');
  };

  return (
    <div className={`cp-card${isFull ? ' cp-card--full' : ''}`}>
      {/* Image */}
      <div className="cp-card-image-wrap">
        {ride.vehicleImage
          ? <img src={ride.vehicleImage} alt="Vehicle" className="cp-card-image" />
          : <div className="cp-card-image-placeholder"><span>🚗</span></div>
        }
        <div className="cp-card-badge">{RECURRENCE_LABEL[ride.recurrence] || ride.recurrence}</div>
        {isFull && <div className="cp-card-full-badge">Full</div>}
      </div>

      {/* Content */}
      <div className="cp-card-content">
        {/* Route */}
        <div className="cp-card-route">
          <span className="cp-card-city">{ride.origin}</span>
          <span className="cp-card-arrow">→</span>
          <span className="cp-card-city">{ride.destination}</span>
        </div>

        {/* Meta row */}
        <div className="cp-card-meta">
          <div className="cp-card-meta-item">
            <span className="cp-card-meta-label">Departure</span>
            <span className="cp-card-meta-value">{formatTime(ride.departureTime)}</span>
          </div>
          <div className="cp-card-meta-item">
            <span className="cp-card-meta-label">Seats left</span>
            <span className="cp-card-meta-value">{ride.seatsAvailable} / {ride.seatsTotal}</span>
          </div>
          <div className="cp-card-meta-item">
            <span className="cp-card-meta-label">Per seat</span>
            <span className="cp-card-meta-value cp-card-price">{formatPrice(ride.pricePerSeat)}</span>
          </div>
        </div>

        {/* Vehicle info */}
        {(ride.vehicle?.make || ride.vehicle?.color) && (
          <div className="cp-card-vehicle">
            {[ride.vehicle.color, ride.vehicle.make, ride.vehicle.model].filter(Boolean).join(' ')}
          </div>
        )}

        {/* Notes */}
        {ride.notes && <p className="cp-card-notes">{ride.notes}</p>}

        {/* Driver */}
        <div className="cp-card-driver">
          <div className="cp-card-driver-avatar">{(ride.driverName || 'D')[0].toUpperCase()}</div>
          <span className="cp-card-driver-name">{ride.driverName}</span>
        </div>

        {/* Reserve panel */}
        {showReserve && (
          <div className="cp-card-reserve-panel">
            {message && (
              <div className={`cp-card-msg cp-card-msg--${message.type}`}>{message.text}</div>
            )}
            <input
              className="cp-card-input"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className="cp-card-input"
              placeholder="Your phone (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <div className="cp-card-seats-row">
              <label className="cp-card-seats-label">Seats:</label>
              <select
                className="cp-card-seats-select"
                value={seats}
                onChange={e => setSeats(Number(e.target.value))}
              >
                {Array.from({ length: Math.min(ride.seatsAvailable, 4) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="cp-card-seats-total">
                Total: {formatPrice(ride.pricePerSeat * seats)}
              </span>
            </div>
            <div className="cp-card-reserve-actions">
              <button className="cp-card-btn cp-card-btn--confirm" onClick={handleReserve} disabled={loading}>
                {loading ? 'Reserving…' : 'Confirm Reservation'}
              </button>
              <button className="cp-card-btn cp-card-btn--cancel" onClick={() => setShowReserve(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="cp-card-footer">
          <button className="cp-card-btn cp-card-btn--wa" onClick={handleWhatsApp}>
            WhatsApp Driver
          </button>
          {!showReserve && (
            <button
              className="cp-card-btn cp-card-btn--reserve"
              onClick={() => setShowReserve(true)}
              disabled={isFull}
            >
              {isFull ? 'Fully Booked' : 'Reserve Seat'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarpoolCard;
