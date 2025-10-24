// client/src/components/features/MarketOverview/MarketOverview.js
import React, { useState, useEffect } from 'react';
import './MarketOverview.css';

const MarketOverview = () => {
  const [filterOptions, setFilterOptions] = useState({
    makes: [],
    models: [],
    years: [],
    conditions: ['all', 'new', 'used', 'certified']
  });
  const [selectedFilters, setSelectedFilters] = useState({
    make: '',
    model: '',
    year: '',
    condition: 'all'
  });
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/market-prices/filters');
      const data = await response.json();

      if (data.success) {
        setFilterOptions({
          ...data.data,
          conditions: ['all', ...data.data.conditions]
        });
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = async () => {
    if (!selectedFilters.make || !selectedFilters.model) {
      alert('Please select at least a make and model');
      return;
    }

    try {
      setLoading(true);
      setShowResults(true);

      const queryParams = new URLSearchParams({
        make: selectedFilters.make,
        model: selectedFilters.model,
        ...(selectedFilters.year && { year: selectedFilters.year }),
        ...(selectedFilters.condition !== 'all' && { condition: selectedFilters.condition })
      });

      const response = await fetch(`/api/market-prices/trend?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setTrendData(data.data);
      } else {
        setTrendData(null);
        alert(data.message || 'No data found for this vehicle');
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setTrendData(null);
      alert('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedFilters({
      make: '',
      model: '',
      year: '',
      condition: 'all'
    });
    setTrendData(null);
    setShowResults(false);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return '#2ed573';
      case 'decreasing':
        return '#ff3838';
      default:
        return '#ffc107';
    }
  };

  const formatPrice = (price) => {
    return `P${price.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="market-overview">
      <div className="market-overview-container">
        {/* Header */}
        <div className="market-header">
          <h1>Market Overview</h1>
          <p>Track historical prices and market trends for vehicles</p>
        </div>

        {/* Search Filters */}
        <div className="search-section">
          <h2>Search Vehicle Prices</h2>
          <div className="filters-container">
            <div className="filter-item">
              <label>Make *</label>
              <select
                value={selectedFilters.make}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, make: e.target.value, model: '' })}
                className="filter-select"
              >
                <option value="">Select Make</option>
                {filterOptions.makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Model *</label>
              <select
                value={selectedFilters.model}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, model: e.target.value })}
                className="filter-select"
                disabled={!selectedFilters.make}
              >
                <option value="">Select Model</option>
                {filterOptions.models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Year (Optional)</label>
              <select
                value={selectedFilters.year}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, year: e.target.value })}
                className="filter-select"
              >
                <option value="">All Years</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Condition (Optional)</label>
              <select
                value={selectedFilters.condition}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, condition: e.target.value })}
                className="filter-select"
              >
                {filterOptions.conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="search-actions">
            <button
              className="btn-search"
              onClick={handleSearch}
              disabled={!selectedFilters.make || !selectedFilters.model}
            >
              🔍 Search Prices
            </button>
            <button className="btn-reset" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="results-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading market data...</p>
              </div>
            ) : trendData ? (
              <>
                {/* Statistics Cards */}
                <div className="stats-grid">
                  <div className="stat-card trend-card">
                    <div className="stat-icon" style={{ color: getTrendColor(trendData.statistics.trend) }}>
                      {getTrendIcon(trendData.statistics.trend)}
                    </div>
                    <div className="stat-content">
                      <div className="stat-label">Market Trend</div>
                      <div className="stat-value" style={{ color: getTrendColor(trendData.statistics.trend) }}>
                        {trendData.statistics.trend.charAt(0).toUpperCase() + trendData.statistics.trend.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <div className="stat-label">Average Price</div>
                      <div className="stat-value">{formatPrice(trendData.statistics.average)}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-label">Price Range</div>
                      <div className="stat-value">
                        {formatPrice(trendData.statistics.min)} - {formatPrice(trendData.statistics.max)}
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <div className="stat-label">Data Points</div>
                      <div className="stat-value">{trendData.statistics.count}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="vehicle-info">
                  <h3>
                    {trendData.vehicle.make} {trendData.vehicle.model}
                    {trendData.vehicle.year && ` (${trendData.vehicle.year})`}
                  </h3>
                  {trendData.vehicle.condition !== 'all' && (
                    <span className={`condition-tag ${trendData.vehicle.condition}`}>
                      {trendData.vehicle.condition}
                    </span>
                  )}
                </div>

                {/* Price History Table */}
                <div className="price-history">
                  <h3>Price History</h3>
                  <div className="price-table-wrapper">
                    <table className="price-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Price</th>
                          <th>Condition</th>
                          <th>Mileage</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.prices.map((price, index) => (
                          <tr key={index}>
                            <td>{formatDate(price.date)}</td>
                            <td className="price-cell">{formatPrice(price.price)}</td>
                            <td>
                              <span className={`condition-tag ${price.condition}`}>
                                {price.condition}
                              </span>
                            </td>
                            <td>{price.mileage ? `${price.mileage.toLocaleString()} km` : 'N/A'}</td>
                            <td>{price.location || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Simple Chart Visualization */}
                <div className="price-chart">
                  <h3>Price Trend Chart</h3>
                  <div className="chart-container">
                    {trendData.prices.map((price, index) => {
                      const maxPrice = trendData.statistics.max;
                      const minPrice = trendData.statistics.min;
                      const range = maxPrice - minPrice;
                      const height = range > 0 ? ((price.price - minPrice) / range) * 100 : 50;
                      
                      return (
                        <div key={index} className="chart-bar-wrapper">
                          <div
                            className="chart-bar"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${formatPrice(price.price)} on ${formatDate(price.date)}`}
                          >
                            <span className="bar-label">{formatPrice(price.price)}</span>
                          </div>
                          <div className="chart-label">{formatDate(price.date)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">📊</div>
                <h3>No Data Found</h3>
                <p>We couldn't find any price data for the selected vehicle.</p>
                <p>Try adjusting your search criteria or check back later.</p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!showResults && (
          <div className="info-section">
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h3>Track Market Trends</h3>
              <p>View historical price data and trends for any vehicle make and model</p>
            </div>
            <div className="info-card">
              <div className="info-icon">💰</div>
              <h3>Make Informed Decisions</h3>
              <p>Compare prices across different conditions and time periods</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📈</div>
              <h3>Understand Depreciation</h3>
              <p>See how vehicle values change over time in the market</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
