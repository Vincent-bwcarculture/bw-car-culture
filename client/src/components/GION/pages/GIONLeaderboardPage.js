// components/GION/pages/GIONLeaderboardPage.js
import React, { useState } from 'react';
import { ArrowLeft, Star, MapPin, Filter, Award } from 'lucide-react';
import './GIONLeaderboardPage.css';

const GIONLeaderboardPage = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeArea, setActiveArea] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'taxi', name: 'Taxis', icon: '🚕' },
    { id: 'bus', name: 'Buses', icon: '🚌' },
    { id: 'train', name: 'Trains', icon: '🚆' },
    { id: 'dealership', name: 'Dealerships', icon: '🏢' }
  ];
  
  const areas = [
    { id: 'all', name: 'All Areas' },
    { id: 'gaborone', name: 'Gaborone' },
    { id: 'francistown', name: 'Francistown' },
    { id: 'maun', name: 'Maun' },
    { id: 'kasane', name: 'Kasane' }
  ];
  
  // Sample leaderboard data
  const topServices = [
    {
      id: 'T1234',
      name: 'SafeRide Taxi',
      category: 'taxi',
      rating: 4.9,
      reviews: 234,
      area: 'gaborone',
      changeIndicator: 'up'
    },
    {
      id: 'B5678',
      name: 'Express Bus Service',
      category: 'bus',
      rating: 4.8,
      reviews: 186,
      area: 'gaborone',
      changeIndicator: 'same'
    },
    {
      id: 'T8765',
      name: 'City Cab',
      category: 'taxi',
      rating: 4.7,
      reviews: 142,
      area: 'francistown',
      changeIndicator: 'up'
    },
    {
      id: 'T9012',
      name: 'Speedy Taxi',
      category: 'taxi',
      rating: 4.7,
      reviews: 112,
      area: 'maun',
      changeIndicator: 'down'
    },
    {
      id: 'B3456',
      name: 'North Express',
      category: 'bus',
      rating: 4.6,
      reviews: 95,
      area: 'francistown',
      changeIndicator: 'up'
    }
  ];
  
  // Filter services based on selected category and area
  const filteredServices = topServices.filter(service => {
    const categoryMatch = activeCategory === 'all' || service.category === activeCategory;
    const areaMatch = activeArea === 'all' || service.area === activeArea;
    return categoryMatch && areaMatch;
  });
  
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Transport Leaderboard</h2>
        <div className="header-spacer"></div>
      </div>
      
      <div className="gion-page-content">
        <div className="leaderboard-filters">
          <div className="filter-section">
            <h4>Transport Type</h4>
            <div className="filter-options">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`filter-option ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.icon && <span className="option-icon">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-section">
            <h4>Area</h4>
            <div className="filter-options">
              {areas.map(area => (
                <button
                  key={area.id}
                  className={`filter-option ${activeArea === area.id ? 'active' : ''}`}
                  onClick={() => setActiveArea(area.id)}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="leaderboard-list">
          <div className="leaderboard-header">
            <span className="leaderboard-title">Top Rated Transport Services</span>
            <span className="leaderboard-subtitle">Updated Daily</span>
          </div>
          
          {filteredServices.map((service, index) => (
            <div key={service.id} className="leaderboard-item">
              <div className="leaderboard-rank">
                <span className="rank-number">{index + 1}</span>
                {service.changeIndicator === 'up' && <span className="rank-change up">▲</span>}
                {service.changeIndicator === 'down' && <span className="rank-change down">▼</span>}
              </div>
              
              <div className="leaderboard-service">
                <div className="service-category-icon" style={{
                  backgroundColor: 
                    service.category === 'taxi' ? '#5f5fc4' :
                    service.category === 'bus' ? '#119847' :
                    service.category === 'train' ? '#2196f3' : '#e74c3c'
                }}>
                  {service.category === 'taxi' ? '🚕' : 
                   service.category === 'bus' ? '🚌' : 
                   service.category === 'train' ? '🚆' : '🏢'}
                </div>
                
                <div className="service-details">
                  <h3 className="service-name">{service.name}</h3>
                  <div className="service-meta">
                    <div className="service-rating">
                      <Star size={14} /> {service.rating.toFixed(1)}
                    </div>
                    <div className="service-reviews">
                      {service.reviews} reviews
                    </div>
                    <div className="service-area">
                      <MapPin size={12} />
                      {areas.find(a => a.id === service.area)?.name}
                    </div>
                  </div>
                </div>
                
                <button className="view-service-button">
                  View
                </button>
              </div>
            </div>
          ))}
          
          {filteredServices.length === 0 && (
            <div className="no-results">
              <p>No transport services found matching your filters.</p>
              <button 
                className="reset-filters-button"
                onClick={() => {
                  setActiveCategory('all');
                  setActiveArea('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        <div className="ministry-badge-container">
          <div className="ministry-badge">
            <div className="ministry-icon">🏛️</div>
            <div className="ministry-text">
              <span className="ministry-title">Ministry of Transport</span>
              <span className="ministry-subtitle">Official Quality Rating Program</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GIONLeaderboardPage;