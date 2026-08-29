// src/components/admin/DashboardOverview.js
import React, { useState, useEffect } from 'react';
import QuickActions from './QuickActions';
import { dashboardService } from '../services/dashboardService';
import { http } from '../config/axios.js';
import './DashboardOverview.css';

const fmt = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const Trend = ({ value }) => {
  if (!value || value === '0%') return null;
  const positive = !value.startsWith('-');
  return (
    <span className={`stat-trend ${positive ? 'positive' : 'negative'}`}>
      {positive ? '↑' : '↓'} {value.replace('-', '')}
    </span>
  );
};

const SkeletonCard = () => (
  <div className="stat-card skeleton">
    <div className="skeleton-icon" />
    <div className="skeleton-content">
      <div className="skeleton-title" />
      <div className="skeleton-value" />
      <div className="skeleton-trend" />
    </div>
  </div>
);

const DashboardOverview = () => {
  const [bizStats, setBizStats] = useState(null);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [biz, analytics] = await Promise.allSettled([
        dashboardService.getDashboardStats(),
        http.get('/api/analytics/dashboard?days=30').then(r => r.data?.data)
      ]);
      if (biz.status === 'fulfilled') setBizStats(biz.value);
      if (analytics.status === 'fulfilled') setAnalyticsStats(analytics.value);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const bizCards = bizStats ? [
    { title: 'Active Listings', value: fmt(bizStats.carListings ?? bizStats.activeListings ?? 0), icon: '🚗' },
    { title: 'Verified Dealers', value: fmt(bizStats.verifiedDealers ?? bizStats.totalDealers ?? 0), icon: '🏢' },
    { title: 'Service Providers', value: fmt(bizStats.serviceProviders ?? bizStats.totalServiceProviders ?? 0), icon: '🔧' },
    { title: 'Transport Routes', value: fmt(bizStats.transportRoutes ?? 0), icon: '🗺️' },
  ] : [];

  const trafficCards = analyticsStats ? [
    {
      title: 'Page Views',
      value: fmt(analyticsStats.overview?.pageViews?.value ?? 0),
      trend: analyticsStats.overview?.pageViews?.trend,
      icon: '👁️',
    },
    {
      title: 'Unique Visitors',
      value: fmt(analyticsStats.overview?.uniqueVisitors?.value ?? 0),
      trend: analyticsStats.overview?.uniqueVisitors?.trend,
      icon: '👥',
    },
    {
      title: 'Sessions',
      value: fmt(analyticsStats.overview?.sessions?.value ?? 0),
      trend: analyticsStats.overview?.sessions?.trend,
      icon: '📊',
    },
    {
      title: 'Avg. Session',
      value: analyticsStats.overview?.avgSessionDuration?.value ?? '—',
      icon: '⏱️',
    },
  ] : [];

  const topPages = analyticsStats?.topPages ?? [];

  if (error && !bizStats && !analyticsStats) {
    return (
      <div className="dashboard-overview">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchAll}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard Overview</h2>
        <a href="/admin/analytics" style={{ fontSize: '0.82rem', color: 'var(--accent, #ff3300)', textDecoration: 'none' }}>
          Full Analytics →
        </a>
      </div>

      {/* Traffic stats row */}
      <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted, #888)', textTransform: 'uppercase' }}>
        Traffic · Last 30 days
      </div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {loading
          ? Array(4).fill(null).map((_, i) => <SkeletonCard key={i} />)
          : trafficCards.length > 0
            ? trafficCards.map((card, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{card.icon}</div>
                  <div className="stat-content">
                    <h3>{card.title}</h3>
                    <div className="stat-value">{card.value}</div>
                    {card.trend && <Trend value={card.trend} />}
                  </div>
                </div>
              ))
            : <div style={{ color: 'var(--text-muted, #888)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No traffic data yet — tracking starts once users visit the site.</div>
        }
      </div>

      {/* Business stats row */}
      <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted, #888)', textTransform: 'uppercase' }}>
        Platform
      </div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {loading
          ? Array(4).fill(null).map((_, i) => <SkeletonCard key={i} />)
          : bizCards.length > 0
            ? bizCards.map((card, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{card.icon}</div>
                  <div className="stat-content">
                    <h3>{card.title}</h3>
                    <div className="stat-value">{card.value}</div>
                  </div>
                </div>
              ))
            : null
        }
      </div>

      {/* Top pages */}
      {!loading && topPages.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.6rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted, #888)', textTransform: 'uppercase' }}>
            Top Pages · Last 30 days
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {topPages.slice(0, 5).map((p, i) => {
              const max = topPages[0]?.views || 1;
              const pct = Math.round((p.views / max) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted, #888)', width: '1.2rem', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, background: 'var(--card-bg, #1a1a1a)', borderRadius: '4px', overflow: 'hidden', height: '22px', position: 'relative', border: '1px solid var(--border-light, rgba(255,255,255,0.06))' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'rgba(255,51,0,0.18)', transition: 'width 0.4s' }} />
                    <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-primary, #fff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                      {p.page || p._id || '/'}
                    </span>
                    <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #888)', fontSize: '0.75rem' }}>
                      {fmt(p.views)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <QuickActions />
    </div>
  );
};

export default DashboardOverview;
