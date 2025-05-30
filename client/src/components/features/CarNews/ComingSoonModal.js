// src/components/shared/ComingSoonModal.js
import React from 'react';
import './ComingSoonModal.css';

const ComingSoonModal = ({ isOpen, onClose, featureName }) => {
  if (!isOpen) return null;
  
  return (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div className="coming-soon-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="coming-soon-icon">🚀</div>
        <h2>Coming Soon!</h2>
        <p>The <strong>{featureName}</strong> feature will be available in our next update.</p>
        <p className="coming-soon-message">We're working hard to bring you the best car community experience in Botswana!</p>
        <button className="got-it-button" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
};

export default ComingSoonModal;
