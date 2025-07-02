// client/src/components/profile/BusinessDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Star, 
  Eye, MessageSquare, Settings, ExternalLink, 
  Calendar, FileText, Award, AlertCircle, CheckCircle,
  Activity, Clock, Phone, MapPin, Shield, Target
} from 'lucide-react';
import axios from '../../config/axios.js';
import './BusinessDashboard.css';

const BusinessDashboard = ({ profileData, refreshProfile }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get user's business services
  const verifiedServices = profileData?.businessProfile?.services?.filter(s => s.isVerified) || [];
  const hasDealer = profileData?.dealership;
  const isAdmin = profileData?.role === 'admin';

  useEffect(() => {
    if (verifiedServices.length > 0 || hasDealer || isAdmin) {
      fetchDashboardData();
    }
  }, [profileData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile/business-dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showMessage('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getServiceTypeDashboard = (serviceType) => {
    switch (serviceType) {
      case 'public_transport':
        return '/provider/transport';
      case 'car_rental':
        return '/provider/rental';
      case 'trailer_rental':
        return '/provider/trailer';
      case 'workshop':
        return '/provider/workshop';
      default:
        return '/provider/dashboard';
    }
  };

  const getServiceTypeIcon = (serviceType) => {
    switch (serviceType) {
      case 'public_transport': return '🚌';
      case 'car_rental': return '🚗';
      case 'trailer_rental': return '🚚';
      case 'workshop': return '🔧';
      default: return '🏢';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'P 0.00';
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP'
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const getPerformanceColor = (value, threshold = 50) => {
    if (value >= threshold * 1.5) return 'excellent';
    if (value >= threshold) return 'good';
    if (value >= threshold * 0.5) return 'average';
    return 'poor';
  };

  const viewTypes = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'admin', label: 'Admin Tools', icon: Shield, adminOnly: true }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="bdash-main-container">
        <div className="bdash-loading-container">
          <div className="bdash-loading-spinner"></div>
          <p>Loading your business dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bdash-main-container">
      {/* Message Display */}
      {message.text && (
        <div className={`bdash-message bdash-message-${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Dashboard Navigation */}
      <div className="bdash-navigation">
        {viewTypes.map(view => {
          if (view.adminOnly && !isAdmin) return null;
          const IconComponent = view.icon;
          return (
            <button
              key={view.id}
              className={`bdash-nav-button ${activeView === view.id ? 'active' : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              <IconComponent size={16} />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Overview Section */}
      {activeView === 'overview' && (
        <div className="bdash-overview-section">
          <h3 className="bdash-section-title">
            <BarChart3 size={20} />
            Business Overview
          </h3>
          
          {/* Key Metrics */}
          <div className="bdash-metrics-grid">
            <div className="bdash-metric-card">
              <div className="bdash-metric-icon">
                <Eye size={24} />
              </div>
              <div className="bdash-metric-content">
                <span className="bdash-metric-value">
                  {formatNumber(dashboardData?.analytics?.totalViews || 0)}
                </span>
                <span className="bdash-metric-label">Total Views</span>
              </div>
            </div>

            <div className="bdash-metric-card">
              <div className="bdash-metric-icon">
                <MessageSquare size={24} />
              </div>
              <div className="bdash-metric-content">
                <span className="bdash-metric-value">
                  {formatNumber(dashboardData?.analytics?.totalInquiries || 0)}
                </span>
                <span className="bdash-metric-label">Inquiries</span>
              </div>
            </div>

            <div className="bdash-metric-card">
              <div className="bdash-metric-icon">
                <Star size={24} />
              </div>
              <div className="bdash-metric-content">
                <span className="bdash-metric-value">
                  {(dashboardData?.analytics?.averageRating || 0).toFixed(1)}
                </span>
                <span className="bdash-metric-label">Average Rating</span>
              </div>
            </div>

            <div className="bdash-metric-card">
              <div className="bdash-metric-icon">
                <DollarSign size={24} />
              </div>
              <div className="bdash-metric-content">
                <span className="bdash-metric-value">
                  {formatCurrency(dashboardData?.analytics?.totalRevenue || 0)}
                </span>
                <span className="bdash-metric-label">Revenue</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bdash-activity-section">
            <h4 className="bdash-subsection-title">
              <Activity size={18} />
              Recent Activity
            </h4>
            <div className="bdash-activity-list">
              {dashboardData?.recentActivity?.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="bdash-activity-item">
                    <div className="bdash-activity-icon">
                      <Clock size={16} />
                    </div>
                    <div className="bdash-activity-content">
                      <p className="bdash-activity-description">{activity.description}</p>
                      <span className="bdash-activity-time">{activity.timeAgo}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bdash-empty-state">
                  <Activity size={32} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      {activeView === 'services' && (
        <div className="bdash-services-section">
          <h3 className="bdash-section-title">
            <Settings size={20} />
            Your Business Services
          </h3>

          <div className="bdash-services-grid">
            {verifiedServices.map((service, index) => (
              <div key={service._id || index} className="bdash-service-card">
                <div className="bdash-service-header">
                  <div className="bdash-service-icon">
                    {getServiceTypeIcon(service.serviceType)}
                  </div>
                  <div className="bdash-service-info">
                    <h4>{service.serviceName}</h4>
                    <p>{service.description?.substring(0, 80)}...</p>
                  </div>
                  <div className={`bdash-service-status ${service.isVerified ? 'verified' : 'pending'}`}>
                    <CheckCircle size={16} />
                    <span>{service.isVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>

                <div className="bdash-service-stats">
                  <div className="bdash-stat-row">
                    <div className="bdash-stat-item">
                      <Eye size={14} />
                      <span>Views: {formatNumber(service.analytics?.views || 0)}</span>
                    </div>
                    <div className="bdash-stat-item">
                      <Star size={14} />
                      <span>Rating: {(service.analytics?.rating || 0).toFixed(1)}/5</span>
                    </div>
                  </div>
                  <div className="bdash-stat-row">
                    <div className="bdash-stat-item">
                      <MessageSquare size={14} />
                      <span>Inquiries: {formatNumber(service.analytics?.inquiries || 0)}</span>
                    </div>
                    <div className="bdash-stat-item">
                      <Calendar size={14} />
                      <span>Bookings: {formatNumber(service.analytics?.bookings || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bdash-service-actions">
                  <button 
                    className="bdash-dashboard-btn"
                    onClick={() => window.location.href = getServiceTypeDashboard(service.serviceType)}
                  >
                    <ExternalLink size={14} />
                    Open Dashboard
                  </button>
                  <button 
                    className="bdash-manage-btn"
                    onClick={() => window.location.href = `/services/${service._id}/manage`}
                  >
                    <Settings size={14} />
                    Manage
                  </button>
                </div>
              </div>
            ))}

            {/* Dealer Dashboard Access */}
            {hasDealer && (
              <div className="bdash-service-card bdash-dealer-card">
                <div className="bdash-service-header">
                  <div className="bdash-service-icon">🏢</div>
                  <div className="bdash-service-info">
                    <h4>Dealer Dashboard</h4>
                    <p>Vehicle sales & listings management</p>
                  </div>
                  <div className="bdash-service-status verified">
                    <CheckCircle size={16} />
                    <span>Active</span>
                  </div>
                </div>

                <div className="bdash-service-stats">
                  <div className="bdash-stat-row">
                    <div className="bdash-stat-item">
                      <FileText size={14} />
                      <span>Listings: {formatNumber(dashboardData?.dealer?.totalListings || 0)}</span>
                    </div>
                    <div className="bdash-stat-item">
                      <DollarSign size={14} />
                      <span>Revenue: {formatCurrency(dashboardData?.dealer?.revenue || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bdash-service-actions">
                  <button 
                    className="bdash-dashboard-btn"
                    onClick={() => window.location.href = '/dealer/dashboard'}
                  >
                    <ExternalLink size={14} />
                    Dealer Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {activeView === 'analytics' && (
        <div className="bdash-analytics-section">
          <h3 className="bdash-section-title">
            <TrendingUp size={20} />
            Performance Analytics
          </h3>

          <div className="bdash-analytics-grid">
            <div className="bdash-analytics-card">
              <h4>Service Performance</h4>
              <div className="bdash-performance-list">
                {verifiedServices.map((service, index) => {
                  const views = service.analytics?.views || 0;
                  const performanceClass = getPerformanceColor(views, 100);
                  return (
                    <div key={index} className="bdash-performance-item">
                      <div className="bdash-performance-info">
                        <span className="bdash-performance-name">{service.serviceName}</span>
                        <div className={`bdash-performance-indicator ${performanceClass}`}>
                          <div className="bdash-performance-bar">
                            <div 
                              className="bdash-performance-fill"
                              style={{ width: `${Math.min((views / 500) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="bdash-performance-value">{views} views</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bdash-analytics-card">
              <h4>Monthly Trends</h4>
              <div className="bdash-trends-placeholder">
                <TrendingUp size={48} />
                <p>Analytics charts coming soon</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tools Section */}
      {activeView === 'admin' && isAdmin && (
        <div className="bdash-admin-section">
          <h3 className="bdash-section-title">
            <Shield size={20} />
            Admin Tools
          </h3>

          <div className="bdash-admin-grid">
            <div className="bdash-admin-card">
              <div className="bdash-admin-icon">
                <Users size={32} />
              </div>
              <div className="bdash-admin-content">
                <h4>Total Users</h4>
                <span className="bdash-admin-value">
                  {formatNumber(dashboardData?.admin?.totalUsers || 0)}
                </span>
              </div>
            </div>

            <div className="bdash-admin-card">
              <div className="bdash-admin-icon">
                <FileText size={32} />
              </div>
              <div className="bdash-admin-content">
                <h4>Total Listings</h4>
                <span className="bdash-admin-value">
                  {formatNumber(dashboardData?.admin?.totalListings || 0)}
                </span>
              </div>
            </div>

            <div className="bdash-admin-card">
              <div className="bdash-admin-icon">
                <Settings size={32} />
              </div>
              <div className="bdash-admin-content">
                <h4>Active Services</h4>
                <span className="bdash-admin-value">
                  {formatNumber(verifiedServices.length)}
                </span>
              </div>
            </div>
          </div>

          <div className="bdash-admin-actions">
            <button 
              className="bdash-admin-action-btn"
              onClick={() => window.location.href = '/admin/dashboard'}
            >
              <ExternalLink size={16} />
              Full Admin Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {verifiedServices.length === 0 && !hasDealer && !isAdmin && (
        <div className="bdash-empty-dashboard">
          <Target size={64} />
          <h3>No Business Services Found</h3>
          <p>Register your first business service to access the dashboard</p>
          <button 
            className="bdash-register-service-btn"
            onClick={() => {
              // Trigger switch to services tab in parent component
              showMessage('info', 'Please register a service first to access business features');
            }}
          >
            <Settings size={16} />
            Register Service
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
