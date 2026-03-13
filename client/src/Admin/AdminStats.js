// src/Admin/AdminStats.js
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { dashboardService } from '../services/dashboardService.js';
import { dealerService } from '../services/dealerService.js';
import { newsService } from '../services/newsService.js';
import './AdminStats.css';

const EMPTY = { viewsData: [], popularReviews: [], topDealers: [], recentActivity: [] };

const AdminStats = () => {
  const [dateRange, setDateRange]   = useState('week');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);   // null | 'network' | 'server'
  const [statsData, setStatsData]   = useState(EMPTY);
  const intervalRef = useRef(null);

  const fetchStatsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ── 1. Try the dashboard analytics endpoint first ──────────────────
      let data = null;
      try {
        data = await dashboardService.getAnalytics(dateRange);
      } catch (err) {
        // Not fatal — fall through to individual service fetches
      }

      if (data?.viewsData?.length) {
        setStatsData(data);
        return;
      }

      // ── 2. Aggregate from individual services ─────────────────────────
      const result = { ...EMPTY };

      // Popular articles
      try {
        const res = await newsService.getArticles({ sort: 'views', limit: 3 });
        result.popularReviews = (res.articles || []).map(a => ({
          title:    a.title,
          views:    a.metadata?.views  ?? a.views    ?? 0,
          likes:    a.metadata?.likes  ?? a.likes    ?? 0,
          comments: a.comments?.length ?? 0
        }));
      } catch (_) { /* leave empty */ }

      // Top dealers
      try {
        const res = await dealerService.getDealers({ sort: 'metrics.totalListings' }, 1);
        result.topDealers = (res.dealers || []).map(d => ({
          name:     d.businessName || d.name || 'Unknown',
          listings: d.metrics?.totalListings ?? 0,
          sales:    d.metrics?.activeSales   ?? 0,
          rating:   d.rating?.average        ?? '—'
        }));
      } catch (_) { /* leave empty */ }

      setStatsData(result);
    } catch (err) {
      const isNetwork = !navigator.onLine || err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network');
      setError(isNetwork ? 'network' : 'server');
      setStatsData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStatsData();
    intervalRef.current = setInterval(fetchStatsData, 300_000); // refresh every 5 min
    return () => clearInterval(intervalRef.current);
  }, [fetchStatsData]);

  // ── Empty / error state helpers ────────────────────────────────────────
  const ErrorBanner = () => (
    <div className="stats-error-banner">
      {error === 'network'
        ? 'Unable to load data. Check your internet connection.'
        : 'Could not reach the server. Please try again later.'}
      <button onClick={fetchStatsData}>Retry</button>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="no-data-message"><p>{message}</p></div>
  );

  return (
    <div className="admin-stats">
      {loading && (
        <div className="loading-overlay">
          <div className="loader"></div>
        </div>
      )}

      <div className="stats-header">
        <h2>Analytics Overview</h2>
        <div className="date-range-selector">
          {['week', 'month', 'year'].map(r => (
            <button
              key={r}
              className={dateRange === r ? 'active' : ''}
              onClick={() => setDateRange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner />}

      <div className="stats-grid">
        {/* ── Page Views Chart ── */}
        <div className="stats-card chart">
          <h3>Page Views</h3>
          {statsData.viewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={statsData.viewsData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff3300" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff3300" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={date =>
                    new Date(date).toLocaleDateString('en-US',
                      dateRange === 'year'
                        ? { month: 'short' }
                        : { month: 'short', day: 'numeric' }
                    )
                  }
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="custom-tooltip">
                        <p className="date">
                          {new Date(label).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </p>
                        <p className="views">{payload[0].value.toLocaleString()} views</p>
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#ff3300"
                  fillOpacity={1}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={error ? 'Data unavailable.' : 'No view data yet for this period.'} />
          )}
        </div>

        {/* ── Popular Reviews ── */}
        <div className="stats-card">
          <h3>Popular Reviews</h3>
          <div className="popular-reviews">
            {statsData.popularReviews.length > 0 ? (
              statsData.popularReviews.map((review, i) => (
                <div key={i} className="review-item">
                  <h4>{review.title}</h4>
                  <div className="review-stats">
                    <span>Views: {review.views.toLocaleString()}</span>
                    <span>Likes: {review.likes}</span>
                    <span>Comments: {review.comments}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message={error ? 'Data unavailable.' : 'No articles published yet.'} />
            )}
          </div>
        </div>

        {/* ── Top Dealers ── */}
        <div className="stats-card">
          <h3>Top Performing Dealers</h3>
          <div className="dealers-list">
            {statsData.topDealers.length > 0 ? (
              statsData.topDealers.map((dealer, i) => (
                <div key={i} className="dealer-item">
                  <div className="dealer-info">
                    <h4>{dealer.name}</h4>
                    <div className="dealer-stats">
                      <span>Listings: {dealer.listings}</span>
                      <span>Sales: {dealer.sales}</span>
                      <span>Rating: {dealer.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message={error ? 'Data unavailable.' : 'No dealers registered yet.'} />
            )}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="stats-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {statsData.recentActivity.length > 0 ? (
              statsData.recentActivity.map((activity, i) => (
                <div key={i} className="activity-item">
                  <span className={`activity-icon activity-icon--${activity.type}`}>
                    {activity.type === 'review'  ? '◉' :
                     activity.type === 'listing' ? '◇' :
                     activity.type === 'dealer'  ? '◎' : '◐'}
                  </span>
                  <div className="activity-details">
                    <p>{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message={error ? 'Data unavailable.' : 'No recent activity yet.'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
