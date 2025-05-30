// src/Admin/AnalyticsDashboard/components/PerformanceMetrics.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const PerformanceMetrics = ({ data }) => {
  const [metric, setMetric] = useState('avgLoadTime');
  const [chartType, setChartType] = useState('bar');
  const [showCount, setShowCount] = useState(15);

  if (!data || !data.length) {
    return (
      <div className="performance-metrics-container">
        <h3>Performance Metrics</h3>
        <div className="no-data-message">
          <p>No performance data available</p>
          <small>Performance metrics will appear here once page load data is collected</small>
        </div>
      </div>
    );
  }

  const metrics = {
    avgLoadTime: { name: 'Load Time', unit: 'ms', color: '#ef4444', threshold: { good: 2000, poor: 4000 } },
    avgFCP: { name: 'First Contentful Paint', unit: 'ms', color: '#3b82f6', threshold: { good: 1800, poor: 3000 } },
    avgLCP: { name: 'Largest Contentful Paint', unit: 'ms', color: '#10b981', threshold: { good: 2500, poor: 4000 } },
    avgFID: { name: 'First Input Delay', unit: 'ms', color: '#f59e0b', threshold: { good: 100, poor: 300 } },
    avgCLS: { name: 'Cumulative Layout Shift', unit: '', color: '#8b5cf6', threshold: { good: 0.1, poor: 0.25 } }
  };

  const getPerformanceRating = (metricKey, value) => {
    const threshold = metrics[metricKey]?.threshold;
    if (!threshold || value === undefined || value === null) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const formatValue = (value, metricKey) => {
    if (value === undefined || value === null) return 'N/A';
    if (metricKey === 'avgCLS') {
      return value.toFixed(3);
    }
    return Math.round(value);
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return '#22c55e';
      case 'needs-improvement': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Sort and limit data
  const sortedData = [...data]
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, showCount);

  const chartData = sortedData.map(item => ({
    ...item,
    shortPage: item.page && item.page.length > 25 ? item.page.substring(0, 25) + '...' : item.page || 'Unknown'
  }));

  // Calculate overall statistics
  const calculateOverallStats = () => {
    if (!data.length) return {};

    const stats = {};
    Object.keys(metrics).forEach(key => {
      const values = data.map(item => item[key]).filter(val => val !== undefined && val !== null);
      if (values.length > 0) {
        stats[key] = {
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          samples: values.length
        };
      }
    });
    return stats;
  };

  const overallStats = calculateOverallStats();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip performance-tooltip">
          <p className="tooltip-title">{data.page}</p>
          <p className="tooltip-metric">
            {metrics[metric].name}: {formatValue(data[metric], metric)}{metrics[metric].unit}
          </p>
          <p className="tooltip-samples">Sample Size: {data.sampleSize || 0} measurements</p>
          <p className="tooltip-rating">
            Rating: <span style={{ color: getRatingColor(getPerformanceRating(metric, data[metric])) }}>
              {getPerformanceRating(metric, data[metric]).replace('-', ' ')}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="performance-metrics-container">
      <div className="performance-header">
        <div className="performance-title-section">
          <h3>Performance Metrics</h3>
          <div className="performance-summary">
            {overallStats[metric] && (
              <>
                <span className="perf-stat">
                  <strong>Avg:</strong> {formatValue(overallStats[metric].avg, metric)}{metrics[metric].unit}
                </span>
                <span className="perf-separator">•</span>
                <span className="perf-stat">
                  <strong>Best:</strong> {formatValue(overallStats[metric].min, metric)}{metrics[metric].unit}
                </span>
                <span className="perf-separator">•</span>
                <span className="perf-stat">
                  <strong>Worst:</strong> {formatValue(overallStats[metric].max, metric)}{metrics[metric].unit}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="performance-controls">
          <div className="metric-selector">
            <label>Metric:</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              {Object.entries(metrics).map(([key, info]) => (
                <option key={key} value={key}>{info.name}</option>
              ))}
            </select>
          </div>
          
          <div className="chart-type-selector">
            <button
              className={chartType === 'bar' ? 'active' : ''}
              onClick={() => setChartType('bar')}
              title="Bar Chart"
            >
              Bar
            </button>
            <button
              className={chartType === 'line' ? 'active' : ''}
              onClick={() => setChartType('line')}
              title="Line Chart"
            >
              Line
            </button>
          </div>
          
          <div className="show-count-selector">
            <select 
              value={showCount} 
              onChange={(e) => setShowCount(parseInt(e.target.value))}
            >
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={25}>Top 25</option>
              <option value={50}>All Pages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Performance Summary */}
      <div className="performance-overview">
        <h4>Overall Performance Summary</h4>
        <div className="performance-cards">
          {Object.entries(metrics).map(([key, info]) => {
            const stat = overallStats[key];
            const rating = stat ? getPerformanceRating(key, stat.avg) : 'unknown';
            
            return (
              <div key={key} className={`performance-card ${rating} ${metric === key ? 'active' : ''}`} 
                   onClick={() => setMetric(key)}>
                <div className="card-header">
                  <span className="card-title">{info.name}</span>
                  <span className={`rating-badge ${rating}`}>
                    {rating === 'good' ? '✓' : rating === 'needs-improvement' ? '⚠' : '✗'}
                  </span>
                </div>
                <div className="card-value">
                  {stat ? formatValue(stat.avg, key) : 'N/A'}{info.unit}
                </div>
                <div className="card-rating">{rating.replace('-', ' ')}</div>
                {stat && (
                  <div className="card-samples">{stat.samples} samples</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="performance-chart">
        <h4>Page Performance - {metrics[metric].name}</h4>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="shortPage" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  label={{ value: metrics[metric].unit, angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => metric === 'avgCLS' ? value.toFixed(2) : Math.round(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metric} 
                  radius={[4, 4, 0, 0]}
                  fill={metrics[metric].color}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="shortPage" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  label={{ value: metrics[metric].unit, angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => metric === 'avgCLS' ? value.toFixed(2) : Math.round(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey={metric} 
                  stroke={metrics[metric].color}
                  strokeWidth={2}
                  dot={{ fill: metrics[metric].color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="no-chart-data">
            <p>No performance data available for charts</p>
          </div>
        )}
      </div>

      {/* Detailed Performance List */}
      <div className="performance-list">
        <div className="performance-list-header">
          <span className="header-rank">#</span>
          <span className="header-page">Page</span>
          <span className="header-load">Load Time</span>
          <span className="header-fcp">FCP</span>
          <span className="header-lcp">LCP</span>
          <span className="header-fid">FID</span>
          <span className="header-cls">CLS</span>
          <span className="header-samples">Samples</span>
        </div>

        {sortedData.map((page, index) => (
          <div key={index} className="performance-list-item">
            <span className="item-rank">#{index + 1}</span>
            <div className="item-page" title={page.page}>
              {page.page && page.page.length > 50 ? `${page.page.substring(0, 50)}...` : page.page || 'Unknown'}
            </div>
            <span className={`item-metric ${getPerformanceRating('avgLoadTime', page.avgLoadTime)}`}>
              {formatValue(page.avgLoadTime, 'avgLoadTime')}ms
            </span>
            <span className={`item-metric ${getPerformanceRating('avgFCP', page.avgFCP)}`}>
              {formatValue(page.avgFCP, 'avgFCP')}ms
            </span>
            <span className={`item-metric ${getPerformanceRating('avgLCP', page.avgLCP)}`}>
              {formatValue(page.avgLCP, 'avgLCP')}ms
            </span>
            <span className={`item-metric ${getPerformanceRating('avgFID', page.avgFID)}`}>
              {formatValue(page.avgFID, 'avgFID')}ms
            </span>
            <span className={`item-metric ${getPerformanceRating('avgCLS', page.avgCLS)}`}>
              {formatValue(page.avgCLS, 'avgCLS')}
            </span>
            <span className="item-samples">{page.sampleSize || 0}</span>
          </div>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <h4>Performance Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Best Performing Page</div>
              <div className="insight-value">
                {data.find(p => p[metric] === Math.min(...data.map(p => p[metric] || Infinity)))?.page?.substring(0, 30) + '...' || 'No data'}
              </div>
              <div className="insight-detail">
                {formatValue(Math.min(...data.map(p => p[metric] || Infinity)), metric)}{metrics[metric].unit}
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Needs Optimization</div>
              <div className="insight-value">
                {data.filter(p => getPerformanceRating(metric, p[metric]) === 'poor').length}
              </div>
              <div className="insight-detail">
                pages performing poorly
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Overall Score</div>
              <div className="insight-value">
                {data.filter(p => getPerformanceRating(metric, p[metric]) === 'good').length}
              </div>
              <div className="insight-detail">
                out of {data.length} pages performing well
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Performance Score</div>
              <div className="insight-value">
                {data.length > 0 ? 
                  Math.round((data.filter(p => getPerformanceRating(metric, p[metric]) === 'good').length / data.length) * 100) : 0}%
              </div>
              <div className="insight-detail">
                pages meeting performance targets
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="performance-recommendations">
        <h4>Optimization Recommendations</h4>
        <div className="recommendations-list">
          {data.filter(page => getPerformanceRating('avgLoadTime', page.avgLoadTime) === 'poor')
               .slice(0, 5).map((page, index) => (
            <div key={index} className="recommendation-item">
              <div className="recommendation-content">
                <div className="recommendation-title">
                  Optimize load time for {page.page}
                </div>
                <div className="recommendation-detail">
                  Current: {formatValue(page.avgLoadTime, 'avgLoadTime')}ms • 
                  Target: &lt;2000ms • 
                  {page.sampleSize || 0} samples
                </div>
                <div className="recommendation-actions">
                  <span className="action-suggestion">
                    Consider optimizing images, reducing JS bundle size, or improving server response time
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Web Vitals Information */}
      <div className="web-vitals-info">
        <h4>About Web Vitals</h4>
        <div className="vitals-grid">
          <div className="vital-card">
            <div className="vital-content">
              <div className="vital-name">First Contentful Paint (FCP)</div>
              <div className="vital-description">Time when first text/image appears</div>
              <div className="vital-thresholds">Good: &lt;1.8s • Poor: &gt;3.0s</div>
            </div>
          </div>
          
          <div className="vital-card">
            <div className="vital-content">
              <div className="vital-name">Largest Contentful Paint (LCP)</div>
              <div className="vital-description">Time when largest element appears</div>
              <div className="vital-thresholds">Good: &lt;2.5s • Poor: &gt;4.0s</div>
            </div>
          </div>
          
          <div className="vital-card">
            <div className="vital-content">
              <div className="vital-name">First Input Delay (FID)</div>
              <div className="vital-description">Time from first interaction to response</div>
              <div className="vital-thresholds">Good: &lt;100ms • Poor: &gt;300ms</div>
            </div>
          </div>
          
          <div className="vital-card">
            <div className="vital-content">
              <div className="vital-name">Cumulative Layout Shift (CLS)</div>
              <div className="vital-description">Measure of visual stability</div>
              <div className="vital-thresholds">Good: &lt;0.1 • Poor: &gt;0.25</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
