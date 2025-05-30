// src/components/GION/ServiceProviderDashboard/components/ProviderHeader.js
import React from 'react';
import './ProviderHeader.css';

const ProviderHeader = ({ 
  providerName, 
  dateRange, 
  onDateRangeChange,
  serviceMode = false // New prop to indicate service-specific mode
}) => {
  return (
    <div className="provider-header">
      <div className="provider-header-left">
        <h1>{providerName}</h1>
        <p className="provider-type">
          {serviceMode ? 'Service Dashboard' : 'Provider Dashboard'}
        </p>
      </div>
      
      <div className="provider-header-right">
        <div className="provider-date-range">
          <label>View data for:</label>
          <select 
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <button className="provider-export-button">
          Export Data
        </button>
      </div>
    </div>
  );
};

export default ProviderHeader;