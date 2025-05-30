// Enhanced GIONBackdrop.js
import React, { useEffect } from 'react';
import './GIONBackdrop.css';

const GIONBackdrop = ({ isOpen, onClick }) => {
  useEffect(() => {
    // Prevent scrolling on body when backdrop is visible
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={`gion-backdrop ${isOpen ? 'visible' : ''}`} 
      onClick={onClick}
      aria-hidden="true"
    ></div>
  );
};

export default GIONBackdrop;