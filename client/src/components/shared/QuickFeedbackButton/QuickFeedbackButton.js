// src/components/shared/QuickFeedbackButton/QuickFeedbackButton.js
import React, { useState } from 'react';
import FeedbackForm from '../../feedback/FeedbackForm.js';
import './QuickFeedbackButton.css';

const QuickFeedbackButton = ({ 
  className = '',
  size = 'medium',
  variant = 'primary',
  position = 'inline',
  label = 'Share Feedback',
  icon = '💬'
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleClick = () => {
    setShowFeedback(true);
  };

  const handleClose = () => {
    setShowFeedback(false);
  };

  return (
    <>
      <button
        className={`quick-feedback-btn ${className} size-${size} variant-${variant} position-${position}`}
        onClick={handleClick}
        aria-label="Open feedback form"
      >
        <span className="btn-icon">{icon}</span>
        <span className="btn-label">{label}</span>
      </button>

      {showFeedback && (
        <div className="quick-feedback-modal">
          <div className="quick-feedback-overlay" onClick={handleClose} />
          <div className="quick-feedback-container">
            <FeedbackForm onClose={handleClose} showWhatsAppOption={true} />
          </div>
        </div>
      )}
    </>
  );
};

export default QuickFeedbackButton;
