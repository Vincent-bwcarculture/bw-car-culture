// src/Admin/AnalyticsDashboard/components/ContentPerformance.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ContentPerformance = ({ data }) => {
  const [sortBy, setSortBy] = useState('views');
  const [viewType, setViewType] = useState('pages');
  const [showCount, setShowCount] = useState(10);

  if (!data) {
    return (
      <div className="content-performance-container">
        <div className="content-header">
          <h3>Content Performance</h3>
        </div>
        <div className="content-loading">Loading content data...</div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatPageName = (page) => {
    if (!page) return 'Unknown Page';
    if (page.length > 40) {
      return page.substring(0, 40) + '...';
    }
    return page;
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get the appropriate data based on viewType
  const getDisplayData = () => {
    if (viewType === 'search' && data.searchAnalytics) {
      return data.searchAnalytics;
    }
    return data.popularPages || [];
  };

  const displayData = getDisplayData();

  // Sort data based on selected criteria
  const getSortedData = () => {
    if (!displayData || displayData.length === 0) return [];
    
    const sorted = [...displayData].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.views || b.searches || 0) - (a.views || a.searches || 0);
        case 'uniqueVisitors':
          return (b.uniqueVisitors || 0) - (a.uniqueVisitors || 0);
        case 'avgTimeOnPage':
          return (b.avgTimeOnPage || 0) - (a.avgTimeOnPage || 0);
        case 'successRate':
          return (b.successRate || 0) - (a.successRate || 0);
        default:
          return (b.views || b.searches || 0) - (a.views || a.searches || 0);
      }
    });
    
    return sorted.slice(0, showCount);
  };

  const sortedData = getSortedData();

  // Prepare chart data
  const getChartData = () => {
    return sortedData.map(item => ({
      ...item,
      shortName: viewType === 'search' ? 
        (item.query || '').substring(0, 20) + ((item.query || '').length > 20 ? '...' : '') :
        formatPageName(item.page),
      displayValue: viewType === 'search' ? 
        (item.searches || 0) : 
        (sortBy === 'views' ? item.views :
         sortBy === 'uniqueVisitors' ? item.uniqueVisitors :
         sortBy === 'avgTimeOnPage' ? item.avgTimeOnPage : item.views)
    }));
  };

  const chartData = getChartData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip content-tooltip">
          <p className="tooltip-title">
            {viewType === 'search' ? data.query : data.page}
          </p>
          {viewType === 'search' ? (
            <>
              <p>Searches: {formatNumber(data.searches || 0)}</p>
              <p>Avg Results: {data.avgResults || 0}</p>
              <p>Success Rate: {data.successRate || 0}%</p>
            </>
          ) : (
            <>
              <p>Views: {formatNumber(data.views || 0)}</p>
              <p>Unique Visitors: {formatNumber(data.uniqueVisitors || 0)}</p>
              <p>Avg. Time: {formatTime(data.avgTimeOnPage || 0)}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Get metric configuration
  const getMetricConfig = () => {
    if (viewType === 'search') {
      return {
        views: { label: 'Searches', field: 'searches' },
        successRate: { label: 'Success Rate', field: 'successRate' },
        avgResults: { label: 'Avg Results', field: 'avgResults' }
      };
    } else {
      return {
        views: { label: 'Views', field: 'views' },
        uniqueVisitors: { label: 'Unique Visitors', field: 'uniqueVisitors' },
        avgTimeOnPage: { label: 'Time on Page', field: 'avgTimeOnPage' }
      };
    }
  };

  const metricConfig = getMetricConfig();

  return (
    <div className="content-performance-container">
      <div className="content-header">
        <h3>Content Performance</h3>
        <div className="content-controls">
          <div className="view-type-selector">
            <button 
              className={viewType === 'pages' ? 'active' : ''}
              onClick={() => setViewType('pages')}
            >
              Pages
            </button>
            <button 
              className={viewType === 'search' ? 'active' : ''}
              onClick={() => setViewType('search')}
            >
              Search
            </button>
          </div>
          
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              {Object.entries(metricConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div className="show-count-selector">
            <label>Show:</label>
            <select 
              value={showCount} 
              onChange={(e) => setShowCount(parseInt(e.target.value))}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart View */}
      {chartData.length > 0 ? (
        <div className="content-chart">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortName" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={sortBy === 'avgTimeOnPage' ? formatTime : formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="displayValue"
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="no-chart-data">
          <div className="no-data-message">
            <p>No {viewType} data available</p>
            <small>Content performance will appear here once users interact with your site</small>
          </div>
        </div>
      )}

      {/* Detailed List View */}
      {sortedData.length > 0 && (
        <div className="content-list">
          <div className="content-list-header">
            <span className="header-rank">#</span>
            <span className="header-page">
              {viewType === 'search' ? 'Search Query' : 'Page'}
            </span>
            {viewType === 'search' ? (
              <>
                <span className="header-searches">Searches</span>
                <span className="header-results">Results</span>
                <span className="header-success">Success</span>
              </>
            ) : (
              <>
                <span className="header-views">Views</span>
                <span className="header-visitors">Unique</span>
                <span className="header-time">Avg. Time</span>
              </>
            )}
          </div>
          
          {sortedData.map((item, index) => (
            <div key={index} className="content-list-item">
              <span className="item-rank">#{index + 1}</span>
              <div className="item-page">
                <div className="page-title" title={viewType === 'search' ? item.query : item.page}>
                  {viewType === 'search' ? 
                    (item.query || 'Unknown Query') : 
                    formatPageName(item.page || 'Unknown Page')
                  }
                </div>
                <div className="page-url">
                  {viewType === 'search' ? 
                    `Category: ${item.category || 'general'}` : 
                    (item.page || 'Unknown URL')
                  }
                </div>
              </div>
              
              {viewType === 'search' ? (
                <>
                  <span className="item-searches">{formatNumber(item.searches || 0)}</span>
                  <span className="item-results">{item.avgResults || 0}</span>
                  <span className={`item-success ${(item.successRate || 0) > 80 ? 'high' : (item.successRate || 0) > 50 ? 'medium' : 'low'}`}>
                    {item.successRate || 0}%
                  </span>
                </>
              ) : (
                <>
                  <span className="item-views">{formatNumber(item.views || 0)}</span>
                  <span className="item-visitors">{formatNumber(item.uniqueVisitors || 0)}</span>
                  <span className="item-time">{formatTime(item.avgTimeOnPage || 0)}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Performance Insights */}
      {sortedData.length > 0 && (
        <div className="content-insights">
          <h4>{viewType === 'search' ? 'Search Insights' : 'Content Insights'}</h4>
          <div className="insights-grid">
            {viewType === 'search' ? (
              <>
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Most Popular</div>
                    <div className="insight-value">
                      {sortedData[0]?.query || 'No data'}
                    </div>
                    <div className="insight-detail">
                      {formatNumber(sortedData[0]?.searches || 0)} searches
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Best Success Rate</div>
                    <div className="insight-value">
                      {sortedData.find(s => s.successRate === Math.max(...sortedData.map(s => s.successRate || 0)))?.query || 'No data'}
                    </div>
                    <div className="insight-detail">
                      {Math.max(...sortedData.map(s => s.successRate || 0)).toFixed(1)}% success
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Needs Improvement</div>
                    <div className="insight-value">
                      {sortedData.filter(s => (s.successRate || 0) < 50).length}
                    </div>
                    <div className="insight-detail">
                      queries with low success rates
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Top Performer</div>
                    <div className="insight-value">
                      {formatPageName(sortedData[0]?.page || 'No data')}
                    </div>
                    <div className="insight-detail">
                      {formatNumber(sortedData[0]?.views || 0)} views
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Highest Engagement</div>
                    <div className="insight-value">
                      {formatPageName(sortedData.find(p => p.avgTimeOnPage === Math.max(...sortedData.map(p => p.avgTimeOnPage || 0)))?.page || 'No data')}
                    </div>
                    <div className="insight-detail">
                      {formatTime(Math.max(...sortedData.map(p => p.avgTimeOnPage || 0)))} avg time
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-content">
                    <div className="insight-title">Total Performance</div>
                    <div className="insight-value">
                      {formatNumber(sortedData.reduce((sum, item) => sum + (item.views || 0), 0))}
                    </div>
                    <div className="insight-detail">
                      total page views
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {viewType === 'search' && sortedData.some(s => (s.successRate || 0) < 50) && (
        <div className="content-recommendations">
          <h4>Recommendations</h4>
          <div className="recommendations-list">
            {sortedData
              .filter(s => (s.successRate || 0) < 50)
              .slice(0, 3)
              .map((search, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-content">
                    <div className="recommendation-title">
                      Improve search results for "{search.query}"
                    </div>
                    <div className="recommendation-detail">
                      Current success rate: {search.successRate || 0}% (Target: 80%)
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPerformance;
