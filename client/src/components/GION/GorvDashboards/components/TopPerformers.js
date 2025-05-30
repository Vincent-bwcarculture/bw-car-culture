// src/components/GION/GovDashboards/components/TopPerformers.js
import React from 'react';
import './TopPerformers.css';

const TopPerformers = ({ providers }) => {
  return (
    <div className="top-performers">
      <h2 className="performers-title">Top Performers</h2>
      
      <div className="performers-list">
        {providers.map((provider, index) => (
          <div key={provider.id} className="performer-item">
            <div className="performer-rank">{index + 1}</div>
            <div className="performer-details">
              <div className="performer-name">{provider.name}</div>
              <div className="performer-info">
                <div className="performer-rating">
                  <span className="rating-value">{provider.rating.toFixed(1)}</span>
                  <span className="rating-stars">
                    {"★".repeat(Math.floor(provider.rating))}
                    {"☆".repeat(5 - Math.floor(provider.rating))}
                  </span>
                </div>
                <div className="performer-reviews">
                  {provider.reviews} reviews
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="view-all-container">
        <button className="view-all-button">
          View All Providers
        </button>
      </div>
    </div>
  );
};

export default TopPerformers;