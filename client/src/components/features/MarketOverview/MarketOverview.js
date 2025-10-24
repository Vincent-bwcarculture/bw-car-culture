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
  const [allPrices, setAllPrices] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'compare'
  const [searchFilters, setSearchFilters] = useState({
    make: '',
    model: '',
    year: '',
    condition: 'all'
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchMarketOverview();
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

  const fetchMarketOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/market-prices?limit=100');
      const data = await response.json();

      if (data.success) {
        setAllPrices(data.data);
        // Auto-select top 5 vehicles for initial display
        const topVehicles = getTopVehicles(data.data, 5);
        setSelectedVehicles(topVehicles);
        updateComparisonData(topVehicles, data.data);
      }
    } catch (error) {
      console.error('Error fetching market overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopVehicles = (prices, limit) => {
    const vehicleGroups = {};
    
    prices.forEach(price => {
      const key = `${price.make}-${price.model}-${price.year}`;
      if (!vehicleGroups[key]) {
        vehicleGroups[key] = {
          make: price.make,
          model: price.model,
          year: price.year,
          prices: [],
          avgPrice: 0
        };
      }
      vehicleGroups[key].prices.push(price);
    });

    // Calculate average and sort
    const vehicles = Object.values(vehicleGroups).map(v => {
      const total = v.prices.reduce((sum, p) => sum + p.price, 0);
      v.avgPrice = total / v.prices.length;
      return v;
    }).sort((a, b) => b.prices.length - a.prices.length);

    return vehicles.slice(0, limit);
  };

  const updateComparisonData = (vehicles, allPricesData) => {
    const comparison = vehicles.map(vehicle => {
      const vehiclePrices = allPricesData.filter(p => 
        p.make === vehicle.make && 
        p.model === vehicle.model && 
        p.year === vehicle.year
      ).sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate));

      const prices = vehiclePrices.map(p => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate trend
      let trend = 'stable';
      if (prices.length >= 2) {
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        if (percentageChange > 5) trend = 'increasing';
        else if (percentageChange < -5) trend = 'decreasing';
      }

      return {
        vehicle: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        pricePoints: vehiclePrices.map(p => ({
          date: new Date(p.recordedDate),
          price: p.price,
          condition: p.condition
        })),
        avgPrice: Math.round(avgPrice),
        minPrice,
        maxPrice,
        trend,
        dataPoints: prices.length
      };
    });

    setComparisonData(comparison);
  };

  const handleSearch = () => {
    if (!searchFilters.make || !searchFilters.model) {
      alert('Please select at least a make and model');
      return;
    }

    const filtered = allPrices.filter(price => {
      const makeMatch = price.make.toLowerCase() === searchFilters.make.toLowerCase();
      const modelMatch = price.model.toLowerCase() === searchFilters.model.toLowerCase();
      const yearMatch = !searchFilters.year || price.year === parseInt(searchFilters.year);
      const conditionMatch = searchFilters.condition === 'all' || price.condition === searchFilters.condition;
      
      return makeMatch && modelMatch && yearMatch && conditionMatch;
    });

    if (filtered.length === 0) {
      alert('No data found for the selected vehicle');
      return;
    }

    // Create vehicle object from filtered results
    const vehicle = {
      make: searchFilters.make,
      model: searchFilters.model,
      year: searchFilters.year || filtered[0].year,
      prices: filtered
    };

    // Add to selected vehicles if not already there
    const exists = selectedVehicles.some(v => 
      v.make === vehicle.make && 
      v.model === vehicle.model && 
      v.year === vehicle.year
    );

    if (!exists && selectedVehicles.length < 5) {
      const updated = [...selectedVehicles, vehicle];
      setSelectedVehicles(updated);
      updateComparisonData(updated, allPrices);
    } else if (selectedVehicles.length >= 5) {
      alert('Maximum 5 vehicles can be compared at once. Remove one first.');
    }
  };

  const removeVehicle = (index) => {
    const updated = selectedVehicles.filter((_, i) => i !== index);
    setSelectedVehicles(updated);
    updateComparisonData(updated, allPrices);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return '#2ed573';
      case 'decreasing': return '#ff3838';
      default: return '#ffc107';
    }
  };

  const getChartColor = (index) => {
    const colors = ['#ff3300', '#2ed573', '#3498db', '#ffc107', '#e056fd'];
    return colors[index % colors.length];
  };

  const formatPrice = (price) => {
    return `P${Math.round(price).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mo-container">
      <div className="mo-wrapper">
        {/* Header */}
        <div className="mo-header">
          <div className="mo-header-content">
            <h1 className="mo-title">Market Overview</h1>
            <p className="mo-subtitle">Real-time market valuations and price trends</p>
          </div>
          <div className="mo-view-toggle">
            <button
              className={`mo-toggle-btn ${viewMode === 'overview' ? 'mo-active' : ''}`}
              onClick={() => setViewMode('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`mo-toggle-btn ${viewMode === 'compare' ? 'mo-active' : ''}`}
              onClick={() => setViewMode('compare')}
            >
              🔄 Compare
            </button>
          </div>
        </div>

        {loading && (
          <div className="mo-loading">
            <div className="mo-spinner"></div>
            <p>Loading market data...</p>
          </div>
        )}

        {!loading && viewMode === 'overview' && (
          <>
            {/* Market Summary */}
            <div className="mo-summary-grid">
              <div className="mo-summary-card">
                <div className="mo-summary-icon">🚗</div>
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Vehicles Tracked</div>
                  <div className="mo-summary-value">{selectedVehicles.length}</div>
                </div>
              </div>
              <div className="mo-summary-card">
                <div className="mo-summary-icon">💰</div>
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Avg Market Value</div>
                  <div className="mo-summary-value">
                    {comparisonData.length > 0 
                      ? formatPrice(comparisonData.reduce((sum, v) => sum + v.avgPrice, 0) / comparisonData.length)
                      : 'P0'}
                  </div>
                </div>
              </div>
              <div className="mo-summary-card">
                <div className="mo-summary-icon">📈</div>
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Trending Up</div>
                  <div className="mo-summary-value" style={{ color: '#2ed573' }}>
                    {comparisonData.filter(v => v.trend === 'increasing').length}
                  </div>
                </div>
              </div>
              <div className="mo-summary-card">
                <div className="mo-summary-icon">📉</div>
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Trending Down</div>
                  <div className="mo-summary-value" style={{ color: '#ff3838' }}>
                    {comparisonData.filter(v => v.trend === 'decreasing').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Vehicle Trend Chart */}
            <div className="mo-chart-section">
              <div className="mo-section-header">
                <h2 className="mo-section-title">Price Trends Comparison</h2>
                <p className="mo-section-desc">Comparing {comparisonData.length} vehicle(s)</p>
              </div>

              <div className="mo-chart-wrapper">
                <div className="mo-chart-canvas">
                  {comparisonData.length > 0 ? (
                    <div className="mo-line-chart">
                      {/* Y-axis labels */}
                      <div className="mo-chart-y-axis">
                        {[100, 75, 50, 25, 0].map(percent => {
                          const maxPrice = Math.max(...comparisonData.flatMap(v => v.pricePoints.map(p => p.price)));
                          const price = (maxPrice * percent) / 100;
                          return (
                            <div key={percent} className="mo-y-label">
                              {formatPrice(price)}
                            </div>
                          );
                        })}
                      </div>

                      {/* Chart area */}
                      <div className="mo-chart-area">
                        <svg className="mo-chart-svg" viewBox="0 0 800 300" preserveAspectRatio="none">
                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100].map(percent => (
                            <line
                              key={percent}
                              x1="0"
                              y1={300 - (percent * 3)}
                              x2="800"
                              y2={300 - (percent * 3)}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Plot lines for each vehicle */}
                          {comparisonData.map((vehicle, vIndex) => {
                            const points = vehicle.pricePoints;
                            if (points.length < 2) return null;

                            const maxPrice = Math.max(...comparisonData.flatMap(v => v.pricePoints.map(p => p.price)));
                            const minPrice = Math.min(...comparisonData.flatMap(v => v.pricePoints.map(p => p.price)));
                            const priceRange = maxPrice - minPrice;

                            const pathData = points.map((point, index) => {
                              const x = (index / (points.length - 1)) * 800;
                              const normalizedPrice = priceRange > 0 
                                ? ((point.price - minPrice) / priceRange) * 280 + 10
                                : 150;
                              const y = 300 - normalizedPrice;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ');

                            return (
                              <g key={vIndex}>
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke={getChartColor(vIndex)}
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* Data points */}
                                {points.map((point, pIndex) => {
                                  const x = (pIndex / (points.length - 1)) * 800;
                                  const normalizedPrice = priceRange > 0 
                                    ? ((point.price - minPrice) / priceRange) * 280 + 10
                                    : 150;
                                  const y = 300 - normalizedPrice;
                                  return (
                                    <circle
                                      key={pIndex}
                                      cx={x}
                                      cy={y}
                                      r="4"
                                      fill={getChartColor(vIndex)}
                                      className="mo-chart-point"
                                    >
                                      <title>{`${vehicle.vehicle}: ${formatPrice(point.price)} on ${formatDate(point.date)}`}</title>
                                    </circle>
                                  );
                                })}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="mo-chart-empty">
                      <div className="mo-empty-icon">📊</div>
                      <p>No vehicles selected for comparison</p>
                    </div>
                  )}
                </div>

                {/* Chart Legend */}
                <div className="mo-chart-legend">
                  {comparisonData.map((vehicle, index) => (
                    <div key={index} className="mo-legend-item">
                      <div 
                        className="mo-legend-color" 
                        style={{ backgroundColor: getChartColor(index) }}
                      ></div>
                      <span className="mo-legend-label">{vehicle.vehicle}</span>
                      <span className="mo-legend-trend" style={{ color: getTrendColor(vehicle.trend) }}>
                        {getTrendIcon(vehicle.trend)}
                      </span>
                      <button
                        className="mo-legend-remove"
                        onClick={() => removeVehicle(index)}
                        title="Remove from comparison"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Cards */}
            <div className="mo-vehicles-grid">
              {comparisonData.map((vehicle, index) => (
                <div key={index} className="mo-vehicle-card">
                  <div className="mo-vehicle-header">
                    <h3 className="mo-vehicle-name">{vehicle.vehicle}</h3>
                    <span 
                      className="mo-vehicle-trend"
                      style={{ color: getTrendColor(vehicle.trend) }}
                    >
                      {getTrendIcon(vehicle.trend)} {vehicle.trend}
                    </span>
                  </div>
                  <div className="mo-vehicle-stats">
                    <div className="mo-stat-item">
                      <span className="mo-stat-label">Avg Price</span>
                      <span className="mo-stat-value">{formatPrice(vehicle.avgPrice)}</span>
                    </div>
                    <div className="mo-stat-item">
                      <span className="mo-stat-label">Range</span>
                      <span className="mo-stat-value">
                        {formatPrice(vehicle.minPrice)} - {formatPrice(vehicle.maxPrice)}
                      </span>
                    </div>
                    <div className="mo-stat-item">
                      <span className="mo-stat-label">Data Points</span>
                      <span className="mo-stat-value">{vehicle.dataPoints}</span>
                    </div>
                  </div>
                  <div 
                    className="mo-vehicle-color-bar"
                    style={{ backgroundColor: getChartColor(index) }}
                  ></div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && viewMode === 'compare' && (
          <div className="mo-compare-section">
            <div className="mo-search-panel">
              <h2 className="mo-section-title">Add Vehicle to Compare</h2>
              <div className="mo-filters-grid">
                <div className="mo-filter-group">
                  <label className="mo-filter-label">Make *</label>
                  <select
                    value={searchFilters.make}
                    onChange={(e) => setSearchFilters({ ...searchFilters, make: e.target.value, model: '' })}
                    className="mo-filter-select"
                  >
                    <option value="">Select Make</option>
                    {filterOptions.makes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div className="mo-filter-group">
                  <label className="mo-filter-label">Model *</label>
                  <select
                    value={searchFilters.model}
                    onChange={(e) => setSearchFilters({ ...searchFilters, model: e.target.value })}
                    className="mo-filter-select"
                    disabled={!searchFilters.make}
                  >
                    <option value="">Select Model</option>
                    {filterOptions.models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div className="mo-filter-group">
                  <label className="mo-filter-label">Year</label>
                  <select
                    value={searchFilters.year}
                    onChange={(e) => setSearchFilters({ ...searchFilters, year: e.target.value })}
                    className="mo-filter-select"
                  >
                    <option value="">All Years</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="mo-filter-group">
                  <label className="mo-filter-label">Condition</label>
                  <select
                    value={searchFilters.condition}
                    onChange={(e) => setSearchFilters({ ...searchFilters, condition: e.target.value })}
                    className="mo-filter-select"
                  >
                    {filterOptions.conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="mo-btn-search"
                onClick={handleSearch}
                disabled={!searchFilters.make || !searchFilters.model}
              >
                + Add to Comparison ({selectedVehicles.length}/5)
              </button>
            </div>

            {/* Selected Vehicles for Comparison */}
            {selectedVehicles.length > 0 && (
              <div className="mo-selected-vehicles">
                <h3 className="mo-section-title">Currently Comparing</h3>
                <div className="mo-selected-list">
                  {selectedVehicles.map((vehicle, index) => (
                    <div key={index} className="mo-selected-item">
                      <div 
                        className="mo-selected-color"
                        style={{ backgroundColor: getChartColor(index) }}
                      ></div>
                      <span className="mo-selected-name">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </span>
                      <button
                        className="mo-selected-remove"
                        onClick={() => removeVehicle(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
