// src/Admin/AnalyticsDashboard/components/SearchAnalytics.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SearchAnalytics = ({ data }) => {
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  if (!data || !data.length) {
    return (
      <div className="search-analytics-container">
        <h3>Search Analytics</h3>
        <div className="no-data-message">
          <p>No search data available</p>
          <small>Search analytics will appear here once users start searching your site</small>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Filter data based on selected filter
  const getFilteredData = () => {
    switch (filter) {
      case 'successful':
        return data.filter(search => (search.successRate || 0) > 80);
      case 'failed':
        return data.filter(search => (search.successRate || 0) < 20);
      case 'popular':
        return data.filter(search => (search.searches || 0) > 10);
      case 'recent':
        return data;
      default:
        return data;
    }
  };

  const filteredData = getFilteredData();

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalSearches = data.reduce((sum, search) => sum + (search.searches || 0), 0);
    const avgSuccessRate = data.length > 0 ? 
      data.reduce((sum, search) => sum + (search.successRate || 0), 0) / data.length : 0;
    const noResultsQueries = data.filter(search => (search.successRate || 0) === 0).length;
    
    return {
      totalSearches,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      noResultsQueries,
      uniqueQueries: data.length
    };
  };

  const summary = calculateSummary();

  // Prepare chart data for search volume
  const getChartData = () => {
    return filteredData.slice(0, 10).map(search => ({
      ...search,
      shortQuery: search.query && search.query.length > 15 ? 
        search.query.substring(0, 15) + '...' : 
        search.query || 'Unknown'
    }));
  };

  const chartData = getChartData();

  // Prepare data for success rate pie chart
  const getSuccessRateData = () => {
    const successful = data.filter(s => (s.successRate || 0) > 80).length;
    const moderate = data.filter(s => (s.successRate || 0) > 20 && (s.successRate || 0) <= 80).length;
    const failed = data.filter(s => (s.successRate || 0) <= 20).length;
    
    return [
      { name: 'High Success (>80%)', value: successful, color: '#22c55e' },
      { name: 'Moderate (20-80%)', value: moderate, color: '#f59e0b' },
      { name: 'Low Success (<20%)', value: failed, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const successRateData = getSuccessRateData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip search-tooltip">
          <p className="tooltip-title">"{data.query}"</p>
          <p>Searches: {formatNumber(data.searches || 0)}</p>
          <p>Success Rate: {data.successRate || 0}%</p>
          <p>Avg. Results: {data.avgResults || 0}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-tooltip pie-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p>{data.value} queries</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="search-analytics-container">
      <div className="search-header">
        <div className="search-title-section">
          <h3>Search Analytics</h3>
          <div className="search-summary">
            <div className="search-stat">
              <span className="stat-number">{formatNumber(summary.totalSearches)}</span>
              <span className="stat-label">Total Searches</span>
            </div>
            <div className="search-stat">
              <span className="stat-number">{summary.avgSuccessRate}%</span>
              <span className="stat-label">Avg. Success Rate</span>
            </div>
            <div className="search-stat">
              <span className="stat-number">{summary.uniqueQueries}</span>
              <span className="stat-label">Unique Queries</span>
            </div>
            <div className="search-stat">
              <span className="stat-number">{summary.noResultsQueries}</span>
              <span className="stat-label">No Results</span>
            </div>
          </div>
        </div>
        
        <div className="search-controls">
          <div className="search-filters">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Searches
            </button>
            <button 
              className={filter === 'popular' ? 'active' : ''}
              onClick={() => setFilter('popular')}
            >
              Popular (10+)
            </button>
            <button 
              className={filter === 'successful' ? 'active' : ''}
              onClick={() => setFilter('successful')}
            >
              Successful (80%+)
            </button>
            <button 
              className={filter === 'failed' ? 'active' : ''}
              onClick={() => setFilter('failed')}
            >
              Failed (20%-)
            </button>
          </div>
          
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              List
            </button>
            <button 
              className={viewMode === 'chart' ? 'active' : ''}
              onClick={() => setViewMode('chart')}
              title="Chart View"
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="search-charts">
          <div className="chart-grid">
            <div className="search-volume-chart">
              <h4>Search Volume (Top 10)</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="shortQuery" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis tickFormatter={formatNumber} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="searches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">No data for selected filter</div>
              )}
            </div>
            
            <div className="success-rate-chart">
              <h4>Success Rate Distribution</h4>
              {successRateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">No success rate data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="search-list">
          <div className="search-list-header">
            <span className="header-rank">#</span>
            <span className="header-query">Search Query</span>
            <span className="header-count">Searches</span>
            <span className="header-results">Avg. Results</span>
            <span className="header-success">Success Rate</span>
          </div>

          {filteredData.length > 0 ? (
            filteredData.slice(0, 25).map((search, index) => (
              <div key={index} className="search-list-item">
                <span className="item-rank">#{index + 1}</span>
                <div className="item-query">
                  <div className="query-text">{search.query || 'Unknown Query'}</div>
                  {search.noResults > 0 && (
                    <div className="query-issues">
                      {search.noResults} searches returned no results
                    </div>
                  )}
                </div>
                <span className="item-count">{formatNumber(search.searches || 0)}</span>
                <span className="item-results">{search.avgResults || 0}</span>
                <div className="item-success">
                  <div className="success-bar">
                    <div 
                      className="success-fill"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, search.successRate || 0))}%`,
                        backgroundColor: (search.successRate || 0) > 80 ? '#22c55e' :
                                       (search.successRate || 0) > 50 ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                  <span className="success-percentage">{search.successRate || 0}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-search-data">
              <p>No searches match the selected filter</p>
              <small>Try selecting a different filter</small>
            </div>
          )}
        </div>
      )}

      {/* Search Insights */}
      <div className="search-insights">
        <h4>Search Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Most Popular</div>
              <div className="insight-value">
                {data[0]?.query || 'No data'}
              </div>
              <div className="insight-detail">
                {formatNumber(data[0]?.searches || 0)} searches
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Highest Success Rate</div>
              <div className="insight-value">
                {data.find(s => s.successRate === Math.max(...data.map(s => s.successRate || 0)))?.query || 'No data'}
              </div>
              <div className="insight-detail">
                {Math.max(...data.map(s => s.successRate || 0)).toFixed(1)}% success
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Needs Improvement</div>
              <div className="insight-value">
                {data.filter(s => (s.successRate || 0) < 50).length}
              </div>
              <div className="insight-detail">
                queries with low success rates
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Search Coverage</div>
              <div className="insight-value">
                {data.filter(s => (s.successRate || 0) > 0).length}
              </div>
              <div className="insight-detail">
                out of {data.length} queries have results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.filter(s => (s.successRate || 0) < 50).length > 0 && (
        <div className="search-recommendations">
          <h4>Improvement Recommendations</h4>
          <div className="recommendations-list">
            {data
              .filter(s => (s.successRate || 0) < 50)
              .slice(0, 5)
              .map((search, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-content">
                    <div className="recommendation-title">
                      Improve search results for "{search.query}"
                    </div>
                    <div className="recommendation-detail">
                      Current success rate: {search.successRate || 0}% • 
                      {search.searches || 0} searches • 
                      Target: 80% success rate
                    </div>
                    <div className="recommendation-actions">
                      <span className="action-suggestion">
                        Consider adding more content matching this search term
                      </span>
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

export default SearchAnalytics;
