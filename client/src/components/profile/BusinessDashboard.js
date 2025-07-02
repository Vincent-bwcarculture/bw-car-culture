// client/src/components/profile/BusinessDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Star, 
  Eye, MessageSquare, Settings, ExternalLink, 
  Calendar, FileText, Award, AlertCircle, CheckCircle
} from 'lucide-react';
import axios from '../../config/axios.js';

const BusinessDashboard = ({ profileData, refreshProfile }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // Get user's business services
  const verifiedServices = profileData?.businessProfile?.services?.filter(s => s.isVerified) || [];
  const hasDealer = profileData?.dealership;
  const isAdmin = profileData?.role === 'admin';

  useEffect(() => {
    if (verifiedServices.length > 0 || hasDealer || isAdmin) {
      fetchDashboardData();
    }
  }, [profileData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile/business-dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  if (verifiedServices.length === 0 && !hasDealer && !isAdmin) {
    return (
      <div className="business-dashboard-tab">
        <div className="tab-header">
          <h2><BarChart3 size={24} /> Business Dashboard</h2>
          <p>Get your services verified to access business features</p>
        </div>
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No Business Access</h3>
          <p>Verify your services to unlock business dashboard features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-dashboard-tab">
      <div className="tab-header">
        <h2><BarChart3 size={24} /> Business Dashboard</h2>
        <p>Monitor and manage your business performance</p>
      </div>

      {/* Business Services Overview */}
      <div className="business-services-grid">
        {verifiedServices.map((service) => (
          <div key={service._id} className="business-service-card">
            <div className="service-header">
              <div className="service-icon">
                {getServiceTypeIcon(service.serviceType)}
              </div>
              <div className="service-info">
                <h4>{service.serviceName}</h4>
                <p>{service.serviceType.replace('_', ' ')}</p>
              </div>
              <div className="service-status">
                <CheckCircle size={16} />
                <span>Verified</span>
              </div>
            </div>

            <div className="service-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <Eye size={14} />
                  <span>Views: {formatNumber(service.analytics?.views || 0)}</span>
                </div>
                <div className="stat-item">
                  <Star size={14} />
                  <span>Rating: {service.analytics?.rating || 'N/A'}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <MessageSquare size={14} />
                  <span>Inquiries: {formatNumber(service.analytics?.inquiries || 0)}</span>
                </div>
                <div className="stat-item">
                  <Calendar size={14} />
                  <span>Bookings: {formatNumber(service.analytics?.bookings || 0)}</span>
                </div>
              </div>
            </div>

            <div className="service-actions">
              <button 
                className="dashboard-btn"
                onClick={() => window.location.href = getServiceTypeDashboard(service.serviceType)}
              >
                <ExternalLink size={14} />
                Open Dashboard
              </button>
              <button 
                className="manage-btn"
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
          <div className="business-service-card dealer-card">
            <div className="service-header">
              <div className="service-icon">🏢</div>
              <div className="service-info">
                <h4>Dealer Dashboard</h4>
                <p>Vehicle sales & listings</p>
              </div>
              <div className="service-status">
                <CheckCircle size={16} />
                <span>Active</span>
              </div>
            </div>

            <div className="service-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <FileText size={14} />
                  <span>Listings: {formatNumber(dashboardData?.dealer?.totalListings || 0)}</span>
                </div>
                <div className="stat-item">
                  <DollarSign size={14} />
                  <span>Revenue: {formatCurrency(dashboardData?.dealer?.revenue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="service-actions">
              <button 
                className="dashboard-btn"
                onClick={() => window.location.href = '/dealer/dashboard'}
              >
                <ExternalLink size={14} />
                Open Dealer Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Admin Dashboard Access */}
        {isAdmin && (
          <div className="business-service-card admin-card">
            <div className="service-header">
              <div className="service-icon">👑</div>
              <div className="service-info">
                <h4>Admin Dashboard</h4>
                <p>Platform administration</p>
              </div>
              <div className="service-status">
                <Award size={16} />
                <span>Administrator</span>
              </div>
            </div>

            <div className="service-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <Users size={14} />
                  <span>Users: {formatNumber(dashboardData?.admin?.totalUsers || 0)}</span>
                </div>
                <div className="stat-item">
                  <FileText size={14} />
                  <span>Listings: {formatNumber(dashboardData?.admin?.totalListings || 0)}</span>
                </div>
              </div>
            </div>

            <div className="service-actions">
              <button 
                className="dashboard-btn admin"
                onClick={() => window.location.href = '/admin/dashboard'}
              >
                <ExternalLink size={14} />
                Open Admin Panel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      {dashboardData && (
        <div className="performance-overview">
          <h3>Performance Overview</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <Eye size={20} />
                <span>Total Views</span>
              </div>
              <div className="metric-value">
                {formatNumber(dashboardData.totalViews || 0)}
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+12% this month</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <MessageSquare size={20} />
                <span>Inquiries</span>
              </div>
              <div className="metric-value">
                {formatNumber(dashboardData.totalInquiries || 0)}
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+8% this month</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Star size={20} />
                <span>Avg Rating</span>
              </div>
              <div className="metric-value">
                {dashboardData.averageRating?.toFixed(1) || 'N/A'}
              </div>
              <div className="metric-trend neutral">
                <span>Based on {dashboardData.totalReviews || 0} reviews</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <DollarSign size={20} />
                <span>Revenue</span>
              </div>
              <div className="metric-value">
                {formatCurrency(dashboardData.totalRevenue || 0)}
              </div>
              <div className="metric-trend positive">
                <TrendingUp size={14} />
                <span>+15% this month</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {dashboardData?.recentActivity ? (
            dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'view' && <Eye size={16} />}
                  {activity.type === 'inquiry' && <MessageSquare size={16} />}
                  {activity.type === 'booking' && <Calendar size={16} />}
                  {activity.type === 'review' && <Star size={16} />}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">{activity.timeAgo}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <AlertCircle size={24} />
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/listings/create'}
          >
            <FileText size={16} />
            Create New Listing
          </button>
          
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/services/manage'}
          >
            <Settings size={16} />
            Manage Services
          </button>
          
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/analytics'}
          >
            <BarChart3 size={16} />
            View Analytics
          </button>
          
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/reviews'}
          >
            <Star size={16} />
            Manage Reviews
          </button>
        </div>
      </div>

      {/* Tips and Recommendations */}
      <div className="business-tips">
        <h3>Business Tips</h3>
        <div className="tips-list">
          <div className="tip-item">
            <CheckCircle size={16} />
            <p>Complete your business profile to increase visibility</p>
          </div>
          <div className="tip-item">
            <CheckCircle size={16} />
            <p>Respond to inquiries quickly to improve customer satisfaction</p>
          </div>
          <div className="tip-item">
            <CheckCircle size={16} />
            <p>Upload high-quality photos to attract more customers</p>
          </div>
          <div className="tip-item">
            <CheckCircle size={16} />
            <p>Keep your service information up to date</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
