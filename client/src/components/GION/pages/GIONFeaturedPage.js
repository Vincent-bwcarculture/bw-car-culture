// components/GION/pages/GIONFeaturedPage.js
import React from 'react';
import { ArrowLeft, Star, MapPin } from 'lucide-react';
import './GIONPages.css';

const GIONFeaturedPage = ({ onBack }) => {
  const featuredServices = [
    { 
      id: 'T1234', 
      name: 'SafeRide Taxi', 
      category: 'taxi', 
      rating: 4.9, 
      reviews: 2345,
      location: 'Gaborone CBD',
      color: '#5f5fc4'
    },
    { 
      id: 'R421', 
      name: 'City Bistro', 
      category: 'restaurant', 
      rating: 4.8, 
      reviews: 1732,
      location: 'Riverwalk Mall',
      color: '#ff8f00'
    },
    {
      id: 'H789',
      name: 'Luxury Stay Hotel',
      category: 'hotel',
      rating: 4.7,
      reviews: 948,
      location: 'Main Mall',
      color: '#2196f3'
    },
    {
      id: 'S432',
      name: 'Quick Shop Retail',
      category: 'retail',
      rating: 4.5,
      reviews: 1245,
      location: 'Game City',
      color: '#4caf50'
    }
  ];
  
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Featured Services</h2>
        <div className="header-spacer"></div>
      </div>
      
      <div className="gion-page-content">
        <div className="gion-filter-tabs">
          <button className="filter-tab active">All</button>
          <button className="filter-tab">Taxi</button>
          <button className="filter-tab">Food</button>
          <button className="filter-tab">Retail</button>
          <button className="filter-tab">Hotels</button>
        </div>
        
        <div className="gion-services-grid">
          {featuredServices.map(service => (
            <div key={service.id} className="service-item">
              <div 
                className="service-header" 
                style={{ backgroundColor: service.color }}
              >
                <span className="service-badge">{service.category.toUpperCase()}</span>
              </div>
              <div className="service-details">
                <h3 className="service-name">{service.name}</h3>
                <div className="service-rating">
                  <Star size={16} className="star-icon" />
                  <span>{service.rating} ({service.reviews.toLocaleString()})</span>
                </div>
                <div className="service-location">
                  <MapPin size={14} />
                  <span>{service.location}</span>
                </div>
                <button className="service-review-btn">Review</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GIONFeaturedPage;