// src/components/features/Auctions/AuctionDetail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../config/axios';
import { useAuth } from '../../../context/AuthContext';
import LoadingScreen from '../../shared/LoadingScreen/LoadingScreen';
import './Auctions.css';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidding, setBidding] = useState(false);
  const [watching, setWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    fetchAuction();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/auctions/${id}`);
      const auctionData = response.data.data;
      
      setAuction(auctionData);
      setWatching(auctionData.isWatching || false);
      
      // Set initial bid amount
      const minBid = auctionData.currentBid.amount > 0 
        ? auctionData.currentBid.amount + auctionData.incrementAmount
        : auctionData.startingBid;
      setBidAmount(minBid.toString());
      
      // Start the timer
      startTimer(auctionData.endDate);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching auction:', err);
      setError('Failed to load auction details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (endDate) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Auction ended');
        clearInterval(timerRef.current);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const handleBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/auctions/${id}` } });
      return;
    }
    
    // Validate bid amount
    if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }
    
    const bidValue = Number(bidAmount);
    
    if (auction.currentBid.amount > 0 && bidValue <= auction.currentBid.amount) {
      setBidError('Bid must be higher than current bid');
      return;
    }
    
    if (auction.currentBid.amount === 0 && bidValue < auction.startingBid) {
      setBidError(`Bid must be at least the starting bid of $${auction.startingBid.toLocaleString()}`);
      return;
    }
    
    if (auction.currentBid.amount > 0 && bidValue < auction.currentBid.amount + auction.incrementAmount) {
      setBidError(`Bid must be at least $${(auction.currentBid.amount + auction.incrementAmount).toLocaleString()}`);
      return;
    }
    
    try {
      setBidding(true);
      setBidError('');
      
      const response = await axios.post(`/api/auctions/${id}/bid`, { amount: bidValue });
      
      // Update auction data with new bid
      setAuction(response.data.data.auction);
      
      // Update bid input to next minimum bid
      const nextMinBid = response.data.data.auction.currentBid.amount + response.data.data.auction.incrementAmount;
      setBidAmount(nextMinBid.toString());
      
      // Show success message
      alert('Your bid was placed successfully!');
    } catch (err) {
      console.error('Error placing bid:', err);
      setBidError(err.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  const handleWatchToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/auctions/${id}` } });
      return;
    }
    
    try {
      const response = await axios.put(`/api/auctions/${id}/watch`);
      setWatching(response.data.data.isWatching);
    } catch (err) {
      console.error('Error toggling watch status:', err);
    }
  };

  const calculateMinBid = () => {
    if (!auction) return 0;
    
    return auction.currentBid.amount > 0
      ? auction.currentBid.amount + auction.incrementAmount
      : auction.startingBid;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !auction) {
    return (
      <div className="auction-detail-container">
        <button 
          className="back-button" 
          onClick={() => navigate('/auctions')}
        >
          ← Back to Auctions
        </button>
        <div className="error-message">{error || 'Auction not found'}</div>
      </div>
    );
  }

  return (
    <div className="auction-detail-container">
      <button 
        className="back-button" 
        onClick={() => navigate('/auctions')}
      >
        ← Back to Auctions
      </button>

      <div className="auction-detail-grid">
        <div className="auction-detail-left">
          <div className="auction-gallery">
            <div className="gallery-main">
              <img 
                src={auction.images[selectedImage]?.url} 
                alt={auction.title}
              />
            </div>
            
            <div className="gallery-thumbnails">
              {auction.images.map((image, index) => (
                <div 
                  key={index}
                  className={`gallery-thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.thumbnail} alt={`${auction.title} view ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="auction-info-content">
            <div className="auction-info-header">
              <h2>{auction.title}</h2>
              <div className="auction-meta">
                <span><i className="fas fa-car"></i> {auction.vehicle.year} {auction.vehicle.make} {auction.vehicle.model}</span>
                <span><i className="fas fa-tachometer-alt"></i> {auction.vehicle.mileage.toLocaleString()} miles</span>
                <span><i className="fas fa-gas-pump"></i> {auction.vehicle.fuelType}</span>
                <span><i className="fas fa-cogs"></i> {auction.vehicle.transmission}</span>
              </div>
            </div>
            
            <div className="auction-description">
              <h3>Description</h3>
              <p>{auction.description}</p>
            </div>
            
            <div className="auction-specs">
              <h3>Vehicle Specifications</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Make</span>
                  <span className="spec-value">{auction.vehicle.make}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Model</span>
                  <span className="spec-value">{auction.vehicle.model}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Year</span>
                  <span className="spec-value">{auction.vehicle.year}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Mileage</span>
                  <span className="spec-value">{auction.vehicle.mileage.toLocaleString()} miles</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Transmission</span>
                  <span className="spec-value">{auction.vehicle.transmission}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fuel Type</span>
                  <span className="spec-value">{auction.vehicle.fuelType}</span>
                </div>
                {auction.vehicle.engineSize && (
                  <div className="spec-item">
                    <span className="spec-label">Engine</span>
                    <span className="spec-value">{auction.vehicle.engineSize}</span>
                  </div>
                )}
                {auction.vehicle.drivetrain && (
                  <div className="spec-item">
                    <span className="spec-label">Drivetrain</span>
                    <span className="spec-value">{auction.vehicle.drivetrain.toUpperCase()}</span>
                  </div>
                )}
                {auction.vehicle.exteriorColor && (
                  <div className="spec-item">
                    <span className="spec-label">Exterior Color</span>
                    <span className="spec-value">{auction.vehicle.exteriorColor}</span>
                  </div>
                )}
                {auction.vehicle.interiorColor && (
                  <div className="spec-item">
                    <span className="spec-label">Interior Color</span>
                    <span className="spec-value">{auction.vehicle.interiorColor}</span>
                  </div>
                )}
              </div>
            </div>
            
            {auction.features && auction.features.length > 0 && (
              <div className="auction-features">
                <h3>Features</h3>
                <ul className="features-list">
                  {auction.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="seller-info">
              <h3>Seller Information</h3>
              <div className="seller-card">
                <div className="seller-avatar">
                  <img src={auction.seller.avatar} alt={auction.seller.name} />
                </div>
                <div className="seller-details">
                  <h4>{auction.seller.name}</h4>
                  <div className="seller-location">
                    <i className="fas fa-map-marker-alt"></i> {auction.location.city}, {auction.location.state}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auction-detail-right">
          <div className="auction-info">
            <div className="bid-section">
              <div className="auction-timer">
                <span className="timer-label">Time Remaining:</span>
                <span className="time-remaining">{timeLeft}</span>
              </div>
              
              <div className="bid-info-grid">
                <div className="bid-info-item">
                  <span className="bid-info-label">Starting Bid</span>
                  <span className="bid-info-value">${auction.startingBid.toLocaleString()}</span>
                </div>
                <div className="bid-info-item">
                  <span className="bid-info-label">Current Bid</span>
                  <span className="bid-info-value highlight">
                    ${auction.currentBid.amount > 0 
                      ? auction.currentBid.amount.toLocaleString() 
                      : auction.startingBid.toLocaleString()}
                  </span>
                </div>
                <div className="bid-info-item">
                  <span className="bid-info-label">Bid Count</span>
                  <span className="bid-info-value">{auction.bidHistory.length}</span>
                </div>
                <div className="bid-info-item">
                  <span className="bid-info-label">Bid Increment</span>
                  <span className="bid-info-value">${auction.incrementAmount.toLocaleString()}</span>
                </div>
              </div>
              
              {auction.status === 'active' && new Date(auction.endDate) > new Date() ? (
                <>
                  {isAuthenticated && auction.seller._id !== user.id ? (
                    <form className="bid-form" onSubmit={handleBid}>
                      <label>Place Your Bid</label>
                      <div className="bid-input-group">
                        <span className="currency-symbol">$</span>
                        <input
                          type="number"
                          className="bid-input"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min={calculateMinBid()}
                          step={auction.incrementAmount}
                        />
                        <button 
                          type="submit" 
                          className="bid-button"
                          disabled={bidding}
                        >
                          {bidding ? 'Bidding...' : 'Place Bid'}
                        </button>
                      </div>
                      {bidError && <p className="bid-error">{bidError}</p>}
                      <p className="bid-note">
                        Minimum bid: ${calculateMinBid().toLocaleString()}
                      </p>
                    </form>
                  ) : isAuthenticated && auction.seller._id === user.id ? (
                    <div className="seller-notice">
                      <p>You are the seller of this auction.</p>
                    </div>
                  ) : (
                    <button 
                      className="bid-button full-width"
                      onClick={() => navigate('/login', { state: { from: `/auctions/${id}` } })}
                    >
                      Login to Bid
                    </button>
                  )}
                </>
              ) : (
                <div className="auction-ended-notice">
                  <p>{auction.status === 'sold' 
                    ? 'This auction has ended and the item has been sold.' 
                    : 'This auction has ended.'}
                  </p>
                </div>
              )}
              
              {isAuthenticated && auction.seller._id !== user.id && (
                <button 
                  className="watch-button"
                  onClick={handleWatchToggle}
                >
                  {watching ? '❤️ Watching' : '♡ Watch Auction'}
                </button>
              )}
            </div>
            
            <div className="bid-history">
              <h3>Bid History</h3>
              {auction.bidHistory.length === 0 ? (
                <p className="no-bids">No bids yet. Be the first to bid!</p>
              ) : (
                <div className="bid-list">
                  {auction.bidHistory.slice().reverse().map((bid, index) => (
                    <div key={index} className="bid-item">
                      <div className="bid-user">
                        <span className="bidder-name">
                          {bid.bidder.name || 'Anonymous'}
                        </span>
                      </div>
                      <div className="bid-details">
                        <span className="bid-amount">${bid.amount.toLocaleString()}</span>
                        <span className="bid-time">
                          {new Date(bid.time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;