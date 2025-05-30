// src/Admin/AnalyticsDashboard/components/TrafficChart.js
import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const TrafficChart = ({ data }) => {
  const [chartType, setChartType] = useState('area');
  const [metrics, setMetrics] = useState(['uniqueVisitors', 'pageViews', 'sessions']);
  const [timeRange, setTimeRange] = useState('all');

  if (!data || !data.trafficOverTime) {
    return (
      <div className="traffic-chart-container">
        <div className="chart-loading">Loading traffic data...</div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTooltipValue = (value, name) => {
    const formatNumber = (num) => {
      if (typeof num !== 'number') return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toLocaleString();
    };

    const labels = {
      uniqueVisitors: 'Unique Visitors',
      pageViews: 'Page Views',
      sessions: 'Sessions'
    };

    return [formatNumber(value), labels[name] || name];
  };

  const colors = {
    uniqueVisitors: '#ef4444',
    pageViews: '#3b82f6',
    sessions: '#10b981'
  };

  // Filter data based on time range
  const getFilteredData = () => {
    if (timeRange === 'all') return data.trafficOverTime;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return data.trafficOverTime;
    }
    
    return data.trafficOverTime.filter(item => 
      new Date(item.date) >= cutoffDate
    );
  };

  const filteredData = getFilteredData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip traffic-tooltip">
          <p className="tooltip-label">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.dataKey)[0]}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (!filteredData.length) return {};
    
    const totals = filteredData.reduce((acc, item) => ({
      uniqueVisitors: (acc.uniqueVisitors || 0) + (item.uniqueVisitors || 0),
      pageViews: (acc.pageViews || 0) + (item.pageViews || 0),
      sessions: (acc.sessions || 0) + (item.sessions || 0)
    }), {});
    
    const averages = {
      uniqueVisitors: Math.round(totals.uniqueVisitors / filteredData.length),
      pageViews: Math.round(totals.pageViews / filteredData.length),
      sessions: Math.round(totals.sessions / filteredData.length)
    };
    
    return { totals, averages };
  };

  const stats = calculateStats();

  const toggleMetric = (metric) => {
    if (metrics.includes(metric)) {
      if (metrics.length > 1) {
        setMetrics(metrics.filter(m => m !== metric));
      }
    } else {
      setMetrics([...metrics, metric]);
    }
  };

  return (
    <div className="traffic-chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>Traffic Overview</h3>
          <div className="chart-stats">
            {stats.totals && (
              <>
                <span className="stat-item">
                  <strong>{stats.totals.uniqueVisitors?.toLocaleString() || 0}</strong> visitors
                </span>
                <span className="stat-separator">•</span>
                <span className="stat-item">
                  <strong>{stats.totals.pageViews?.toLocaleString() || 0}</strong> page views
                </span>
                <span className="stat-separator">•</span>
                <span className="stat-item">
                  <strong>{stats.averages.uniqueVisitors?.toLocaleString() || 0}</strong> avg/day
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="chart-controls">
          <div className="time-range-selector">
            <button 
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </button>
            <button 
              className={timeRange === '30d' ? 'active' : ''}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </button>
            <button 
              className={timeRange === '90d' ? 'active' : ''}
              onClick={() => setTimeRange('90d')}
            >
              90D
            </button>
            <button 
              className={timeRange === 'all' ? 'active' : ''}
              onClick={() => setTimeRange('all')}
            >
              All
            </button>
          </div>
          
          <div className="metric-toggles">
            {['uniqueVisitors', 'pageViews', 'sessions'].map(metric => (
              <label key={metric} className="metric-toggle">
                <input
                  type="checkbox"
                  checked={metrics.includes(metric)}
                  onChange={() => toggleMetric(metric)}
                />
                <span 
                  className="metric-label" 
                  style={{ color: colors[metric] }}
                >
                  {metric === 'uniqueVisitors' ? 'Unique Visitors' :
                   metric === 'pageViews' ? 'Page Views' : 'Sessions'}
                </span>
              </label>
            ))}
          </div>
          
          <div className="chart-type-selector">
            <button
              className={chartType === 'area' ? 'active' : ''}
              onClick={() => setChartType('area')}
              title="Area Chart"
            >
              Area
            </button>
            <button
              className={chartType === 'line' ? 'active' : ''}
              onClick={() => setChartType('line')}
              title="Line Chart"
            >
              Line
            </button>
          </div>
        </div>
      </div>

      <div className="chart-content">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'area' ? (
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis tickFormatter={(value) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                  return value;
                }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {metrics.includes('uniqueVisitors') && (
                  <Area 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="#ef4444" 
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                    name="Unique Visitors"
                  />
                )}
                {metrics.includes('pageViews') && (
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#colorPageViews)"
                    name="Page Views"
                  />
                )}
                {metrics.includes('sessions') && (
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#10b981" 
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                    name="Sessions"
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis tickFormatter={(value) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                  return value;
                }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {metrics.includes('uniqueVisitors') && (
                  <Line 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Unique Visitors"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {metrics.includes('pageViews') && (
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Page Views"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {metrics.includes('sessions') && (
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Sessions"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="no-chart-data">
            <div className="no-data-message">
              <p>No traffic data available for the selected time range</p>
              <small>Try selecting a different time period</small>
            </div>
          </div>
        )}
      </div>

      {/* Traffic Insights */}
      {stats.totals && (
        <div className="traffic-insights">
          <h4>Traffic Insights</h4>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-content">
                <div className="insight-title">Daily Average</div>
                <div className="insight-value">
                  {stats.averages.uniqueVisitors} visitors
                </div>
              </div>
            </div>
            
            <div className="insight-card">
              <div className="insight-content">
                <div className="insight-title">Pages per Visit</div>
                <div className="insight-value">
                  {stats.totals.sessions > 0 ? 
                    (stats.totals.pageViews / stats.totals.sessions).toFixed(1) : 0}
                </div>
              </div>
            </div>
            
            <div className="insight-card">
              <div className="insight-content">
                <div className="insight-title">Engagement Rate</div>
                <div className="insight-value">
                  {stats.totals.uniqueVisitors > 0 ? 
                    ((stats.totals.sessions / stats.totals.uniqueVisitors) * 100).toFixed(0) + '%' : '0%'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficChart;
