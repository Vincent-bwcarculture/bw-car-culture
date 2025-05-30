// src/Admin/AnalyticsDashboard/components/GeographicData.js
import React, { useState } from 'react';

const GeographicData = ({ data, title = "Geographic Data" }) => {
  const [viewType, setViewType] = useState('visitors');
  const [showCount, setShowCount] = useState(15);

  if (!data || !data.length) {
    return (
      <div className="geographic-data-container">
        <h3>{title}</h3>
        <div className="no-data-message">
          <p>No geographic data available</p>
          <small>Location data will appear here once users visit your site</small>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Sort data based on selected view type
  const getSortedData = () => {
    const sorted = [...data].sort((a, b) => {
      return viewType === 'visitors' ? 
        (b.uniqueVisitors || 0) - (a.uniqueVisitors || 0) : 
        (b.pageViews || 0) - (a.pageViews || 0);
    });
    return sorted.slice(0, showCount);
  };

  const sortedData = getSortedData();

  // Calculate max value for bar visualization
  const maxValue = Math.max(...sortedData.map(item => 
    viewType === 'visitors' ? (item.uniqueVisitors || 0) : (item.pageViews || 0)
  ));

  // Get country flag emoji (simplified)
  const getCountryFlag = (country) => {
    const flags = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'China': '🇨🇳',
      'South Africa': '🇿🇦',
      'Botswana': '🇧🇼',
      'Nigeria': '🇳🇬',
      'Kenya': '🇰🇪',
      'Ghana': '🇬🇭'
    };
    return flags[country] || '🌍';
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalVisitors = data.reduce((sum, item) => sum + (item.uniqueVisitors || 0), 0);
    const totalPageViews = data.reduce((sum, item) => sum + (item.pageViews || 0), 0);
    const topCountry = data.length > 0 ? data[0] : null;
    
    return {
      totalCountries: data.length,
      totalVisitors,
      totalPageViews,
      topCountry
    };
  };

  const summary = calculateSummary();

  // Get continent for grouping
  const getContinent = (country) => {
    const continents = {
      'Botswana': 'Africa',
      'South Africa': 'Africa',
      'Nigeria': 'Africa',
      'Kenya': 'Africa',
      'Ghana': 'Africa',
      'United States': 'North America',
      'Canada': 'North America',
      'United Kingdom': 'Europe',
      'Germany': 'Europe',
      'France': 'Europe',
      'Australia': 'Oceania',
      'Japan': 'Asia',
      'China': 'Asia',
      'India': 'Asia',
      'Brazil': 'South America'
    };
    return continents[country] || 'Other';
  };

  // Group by continent
  const getContinentData = () => {
    const continentGroups = {};
    
    data.forEach(item => {
      const continent = getContinent(item.country);
      if (!continentGroups[continent]) {
        continentGroups[continent] = {
          continent,
          countries: 0,
          visitors: 0,
          pageViews: 0
        };
      }
      continentGroups[continent].countries++;
      continentGroups[continent].visitors += item.uniqueVisitors || 0;
      continentGroups[continent].pageViews += item.pageViews || 0;
    });
    
    return Object.values(continentGroups).sort((a, b) => b.visitors - a.visitors);
  };

  const continentData = getContinentData();

  return (
    <div className="geographic-data-container">
      <div className="geographic-header">
        <div className="geographic-title-section">
          <h3>{title}</h3>
          <div className="geographic-summary">
            <div className="geo-stat">
              <span className="stat-number">{summary.totalCountries}</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="geo-stat">
              <span className="stat-number">{formatNumber(summary.totalVisitors)}</span>
              <span className="stat-label">Visitors</span>
            </div>
            <div className="geo-stat">
              <span className="stat-number">{formatNumber(summary.totalPageViews)}</span>
              <span className="stat-label">Page Views</span>
            </div>
          </div>
        </div>
        
        <div className="geographic-controls">
          <div className="view-controls">
            <button 
              className={viewType === 'visitors' ? 'active' : ''}
              onClick={() => setViewType('visitors')}
            >
              Visitors
            </button>
            <button 
              className={viewType === 'pageViews' ? 'active' : ''}
              onClick={() => setViewType('pageViews')}
            >
              Page Views
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
              <option value={50}>All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Country List */}
      <div className="geographic-list">
        <div className="geographic-list-header">
          <span className="header-rank">#</span>
          <span className="header-location">Location</span>
          <span className="header-visitors">Visitors</span>
          <span className="header-pageviews">Page Views</span>
          <span className="header-chart">Distribution</span>
        </div>
        
        {sortedData.map((location, index) => {
          const value = viewType === 'visitors' ? 
            (location.uniqueVisitors || 0) : 
            (location.pageViews || 0);
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="geographic-item">
              <span className="item-rank">#{index + 1}</span>
              
              <div className="location-info">
                <span className="country-flag" role="img" aria-label={location.country}>
                  {getCountryFlag(location.country)}
                </span>
                <div className="location-details">
                  <div className="location-primary">
                    {location.city ? 
                      `${location.city}, ${location.country}` : 
                      location.country
                    }
                  </div>
                  <div className="location-continent">
                    {getContinent(location.country)}
                  </div>
                </div>
              </div>
              
              <span className="item-visitors">
                {formatNumber(location.uniqueVisitors || 0)}
              </span>
              
              <span className="item-pageviews">
                {formatNumber(location.pageViews || 0)}
              </span>
              
              <div className="location-chart">
                <div className="metric-bar">
                  <div 
                    className="metric-fill"
                    style={{ 
                      width: `${Math.max(2, percentage)}%`,
                      backgroundColor: index === 0 ? '#ef4444' : '#36a2eb'
                    }}
                  ></div>
                </div>
                <span className="metric-percentage">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continent Summary */}
      {continentData.length > 1 && (
        <div className="continent-summary">
          <h4>By Continent</h4>
          <div className="continent-grid">
            {continentData.map((continent, index) => (
              <div key={index} className="continent-card">
                <div className="continent-header">
                  <span className="continent-name">{continent.continent}</span>
                  <span className="continent-countries">{continent.countries} countries</span>
                </div>
                <div className="continent-stats">
                  <div className="continent-stat">
                    <span className="stat-value">{formatNumber(continent.visitors)}</span>
                    <span className="stat-label">visitors</span>
                  </div>
                  <div className="continent-stat">
                    <span className="stat-value">{formatNumber(continent.pageViews)}</span>
                    <span className="stat-label">page views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Insights */}
      <div className="geographic-insights">
        <h4>Geographic Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Top Country</div>
              <div className="insight-value">
                {summary.topCountry ? 
                  `${getCountryFlag(summary.topCountry.country)} ${summary.topCountry.country}` : 
                  'No data'
                }
              </div>
              <div className="insight-detail">
                {formatNumber(summary.topCountry?.uniqueVisitors || 0)} visitors
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Global Reach</div>
              <div className="insight-value">{summary.totalCountries}</div>
              <div className="insight-detail">
                countries reached
              </div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-content">
              <div className="insight-title">Avg. per Country</div>
              <div className="insight-value">
                {summary.totalCountries > 0 ? 
                  formatNumber(Math.round(summary.totalVisitors / summary.totalCountries)) : 
                  '0'
                }
              </div>
              <div className="insight-detail">
                visitors per country
              </div>
            </div>
          </div>
          
          {continentData.length > 0 && (
            <div className="insight-card">
              <div className="insight-content">
                <div className="insight-title">Top Continent</div>
                <div className="insight-value">{continentData[0].continent}</div>
                <div className="insight-detail">
                  {((continentData[0].visitors / summary.totalVisitors) * 100).toFixed(0)}% of traffic
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regional Focus Message */}
      {summary.topCountry?.country === 'Botswana' && summary.totalVisitors > 0 && (
        <div className="regional-focus-note">
          <span className="note-icon">🇧🇼</span>
          <div className="note-content">
            <strong>Local Focus:</strong> 
            {((summary.topCountry.uniqueVisitors / summary.totalVisitors) * 100).toFixed(0)}% 
            of your traffic is from Botswana. Consider localizing content for your primary market.
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicData;
