// src/Admin/AnalyticsDashboard/AnalyticsDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../services/analyticsService.js';
import { useAuth } from '../../context/AuthContext.js';
import MetricCard from './components/MetricCard.js';
import RealTimeWidget from './components/RealTimeWidget.js';
import TrafficChart from './components/TrafficChart.js';
import ContentPerformance from './components/ContentPerformance.js';
import DeviceBreakdown from './components/DeviceBreakdown.js';
import GeographicData from './components/GeographicData.js';
import SearchAnalytics from './components/SearchAnalytics.js';
import PerformanceMetrics from './components/PerformanceMetrics.js';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [isLive, setIsLive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataStatus, setDataStatus] = useState({
    dashboard: { loaded: false, error: null },
    realtime: { loaded: false, error: null },
    traffic: { loaded: false, error: null },
    content: { loaded: false, error: null },
    performance: { loaded: false, error: null }
  });

  // Fetch analytics data - REAL DATA ONLY
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching real analytics data for date range:', dateRange);

      // Reset data status
      setDataStatus({
        dashboard: { loaded: false, error: null },
        realtime: { loaded: false, error: null },
        traffic: { loaded: false, error: null },
        content: { loaded: false, error: null },
        performance: { loaded: false, error: null }
      });

      // Fetch all data in parallel
      const dataFetches = await Promise.allSettled([
        analyticsService.getDashboardData(dateRange),
        analyticsService.getRealTimeData(),
        analyticsService.getTrafficData(dateRange),
        analyticsService.getContentData(dateRange),
        analyticsService.getPerformanceData(7)
      ]);

      // Handle dashboard data
      if (dataFetches[0].status === 'fulfilled' && dataFetches[0].value?.success && dataFetches[0].value?.data) {
        setDashboardData(dataFetches[0].value.data);
        setDataStatus(prev => ({ ...prev, dashboard: { loaded: true, error: null } }));
      } else {
        const error = dataFetches[0].reason?.message || 'Failed to load dashboard data';
        setDataStatus(prev => ({ ...prev, dashboard: { loaded: false, error } }));
        console.error('Dashboard data failed:', error);
      }

      // Handle real-time data
      if (dataFetches[1].status === 'fulfilled' && dataFetches[1].value?.success && dataFetches[1].value?.data) {
        setRealTimeData(dataFetches[1].value.data);
        setDataStatus(prev => ({ ...prev, realtime: { loaded: true, error: null } }));
      } else {
        const error = dataFetches[1].reason?.message || 'Failed to load real-time data';
        setDataStatus(prev => ({ ...prev, realtime: { loaded: false, error } }));
        console.error('Real-time data failed:', error);
      }

      // Handle traffic data
      if (dataFetches[2].status === 'fulfilled' && dataFetches[2].value?.success && dataFetches[2].value?.data) {
        setTrafficData(dataFetches[2].value.data);
        setDataStatus(prev => ({ ...prev, traffic: { loaded: true, error: null } }));
      } else {
        const error = dataFetches[2].reason?.message || 'Failed to load traffic data';
        setDataStatus(prev => ({ ...prev, traffic: { loaded: false, error } }));
        console.error('Traffic data failed:', error);
      }

      // Handle content data
      if (dataFetches[3].status === 'fulfilled' && dataFetches[3].value?.success && dataFetches[3].value?.data) {
        setContentData(dataFetches[3].value.data);
        setDataStatus(prev => ({ ...prev, content: { loaded: true, error: null } }));
      } else {
        const error = dataFetches[3].reason?.message || 'Failed to load content data';
        setDataStatus(prev => ({ ...prev, content: { loaded: false, error } }));
        console.error('Content data failed:', error);
      }

      // Handle performance data
      if (dataFetches[4].status === 'fulfilled' && dataFetches[4].value?.success && dataFetches[4].value?.data) {
        setPerformanceData(dataFetches[4].value.data);
        setDataStatus(prev => ({ ...prev, performance: { loaded: true, error: null } }));
      } else {
        const error = dataFetches[4].reason?.message || 'Failed to load performance data';
        setDataStatus(prev => ({ ...prev, performance: { loaded: false, error } }));
        console.error('Performance data failed:', error);
      }
      
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(`Failed to load analytics data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Real-time updates
  useEffect(() => {
    if (!isLive) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      return;
    }

    const interval = setInterval(async () => {
      try {
        const realTime = await analyticsService.getRealTimeData();
        if (realTime?.success && realTime?.data) {
          setRealTimeData(realTime.data);
          setDataStatus(prev => ({ ...prev, realtime: { loaded: true, error: null } }));
          setLastUpdated(new Date());
        } else {
          setDataStatus(prev => ({ ...prev, realtime: { loaded: false, error: 'Update failed' } }));
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        setDataStatus(prev => ({ ...prev, realtime: { loaded: false, error: error.message } }));
      }
    }, 30000);

    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, [isLive]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Export data functionality
  const handleExportData = useCallback(async (format = 'csv') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/export?format=${format}&days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Format number with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Tab configuration - reduced icons
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'realtime', name: 'Real-time' },
    { id: 'traffic', name: 'Traffic' },
    { id: 'content', name: 'Content' },
    { id: 'performance', name: 'Performance' },
    { id: 'conversions', name: 'Conversions' }
  ];

  // Check if we have any data loaded
  const hasAnyData = dashboardData || realTimeData || trafficData || contentData || performanceData;
  const allDataFailed = !dataStatus.dashboard.loaded && !dataStatus.realtime.loaded && 
                       !dataStatus.traffic.loaded && !dataStatus.content.loaded && 
                       !dataStatus.performance.loaded;

  if (loading && !hasAnyData) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <div className="analytics-loader"></div>
          <p>Loading analytics data...</p>
          <div className="loading-status">
            <div className={`status-item ${dataStatus.dashboard.loaded ? 'loaded' : dataStatus.dashboard.error ? 'error' : 'loading'}`}>
              Dashboard: {dataStatus.dashboard.loaded ? 'Ready' : dataStatus.dashboard.error ? 'Failed' : 'Loading'}
            </div>
            <div className={`status-item ${dataStatus.realtime.loaded ? 'loaded' : dataStatus.realtime.error ? 'error' : 'loading'}`}>
              Real-time: {dataStatus.realtime.loaded ? 'Ready' : dataStatus.realtime.error ? 'Failed' : 'Loading'}
            </div>
            <div className={`status-item ${dataStatus.traffic.loaded ? 'loaded' : dataStatus.traffic.error ? 'error' : 'loading'}`}>
              Traffic: {dataStatus.traffic.loaded ? 'Ready' : dataStatus.traffic.error ? 'Failed' : 'Loading'}
            </div>
            <div className={`status-item ${dataStatus.content.loaded ? 'loaded' : dataStatus.content.error ? 'error' : 'loading'}`}>
              Content: {dataStatus.content.loaded ? 'Ready' : dataStatus.content.error ? 'Failed' : 'Loading'}
            </div>
            <div className={`status-item ${dataStatus.performance.loaded ? 'loaded' : dataStatus.performance.error ? 'error' : 'loading'}`}>
              Performance: {dataStatus.performance.loaded ? 'Ready' : dataStatus.performance.error ? 'Failed' : 'Loading'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-header-content">
          <div className="header-info">
            <h1>Analytics Dashboard</h1>
            <p>Welcome, {user?.name || 'Admin'}</p>
            {lastUpdated && (
              <small className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </small>
            )}
          </div>
          
          <div className="analytics-header-controls">
            <div className="date-range-selector">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="date-range-select"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`live-toggle ${isLive ? 'active' : ''}`}
            >
              {isLive ? 'LIVE' : 'Go Live'}
            </button>
            
            <div className="export-controls">
              <button 
                onClick={() => handleExportData('csv')}
                className="export-btn"
                disabled={loading || allDataFailed}
              >
                Export CSV
              </button>
              <button 
                onClick={() => handleExportData('json')}
                className="export-btn"
                disabled={loading || allDataFailed}
              >
                Export JSON
              </button>
            </div>
            
            <button 
              onClick={fetchAnalyticsData} 
              className="refresh-button" 
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="analytics-error-banner">
            {error}
          </div>
        )}

        {/* All Data Failed Message */}
        {allDataFailed && !loading && (
          <div className="analytics-no-data-banner">
            No analytics data available. Please check your analytics API connection.
            <button onClick={fetchAnalyticsData} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="analytics-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="analytics-tab-content">
            {dashboardData ? (
              <>
                {/* Key Metrics Cards */}
                <div className="metrics-grid">
                  <MetricCard
                    title="Unique Visitors"
                    value={formatNumber(dashboardData.overview?.uniqueVisitors?.value || 0)}
                    trend={dashboardData.overview?.uniqueVisitors?.trend}
                  />
                  <MetricCard
                    title="Page Views"
                    value={formatNumber(dashboardData.overview?.pageViews?.value || 0)}
                    trend={dashboardData.overview?.pageViews?.trend}
                  />
                  <MetricCard
                    title="Sessions"
                    value={formatNumber(dashboardData.overview?.sessions?.value || 0)}
                    trend={dashboardData.overview?.sessions?.trend}
                  />
                  <MetricCard
                    title="Avg. Duration"
                    value={`${Math.floor((dashboardData.overview?.avgSessionDuration?.value || 0) / 60)}m ${((dashboardData.overview?.avgSessionDuration?.value || 0) % 60)}s`}
                    trend={dashboardData.overview?.avgSessionDuration?.trend}
                  />
                  <MetricCard
                    title="Bounce Rate"
                    value={dashboardData.overview?.bounceRate?.value || '0%'}
                    trend={dashboardData.overview?.bounceRate?.trend}
                    isInverted={true}
                  />
                </div>

                {/* Business Metrics */}
                <div className="business-metrics-grid">
                  <MetricCard
                    title="Car Listings Viewed"
                    value={formatNumber(dashboardData.content?.listingsViewed?.value || 0)}
                    trend={dashboardData.content?.listingsViewed?.trend}
                  />
                  <MetricCard
                    title="Articles Read"
                    value={formatNumber(dashboardData.content?.articlesRead?.value || 0)}
                    trend={dashboardData.content?.articlesRead?.trend}
                  />
                  <MetricCard
                    title="Search Queries"
                    value={formatNumber(dashboardData.content?.searchQueries?.value || 0)}
                    trend={dashboardData.content?.searchQueries?.trend}
                  />
                  <MetricCard
                    title="Dealer Contacts"
                    value={formatNumber(dashboardData.conversions?.dealerContacts?.value || 0)}
                    trend={dashboardData.conversions?.dealerContacts?.trend}
                  />
                </div>

                {/* Device and Source Breakdown */}
                {(dashboardData.breakdown?.devices || dashboardData.breakdown?.sources) && (
                  <div className="breakdown-grid">
                    {dashboardData.breakdown?.devices && (
                      <DeviceBreakdown data={dashboardData.breakdown.devices} />
                    )}
                    {dashboardData.breakdown?.sources && (
                      <div className="source-breakdown-card">
                        <h3>Traffic Sources</h3>
                        <div className="source-breakdown">
                          {Object.entries(dashboardData.breakdown.sources).map(([source, count]) => (
                            <div key={source} className="source-item">
                              <span className="source-name">{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                              <span className="source-count">{formatNumber(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Top Pages */}
                {dashboardData.breakdown?.topPages && dashboardData.breakdown.topPages.length > 0 && (
                  <div className="top-pages-card">
                    <h3>Top Pages</h3>
                    <div className="top-pages-list">
                      {dashboardData.breakdown.topPages.slice(0, 10).map((page, index) => (
                        <div key={index} className="top-page-item">
                          <span className="page-rank">#{index + 1}</span>
                          <span className="page-path">{page.page}</span>
                          <span className="page-views">{formatNumber(page.views)} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data-state">
                <h3>No Overview Data Available</h3>
                <p>Unable to load dashboard overview data.</p>
                {dataStatus.dashboard.error && (
                  <p className="error-detail">Error: {dataStatus.dashboard.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Real-time Tab */}
        {activeTab === 'realtime' && (
          <div className="analytics-tab-content">
            {realTimeData ? (
              <RealTimeWidget data={realTimeData} isLive={isLive} />
            ) : (
              <div className="no-data-state">
                <h3>No Real-time Data Available</h3>
                <p>Unable to load real-time analytics data.</p>
                {dataStatus.realtime.error && (
                  <p className="error-detail">Error: {dataStatus.realtime.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Traffic Tab */}
        {activeTab === 'traffic' && (
          <div className="analytics-tab-content">
            {trafficData ? (
              <>
                <TrafficChart data={trafficData} />
                <div className="traffic-details-grid">
                  {trafficData.deviceBreakdown && (
                    <DeviceBreakdown data={trafficData.deviceBreakdown} />
                  )}
                  {trafficData.geographicData && (
                    <GeographicData data={trafficData.geographicData} />
                  )}
                </div>
              </>
            ) : (
              <div className="no-data-state">
                <h3>No Traffic Data Available</h3>
                <p>Unable to load traffic analytics data.</p>
                {dataStatus.traffic.error && (
                  <p className="error-detail">Error: {dataStatus.traffic.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="analytics-tab-content">
            {contentData ? (
              <>
                <ContentPerformance data={contentData} />
                {contentData.searchAnalytics && (
                  <SearchAnalytics data={contentData.searchAnalytics} />
                )}
              </>
            ) : (
              <div className="no-data-state">
                <h3>No Content Data Available</h3>
                <p>Unable to load content analytics data.</p>
                {dataStatus.content.error && (
                  <p className="error-detail">Error: {dataStatus.content.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="analytics-tab-content">
            {performanceData ? (
              <PerformanceMetrics data={performanceData} />
            ) : (
              <div className="no-data-state">
                <h3>No Performance Data Available</h3>
                <p>Unable to load performance analytics data.</p>
                {dataStatus.performance.error && (
                  <p className="error-detail">Error: {dataStatus.performance.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conversions Tab */}
        {activeTab === 'conversions' && (
          <div className="analytics-tab-content">
            {dashboardData ? (
              <>
                <div className="conversions-overview">
                  <h3>Conversion Funnel</h3>
                  <div className="conversion-funnel">
                    <div className="funnel-step">
                      <span className="funnel-label">Visitors</span>
                      <span className="funnel-value">{formatNumber(dashboardData.overview?.uniqueVisitors?.value || 0)}</span>
                    </div>
                    <div className="funnel-arrow">→</div>
                    <div className="funnel-step">
                      <span className="funnel-label">Listing Views</span>
                      <span className="funnel-value">{formatNumber(dashboardData.content?.listingsViewed?.value || 0)}</span>
                    </div>
                    <div className="funnel-arrow">→</div>
                    <div className="funnel-step">
                      <span className="funnel-label">Contacts</span>
                      <span className="funnel-value">{formatNumber(dashboardData.conversions?.dealerContacts?.value || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="conversion-metrics-detailed">
                  <div className="conversion-card">
                    <h4>Contact Conversion Rate</h4>
                    <div className="conversion-rate">
                      {(dashboardData.content?.listingsViewed?.value || 0) > 0 ? 
                        (((dashboardData.conversions?.dealerContacts?.value || 0) / (dashboardData.content?.listingsViewed?.value || 1)) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                  <div className="conversion-card">
                    <h4>Phone Click Rate</h4>
                    <div className="conversion-rate">
                      {(dashboardData.overview?.uniqueVisitors?.value || 0) > 0 ? 
                        (((dashboardData.conversions?.phoneCallClicks?.value || 0) / (dashboardData.overview?.uniqueVisitors?.value || 1)) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                  <div className="conversion-card">
                    <h4>Search-to-Contact Rate</h4>
                    <div className="conversion-rate">
                      {(dashboardData.content?.searchQueries?.value || 0) > 0 ? 
                        (((dashboardData.conversions?.dealerContacts?.value || 0) / (dashboardData.content?.searchQueries?.value || 1)) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data-state">
                <h3>No Conversion Data Available</h3>
                <p>Unable to load conversion analytics data.</p>
                {dataStatus.dashboard.error && (
                  <p className="error-detail">Error: {dataStatus.dashboard.error}</p>
                )}
                <button onClick={fetchAnalyticsData} className="retry-button">
                  Retry Loading Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;