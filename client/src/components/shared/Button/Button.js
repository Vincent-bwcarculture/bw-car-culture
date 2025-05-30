// src/components/shared/Button/Button.js
import React from 'react';
import './Button.css';

export const Button = ({ children, variant = 'primary', onClick, className }) => {
  return (
    <button 
      className={`button ${variant} ${className}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};