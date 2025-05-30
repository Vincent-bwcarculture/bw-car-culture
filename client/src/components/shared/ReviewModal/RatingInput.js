// src/components/admin/ReviewModal/components/RatingInput.js
import React from 'react';

const RatingInput = ({ 
  category, 
  label, 
  value, 
  maxValue = 10, 
  onChange, 
  disabled 
}) => {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(category, newValue);
  };

  return (
    <div className="rating-input">
      <label>{label}</label>
      <div className="rating-controls">
        <input
          type="range"
          min="0"
          max={maxValue}
          step="0.5"
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="rating-value">{value.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default RatingInput;