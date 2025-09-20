// client/src/components/features/MarketplaceSection/ViewModeSelector.js

import React from 'react';
import './ViewModeSelector.css';

const ViewModeSelector = ({ viewMode, onViewModeChange, isMobile }) => {
  const viewModes = [
    {
      key: 'grid',
      label: 'Grid',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
        </svg>
      ),
      description: 'Large cards with detailed information'
    },
    {
      key: 'compact',
      label: 'Compact',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h5v5H3V3zm0 7h5v5H3v-5zm0 7h5v5H3v-5zm7-14h5v5h-5V3zm0 7h5v5h-5v-5zm0 7h5v5h-5v-5zm7-14h5v5h-5V3zm0 7h5v5h-5v-5zm0 7h5v5h-5v-5z"/>
        </svg>
      ),
      description: 'Small cards showing essential information'
    },
    {
      key: 'list',
      label: 'List',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v4H3V3zm0 7h18v4H3v-4zm0 7h18v4H3v-4z"/>
        </svg>
      ),
      description: 'Horizontal cards with comprehensive details'
    }
  ];

  // Hide on mobile to save space
  if (isMobile) {
    return null;
  }

  const handleModeChange = (mode) => {
    if (onViewModeChange && typeof onViewModeChange === 'function') {
      onViewModeChange(mode);
    }
  };

  return (
    <div className="view-mode-selector">
      <div className="view-mode-label">View:</div>
      <div className="view-mode-buttons">
        {viewModes.map((mode) => (
          <button
            key={mode.key}
            className={`view-mode-btn ${viewMode === mode.key ? 'active' : ''}`}
            onClick={() => handleModeChange(mode.key)}
            title={mode.description}
            aria-label={`Switch to ${mode.label} view`}
            type="button"
          >
            {mode.icon}
            <span className="view-mode-text">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewModeSelector;
