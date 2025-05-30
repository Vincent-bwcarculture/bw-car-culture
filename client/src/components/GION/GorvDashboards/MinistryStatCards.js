import React from 'react';
import './MinistryStatCards.css';

const MinistryStatCards = ({ stats }) => {
  return (
    <div className="ministry-stat-cards">
      <div className="stat-card">
        <div className="stat-icon reviews-icon">
          <i className="icon">📝</i>
        </div>
        <div className="stat-content">
          <h3>Total Reviews</h3>
          <div className="stat-value">{stats.totalReviews.toLocaleString()}</div>
          <div className="stat-trend positive">
            <span className="trend-arrow">↑</span> 12.3% from last month
          </div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon rating-icon">
          <i className="icon">⭐</i>
        </div>
        <div className="stat-content">
          <h3>Avg. Rating</h3>
          <div className="stat-value">{stats.avgRating.toFixed(1)}</div>
          <div className="stat-trend negative">
            <span className="trend-arrow">↓</span> 0.3 from last month
          </div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon compliance-icon">
          <i className="icon">✅</i>
        </div>
        <div className="stat-content">
          <h3>Compliance Rate</h3>
          <div className="stat-value">{stats.complianceRate}%</div>
          <div className="stat-trend positive">
            <span className="trend-arrow">↑</span> 5% from last month
          </div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon issues-icon">
          <i className="icon">⚠️</i>
        </div>
        <div className="stat-content">
          <h3>Issues Reported</h3>
          <div className="stat-value">{stats.issuesReported}</div>
          <div className="stat-trend negative">
            <span className="trend-arrow">↑</span> 23 from last month
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinistryStatCards;