// client/src/components/features/MarketOverview/MarketOverview.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MarketOverview.css';

const API_BASE = 'https://bw-car-culture-api.vercel.app/api';

const MarketOverview = () => {
  const [filterOptions, setFilterOptions] = useState({
    makes: [],
    models: [],
    years: [],
    conditions: ['all', 'new', 'used', 'certified'],
    countries: []
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
    condition: 'all',
    country: ''
  });
  const [carValueQuery, setCarValueQuery] = useState({ make: '', model: '', year: '', condition: 'all' });
  const [carValueResult, setCarValueResult] = useState(null);

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
      const response = await fetch(`${API_BASE}/market-prices/filters`);
      const data = await response.json();

      if (data.success) {
        setFilterOptions({
          ...data.data,
          conditions: ['all', ...(data.data.conditions || [])],
          countries: data.data.countries || []
        });
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchMarketOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/market-prices?limit=100`);
      const data = await response.json();

      if (data.success) {
        setAllPrices(data.data);
        // Auto-select similar vehicles for initial display
        const autoSelected = autoSelectSimilarVehicles(data.data, 4);
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

        const response = await fetch(`${API_BASE}/listings?${params.toString()}`);
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
        
        const response = await fetch(`${API_BASE}/news?search=${encodeURIComponent(searchQuery)}&limit=2`);
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

  // Auto-select vehicles randomly
  const autoSelectSimilarVehicles = (prices, maxCount) => {
    if (!prices || prices.length === 0) return [];

    // Group by make-model-year combination
    const vehicleGroups = {};
    prices.forEach(price => {
      const key = `${price.make}-${price.model}-${price.year}`;
      if (!vehicleGroups[key]) {
        vehicleGroups[key] = { make: price.make, model: price.model, year: price.year, prices: [] };
      }
      vehicleGroups[key].prices.push(price);
    });

    // Shuffle randomly
    const vehicles = Object.values(vehicleGroups);
    for (let i = vehicles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vehicles[i], vehicles[j]] = [vehicles[j], vehicles[i]];
    }
    return vehicles.slice(0, maxCount);
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

      // Group prices by country for breakdown
      const byCountry = {};
      vehiclePrices.forEach(p => {
        const c = p.country || (p.location ? p.location.split(',').pop().trim() : 'Botswana');
        if (!byCountry[c]) byCountry[c] = [];
        byCountry[c].push(p.price);
      });
      const countryBreakdown = Object.entries(byCountry).map(([c, cPrices]) => ({
        country: c,
        avg: Math.round(cPrices.reduce((s, v) => s + v, 0) / cPrices.length),
        count: cPrices.length
      })).sort((a, b) => a.avg - b.avg);

      return {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        pricePoints: vehiclePrices.map(p => ({
          date: new Date(p.recordedDate),
          price: p.price,
          condition: p.condition,
          country: p.country || '',
          location: p.location || ''
        })),
        avgPrice: Math.round(avgPrice),
        minPrice,
        maxPrice,
        trend,
        dataPoints: prices.length,
        countryBreakdown
      };
    }).filter(Boolean);

    setComparisonData(comparison);
  };

  const handleCarValueCheck = () => {
    if (!carValueQuery.make || !carValueQuery.model) {
      alert('Please select at least a make and model');
      return;
    }

    const filtered = allPrices.filter(p => {
      const makeMatch = p.make.toLowerCase() === carValueQuery.make.toLowerCase();
      const modelMatch = p.model.toLowerCase() === carValueQuery.model.toLowerCase();
      const yearMatch = !carValueQuery.year || p.year === parseInt(carValueQuery.year);
      const conditionMatch = carValueQuery.condition === 'all' || p.condition === carValueQuery.condition;
      return makeMatch && modelMatch && yearMatch && conditionMatch;
    });

    if (filtered.length === 0) {
      setCarValueResult({ notFound: true, make: carValueQuery.make, model: carValueQuery.model });
      return;
    }

    const prices = filtered.map(p => p.price);
    const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const allMarketPrices = allPrices.map(p => p.price);
    const marketAvg = Math.round(allMarketPrices.reduce((s, v) => s + v, 0) / allMarketPrices.length);
    const vsMarket = avg - marketAvg;
    const vsMarketPct = Math.round((vsMarket / marketAvg) * 100);

    setCarValueResult({
      make: carValueQuery.make,
      model: carValueQuery.model,
      year: carValueQuery.year,
      condition: carValueQuery.condition,
      avg, min, max,
      dataPoints: filtered.length,
      marketAvg,
      vsMarket,
      vsMarketPct
    });

    // Add to comparison chart if not already there
    const exists = selectedVehicles.some(v =>
      v.make === carValueQuery.make &&
      v.model === carValueQuery.model
    );
    if (!exists && selectedVehicles.length < 4) {
      const vehicle = {
        make: carValueQuery.make,
        model: carValueQuery.model,
        year: carValueQuery.year || filtered[0].year,
        prices: filtered
      };
      const updated = [...selectedVehicles, vehicle];
      setSelectedVehicles(updated);
      updateComparisonData(updated, allPrices);
    }
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
      const countryMatch = !searchFilters.country ||
        (price.country || '').toLowerCase() === searchFilters.country.toLowerCase() ||
        (price.location || '').toLowerCase().includes(searchFilters.country.toLowerCase());

      return makeMatch && modelMatch && yearMatch && conditionMatch && countryMatch;
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

    if (!exists && selectedVehicles.length < 4) {
      const updated = [...selectedVehicles, vehicle];
      setSelectedVehicles(updated);
      updateComparisonData(updated, allPrices);
    } else if (selectedVehicles.length >= 4) {
      alert('Maximum 4 vehicles can be shown at once. Remove one first.');
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
    const colors = ['#ff3300', '#2ed573', '#3498db', '#ffc107'];
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

  // Render the line chart with date X-axis and inline vehicle name labels
  const renderChart = () => {
    if (comparisonData.length === 0) {
      return (
        <div className="mo-chart-empty">
          <div className="mo-empty-icon">📊</div>
          <p>No market data available yet</p>
        </div>
      );
    }

    const allPoints = comparisonData.flatMap(v => v.pricePoints);

    // Price range
    const allPriceValues = allPoints.map(p => p.price);
    const minPriceVal = Math.min(...allPriceValues);
    const maxPriceVal = Math.max(...allPriceValues);
    const pad = (maxPriceVal - minPriceVal || 1) * 0.15;
    const yMin = Math.max(0, minPriceVal - pad);
    const yMax = maxPriceVal + pad;

    // Date range
    const timestamps = allPoints.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
    const minDate = timestamps.length > 0 ? Math.min(...timestamps) : Date.now() - 180 * 86400000;
    const maxDate = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    const dateRange = maxDate - minDate || 1;

    // Y-axis labels
    const yLabels = [];
    for (let i = 0; i < 6; i++) {
      yLabels.push(Math.round(yMax - ((yMax - yMin) / 5) * i));
    }

    // X-axis date labels (5 evenly spaced)
    const xCount = 5;
    const xDates = Array.from({ length: xCount }, (_, i) =>
      new Date(minDate + (dateRange / (xCount - 1)) * i)
    );

    const toX = (date) => {
      const t = new Date(date).getTime();
      return isNaN(t) ? 500 : ((t - minDate) / dateRange) * 1000;
    };
    const toY = (price) => 280 - ((price - yMin) / (yMax - yMin)) * 280;
    // Y position as % from top (for HTML overlay)
    const toYPct = (price) => ((price - yMin) / (yMax - yMin)) === 0
      ? 100
      : 100 - ((price - yMin) / (yMax - yMin)) * 100;

    // Build label positions with collision avoidance
    const rawLabels = comparisonData.map((vehicle, vIndex) => {
      const sorted = [...vehicle.pricePoints]
        .filter(p => !isNaN(new Date(p.date).getTime()))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (sorted.length === 0) return null;
      const lastPrice = sorted[sorted.length - 1].price;
      return { vIndex, yPct: toYPct(lastPrice), make: vehicle.make, model: vehicle.model };
    }).filter(Boolean);

    // Sort by Y and push overlapping labels apart (min 9% gap)
    const sortedLabels = [...rawLabels].sort((a, b) => a.yPct - b.yPct);
    for (let i = 1; i < sortedLabels.length; i++) {
      if (sortedLabels[i].yPct - sortedLabels[i - 1].yPct < 9) {
        sortedLabels[i].yPct = sortedLabels[i - 1].yPct + 9;
      }
    }
    sortedLabels.forEach(l => { l.yPct = Math.max(3, Math.min(93, l.yPct)); });

    return (
      <div className="mo-line-chart">
        {/* Y-Axis */}
        <div className="mo-chart-y-axis">
          {yLabels.map((label, i) => (
            <div key={i} className="mo-y-label">{formatPrice(label)}</div>
          ))}
        </div>

        {/* Chart plot + X-axis */}
        <div className="mo-chart-area">
          <div className="mo-chart-plot">
            {/* SVG wrapper */}
            <div className="mo-chart-svg-wrapper">
              <svg className="mo-chart-svg" viewBox="0 0 1000 280" preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                {yLabels.map((_, i) => (
                  <line key={i} x1="0" y1={(i / 5) * 280} x2="1000" y2={(i / 5) * 280}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {/* Vertical grid lines at date ticks */}
                {xDates.map((_, i) => (
                  <line key={i} x1={(i / (xCount - 1)) * 1000} y1="0"
                    x2={(i / (xCount - 1)) * 1000} y2="280"
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {/* Vehicle lines */}
                {comparisonData.map((vehicle, vIndex) => {
                  const sorted = [...vehicle.pricePoints]
                    .filter(p => !isNaN(new Date(p.date).getTime()))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                  if (sorted.length === 0) return null;
                  const color = getChartColor(vIndex);
                  const points = sorted.map(p => ({ x: toX(p.date), y: toY(p.price), price: p.price }));
                  return (
                    <g key={vIndex}>
                      <polyline
                        points={points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none" stroke={color} strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                      {points.map((pt, pi) => (
                        <circle key={pi} cx={pt.x} cy={pt.y} r="5" fill={color} className="mo-chart-point">
                          <title>{`${vehicle.make} ${vehicle.model}: ${formatPrice(pt.price)}`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Inline vehicle name labels — positioned at end of each line */}
            <div className="mo-chart-end-labels">
              {sortedLabels.map(label => (
                <div
                  key={label.vIndex}
                  className="mo-chart-end-label"
                  style={{ top: `${label.yPct}%`, color: getChartColor(label.vIndex) }}
                >
                  <span className="mo-chart-end-label-tick"></span>
                  {label.make} {label.model}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis date labels */}
          <div className="mo-x-axis">
            {xDates.map((date, i) => (
              <div key={i} className="mo-x-label">
                {date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
              </div>
            ))}
          </div>
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
            {/* Check Your Car Value */}
            <div className="mo-car-value-section">
              <div className="mo-car-value-header">
                <h2 className="mo-car-value-title">Check Your Car's Value</h2>
                <p className="mo-car-value-desc">Enter your vehicle details to see its estimated market value and how it compares</p>
              </div>
              <div className="mo-car-value-inputs">
                <div className="mo-filter-group">
                  <label className="mo-filter-label">Make</label>
                  <select
                    value={carValueQuery.make}
                    onChange={(e) => setCarValueQuery({ ...carValueQuery, make: e.target.value, model: '' })}
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
                    value={carValueQuery.model}
                    onChange={(e) => setCarValueQuery({ ...carValueQuery, model: e.target.value })}
                    className="mo-filter-select"
                    disabled={!carValueQuery.make}
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
                    value={carValueQuery.year}
                    onChange={(e) => setCarValueQuery({ ...carValueQuery, year: e.target.value })}
                    className="mo-filter-select"
                  >
                    <option value="">Any Year</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="mo-filter-group">
                  <label className="mo-filter-label">Condition</label>
                  <select
                    value={carValueQuery.condition}
                    onChange={(e) => setCarValueQuery({ ...carValueQuery, condition: e.target.value })}
                    className="mo-filter-select"
                  >
                    {filterOptions.conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="mo-btn-check-value"
                  onClick={handleCarValueCheck}
                  disabled={!carValueQuery.make || !carValueQuery.model}
                >
                  Check Value
                </button>
              </div>

              {carValueResult && (
                carValueResult.notFound ? (
                  <div className="mo-car-value-result mo-car-value-not-found">
                    <p>No market data found for {carValueResult.make} {carValueResult.model}. Try a different make or model.</p>
                  </div>
                ) : (
                  <div className="mo-car-value-result">
                    <div className="mo-car-value-main">
                      <div className="mo-car-value-label">Estimated Market Value</div>
                      <div className="mo-car-value-price">{formatPrice(carValueResult.avg)}</div>
                      <div className="mo-car-value-vehicle">
                        {carValueResult.make} {carValueResult.model}
                        {carValueResult.year ? ` ${carValueResult.year}` : ''}
                        {carValueResult.condition !== 'all' ? ` • ${carValueResult.condition}` : ''}
                      </div>
                    </div>
                    <div className="mo-car-value-stats">
                      <div className="mo-car-value-stat">
                        <span className="mo-car-value-stat-label">Min</span>
                        <span className="mo-car-value-stat-value">{formatPrice(carValueResult.min)}</span>
                      </div>
                      <div className="mo-car-value-stat">
                        <span className="mo-car-value-stat-label">Max</span>
                        <span className="mo-car-value-stat-value">{formatPrice(carValueResult.max)}</span>
                      </div>
                      <div className="mo-car-value-stat">
                        <span className="mo-car-value-stat-label">Listings</span>
                        <span className="mo-car-value-stat-value">{carValueResult.dataPoints}</span>
                      </div>
                      <div className="mo-car-value-stat">
                        <span className="mo-car-value-stat-label">vs Market Avg</span>
                        <span
                          className="mo-car-value-stat-value"
                          style={{ color: carValueResult.vsMarket > 0 ? '#ff3838' : '#2ed573' }}
                        >
                          {carValueResult.vsMarket > 0 ? '+' : ''}{carValueResult.vsMarketPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

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
              <h2 className="mo-section-title">Explore Car Values</h2>
              <p className="mo-section-desc" style={{ marginBottom: '1rem', color: '#888' }}>
                Search any vehicle to see its market value and add it to the chart
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

                {filterOptions.countries.length > 0 && (
                  <div className="mo-filter-group">
                    <label className="mo-filter-label">Country</label>
                    <select
                      value={searchFilters.country}
                      onChange={(e) => setSearchFilters({ ...searchFilters, country: e.target.value })}
                      className="mo-filter-select"
                    >
                      <option value="">All Countries</option>
                      {filterOptions.countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                className="mo-btn-search"
                onClick={handleSearch}
                disabled={!searchFilters.make || !searchFilters.model}
              >
                Add to Chart ({selectedVehicles.length}/4)
              </button>

              {/* Selected Vehicles */}
              {selectedVehicles.length > 0 && (
                <div className="mo-selected-vehicles" style={{ marginTop: '1.5rem' }}>
                  <h3 className="mo-section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>
                    Vehicles on Chart
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

            {/* Price Trends Chart */}
            <div className="mo-chart-section">
              <div className="mo-section-header">
                <h2 className="mo-section-title">Market Price Trends</h2>
                <p className="mo-section-desc">Showing {comparisonData.length} vehicle(s) — values over time</p>
              </div>

              <div className="mo-chart-wrapper">
                <div className="mo-chart-canvas">
                  {renderChart()}
                </div>
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
                  <div className="mo-carousel">
                    <div className="mo-carousel-track">
                    {relatedListings.map((listing) => (
                      <Link
                        key={listing._id}
                        to={`/listing/${listing._id}`}
                        className="mo-carousel-item mo-listing-card"
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
                  <div className="mo-carousel">
                    <div className="mo-carousel-track">
                      {relatedArticles.map((article) => (
                        <Link
                          key={article._id}
                          to={`/news/${article._id}`}
                          className="mo-carousel-item mo-article-card"
                        >
                          {article.coverImage || (article.images && article.images.length > 0) ? (
                            <div className="mo-article-image">
                              <img
                                src={article.coverImage || article.images[0]?.url || article.images[0]}
                                alt={article.title}
                                onError={(e) => { e.target.src = '/placeholder-news.jpg'; }}
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
                  </div>
                ) : (
                  <div className="mo-empty-state">
                    <p>No articles found for the selected vehicles</p>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Value Cards */}
            {comparisonData.length > 0 && (
              <div className="mo-carousel">
                <div className="mo-carousel-track">
                  {comparisonData.map((vehicle, index) => (
                    <div key={index} className="mo-carousel-item mo-vehicle-card">
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
                          <span className="mo-stat-label">Market Value</span>
                          <span className="mo-stat-value">{formatPrice(vehicle.avgPrice)}</span>
                        </div>
                        <div className="mo-stat-item">
                          <span className="mo-stat-label">Min</span>
                          <span className="mo-stat-value">{formatPrice(vehicle.minPrice)}</span>
                        </div>
                        <div className="mo-stat-item">
                          <span className="mo-stat-label">Max</span>
                          <span className="mo-stat-value">{formatPrice(vehicle.maxPrice)}</span>
                        </div>
                        <div className="mo-stat-item">
                          <span className="mo-stat-label">Data Points</span>
                          <span className="mo-stat-value">{vehicle.dataPoints}</span>
                        </div>
                      </div>

                      {vehicle.countryBreakdown && vehicle.countryBreakdown.length > 1 && (
                        <div className="mo-country-breakdown">
                          <div className="mo-country-breakdown-title">Price by Country</div>
                          {vehicle.countryBreakdown.map(cb => (
                            <div key={cb.country} className="mo-country-row">
                              <span className="mo-country-name">{cb.country}</span>
                              <span className="mo-country-price">{formatPrice(cb.avg)}</span>
                              <span className="mo-country-count">{cb.count} listing{cb.count !== 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Data disclaimer */}
            <div className="mo-data-note">
              Market valuations are based on real-time data aggregated from trusted partner dealerships, verified listings, and publicly available market sources across the region. Prices are indicative and may vary based on vehicle condition, mileage, and location.
            </div>
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

                {filterOptions.countries.length > 0 && (
                  <div className="mo-filter-group">
                    <label className="mo-filter-label">Country</label>
                    <select
                      value={searchFilters.country}
                      onChange={(e) => setSearchFilters({ ...searchFilters, country: e.target.value })}
                      className="mo-filter-select"
                    >
                      <option value="">All Countries</option>
                      {filterOptions.countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
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
