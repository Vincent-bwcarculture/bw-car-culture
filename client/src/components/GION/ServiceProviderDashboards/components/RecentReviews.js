// src/components/GION/ServiceProviderDashboards/components/RecentReviews.js
import React from 'react';
import './RecentReviews.css';

const RecentReviews = ({ reviews, averageRating, totalReviews }) => {
  // Format date display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="recent-reviews">
      <div className="reviews-header">
        <div className="header-title">
          <h2>Recent Reviews</h2>
        </div>
        <div className="reviews-summary">
          <span className="avg-rating">{averageRating.toFixed(1)}</span>
          <div className="stars-display">
            {"★".repeat(Math.floor(averageRating))}
            {"☆".repeat(5 - Math.floor(averageRating))}
          </div>
          <span className="total-reviews">({totalReviews} reviews)</span>
        </div>
      </div>
      
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="review-user">{review.user}</div>
              <div className="review-date">{formatDate(review.date)}</div>
            </div>
            <div className="review-rating">
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </div>
            <div className="review-comment">{review.comment}</div>
          </div>
        ))}
      </div>
      
      <div className="view-all-container">
        <button className="view-all-button">
          View All Reviews
        </button>
      </div>
    </div>
  );
};

export default RecentReviews;