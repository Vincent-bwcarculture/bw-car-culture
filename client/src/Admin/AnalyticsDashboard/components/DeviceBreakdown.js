// src/Admin/AnalyticsDashboard/components/DeviceBreakdown.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DeviceBreakdown = ({ data, title = "Device Breakdown" }) => {
  if (!data) {
    return (
      <div className="device-breakdown-card">
        <h3>{title}</h3>
        <div className="device-breakdown-loading">Loading device data...</div>
      </div>
    );
  }

  // Prepare data for the chart
  const deviceData = [
    { 
      name: 'Mobile', 
      value: data.mobile || 0, 
      color: '#ef4444'
    },
    { 
      name: 'Desktop', 
      value: data.desktop || 0, 
      color: '#3b82f6'
    },
    { 
      name: 'Tablet', 
      value: data.tablet || 0, 
      color: '#10b981'
    }
  ].filter(item => item.value > 0);

  const total = deviceData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="custom-tooltip device-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">
            {data.value.toLocaleString()} users ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for the pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Get the most used device
  const getMostUsedDevice = () => {
    if (deviceData.length === 0) return null;
    return deviceData.reduce((prev, current) => 
      (current.value > prev.value) ? current : prev
    );
  };

  const mostUsedDevice = getMostUsedDevice();

  return (
    <div className="device-breakdown-card">
      <div className="device-breakdown-header">
        <h3>{title}</h3>
        {total > 0 && (
          <div className="device-total">
            <span className="total-count">{total.toLocaleString()}</span>
            <span className="total-label">total users</span>
          </div>
        )}
      </div>
      
      {deviceData.length > 0 ? (
        <div className="device-breakdown-content">
          <div className="device-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="device-legend">
            {deviceData.map((device, index) => {
              const percentage = total > 0 ? ((device.value / total) * 100).toFixed(1) : 0;
              const isHighlight = mostUsedDevice && device.name === mostUsedDevice.name;
              
              return (
                <div 
                  key={index} 
                  className={`legend-item ${isHighlight ? 'highlight' : ''}`}
                >
                  <div className="legend-indicator">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: device.color }}
                    ></div>
                  </div>
                  <div className="legend-details">
                    <span className="legend-label">{device.name}</span>
                    <span className="legend-value">
                      {device.value.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  {isHighlight && (
                    <span className="legend-badge">Most Used</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Device Insights */}
          <div className="device-insights">
            {mostUsedDevice && (
              <div className="insight-item">
                <div className="insight-text">
                  <strong>{mostUsedDevice.name}</strong> users make up{' '}
                  <strong>{((mostUsedDevice.value / total) * 100).toFixed(0)}%</strong>{' '}
                  of your audience
                </div>
              </div>
            )}
            
            {data.mobile && data.mobile > (total * 0.6) && (
              <div className="insight-item mobile-first">
                <div className="insight-text">
                  <strong>Mobile-first audience:</strong> Consider optimizing for mobile experience
                </div>
              </div>
            )}
            
            {data.desktop && data.desktop > (total * 0.5) && (
              <div className="insight-item desktop-heavy">
                <div className="insight-text">
                  <strong>Desktop-heavy usage:</strong> Users may prefer detailed browsing
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          <p>No device data available</p>
          <small>Device breakdown will appear here once users visit your site</small>
        </div>
      )}

      {/* Mobile optimization note */}
      {data.mobile && total > 0 && (data.mobile / total) > 0.6 && (
        <div className="mobile-optimization-note">
          <div className="note-content">
            <strong>Tip:</strong> With {((data.mobile / total) * 100).toFixed(0)}% mobile users, 
            ensure your site loads quickly on mobile networks.
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceBreakdown;
