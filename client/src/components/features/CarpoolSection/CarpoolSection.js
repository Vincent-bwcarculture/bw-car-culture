import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CarpoolCard from '../../shared/CarpoolCard/CarpoolCard.js';
import CreateRideModal from '../../modals/CreateRideModal/CreateRideModal.js';
import './CarpoolSection.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';

const CarpoolSection = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/rides?limit=4`)
      .then(r => r.json())
      .then(d => { if (d.success) setRides(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReserved = (rideId, newAvailable) => {
    setRides(prev => prev.map(r =>
      String(r._id) === String(rideId)
        ? { ...r, seatsAvailable: newAvailable, status: newAvailable === 0 ? 'full' : 'active' }
        : r
    ));
  };

  const handleCreated = (newRide) => {
    setRides(prev => [newRide, ...prev].slice(0, 4));
  };

  return (
    <section className="cps-section">
      <div className="cps-container">
        {/* Header */}
        <div className="cps-header">
          <div className="cps-header-text">
            <div className="cps-eyebrow">Community Rides</div>
            <h2 className="cps-title">Share a Ride</h2>
            <p className="cps-subtitle">
              With public transport disruptions, BW Car Culture connects drivers with passengers
              heading the same way. Split costs, share the road.
            </p>
          </div>
          <div className="cps-header-actions">
            <button className="cps-btn cps-btn--primary" onClick={() => setShowModal(true)}>
              + Post Your Ride
            </button>
            <button className="cps-btn cps-btn--secondary" onClick={() => navigate('/services?category=carpooling')}>
              Browse All Rides
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="cps-loading">
            {[1,2,3,4].map(i => <div key={i} className="cps-skeleton" />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="cps-empty">
            <div className="cps-empty-icon">🚗</div>
            <p className="cps-empty-title">No rides posted yet</p>
            <p className="cps-empty-sub">Be the first to offer a shared ride in your area.</p>
            <button className="cps-btn cps-btn--primary" onClick={() => setShowModal(true)}>
              Post the first ride
            </button>
          </div>
        ) : (
          <div className="cps-grid">
            {rides.map(ride => (
              <CarpoolCard key={ride._id} ride={ride} onReserved={handleReserved} />
            ))}
          </div>
        )}

        {rides.length > 0 && (
          <div className="cps-footer">
            <button className="cps-view-all" onClick={() => navigate('/services?category=carpooling')}>
              View all rides →
            </button>
          </div>
        )}
      </div>

      <CreateRideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </section>
  );
};

export default CarpoolSection;
