// src/components/admin/ReviewModal/components/TabNavigation.js
import React from 'react';

const TabNavigation = ({ tabs, activeTab, onTabChange, disabled = false }) => {
  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }
  
  return (
    <div className="modal-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          disabled={disabled}
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          role="tab"
          id={`tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;