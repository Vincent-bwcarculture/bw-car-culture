// client/src/components/features/MarketOverview/MarketOverview.js
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './MarketOverview.css';
import { buildHelmet } from '../../../hooks/useSEO.js';

const API_BASE = 'https://bw-car-culture-api.vercel.app/api';

const formatPrice = (price) => `P${Math.round(price || 0).toLocaleString()}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

const CHART_COLORS = ['#ff3300', '#2ed573', '#3498db', '#ffc107'];
const getChartColor = (i) => CHART_COLORS[i % CHART_COLORS.length];

const getTrend = (prices) => {
  if (prices.length < 2) return 'stable';
  const recent = prices.slice(-3);
  const older = prices.slice(0, -3);
  if (!older.length) return 'stable';
  const rAvg = recent.reduce((s, p) => s + p, 0) / recent.length;
  const oAvg = older.reduce((s, p) => s + p, 0) / older.length;
  const pct = ((rAvg - oAvg) / oAvg) * 100;
  if (pct > 5) return 'increasing';
  if (pct < -5) return 'decreasing';
  return 'stable';
};

const TrendBadge = ({ trend }) => {
  const map = { increasing: { icon: '↗', label: 'Rising', cls: 'mo-trend--up' }, decreasing: { icon: '↘', label: 'Falling', cls: 'mo-trend--down' }, stable: { icon: '→', label: 'Stable', cls: 'mo-trend--stable' } };
  const t = map[trend] || map.stable;
  return <span className={`mo-trend-badge ${t.cls}`}>{t.icon} {t.label}</span>;
};

const MarketOverview = () => {
  const [allPrices, setAllPrices] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ makes: [], years: [], conditions: ['all', 'new', 'used', 'certified'], countries: [] });
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [relatedListings, setRelatedListings] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const [searchFilters, setSearchFilters] = useState({ make: '', model: '', year: '', condition: 'all', country: '' });
  const [searchError, setSearchError] = useState('');

  const [valueQuery, setValueQuery] = useState({ make: '', model: '', year: '', condition: 'all' });
  const [valueResult, setValueResult] = useState(null);
  const [valueError, setValueError] = useState('');

  // Derived: models for whichever make is selected
  const modelsForSearchMake = useMemo(() => {
    if (!searchFilters.make || !allPrices.length) return [];
    const set = new Set(allPrices.filter(p => p.make === searchFilters.make).map(p => p.model));
    return [...set].sort();
  }, [searchFilters.make, allPrices]);

  const modelsForValueMake = useMemo(() => {
    if (!valueQuery.make || !allPrices.length) return [];
    const set = new Set(allPrices.filter(p => p.make === valueQuery.make).map(p => p.model));
    return [...set].sort();
  }, [valueQuery.make, allPrices]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (selectedVehicles.length > 0) {
      fetchRelatedListings();
      fetchRelatedArticles();
    } else {
      setRelatedListings([]);
      setRelatedArticles([]);
    }
  }, [selectedVehicles]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [filtersRes, pricesRes] = await Promise.all([
        fetch(`${API_BASE}/market-prices/filters`),
        fetch(`${API_BASE}/market-prices?limit=100`)
      ]);
      const [filtersData, pricesData] = await Promise.all([filtersRes.json(), pricesRes.json()]);

      if (filtersData.success) {
        setFilterOptions({
          ...filtersData.data,
          conditions: ['all', ...(filtersData.data.conditions || [])],
          countries: filtersData.data.countries || []
        });
      }
      if (pricesData.success) {
        setAllPrices(pricesData.data);
        const auto = autoSelect(pricesData.data, 4);
        setSelectedVehicles(auto);
        setComparisonData(buildComparison(auto));
      }
    } catch (e) {
      console.error('Market overview fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const autoSelect = (prices, n) => {
    const groups = {};
    prices.forEach(p => {
      const k = `${p.make}-${p.model}-${p.year}`;
      if (!groups[k]) groups[k] = { make: p.make, model: p.model, year: p.year, prices: [] };
      groups[k].prices.push(p);
    });
    const arr = Object.values(groups);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
  };

  const buildComparison = (vehicles) =>
    (vehicles || []).map(v => {
      const pts = v.prices;
      if (!pts?.length) return null;
      const sorted = [...pts].sort((a, b) => new Date(a.recordedDate) - new Date(b.recordedDate));
      const vals = sorted.map(p => p.price);
      const avg = Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
      const byCountry = {};
      pts.forEach(p => {
        const c = p.country || 'Botswana';
        if (!byCountry[c]) byCountry[c] = [];
        byCountry[c].push(p.price);
      });
      return {
        make: v.make, model: v.model, year: v.year,
        pricePoints: pts.map(p => ({ date: new Date(p.recordedDate), price: p.price })),
        avgPrice: avg,
        minPrice: Math.min(...vals),
        maxPrice: Math.max(...vals),
        trend: getTrend(vals),
        dataPoints: vals.length,
        countryBreakdown: Object.entries(byCountry)
          .map(([c, cp]) => ({ country: c, avg: Math.round(cp.reduce((s, x) => s + x, 0) / cp.length), count: cp.length }))
          .sort((a, b) => a.avg - b.avg)
      };
    }).filter(Boolean);

  const fetchRelatedListings = async () => {
    setLoadingListings(true);
    try {
      const results = await Promise.all(
        selectedVehicles.slice(0, 3).map(v =>
          fetch(`${API_BASE}/listings?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&limit=3`)
            .then(r => r.json())
            .then(d => d.success ? d.data : [])
            .catch(() => [])
        )
      );
      const all = results.flat();
      const unique = Array.from(new Map(all.map(l => [l._id, l])).values()).slice(0, 9);
      setRelatedListings(unique);
    } catch (e) {
      setRelatedListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchRelatedArticles = async () => {
    setLoadingArticles(true);
    try {
      const results = await Promise.all(
        selectedVehicles.slice(0, 2).map(v =>
          fetch(`${API_BASE}/news?search=${encodeURIComponent(`${v.make} ${v.model}`)}&limit=3`)
            .then(r => r.json())
            .then(d => d.success ? d.data : [])
            .catch(() => [])
        )
      );
      const all = results.flat();
      setRelatedArticles(Array.from(new Map(all.map(a => [a._id, a])).values()).slice(0, 6));
    } catch (e) {
      setRelatedArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleSearch = () => {
    setSearchError('');
    if (!searchFilters.make || !searchFilters.model) { setSearchError('Select a make and model first.'); return; }
    if (selectedVehicles.length >= 4) { setSearchError('Maximum 4 vehicles on chart. Remove one first.'); return; }

    const filtered = allPrices.filter(p =>
      p.make.toLowerCase() === searchFilters.make.toLowerCase() &&
      p.model.toLowerCase() === searchFilters.model.toLowerCase() &&
      (!searchFilters.year || p.year === parseInt(searchFilters.year)) &&
      (searchFilters.condition === 'all' || p.condition === searchFilters.condition) &&
      (!searchFilters.country || (p.country || '').toLowerCase().includes(searchFilters.country.toLowerCase()))
    );

    if (!filtered.length) { setSearchError('No data found for that vehicle.'); return; }

    const vehicle = { make: searchFilters.make, model: searchFilters.model, year: searchFilters.year || filtered[0].year, prices: filtered };
    const exists = selectedVehicles.some(v => v.make === vehicle.make && v.model === vehicle.model && v.year === vehicle.year);
    if (exists) { setSearchError('That vehicle is already on the chart.'); return; }

    const updated = [...selectedVehicles, vehicle];
    setSelectedVehicles(updated);
    setComparisonData(buildComparison(updated));
    setSearchFilters({ make: '', model: '', year: '', condition: 'all', country: '' });
  };

  const handleValueCheck = () => {
    setValueError('');
    setValueResult(null);
    if (!valueQuery.make || !valueQuery.model) { setValueError('Select a make and model.'); return; }

    const filtered = allPrices.filter(p =>
      p.make.toLowerCase() === valueQuery.make.toLowerCase() &&
      p.model.toLowerCase() === valueQuery.model.toLowerCase() &&
      (!valueQuery.year || p.year === parseInt(valueQuery.year)) &&
      (valueQuery.condition === 'all' || p.condition === valueQuery.condition)
    );

    if (!filtered.length) { setValueError('No data found. Try removing the year or condition filter.'); return; }

    const vals = filtered.map(p => p.price);
    const avg = Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
    const marketVals = allPrices.map(p => p.price);
    const marketAvg = Math.round(marketVals.reduce((s, x) => s + x, 0) / marketVals.length);
    const vsMarketPct = Math.round(((avg - marketAvg) / marketAvg) * 100);

    setValueResult({
      make: valueQuery.make, model: valueQuery.model, year: valueQuery.year, condition: valueQuery.condition,
      avg, min: Math.min(...vals), max: Math.max(...vals),
      dataPoints: filtered.length, marketAvg, vsMarketPct
    });
  };

  const removeVehicle = (i) => {
    const updated = selectedVehicles.filter((_, idx) => idx !== i);
    setSelectedVehicles(updated);
    setComparisonData(buildComparison(updated));
  };

  // Chart render
  const renderChart = () => {
    if (!comparisonData.length) {
      return (
        <div className="mo-chart-empty">
          <div className="mo-chart-empty-icon">📊</div>
          <p>No market data available yet</p>
          <span>Add vehicles using the panel on the right</span>
        </div>
      );
    }

    const allPts = comparisonData.flatMap(v => v.pricePoints);
    const allVals = allPts.map(p => p.price);
    const minV = Math.min(...allVals), maxV = Math.max(...allVals);
    const pad = (maxV - minV || 1) * 0.15;
    const yMin = Math.max(0, minV - pad), yMax = maxV + pad;

    const timestamps = allPts.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
    const minDate = timestamps.length ? Math.min(...timestamps) : Date.now() - 180 * 86400000;
    const maxDate = timestamps.length ? Math.max(...timestamps) : Date.now();
    const dateRange = maxDate - minDate || 1;

    const yLabels = Array.from({ length: 5 }, (_, i) => Math.round(yMax - ((yMax - yMin) / 4) * i));
    const xCount = 5;
    const xDates = Array.from({ length: xCount }, (_, i) => new Date(minDate + (dateRange / (xCount - 1)) * i));

    const toX = (d) => { const t = new Date(d).getTime(); return isNaN(t) ? 500 : ((t - minDate) / dateRange) * 940; };
    const toY = (p) => 260 - ((p - yMin) / (yMax - yMin)) * 260;
    const toYPct = (p) => 100 - ((p - yMin) / (yMax - yMin)) * 100;

    const rawLabels = comparisonData.map((v, vi) => {
      const sorted = [...v.pricePoints].filter(p => !isNaN(new Date(p.date).getTime())).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (!sorted.length) return null;
      return { vi, yPct: toYPct(sorted[sorted.length - 1].price), label: `${v.make} ${v.model}` };
    }).filter(Boolean).sort((a, b) => a.yPct - b.yPct);

    for (let i = 1; i < rawLabels.length; i++) {
      if (rawLabels[i].yPct - rawLabels[i - 1].yPct < 10) rawLabels[i].yPct = rawLabels[i - 1].yPct + 10;
    }
    rawLabels.forEach(l => { l.yPct = Math.max(3, Math.min(92, l.yPct)); });

    return (
      <div className="mo-line-chart">
        <div className="mo-chart-y-axis">
          {yLabels.map((v, i) => <div key={i} className="mo-y-label">{formatPrice(v)}</div>)}
        </div>
        <div className="mo-chart-area">
          <div className="mo-chart-plot">
            <div className="mo-chart-svg-wrapper">
              <svg className="mo-chart-svg" viewBox="0 0 940 260" preserveAspectRatio="none">
                {yLabels.map((_, i) => (
                  <line key={i} x1="0" y1={(i / 4) * 260} x2="940" y2={(i / 4) * 260} stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                ))}
                {xDates.map((_, i) => (
                  <line key={i} x1={(i / (xCount - 1)) * 940} y1="0" x2={(i / (xCount - 1)) * 940} y2="260" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                ))}
                {comparisonData.map((v, vi) => {
                  const sorted = [...v.pricePoints].filter(p => !isNaN(new Date(p.date).getTime())).sort((a, b) => new Date(a.date) - new Date(b.date));
                  if (!sorted.length) return null;
                  const color = getChartColor(vi);
                  const pts = sorted.map(p => ({ x: toX(p.date), y: toY(p.price), price: p.price }));
                  const pathD = pts.map((p, pi) => `${pi === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                  return (
                    <g key={vi}>
                      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((pt, pi) => (
                        <circle key={pi} cx={pt.x} cy={pt.y} r="4.5" fill={color} stroke="var(--mo-bg)" strokeWidth="1.5">
                          <title>{`${v.make} ${v.model}: ${formatPrice(pt.price)}`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mo-chart-end-labels">
              {rawLabels.map(l => (
                <div key={l.vi} className="mo-chart-end-label" style={{ top: `${l.yPct}%`, color: getChartColor(l.vi) }}>
                  <span className="mo-chart-end-label-tick" />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div className="mo-x-axis">
            {xDates.map((d, i) => <div key={i} className="mo-x-label">{formatDate(d)}</div>)}
          </div>
        </div>
      </div>
    );
  };

  const marketStats = useMemo(() => {
    if (!comparisonData.length) return null;
    const avg = Math.round(comparisonData.reduce((s, v) => s + v.avgPrice, 0) / comparisonData.length);
    return {
      tracked: comparisonData.length,
      avg,
      rising: comparisonData.filter(v => v.trend === 'increasing').length,
      falling: comparisonData.filter(v => v.trend === 'decreasing').length
    };
  }, [comparisonData]);

  return (
    <div className="mo-container">
      {buildHelmet({
        title: 'Botswana Car Market Overview — Price Trends & Valuations',
        description: 'Explore real-time car price trends, market valuations, and vehicle comparisons for the Botswana automotive market.',
        url: 'https://www.i3wcarculture.com/market-overview',
      })}

      {/* ─── HERO HEADER ─── */}
      <div className="mo-hero">
        <div className="mo-wrapper">
          <h1 className="mo-hero-title">Market Overview</h1>
          <p className="mo-hero-sub">Real-time price trends & valuations for the Botswana car market</p>

          {marketStats && !loading && (
            <div className="mo-stats-bar">
              <div className="mo-stat-pill">
                <span className="mo-stat-pill-val">{marketStats.tracked}</span>
                <span className="mo-stat-pill-lbl">Tracked</span>
              </div>
              <div className="mo-stat-pill">
                <span className="mo-stat-pill-val">{formatPrice(marketStats.avg)}</span>
                <span className="mo-stat-pill-lbl">Avg Value</span>
              </div>
              <div className="mo-stat-pill mo-stat-pill--up">
                <span className="mo-stat-pill-val">↗ {marketStats.rising}</span>
                <span className="mo-stat-pill-lbl">Rising</span>
              </div>
              <div className="mo-stat-pill mo-stat-pill--down">
                <span className="mo-stat-pill-val">↘ {marketStats.falling}</span>
                <span className="mo-stat-pill-lbl">Falling</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mo-wrapper">
        {loading ? (
          <div className="mo-loading">
            <div className="mo-spinner" />
            <p>Loading market data…</p>
          </div>
        ) : (
          <>
            {/* ─── TWO-COLUMN MAIN LAYOUT ─── */}
            <div className="mo-main-grid">

              {/* LEFT: Chart + Vehicle Cards */}
              <div className="mo-left-col">

                {/* Chart */}
                <div className="mo-card mo-chart-card">
                  <div className="mo-card-header">
                    <div>
                      <h2 className="mo-card-title">Price Trends</h2>
                      <p className="mo-card-sub">{comparisonData.length} vehicle{comparisonData.length !== 1 ? 's' : ''} · values over time</p>
                    </div>
                  </div>
                  <div className="mo-chart-wrapper">
                    {renderChart()}
                  </div>
                </div>

                {/* Vehicle Value Cards */}
                {comparisonData.length > 0 && (
                  <div className="mo-vehicle-cards-grid">
                    {comparisonData.map((v, i) => (
                      <div key={i} className="mo-vehicle-card" style={{ '--vc-color': getChartColor(i) }}>
                        <div className="mo-vehicle-card-top">
                          <div className="mo-vehicle-card-dot" />
                          <div>
                            <div className="mo-vehicle-card-name">{v.make} {v.model}</div>
                            {v.year && <div className="mo-vehicle-card-year">{v.year}</div>}
                          </div>
                          <TrendBadge trend={v.trend} />
                        </div>

                        <div className="mo-vehicle-card-price">{formatPrice(v.avgPrice)}</div>
                        <div className="mo-vehicle-card-label">Average Market Value</div>

                        <div className="mo-vehicle-card-range">
                          <span className="mo-vcr-item"><span className="mo-vcr-lbl">Min</span><span className="mo-vcr-val">{formatPrice(v.minPrice)}</span></span>
                          <div className="mo-vcr-bar">
                            <div className="mo-vcr-fill" style={{ left: '0%', right: `${100 - Math.round(((v.avgPrice - v.minPrice) / (v.maxPrice - v.minPrice || 1)) * 100)}%` }} />
                            <div className="mo-vcr-thumb" style={{ left: `${Math.round(((v.avgPrice - v.minPrice) / (v.maxPrice - v.minPrice || 1)) * 100)}%` }} />
                          </div>
                          <span className="mo-vcr-item mo-vcr-right"><span className="mo-vcr-lbl">Max</span><span className="mo-vcr-val">{formatPrice(v.maxPrice)}</span></span>
                        </div>

                        <div className="mo-vehicle-card-footer">
                          <span>{v.dataPoints} data point{v.dataPoints !== 1 ? 's' : ''}</span>
                          <button className="mo-vcf-remove" onClick={() => removeVehicle(i)}>Remove</button>
                        </div>

                        {v.countryBreakdown?.length > 1 && (
                          <div className="mo-country-breakdown">
                            {v.countryBreakdown.map(cb => (
                              <div key={cb.country} className="mo-country-row">
                                <span className="mo-country-name">{cb.country}</span>
                                <span className="mo-country-price">{formatPrice(cb.avg)}</span>
                                <span className="mo-country-count">{cb.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Controls Panel */}
              <div className="mo-right-col">

                {/* Check Your Car's Value */}
                <div className="mo-card mo-value-card">
                  <div className="mo-card-header">
                    <h2 className="mo-card-title">Check Your Car's Value</h2>
                    <p className="mo-card-sub">See what your car is worth in today's market</p>
                  </div>

                  <div className="mo-controls-stack">
                    <div className="mo-filter-row">
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Make</label>
                        <select className="mo-filter-select" value={valueQuery.make}
                          onChange={e => setValueQuery({ ...valueQuery, make: e.target.value, model: '' })}>
                          <option value="">Select Make</option>
                          {filterOptions.makes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Model</label>
                        <select className="mo-filter-select" value={valueQuery.model} disabled={!valueQuery.make}
                          onChange={e => setValueQuery({ ...valueQuery, model: e.target.value })}>
                          <option value="">{valueQuery.make ? 'Select Model' : '— pick make first —'}</option>
                          {modelsForValueMake.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mo-filter-row">
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Year</label>
                        <select className="mo-filter-select" value={valueQuery.year}
                          onChange={e => setValueQuery({ ...valueQuery, year: e.target.value })}>
                          <option value="">Any</option>
                          {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Condition</label>
                        <select className="mo-filter-select" value={valueQuery.condition}
                          onChange={e => setValueQuery({ ...valueQuery, condition: e.target.value })}>
                          {filterOptions.conditions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    {valueError && <p className="mo-inline-error">{valueError}</p>}
                    <button className="mo-btn-primary" onClick={handleValueCheck} disabled={!valueQuery.make || !valueQuery.model}>
                      Check Value
                    </button>
                  </div>

                  {valueResult && (
                    <div className="mo-value-result">
                      <div className="mo-value-result-name">{valueResult.make} {valueResult.model}{valueResult.year ? ` ${valueResult.year}` : ''}</div>
                      <div className="mo-value-result-price">{formatPrice(valueResult.avg)}</div>
                      <div className="mo-value-result-label">Estimated Market Value</div>
                      <div className="mo-value-result-stats">
                        <div className="mo-vrs-item"><span>Min</span><strong>{formatPrice(valueResult.min)}</strong></div>
                        <div className="mo-vrs-item"><span>Max</span><strong>{formatPrice(valueResult.max)}</strong></div>
                        <div className="mo-vrs-item"><span>Listings</span><strong>{valueResult.dataPoints}</strong></div>
                        <div className="mo-vrs-item">
                          <span>vs Market</span>
                          <strong style={{ color: valueResult.vsMarketPct > 0 ? '#ef4444' : '#22c55e' }}>
                            {valueResult.vsMarketPct > 0 ? '+' : ''}{valueResult.vsMarketPct}%
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to Chart */}
                <div className="mo-card">
                  <div className="mo-card-header">
                    <h2 className="mo-card-title">Add to Chart</h2>
                    <p className="mo-card-sub">Compare up to 4 vehicles ({selectedVehicles.length}/4 selected)</p>
                  </div>

                  <div className="mo-controls-stack">
                    <div className="mo-filter-row">
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Make</label>
                        <select className="mo-filter-select" value={searchFilters.make}
                          onChange={e => setSearchFilters({ ...searchFilters, make: e.target.value, model: '' })}>
                          <option value="">Select Make</option>
                          {filterOptions.makes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Model</label>
                        <select className="mo-filter-select" value={searchFilters.model} disabled={!searchFilters.make}
                          onChange={e => setSearchFilters({ ...searchFilters, model: e.target.value })}>
                          <option value="">{searchFilters.make ? 'Select Model' : '— pick make first —'}</option>
                          {modelsForSearchMake.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mo-filter-row">
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Year</label>
                        <select className="mo-filter-select" value={searchFilters.year}
                          onChange={e => setSearchFilters({ ...searchFilters, year: e.target.value })}>
                          <option value="">Any</option>
                          {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Condition</label>
                        <select className="mo-filter-select" value={searchFilters.condition}
                          onChange={e => setSearchFilters({ ...searchFilters, condition: e.target.value })}>
                          {filterOptions.conditions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    {filterOptions.countries.length > 0 && (
                      <div className="mo-filter-group">
                        <label className="mo-filter-label">Country</label>
                        <select className="mo-filter-select" value={searchFilters.country}
                          onChange={e => setSearchFilters({ ...searchFilters, country: e.target.value })}>
                          <option value="">All Countries</option>
                          {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    {searchError && <p className="mo-inline-error">{searchError}</p>}
                    <button className="mo-btn-secondary" onClick={handleSearch}
                      disabled={!searchFilters.make || !searchFilters.model || selectedVehicles.length >= 4}>
                      + Add to Chart
                    </button>
                  </div>

                  {/* Vehicles on Chart */}
                  {selectedVehicles.length > 0 && (
                    <div className="mo-chart-legend">
                      <div className="mo-chart-legend-title">On Chart</div>
                      {selectedVehicles.map((v, i) => (
                        <div key={i} className="mo-legend-item">
                          <span className="mo-legend-dot" style={{ background: getChartColor(i) }} />
                          <span className="mo-legend-name">{v.make} {v.model} {v.year}</span>
                          <button className="mo-legend-remove" onClick={() => removeVehicle(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ─── LISTINGS SECTION ─── */}
            {selectedVehicles.length > 0 && (
              <div className="mo-section">
                <div className="mo-section-hd">
                  <h2 className="mo-section-title">Available Listings</h2>
                  <p className="mo-section-sub">Vehicles currently for sale matching your selection</p>
                  <Link to="/marketplace" className="mo-section-link">View all →</Link>
                </div>

                {loadingListings ? (
                  <div className="mo-loading-inline"><div className="mo-spinner-small" /><p>Loading listings…</p></div>
                ) : relatedListings.length > 0 ? (
                  <div className="mo-listings-grid">
                    {relatedListings.map(l => (
                      <Link key={l._id} to={`/listing/${l._id}`} className="mo-listing-card">
                        <div className="mo-listing-img">
                          {l.images?.length > 0
                            ? <img src={l.images.find(i => i.isPrimary)?.url || l.images[0]?.url || l.images[0]} alt={l.title} onError={e => { e.target.src = '/placeholder-car.jpg'; }} />
                            : <div className="mo-listing-no-img">No Image</div>}
                          {l.condition && <span className="mo-listing-badge">{l.condition}</span>}
                        </div>
                        <div className="mo-listing-body">
                          <div className="mo-listing-title">{l.title}</div>
                          <div className="mo-listing-specs">{[l.specifications?.year, l.specifications?.mileage && `${Number(l.specifications.mileage).toLocaleString()} km`].filter(Boolean).join(' · ')}</div>
                          <div className="mo-listing-price">{formatPrice(l.price || l.pricing?.price)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mo-empty-state"><p>No listings found for the selected vehicles</p></div>
                )}
              </div>
            )}

            {/* ─── ARTICLES SECTION ─── */}
            {relatedArticles.length > 0 && (
              <div className="mo-section">
                <div className="mo-section-hd">
                  <h2 className="mo-section-title">Related News</h2>
                  <p className="mo-section-sub">Latest articles about your selected vehicles</p>
                  <Link to="/news" className="mo-section-link">All news →</Link>
                </div>

                {loadingArticles ? (
                  <div className="mo-loading-inline"><div className="mo-spinner-small" /><p>Loading articles…</p></div>
                ) : (
                  <div className="mo-articles-grid">
                    {relatedArticles.map(a => (
                      <Link key={a._id} to={`/news/${a._id}`} className="mo-article-card">
                        {(a.coverImage || a.images?.length > 0) && (
                          <div className="mo-article-img">
                            <img src={a.coverImage || a.images[0]?.url || a.images[0]} alt={a.title} onError={e => { e.target.src = '/placeholder-news.jpg'; }} />
                          </div>
                        )}
                        <div className="mo-article-body">
                          {a.category && <span className="mo-article-cat">{a.category}</span>}
                          <div className="mo-article-title">{a.title}</div>
                          {a.summary && <p className="mo-article-summary">{a.summary}</p>}
                          {a.publishedAt && <span className="mo-article-date">{new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mo-disclaimer">
              Market valuations are aggregated from verified listings and partner dealerships across the region. Prices are indicative and may vary based on condition, mileage, and location.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
