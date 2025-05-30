// src/Admin/AnalyticsDashboard/components/MetricCard.js
import React from 'react';

const MetricCard = ({ 
  title, 
  value, 
  trend, 
  isInverted = false, 
  description,
  className = '' 
}) => {
  // Determine trend color and direction
  const getTrendColor = () => {
    if (!trend || typeof trend.isPositive !== 'boolean') return '#666';
    
    const isPositiveTrend = trend.isPositive;
    
    if (isInverted) {
      return isPositiveTrend ? '#ef4444' : '#22c55e';
    } else {
      return isPositiveTrend ? '#22c55e' : '#ef4444';
    }
  };

  const getTrendDirection = () => {
    if (!trend || typeof trend.isPositive !== 'boolean') return '';
    return trend.isPositive ? '↗' : '↘';
  };

  // Ensure value is properly formatted
  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return val.toLocaleString();
    }
    return String(val);
  };

  return (
    <div className={`metric-card ${className}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
      </div>
      
      <div className="metric-content">
        <div className="metric-value">
          {formatValue(value)}
        </div>
        
        {description && (
          <div className="metric-description">
            {description}
          </div>
        )}
        
        {trend && trend.value !== undefined && (
          <div className="metric-trend" style={{ color: getTrendColor() }}>
            <span className="trend-direction">
              {getTrendDirection()}
            </span>
            <span className="trend-value">
              {typeof trend.value === 'number' ? 
                `${Math.abs(trend.value).toFixed(1)}%` : 
                trend.value
              }
            </span>
            <span className="trend-period">
              {trend.period || 'vs. previous period'}
            </span>
          </div>
        )}
      </div>
      
      {/* Loading state overlay */}
      {value === 'Loading...' && (
        <div className="metric-loading-overlay">
          <div className="metric-spinner"></div>
        </div>
      )}
      
      {/* Error state overlay */}
      {value === 'Error' && (
        <div className="metric-error-overlay">
          <span>Data Error</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;