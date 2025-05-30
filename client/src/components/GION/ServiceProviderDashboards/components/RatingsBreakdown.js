// src/components/GION/ServiceProviderDashboards/components/RatingsBreakdown.js
import React from 'react';
import './RatingsBreakdown.css';

const RatingsBreakdown = ({ data, averageRating }) => {
  return (
    <div className="ratings-breakdown">
      <h2>Ratings Breakdown</h2>
      
      <div className="ratings-summary">
        <div className="rating-number">{averageRating.toFixed(1)}</div>
        <div className="rating-stars">
          {"★".repeat(Math.floor(averageRating))}
          {"☆".repeat(5 - Math.floor(averageRating))}
        </div>
      </div>
      
      <div className="rating-distributions">
        {data.map(item => (
          <div key={item.rating} className="rating-bar-item">
            <div className="rating-label">{item.rating} ★</div>
            <div className="rating-bar-container">
              <div 
                className="rating-bar"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            <div className="rating-percentage">{item.percentage}%</div>
          </div>
        ))}
      </div>
      
      <div className="rating-insights">
        <h3>Rating Insights</h3>
        <div className="insights-content">
          <p className="insight-item">
            <span className="highlight positive">85%</span> of your reviews are 5-star ratings
          </p>
          <p className="insight-item">
            <span className="highlight neutral">4.8</span> average rating in the last 30 days
          </p>
          <p className="insight-item">
            <span className="highlight positive">↑ 0.2</span> improvement from previous period
          </p>
        </div>
      </div>
    </div>
  );
};

export default RatingsBreakdown;