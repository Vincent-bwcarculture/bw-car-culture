// client/src/components/features/MarketOverview/MarketOverview.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [relatedListings, setRelatedListings] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
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

  // Fetch related listings and articles when vehicles change
  useEffect(() => {
    if (selectedVehicles.length > 0) {
      fetchRelatedListings();
      fetchRelatedArticles();
    } else {
      setRelatedListings([]);
      setRelatedArticles([]);
    }
  }, [selectedVehicles]);

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
        // Auto-select similar vehicles for initial display
        const autoSelected = autoSelectSimilarVehicles(data.data, 5);
        setSelectedVehicles(autoSelected);
        updateComparisonData(autoSelected, data.data);
      }
    } catch (error) {
      console.error('Error fetching market overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedListings = async () => {
    try {
      setLoadingListings(true);
      const listings = [];

      // Fetch listings for each selected vehicle
      for (const vehicle of selectedVehicles) {
        const params = new URLSearchParams({
          make: vehicle.make,
          model: vehicle.model,
          limit: '3' // Get 3 listings per vehicle
        });

        if (vehicle.year) {
          params.append('year', vehicle.year);
        }

        const response = await fetch(`/api/listings?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.data) {
          listings.push(...data.data);
        }
      }

      // Remove duplicates and limit to 10 total
      const uniqueListings = Array.from(
        new Map(listings.map(item => [item._id, item])).values()
      ).slice(0, 10);

      setRelatedListings(uniqueListings);
    } catch (error) {
      console.error('Error fetching related listings:', error);
      setRelatedListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      setLoadingArticles(true);
      const articles = [];

      // Fetch articles related to each selected vehicle
      for (const vehicle of selectedVehicles) {
        // Create search query with vehicle make and model
        const searchQuery = `${vehicle.make} ${vehicle.model}`;
        
        const response = await fetch(`/api/news?search=${encodeURIComponent(searchQuery)}&limit=2`);
        const data = await response.json();

        if (data.success && data.data) {
          articles.push(...data.data);
        }
      }

      // Remove duplicates and limit to 6 total
      const uniqueArticles = Array.from(
        new Map(articles.map(item => [item._id, item])).values()
      ).slice(0, 6);

      setRelatedArticles(uniqueArticles);
    } catch (error) {
      console.error('Error fetching related articles:', error);
      setRelatedArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  // Auto-select similar vehicles based on popularity and similarity
  const autoSelectSimilarVehicles = (prices, maxCount) => {
    if (!prices || prices.length === 0) return [];

    // Group by make-model-year combination
    const vehicleGroups = {};
    
    prices.forEach(price => {
      const key = `${price.make}-${price.model}-${price.year}`;
      if (!vehicleGroups[key]) {
        vehicleGroups[key] = {
          make: price.make,
          model: price.model,
          year: price.year,
          prices: []
        };
      }
      vehicleGroups[key].prices.push(price);
    });

    // Convert to array and sort by data points (more data = more popular)
    const vehicles = Object.values(vehicleGroups)
      .sort((a, b) => b.prices.length - a.prices.length)
      .slice(0, maxCount);

    return vehicles;
  };

  const updateComparisonData = (vehicles, allPricesData) => {
    if (!vehicles || vehicles.length === 0) {
      setComparisonData([]);
      return;
    }

    const comparison = vehicles.map(vehicle => {
      const vehiclePrices = vehicle.prices;
      
      if (!vehiclePrices || vehiclePrices.length === 0) {
        return null;
      }

      // Sort by date
      const sortedPrices = [...vehiclePrices].sort((a, b) => 
        new Date(a.recordedDate) - new Date(b.recordedDate)
      );

      // Calculate statistics
      const prices = sortedPrices.map(p => p.price);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Determine trend
      let trend = 'stable';
      if (prices.length >= 2) {
        const recentPrices = prices.slice(-3);
        const olderPrices = prices.slice(0, -3);
        
        if (olderPrices.length > 0) {
          const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
          const olderAvg = olderPrices.reduce((sum, p) => sum + p, 0) / olderPrices.length;
          
          const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
          
          if (changePercent > 5) trend = 'increasing';
          else if (changePercent < -5) trend = 'decreasing';
        }
      }

      return {
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
    }).filter(Boolean);

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
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      default: return '→';
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

  // Render the line chart
  const renderChart = () => {
    if (comparisonData.length === 0) {
      return (
        <div className="mo-chart-empty">
          <div className="mo-empty-icon">📊</div>
          <p>No vehicles selected for comparison</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#666' }}>
            Use the filters below to add vehicles
          </p>
        </div>
      );
    }

    // Find min and max prices across all vehicles for Y-axis
    const allPrices = comparisonData.flatMap(v => v.pricePoints.map(p => p.price));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    const yMin = Math.max(0, minPrice - padding);
    const yMax = maxPrice + padding;

    // Generate Y-axis labels
    const yLabels = [];
    const labelCount = 6;
    for (let i = 0; i < labelCount; i++) {
      const value = yMax - ((yMax - yMin) / (labelCount - 1)) * i;
      yLabels.push(Math.round(value));
    }

    return (
      <div className="mo-line-chart">
        {/* Y-Axis */}
        <div className="mo-chart-y-axis">
          {yLabels.map((label, i) => (
            <div key={i} className="mo-y-label">
              {formatPrice(label)}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="mo-chart-area">
          <svg className="mo-chart-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
            {/* Grid lines */}
            {yLabels.map((_, i) => {
              const y = (i / (yLabels.length - 1)) * 300;
              return (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Plot lines for each vehicle */}
            {comparisonData.map((vehicle, vIndex) => {
              const points = vehicle.pricePoints.map((point, pIndex) => {
                const x = (pIndex / (vehicle.pricePoints.length - 1)) * 1000;
                const y = 300 - ((point.price - yMin) / (yMax - yMin)) * 300;
                return { x, y, price: point.price };
              });

              const color = getChartColor(vIndex);

              return (
                <g key={vIndex}>
                  {/* Line */}
                  <polyline
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Points */}
                  {points.map((point, pIndex) => (
                    <circle
                      key={pIndex}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={color}
                      className="mo-chart-point"
                    >
                      <title>{`${vehicle.make} ${vehicle.model}: ${formatPrice(point.price)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
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
              Overview
            </button>
            <button
              className={`mo-toggle-btn ${viewMode === 'compare' ? 'mo-active' : ''}`}
              onClick={() => setViewMode('compare')}
            >
              Compare
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
            {/* Market Summary - NO EMOJIS */}
            <div className="mo-summary-grid">
              <div className="mo-summary-card">
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Vehicles Tracked</div>
                  <div className="mo-summary-value">{selectedVehicles.length}</div>
                </div>
              </div>
              <div className="mo-summary-card">
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
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Trending Up</div>
                  <div className="mo-summary-value" style={{ color: '#2ed573' }}>
                    {comparisonData.filter(v => v.trend === 'increasing').length}
                  </div>
                </div>
              </div>
              <div className="mo-summary-card">
                <div className="mo-summary-content">
                  <div className="mo-summary-label">Trending Down</div>
                  <div className="mo-summary-value" style={{ color: '#ff3838' }}>
                    {comparisonData.filter(v => v.trend === 'decreasing').length}
                  </div>
                </div>
              </div>
            </div>

            {/* FILTER SECTION */}
            <div className="mo-search-panel">
              <h2 className="mo-section-title">Filter Vehicles</h2>
              <p className="mo-section-desc" style={{ marginBottom: '1rem', color: '#888' }}>
                Add vehicles to comparison (up to 5)
              </p>
              
              <div className="mo-filters-grid">
                <div className="mo-filter-group">
                  <label className="mo-filter-label">Make</label>
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
                  <label className="mo-filter-label">Model</label>
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
                Add to Comparison ({selectedVehicles.length}/5)
              </button>

              {/* Selected Vehicles */}
              {selectedVehicles.length > 0 && (
                <div className="mo-selected-vehicles" style={{ marginTop: '1.5rem' }}>
                  <h3 className="mo-section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>
                    Currently Comparing
                  </h3>
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

            {/* Multi-Vehicle Trend Chart */}
            <div className="mo-chart-section">
              <div className="mo-section-header">
                <h2 className="mo-section-title">Price Trends Comparison</h2>
                <p className="mo-section-desc">Comparing {comparisonData.length} vehicle(s)</p>
              </div>

              <div className="mo-chart-wrapper">
                <div className="mo-chart-canvas">
                  {renderChart()}
                </div>

                {/* Legend */}
                {comparisonData.length > 0 && (
                  <div className="mo-chart-legend">
                    {comparisonData.map((vehicle, index) => (
                      <div key={index} className="mo-legend-item">
                        <div 
                          className="mo-legend-color"
                          style={{ backgroundColor: getChartColor(index) }}
                        ></div>
                        <span className="mo-legend-label">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AVAILABLE LISTINGS SECTION */}
            {selectedVehicles.length > 0 && (
              <div className="mo-listings-section">
                <div className="mo-section-header">
                  <h2 className="mo-section-title">Available Listings</h2>
                  <p className="mo-section-desc">
                    Cars currently for sale matching your selected vehicles
                  </p>
                </div>

                {loadingListings ? (
                  <div className="mo-loading-inline">
                    <div className="mo-spinner-small"></div>
                    <p>Loading listings...</p>
                  </div>
                ) : relatedListings.length > 0 ? (
                  <div className="mo-listings-grid">
                    {relatedListings.map((listing) => (
                      <Link
                        key={listing._id}
                        to={`/listing/${listing._id}`}
                        className="mo-listing-card"
                      >
                        <div className="mo-listing-image">
                          {listing.images && listing.images.length > 0 ? (
                            <img 
                              src={listing.images[0].url || listing.images[0]} 
                              alt={listing.title}
                              onError={(e) => {
                                e.target.src = '/placeholder-car.jpg';
                              }}
                            />
                          ) : (
                            <div className="mo-listing-placeholder">No Image</div>
                          )}
                          {listing.condition && (
                            <div className="mo-listing-badge">{listing.condition}</div>
                          )}
                        </div>
                        <div className="mo-listing-content">
                          <h3 className="mo-listing-title">{listing.title}</h3>
                          <p className="mo-listing-specs">
                            {listing.specifications?.year} • {listing.specifications?.mileage} km
                          </p>
                          <div className="mo-listing-price">
                            {formatPrice(listing.price || listing.pricing?.price)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mo-empty-state">
                    <p>No listings found for the selected vehicles</p>
                  </div>
                )}
              </div>
            )}

            {/* RELATED ARTICLES SECTION */}
            {selectedVehicles.length > 0 && (
              <div className="mo-articles-section">
                <div className="mo-section-header">
                  <h2 className="mo-section-title">Related News & Articles</h2>
                  <p className="mo-section-desc">
                    Latest news about your selected vehicles
                  </p>
                </div>

                {loadingArticles ? (
                  <div className="mo-loading-inline">
                    <div className="mo-spinner-small"></div>
                    <p>Loading articles...</p>
                  </div>
                ) : relatedArticles.length > 0 ? (
                  <div className="mo-articles-grid">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article._id}
                        to={`/news/${article._id}`}
                        className="mo-article-card"
                      >
                        {article.coverImage || (article.images && article.images.length > 0) ? (
                          <div className="mo-article-image">
                            <img 
                              src={article.coverImage || article.images[0]?.url || article.images[0]} 
                              alt={article.title}
                              onError={(e) => {
                                e.target.src = '/placeholder-news.jpg';
                              }}
                            />
                          </div>
                        ) : null}
                        <div className="mo-article-content">
                          {article.category && (
                            <span className="mo-article-category">{article.category}</span>
                          )}
                          <h3 className="mo-article-title">{article.title}</h3>
                          {article.summary && (
                            <p className="mo-article-summary">{article.summary}</p>
                          )}
                          <div className="mo-article-meta">
                            {article.publishedAt && (
                              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mo-empty-state">
                    <p>No articles found for the selected vehicles</p>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Details Cards */}
            {comparisonData.length > 0 && (
              <div className="mo-vehicles-grid">
                {comparisonData.map((vehicle, index) => (
                  <div key={index} className="mo-vehicle-card">
                    <div 
                      className="mo-vehicle-color-bar"
                      style={{ backgroundColor: getChartColor(index) }}
                    ></div>
                    
                    <h3 className="mo-vehicle-name">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="mo-vehicle-year">{vehicle.year}</p>
                    
                    <div 
                      className="mo-vehicle-trend"
                      style={{ color: getTrendColor(vehicle.trend) }}
                    >
                      {getTrendIcon(vehicle.trend)} {vehicle.trend.toUpperCase()}
                    </div>

                    <div className="mo-vehicle-stats">
                      <div className="mo-stat-item">
                        <span className="mo-stat-label">Average</span>
                        <span className="mo-stat-value">{formatPrice(vehicle.avgPrice)}</span>
                      </div>
                      <div className="mo-stat-item">
                        <span className="mo-stat-label">Min Price</span>
                        <span className="mo-stat-value">{formatPrice(vehicle.minPrice)}</span>
                      </div>
                      <div className="mo-stat-item">
                        <span className="mo-stat-label">Max Price</span>
                        <span className="mo-stat-value">{formatPrice(vehicle.maxPrice)}</span>
                      </div>
                      <div className="mo-stat-item">
                        <span className="mo-stat-label">Data Points</span>
                        <span className="mo-stat-value">{vehicle.dataPoints}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && viewMode === 'compare' && (
          <div className="mo-compare-section">
            {/* Search Panel for Compare Mode */}
            <div className="mo-search-panel">
              <h2 className="mo-section-title">Add Vehicle to Compare</h2>
              <div className="mo-filters-grid">
                <div className="mo-filter-group">
                  <label className="mo-filter-label">Make</label>
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
                  <label className="mo-filter-label">Model</label>
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
