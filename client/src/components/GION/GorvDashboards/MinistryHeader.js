import React from 'react';
import './MinistryHeader.css';

const MinistryHeader = ({ 
  onFilterChange,
  onExport,
  onGenerateReport,
  dateRange 
}) => {
  // Calculate date range display
  const getDateRangeLabel = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch(dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(now)}`;
  };

  return (
    <div className="ministry-header">
      <div className="header-title">
        <h1>Transport Service Overview</h1>
        <p className="date-range">{getDateRangeLabel()}</p>
      </div>
      
      <div className="header-actions">
        <div className="filter-dropdown">
          <select 
            value={dateRange}
            onChange={(e) => onFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last 12 months</option>
          </select>
        </div>
        
        <button className="btn-export" onClick={onExport}>
          Export
        </button>
        
        <button className="btn-report" onClick={onGenerateReport}>
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default MinistryHeader;