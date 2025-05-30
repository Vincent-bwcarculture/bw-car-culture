// src/Admin/AnalyticsDashboard/components/RealTimeWidget.js
import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../../services/analyticsService.js';

const RealTimeWidget = ({ data: initialData, isLive = false }) => {
  const [realtimeData, setRealtimeData] = useState(initialData);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (initialData) {
      setRealtimeData(initialData);
      setLastUpdated(new Date());
    }
  }, [initialData]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        setConnectionStatus('updating');
        const response = await analyticsService.getRealTimeData();
        
        if (response?.data) {
          setRealtimeData(response.data);
          setLastUpdated(new Date());
          setConnectionStatus('connected');
          setUpdateCount(prev => prev + 1);
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        setConnectionStatus('error');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getEventDescription = (interaction) => {
    const descriptions = {
      'listing_view': 'viewed a car listing',
      'news_read': 'read an article',
      'search': 'performed a search',
      'dealer_contact': 'contacted a dealer',
      'phone_call': 'clicked phone number',
      'listing_favorite': 'favorited a listing',
      'filter': 'used filters',
      'click': 'clicked an element',
      'error': 'encountered an error',
      'user_action': 'performed an action'
    };
    return descriptions[interaction.eventType] || 'performed an action';
  };

  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: '#22c55e', text: 'Connected' };
      case 'updating':
        return { color: '#f59e0b', text: 'Updating...' };
      case 'error':
        return { color: '#ef4444', text: 'Connection Error' };
      default:
        return { color: '#6b7280', text: 'Unknown' };
    }
  };

  if (!realtimeData) {
    return (
      <div className="realtime-dashboard">
        <div className="realtime-loading">
          <div className="realtime-spinner"></div>
          <p>Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const statusIndicator = getConnectionStatusIndicator();

  return (
    <div className="realtime-dashboard">
      <div className="realtime-header">
        <div className="realtime-title">
          <h2>Real-Time Activity</h2>
          <div className="realtime-status">
            <span className="status-indicator" style={{ color: statusIndicator.color }}>
              ● {statusIndicator.text}
            </span>
            {isLive && (
              <span className="update-count">
                Updates: {updateCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="realtime-controls">
          <div className="last-updated">
            Last updated: {formatTimestamp(lastUpdated)}
          </div>
        </div>
      </div>

      <div className="realtime-stats">
        <div className="realtime-stat-card">
          <div className="stat-number">{realtimeData.activeSessions || 0}</div>
          <div className="stat-label">Active Users</div>
          <div className="stat-sublabel">Last 30 minutes</div>
        </div>
        <div className="realtime-stat-card">
          <div className="stat-number">{realtimeData.recentPageViews || 0}</div>
          <div className="stat-label">Page Views</div>
          <div className="stat-sublabel">Last 24 hours</div>
        </div>
        <div className="realtime-stat-card">
          <div className="stat-number">
            {realtimeData.recentInteractions?.length || 0}
          </div>
          <div className="stat-label">Interactions</div>
          <div className="stat-sublabel">Last hour</div>
        </div>
      </div>

      <div className="realtime-content-grid">
        {/* Top Pages */}
        <div className="realtime-section">
          <h3>Top Pages (24h)</h3>
          <div className="realtime-list">
            {realtimeData.topPages && realtimeData.topPages.length > 0 ? (
              realtimeData.topPages.slice(0, 10).map((page, index) => (
                <div key={index} className="realtime-item">
                  <span className="item-rank">#{index + 1}</span>
                  <div className="item-details">
                    <div className="item-title" title={page.page}>
                      {page.page.length > 50 ? `${page.page.substring(0, 50)}...` : page.page}
                    </div>
                    <div className="item-stats">
                      <span className="stat-views">{page.views} views</span>
                      <span className="stat-separator">•</span>
                      <span className="stat-visitors">{page.uniqueVisitors} visitors</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No page data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="realtime-section">
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            {realtimeData.recentInteractions && realtimeData.recentInteractions.length > 0 ? (
              realtimeData.recentInteractions.slice(0, 20).map((interaction, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-details">
                    <div className="activity-description">
                      <strong>{interaction.user || 'Anonymous User'}</strong>{' '}
                      {getEventDescription(interaction)}
                      {interaction.details?.listingTitle && (
                        <span className="activity-target">
                          : {interaction.details.listingTitle}
                        </span>
                      )}
                      {interaction.details?.articleTitle && (
                        <span className="activity-target">
                          : {interaction.details.articleTitle}
                        </span>
                      )}
                    </div>
                    <div className="activity-meta">
                      {interaction.page && (
                        <span className="activity-page" title={interaction.page}>
                          {interaction.page.length > 30 ? 
                            `${interaction.page.substring(0, 30)}...` : 
                            interaction.page
                          }
                        </span>
                      )}
                      <span className="activity-time">
                        {formatTimeAgo(interaction.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No recent activity</p>
                <small>Activity will appear here as users interact with your site</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {connectionStatus === 'error' && (
        <div className="realtime-error-message">
          <span>Connection lost. Trying to reconnect...</span>
        </div>
      )}
      
      {!isLive && realtimeData && (
        <div className="realtime-info-message">
          <span>Real-time updates are paused. Click "Go Live" to resume.</span>
        </div>
      )}
    </div>
  );
};

export default RealTimeWidget;
