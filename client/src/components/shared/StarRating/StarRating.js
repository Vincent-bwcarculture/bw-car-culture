// src/components/shared/StarRating/StarRating.js
import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, onRatingChange = null, editable = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  // Determine the final display rating (hover value takes precedence when hovering)
  const displayRating = hoverRating > 0 ? hoverRating : rating;
  
  // Generate array of 5 stars
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);
  
  // Handle mouse events
  const handleMouseEnter = (starValue) => {
    if (editable) {
      setHoverRating(starValue);
    }
  };
  
  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(0);
    }
  };
  
  const handleClick = (starValue) => {
    if (editable && onRatingChange) {
      onRatingChange(starValue);
    }
  };
  
  // Determine CSS class based on size prop
  const sizeClass = `star-rating--${size}`;
  
  return (
    <div 
      className={`star-rating ${sizeClass} ${editable ? 'star-rating--editable' : ''}`} 
      onMouseLeave={handleMouseLeave}
    >
      {stars.map(star => (
        <span
          key={star}
          className={`star ${star <= displayRating ? 'star--filled' : 'star--empty'}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          role={editable ? 'button' : 'presentation'}
          aria-label={editable ? `Rate ${star} out of 5 stars` : `${rating} out of 5 stars`}
          tabIndex={editable ? 0 : -1}
        >
          {star <= displayRating ? '★' : '☆'}
        </span>
      ))}
      
      {/* Optional fractional star */}
      {!Number.isInteger(displayRating) && displayRating <= 5 && (
        <span 
          className="star star--half" 
          style={{ 
            position: 'absolute',
            left: `${Math.floor(displayRating) * 20}%`,
            zIndex: 1
          }}
        >
          ★
        </span>
      )}
      
      {editable && (
        <span className="star-rating-value">
          {hoverRating > 0 ? hoverRating : rating}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;