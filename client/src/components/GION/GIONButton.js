// components/GION/GIONButton.js
import React, { useState, useEffect } from 'react';
import { Star, Award } from 'lucide-react';
import './GIONButton.css';

const GIONButton = ({ onClick, points = 0 }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Add entrance animation when points change
  useEffect(() => {
    if (points > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [points]);
  
  return (
    <div className="gion-button-container">
      {points > 0 && (
        <div className={`gion-points-badge ${isAnimating ? 'animating' : ''}`}>
          <Award size={14} strokeWidth={2.5} />
          <span>{points}</span>
        </div>
      )}
      <button 
        className="gion-button"
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        aria-label="Rate transport service"
      >
        <Star 
          size={24} 
          color="#ffffff"
          fill={isHovering ? "#ffffff" : "none"}
          strokeWidth={2}
        />
      </button>
    </div>
  );
};

export default GIONButton;