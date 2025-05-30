import React from 'react';
import './SystemMetrics.css';

const SystemMetrics = ({ metrics }) => {
  // Determine the status level based on the metric value
  const getStatusLevel = (metricName, value) => {
    switch (metricName) {
      case 'uptime':
        return value >= 99.9 ? 'high' : value >= 99 ? 'medium' : 'low';
      case 'avgResponseTime':
        return value <= 200 ? 'high' : value <= 500 ? 'medium' : 'low';
      case 'errorRate':
        return value <= 0.5 ? 'high' : value <= 2 ? 'medium' : 'low';
      default:
        return 'medium';
    }
  };

  // Get appropriate label for status level
  const getStatusLabel = (level) => {
    switch (level) {
      case 'high':
        return 'Excellent';
      case 'medium':
        return 'Normal';
      case 'low':
        return level === 'errorRate' ? 'High' : 'Poor';
      default:
        return 'Normal';
    }
  };

  // Determine overall system status
  const getOverallStatus = () => {
    const uptimeStatus = getStatusLevel('uptime', metrics.uptime);
    const responseStatus = getStatusLevel('avgResponseTime', metrics.avgResponseTime);
    const errorStatus = getStatusLevel('errorRate', metrics.errorRate);
    
    if (uptimeStatus === 'low' || responseStatus === 'low' || errorStatus === 'low') {
      return { class: 'offline', text: 'System issues detected' };
    } else if (uptimeStatus === 'medium' || responseStatus === 'medium' || errorStatus === 'medium') {
      return { class: 'partial', text: 'System running with minor issues' };
    } else {
      return { class: 'online', text: 'All systems operational' };
    }
  };

  const systemStatus = getOverallStatus();

  return (
    <div className="gion-system-metrics">
      <div className="gion-metrics-grid">
        <div className="gion-metric-item">
          <div className="gion-metric-label">System Uptime</div>
          <div className="gion-metric-value">{metrics.uptime}%</div>
          <div className={`gion-metric-status ${getStatusLevel('uptime', metrics.uptime)}`}>
            {getStatusLabel(getStatusLevel('uptime', metrics.uptime))}
          </div>
        </div>
        
        <div className="gion-metric-item">
          <div className="gion-metric-label">API Requests (24h)</div>
          <div className="gion-metric-value">{metrics.apiRequests.toLocaleString()}</div>
          <div className="gion-metric-status medium">Normal</div>
        </div>
        
        <div className="gion-metric-item">
          <div className="gion-metric-label">Avg. Response Time</div>
          <div className="gion-metric-value">{metrics.avgResponseTime}ms</div>
          <div className={`gion-metric-status ${getStatusLevel('avgResponseTime', metrics.avgResponseTime)}`}>
            {getStatusLabel(getStatusLevel('avgResponseTime', metrics.avgResponseTime))}
          </div>
        </div>
        
        <div className="gion-metric-item">
          <div className="gion-metric-label">Error Rate</div>
          <div className="gion-metric-value">{metrics.errorRate}%</div>
          <div className={`gion-metric-status ${getStatusLevel('errorRate', metrics.errorRate)}`}>
            {metrics.errorRate <= 0.5 ? 'Low' : metrics.errorRate <= 2 ? 'Moderate' : 'High'}
          </div>
        </div>
      </div>
      
      <div className="gion-server-status">
        <div className={`gion-status-indicator ${systemStatus.class}`}></div>
        <span>{systemStatus.text}</span>
      </div>
    </div>
  );
};

export default SystemMetrics;