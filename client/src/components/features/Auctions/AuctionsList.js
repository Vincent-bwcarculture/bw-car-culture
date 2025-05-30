// src/components/features/Auctions/AuctionsList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Auctions.css';

const AuctionsList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'active',
    sort: 'endDate'
  });
  const { isAuthenticated } = useAuth();
  
  // Temporary sample auction data for demonstration
  const [auctions] = useState([
    {
      _id: '1',
      title: '2023 BMW M4 Competition - Low Miles, One Owner',
      startingBid: 75000,
      currentBid: {
        amount: 85500,
        bidder: { name: 'John D.' }
      },
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      vehicle: {
        year: 2023,
        make: 'BMW',
        model: 'M4 Competition'
      },
      images: [
        { url: '/images/f80.jpg', isPrimary: true },
        { url: '/images/f80-front.jpg', isPrimary: false },
        { url: '/images/f80-rear.jpg', isPrimary: false }
      ],
      bidHistory: [
        { amount: 75000, bidder: { name: 'Sarah M.' } },
        { amount: 81000, bidder: { name: 'Michael T.' } },
        { amount: 85500, bidder: { name: 'John D.' } }
      ],
      views: 342,
      status: 'active',
      featured: true,
      location: {
        city: 'Los Angeles',
        state: 'CA'
      },
      seller: {
        _id: '123',
        name: 'Premium Motors',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user1', 'user2', 'user3']
    },
    {
      _id: '2',
      title: '2024 Porsche 911 GT3 RS - Track Ready',
      startingBid: 249000,
      currentBid: {
        amount: 249000,
        bidder: null
      },
      endDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      vehicle: {
        year: 2024,
        make: 'Porsche',
        model: '911 GT3 RS'
      },
      images: [
        { url: '/images/posrche.jpg', isPrimary: true }
      ],
      bidHistory: [],
      views: 156,
      status: 'active',
      featured: false,
      location: {
        city: 'Miami',
        state: 'FL'
      },
      seller: {
        _id: '124',
        name: 'Exclusive Automobiles',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user1']
    },
    {
      _id: '3',
      title: '2024 Tesla Cybertruck - First Edition',
      startingBid: 120000,
      currentBid: {
        amount: 155000,
        bidder: { name: 'Alex W.' }
      },
      endDate: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 day from now
      vehicle: {
        year: 2024,
        make: 'Tesla',
        model: 'Cybertruck'
      },
      images: [
        { url: '/images/cybertruck.jpg', isPrimary: true }
      ],
      bidHistory: [
        { amount: 120000, bidder: { name: 'David K.' } },
        { amount: 135000, bidder: { name: 'Emily R.' } },
        { amount: 144000, bidder: { name: 'Robert S.' } },
        { amount: 155000, bidder: { name: 'Alex W.' } }
      ],
      views: 897,
      status: 'active',
      featured: true,
      location: {
        city: 'Austin',
        state: 'TX'
      },
      seller: {
        _id: '125',
        name: 'Tesla Direct',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user1', 'user2', 'user3', 'user4', 'user5']
    },
    {
      _id: '4',
      title: '2023 Cadillac CT5-V Blackwing - 668HP Beast',
      startingBid: 95000,
      currentBid: {
        amount: 102500,
        bidder: { name: 'Chris B.' }
      },
      endDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      vehicle: {
        year: 2023,
        make: 'Cadillac',
        model: 'CT5-V Blackwing'
      },
      images: [
        { url: '/images/ct5-v.jpg', isPrimary: true }
      ],
      bidHistory: [
        { amount: 95000, bidder: { name: 'Jessica T.' } },
        { amount: 98000, bidder: { name: 'Mark R.' } },
        { amount: 102500, bidder: { name: 'Chris B.' } }
      ],
      views: 230,
      status: 'active',
      featured: false,
      location: {
        city: 'Detroit',
        state: 'MI'
      },
      seller: {
        _id: '126',
        name: 'Cadillac Premier',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user2', 'user3']
    },
    {
      _id: '5',
      title: '2023 Audi RS7 - Fully Loaded, Carbon Package',
      startingBid: 129000,
      currentBid: {
        amount: 134500,
        bidder: { name: 'Thomas J.' }
      },
      endDate: new Date(Date.now() + 86400000 * 6).toISOString(), // 6 days from now
      vehicle: {
        year: 2023,
        make: 'Audi',
        model: 'RS7'
      },
      images: [
        { url: '/images/lambo.png', isPrimary: true }
      ],
      bidHistory: [
        { amount: 129000, bidder: { name: 'Laura S.' } },
        { amount: 134500, bidder: { name: 'Thomas J.' } }
      ],
      views: 175,
      status: 'active',
      featured: false,
      location: {
        city: 'Chicago',
        state: 'IL'
      },
      seller: {
        _id: '127',
        name: 'Audi Exclusive',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user1', 'user4']
    },
    {
      _id: '6',
      title: '2023 Lamborghini Urus - Pearl White, 2K Miles',
      startingBid: 275000,
      currentBid: {
        amount: 285000,
        bidder: { name: 'James P.' }
      },
      endDate: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
      vehicle: {
        year: 2023,
        make: 'Lamborghini',
        model: 'Urus'
      },
      images: [
        { url: '/images/manhart-x5.jpg', isPrimary: true }
      ],
      bidHistory: [
        { amount: 275000, bidder: { name: 'Kevin N.' } },
        { amount: 280000, bidder: { name: 'Lisa G.' } },
        { amount: 285000, bidder: { name: 'James P.' } }
      ],
      views: 412,
      status: 'active',
      featured: true,
      location: {
        city: 'New York',
        state: 'NY'
      },
      seller: {
        _id: '128',
        name: 'Luxury Auto Group',
        avatar: '/images/dealer-avatar.jpg'
      },
      watchers: ['user1', 'user2', 'user3', 'user4']
    }
  ]);

  // Simulate loading state for better UX demonstration
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTimeLeft = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const sortAuctions = (aucts) => {
    switch(filters.sort) {
      case 'endDate':
        return [...aucts].sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
      case 'price-high':
        return [...aucts].sort((a, b) => b.currentBid.amount - a.currentBid.amount);
      case 'price-low':
        return [...aucts].sort((a, b) => a.currentBid.amount - b.currentBid.amount);
      case 'bids':
        return [...aucts].sort((a, b) => b.bidHistory.length - a.bidHistory.length);
      case 'watchers':
        return [...aucts].sort((a, b) => b.watchers.length - a.watchers.length);
      case 'newest':
      default:
        return [...aucts].sort((a, b) => b._id - a._id);
    }
  };

  const filteredAuctions = sortAuctions(auctions);

  if (loading) {
    return (
      <div className="auctions-loading-container">
        <div className="auctions-loader"></div>
        <p>Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="auctions-container">
      <div className="auctions-header">
        <div className="auctions-title">
          <h1>Car Auctions</h1>
          <p>Bid on exclusive cars from trusted sellers</p>
        </div>
        
        {isAuthenticated && (
          <Link to="/auctions/create" className="create-auction-btn">
            <span className="icon">🔨</span>
            Sell Your Car
          </Link>
        )}
      </div>
      
      <div className="auctions-filter-bar">
        <div className="filter-stats">
          <span className="stat-label">Active Auctions:</span>
          <span className="stat-value">{auctions.length}</span>
        </div>
        
        <div className="filter-controls">
          <select 
            name="status" 
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="active">Active Auctions</option>
            <option value="upcoming">Upcoming Auctions</option>
            <option value="ended">Ended Auctions</option>
          </select>
          
          <select 
            name="sort" 
            value={filters.sort}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="endDate">Ending Soon</option>
            <option value="newest">Newest Listed</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="bids">Most Bids</option>
            <option value="watchers">Most Watched</option>
          </select>
          
          <div className="view-toggle">
            <button 
              className="view-btn active" 
              title="Grid View"
            >
              <span className="grid-icon">▦</span>
            </button>
            <button 
              className="view-btn" 
              title="List View"
            >
              <span className="list-icon">☰</span>
            </button>
          </div>
        </div>
      </div>
      
      {error && <div className="auctions-error">{error}</div>}
      
      <div className="featured-auctions">
        {auctions.filter(a => a.featured).length > 0 && (
          <>
            <h2 className="section-title">
              <span className="featured-icon">★</span> Featured Auctions
            </h2>
            <div className="featured-grid">
              {auctions
                .filter(auction => auction.featured)
                .map(auction => (
                  <div key={auction._id} className="featured-card">
                    <div className="auction-image-container">
                      <img 
                        src={auction.images.find(img => img.isPrimary)?.url || auction.images[0]?.url} 
                        alt={auction.title}
                        className="auction-image"
                      />
                      <div className="auction-badges">
                        <span className="featured-badge">Featured</span>
                        <span className="bids-badge">
                          <span className="icon">🔨</span>
                          {auction.bidHistory.length} bids
                        </span>
                      </div>
                      <div className="time-remaining">
                        {formatTimeLeft(auction.endDate)}
                      </div>
                    </div>
                    
                    <div className="auction-content">
                      <h3 className="auction-title">{auction.title}</h3>
                      
                      <div className="auction-info">
                        <div className="specs">
                          <span className="year">{auction.vehicle.year}</span>
                          <span className="make-model">{auction.vehicle.make} {auction.vehicle.model}</span>
                        </div>
                        
                        <div className="location">
                          <span className="icon">📍</span>
                          {auction.location.city}, {auction.location.state}
                        </div>
                      </div>
                      
                      <div className="bid-info">
                        <div className="current-bid">
                          <span className="label">Current Bid:</span>
                          <span className="amount">${auction.currentBid.amount.toLocaleString()}</span>
                        </div>
                        
                        <Link to={`/auctions/${auction._id}`} className="bid-button">
                          Bid Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
      
      <div className="all-auctions">
        <h2 className="section-title">All Auctions</h2>
        
        <div className="auctions-grid">
          {filteredAuctions.map(auction => (
            <Link 
              to={`/auctions/${auction._id}`} 
              className="auction-card" 
              key={auction._id}
            >
              <div className="auction-image-container">
                <img 
                  src={auction.images.find(img => img.isPrimary)?.url || auction.images[0]?.url} 
                  alt={auction.title}
                  className="auction-image"
                  loading="lazy"
                />
                
                {auction.featured && (
                  <span className="featured-tag">★ Featured</span>
                )}
                
                <div className="auction-time-remaining">
                  <span className="icon">⏱️</span>
                  {formatTimeLeft(auction.endDate)}
                </div>
              </div>
              
              <div className="auction-content">
                <h3 className="auction-title">{auction.title}</h3>
                
                <div className="auction-specs">
                  <div className="spec-group">
                    <span className="year">{auction.vehicle.year}</span>
                    <span className="make">{auction.vehicle.make}</span>
                    <span className="model">{auction.vehicle.model}</span>
                  </div>
                  <div className="location">
                    <span className="icon">📍</span>
                    {auction.location.city}, {auction.location.state}
                  </div>
                </div>
                
                <div className="auction-bid-info">
                  <div className="current-bid">
                    <div className="bid-label">Current Bid:</div>
                    <div className="bid-amount">
                      ${auction.currentBid.amount.toLocaleString()}
                    </div>
                    <div className="bid-count">
                      <span className="icon">🔨</span>
                      <span className="count">{auction.bidHistory.length}</span>
                    </div>
                  </div>
                  
                  <div className="watchers">
                    <span className="icon">👁️</span>
                    <span className="count">{auction.views}</span>
                    <span className="watch-count">
                      {auction.watchers.length > 0 && 
                        `${auction.watchers.length} watching`
                      }
                    </span>
                  </div>
                </div>
                
                <div className="seller-info">
                  <img 
                    src={auction.seller.avatar} 
                    alt={auction.seller.name}
                    className="seller-avatar"
                  />
                  <span className="seller-name">{auction.seller.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="auctions-pagination">
        <button className="page-button active">1</button>
        <button className="page-button">2</button>
        <button className="page-button">3</button>
        <span className="pagination-dots">...</span>
        <button className="page-button">Next →</button>
      </div>
    </div>
  );
};

export default AuctionsList;