// src/components/GION/ServiceProviderDashboards/components/ComplianceStatus.js
import React from 'react';
import './ComplianceStatus.css';

const ComplianceStatus = ({ items, status }) => {
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Show days remaining if less than 30 days
    if (diffDays > 0 && diffDays < 30) {
      return `${diffDays} days remaining`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="compliance-status-container">
      <div className="compliance-header">
        <h2>Compliance Status</h2>
        <div className={`status-badge ${status}`}>
          {status === 'compliant' ? 'Compliant' : 'Non-Compliant'}
        </div>
      </div>
      
      <div className="compliance-items">
        {items.map(item => (
          <div key={item.id} className={`compliance-item ${item.status}`}>
            <div className="item-content">
              <div className="item-name">{item.name}</div>
              <div className="item-expiry">
                {formatDate(item.expiry)}
              </div>
            </div>
            <div className="item-status-indicator">
              {item.status === 'valid' ? (
                <span className="status-icon valid">✓</span>
              ) : item.status === 'upcoming' ? (
                <span className="status-icon upcoming">⚠️</span>
              ) : (
                <span className="status-icon expired">✕</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="compliance-actions">
        <button className="action-button primary">Update Documents</button>
        <button className="action-button secondary">View Requirements</button>
      </div>
    </div>
  );
};

export default ComplianceStatus;