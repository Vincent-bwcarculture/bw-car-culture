// src/components/shared/FeedbackWidget/FeedbackWidget.js
import React, { useState, useEffect } from 'react';
import FeedbackForm from '../../feedback/FeedbackForm.js';
import './FeedbackWidget.css';

const FeedbackWidget = ({ 
  position = 'bottom-right', 
  showOnMobile = true,
  customTrigger = null,
  autoShow = false,
  autoShowDelay = 30000 // 30 seconds
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewFeedback, setHasNewFeedback] = useState(false);

  // Auto-show functionality
  useEffect(() => {
    if (autoShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, autoShowDelay]);

  // Check if user is on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Don't show widget on mobile if showOnMobile is false
  if (isMobile && !showOnMobile) {
    return null;
  }

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setHasNewFeedback(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  // Custom trigger component
  if (customTrigger) {
    return (
      <>
        <div onClick={handleToggle}>
          {customTrigger}
        </div>
        {isOpen && (
          <div className="feedback-widget-modal">
            <div className="feedback-widget-overlay" onClick={handleClose} />
            <div className="feedback-widget-container">
              <FeedbackForm onClose={handleClose} showWhatsAppOption={true} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={`feedback-widget-trigger ${position} ${isMinimized ? 'minimized' : ''}`}>
        {!isOpen && (
          <button 
            className="feedback-trigger-btn"
            onClick={handleToggle}
            aria-label="Open feedback form"
          >
            {hasNewFeedback && <span className="notification-dot"></span>}
            <span className="trigger-icon">💬</span>
            <span className="trigger-text">Feedback</span>
          </button>
        )}
      </div>

      {/* Feedback Form Modal */}
      {isOpen && (
        <div className="feedback-widget-modal">
          <div className="feedback-widget-overlay" onClick={handleClose} />
          <div className={`feedback-widget-container ${position}`}>
            <div className="feedback-widget-header">
              <h3>Share Your Feedback</h3>
              <div className="feedback-widget-controls">
                <button 
                  className="minimize-btn"
                  onClick={handleMinimize}
                  aria-label="Minimize"
                >
                  −
                </button>
                <button 
                  className="close-btn"
                  onClick={handleClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="feedback-widget-content">
              <FeedbackForm onClose={handleClose} showWhatsAppOption={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
