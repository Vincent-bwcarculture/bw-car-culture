import React from 'react';
import './ProviderOverview.css';

const ProviderOverview = ({ data }) => {
  return (
    <div className="provider-overview">
      <div className="overview-item">
        <div className="overview-icon rating-icon">
          <i className="icon">⭐</i>
        </div>
        <div className="overview-content">
          <h3>Overall Rating</h3>
          <div className="overview-value">{data.rating.toFixed(1)}</div>
          <div className="stars-display">
            {Array.from({ length: 5 }).map((_, index) => (
              <span 
                key={index}
                className={`star ${index < Math.floor(data.rating) ? 'filled' : index < data.rating ? 'half-filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overview-item">
        <div className="overview-icon reviews-icon">
          <i className="icon">📝</i>
        </div>
        <div className="overview-content">
          <h3>Total Reviews</h3>
          <div className="overview-value">{data.reviewCount.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="overview-item">
        <div className="overview-icon revenue-icon">
          <i className="icon">📈</i>
        </div>
        <div className="overview-content">
          <h3>Service Growth</h3>
          <div className="overview-value">+{data.revenueGrowth}%</div>
          <div className="overview-subtitle">vs. last period</div>
        </div>
      </div>
      
      <div className="overview-item">
        <div className="overview-icon service-icon">
          <i className="icon">🚗</i>
        </div>
        <div className="overview-content">
          <h3>Services Completed</h3>
          <div className="overview-value">{data.serviceCount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default ProviderOverview;