// src/components/GION/GovDashboards/components/AlertBox.js
import React from 'react';
import './AlertBox.css';

const AlertBox = ({ message, type, onViewDetails }) => {
  // Determine icon based on alert type
  const getAlertIcon = () => {
    switch(type) {
      case 'urgent':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`alert-box ${type}`}>
      <div className="alert-icon">
        {getAlertIcon()}
      </div>
      <div className="alert-content">
        <div className="alert-message">{message}</div>
      </div>
      <button className="alert-action" onClick={onViewDetails}>
        View Details
      </button>
    </div>
  );
};

export default AlertBox;