// src/components/GION/GovDashboards/components/RatingsChart.js
import React from 'react';
import './RatingsChart.css';

const RatingsChart = ({ data }) => {
  // Find min and max values for chart scaling
  const minValue = Math.min(...data.map(item => item.rating)) - 0.5;
  const maxValue = Math.max(...data.map(item => item.rating)) + 0.5;
  const range = maxValue - minValue;
  
  // Chart dimensions
  const chartHeight = 250;
  const chartWidth = 600;
  
  // Convert data point to Y coordinate
  const getYCoordinate = (value) => {
    return chartHeight - ((value - minValue) / range) * chartHeight;
  };
  
  // Calculate X spacing between points
  const xSpacing = chartWidth / (data.length - 1);
  
  // Generate SVG path
  const generatePath = () => {
    return data.map((point, index) => {
      const x = index * xSpacing;
      const y = getYCoordinate(point.rating);
      return (index === 0) ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');
  };
  
  // Generate points for the SVG
  const generatePoints = () => {
    return data.map((point, index) => {
      const x = index * xSpacing;
      const y = getYCoordinate(point.rating);
      return { x, y, ...point };
    });
  };
  
  const points = generatePoints();

  return (
    <div className="ratings-chart">
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[3, 3.5, 4, 4.5, 5].map(val => (
          <g key={val}>
            <line 
              x1="0" 
              y1={getYCoordinate(val)} 
              x2={chartWidth} 
              y2={getYCoordinate(val)} 
              stroke="#e0e0e0" 
              strokeWidth="1"
            />
            <text 
              x="-30" 
              y={getYCoordinate(val)} 
              fill="#666" 
              fontSize="12" 
              dominantBaseline="middle"
            >
              {val.toFixed(1)}
            </text>
          </g>
        ))}
        
        {/* Line path */}
        <path 
          d={generatePath()} 
          fill="none" 
          stroke="#4a4a8a" 
          strokeWidth="3"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#4a4a8a"
          />
        ))}
        
        {/* Area under the curve */}
        <path 
          d={`${generatePath()} L ${(data.length - 1) * xSpacing},${chartHeight} L 0,${chartHeight} Z`} 
          fill="url(#gradient)" 
          opacity="0.2"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a4a8a" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#4a4a8a" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>
      
      {/* X-axis labels */}
      <div className="x-axis-labels">
        {data.map((point, index) => (
          <div key={index} className="x-label">
            {point.month}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingsChart;