// client/src/Admin/DealershipManager/SubscriptionManager.js
// COMPLETE VERSION: Admin Subscription Manager with Rental Providers & Add-ons

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Building,
  Truck,
  Package,
  Camera,
  Star,
  Video,
  MessageCircle,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { http } from '../../config/axios.js';
import { 
  formatPrice, 
  SELLER_TYPES,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUS 
} from '../../constants/subscriptionConfig.js';
import './SubscriptionManager.css';

const SubscriptionManager = () => {
  // State management
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addons, setAddons] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    sellerType: 'all',
    status: 'all',
    tier: 'all',
    dateRange: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Load data on component mount
  useEffect(() => {
    loadSubscriptions();
    loadAnalytics();
  }, [filters, pagination.page]);

  // Load subscriptions data
  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sellerType: filters.sellerType,
        status: filters.status,
        tier: filters.tier,
        dateRange: filters.dateRange
      });

      const response = await http.get(`/api/admin/subscriptions?${params}`);
      if (response.data.success) {
        setSubscriptions(response.data.data.subscriptions);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total
        }));
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('Failed to load subscriptions data');
    } finally {
      setLoading(false);
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      const response = await http.get('/api/admin/subscription-analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  // Load payments data
  const loadPayments = async () => {
    try {
      const response = await http.get('/api/admin/payments');
      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  // Load add-ons data
  const loadAddons = async () => {
    try {
      const response = await http.get('/api/admin/addons');
      if (response.data.success) {
        setAddons(response.data.data);
      }
    } catch (error) {
      console.error('Error loading add-ons:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle subscription edit
  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setEditForm({
      tier: subscription.tier,
      status: subscription.status,
      expiresAt: subscription.expiresAt ? subscription.expiresAt.split('T')[0] : '',
      sellerType: subscription.sellerType,
      maxListings: subscription.maxListings || 1
    });
    setShowEditModal(true);
  };

  // Handle subscription details view
  const handleViewDetails = async (subscription) => {
    try {
      setLoading(true);
      const response = await http.get(`/api/admin/subscriptions/${subscription._id}/details`);
      if (response.data.success) {
        setSelectedSubscription(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading subscription details:', error);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Save subscription changes
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const response = await http.put(`/api/admin/subscriptions/${selectedSubscription._id}`, editForm);
      if (response.data.success) {
        await loadSubscriptions();
        setShowEditModal(false);
        setSelectedSubscription(null);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  // Delete subscription
  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;

    try {
      setLoading(true);
      const response = await http.delete(`/api/admin/subscriptions/${subscriptionId}`);
      if (response.data.success) {
        await loadSubscriptions();
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setError('Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  // Generate WhatsApp link for add-on booking
  const generateWhatsAppLink = (addon, user) => {
    const whatsappNumber = '+26771234567'; // Replace with actual number
    const message = `Hi! I'm following up on the ${addon.name} service booked for user ${user.name} (${user.email}).`;
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  };

  // Export data
  const handleExportData = async (type) => {
    try {
      const response = await http.get(`/api/admin/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    }
  };

  // Get seller type icon
  const getSellerTypeIcon = (sellerType) => {
    switch (sellerType) {
      case 'private': return User;
      case 'dealership': return Building;
      case 'rental': return Truck;
      default: return User;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Render overview tab
  const renderOverviewTab = () => {
    return (
      <div className="overview-tab">
        {/* Analytics Cards */}
        <div className="analytics-cards">
          <div className="analytics-card">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div className="card-info">
                <h3>Total Subscriptions</h3>
                <p className="card-value">{analytics.totalSubscriptions || 0}</p>
                <p className="card-change positive">+{analytics.newThisMonth || 0} this month</p>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
                <DollarSign size={24} />
              </div>
              <div className="card-info">
                <h3>Monthly Revenue</h3>
                <p className="card-value">{formatPrice(analytics.monthlyRevenue || 0)}</p>
                <p className="card-change positive">+{analytics.revenueGrowth || 0}% vs last month</p>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
                <TrendingUp size={24} />
              </div>
              <div className="card-info">
                <h3>Active Subscriptions</h3>
                <p className="card-value">{analytics.activeSubscriptions || 0}</p>
                <p className="card-change">{analytics.activePercentage || 0}% of total</p>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
                <Package size={24} />
              </div>
              <div className="card-info">
                <h3>Add-on Revenue</h3>
                <p className="card-value">{formatPrice(analytics.addonRevenue || 0)}</p>
                <p className="card-change positive">+{analytics.addonGrowth || 0}% growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Subscription Distribution by Seller Type</h3>
            <div className="seller-type-stats">
              {Object.entries(analytics.bySellerType || {}).map(([type, count]) => {
                const IconComponent = getSellerTypeIcon(type);
                return (
                  <div key={type} className="seller-stat">
                    <div className="stat-icon">
                      <IconComponent size={20} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span className="stat-value">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-container">
            <h3>Revenue by Plan Tier</h3>
            <div className="tier-revenue-stats">
              {Object.entries(analytics.revenueByTier || {}).map(([tier, revenue]) => (
                <div key={tier} className="revenue-stat">
                  <span className="tier-name">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                  <span className="tier-revenue">{formatPrice(revenue)}</span>
                  <div className="revenue-bar">
                    <div 
                      className="revenue-fill" 
                      style={{ 
                        width: `${(revenue / Math.max(...Object.values(analytics.revenueByTier || {}))) * 100}%`,
                        backgroundColor: tier === 'basic' ? '#3b82f6' : tier === 'standard' ? '#10b981' : '#8b5cf6'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Subscription Activity</h3>
          <div className="activity-list">
            {(analytics.recentActivity || []).slice(0, 10).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'new' && <CheckCircle size={16} />}
                  {activity.type === 'expired' && <XCircle size={16} />}
                  {activity.type === 'upgraded' && <TrendingUp size={16} />}
                </div>
                <div className="activity-info">
                  <span>{activity.description}</span>
                  <small>{new Date(activity.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render subscriptions tab
  const renderSubscriptionsTab = () => {
    return (
      <div className="subscriptions-tab">
        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-filter">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by user name, email, or business..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-dropdowns">
            <select
              value={filters.sellerType}
              onChange={(e) => handleFilterChange('sellerType', e.target.value)}
            >
              <option value="all">All Seller Types</option>
              <option value="private">Private Sellers</option>
              <option value="dealership">Dealerships</option>
              <option value="rental">Rental Providers</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.tier}
              onChange={(e) => handleFilterChange('tier', e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>

            <button
              className="export-btn"
              onClick={() => handleExportData('subscriptions')}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="subscriptions-table">
          <div className="table-header">
            <div className="header-cell">User</div>
            <div className="header-cell">Seller Type</div>
            <div className="header-cell">Plan</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Expires</div>
            <div className="header-cell">Revenue</div>
            <div className="header-cell">Actions</div>
          </div>

          <div className="table-body">
            {subscriptions.map((subscription) => {
              const IconComponent = getSellerTypeIcon(subscription.sellerType);
              
              return (
                <div key={subscription._id} className="table-row">
                  <div className="table-cell user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {subscription.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{subscription.user?.name}</span>
                        <span className="user-email">{subscription.user?.email}</span>
                        {subscription.businessName && (
                          <span className="business-name">{subscription.businessName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="table-cell seller-type-cell">
                    <div className="seller-type-badge">
                      <IconComponent size={16} />
                      <span>{subscription.sellerType}</span>
                    </div>
                  </div>

                  <div className="table-cell plan-cell">
                    <div className="plan-info">
                      <span className="plan-tier">{subscription.tier}</span>
                      <span className="plan-listings">{subscription.maxListings} listings</span>
                    </div>
                  </div>

                  <div className="table-cell status-cell">
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(subscription.status) }}
                    >
                      {subscription.status}
                    </div>
                  </div>

                  <div className="table-cell expires-cell">
                    {subscription.expiresAt ? (
                      <div className="expires-info">
                        <span>{new Date(subscription.expiresAt).toLocaleDateString()}</span>
                        <small>
                          {Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left
                        </small>
                      </div>
                    ) : (
                      <span>No expiry</span>
                    )}
                  </div>

                  <div className="table-cell revenue-cell">
                    <span className="revenue-amount">{formatPrice(subscription.totalPaid || 0)}</span>
                  </div>

                  <div className="table-cell actions-cell">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewDetails(subscription)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditSubscription(subscription)}
                      title="Edit Subscription"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteSubscription(subscription._id)}
                      title="Delete Subscription"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Render payments tab
  const renderPaymentsTab = () => {
    useEffect(() => {
      if (selectedTab === 'payments') {
        loadPayments();
      }
    }, [selectedTab]);

    return (
      <div className="payments-tab">
        <div className="payments-header">
          <h3>Payment History</h3>
          <button
            className="refresh-btn"
            onClick={loadPayments}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-item">
              <div className="payment-info">
                <div className="payment-user">
                  <strong>{payment.user?.name}</strong>
                  <span>{payment.user?.email}</span>
                </div>
                <div className="payment-details">
                  <span className="payment-type">{payment.type}</span>
                  {payment.subscriptionTier && (
                    <span className="payment-tier">{payment.subscriptionTier} plan</span>
                  )}
                  {payment.addons && payment.addons.length > 0 && (
                    <span className="payment-addons">{payment.addons.length} add-ons</span>
                  )}
                </div>
              </div>
              
              <div className="payment-amount">
                <span className="amount">{formatPrice(payment.amount)}</span>
                <span className="payment-date">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="payment-status">
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(payment.status) }}
                >
                  {payment.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render add-ons tab
  const renderAddonsTab = () => {
    useEffect(() => {
      if (selectedTab === 'addons') {
        loadAddons();
      }
    }, [selectedTab]);

    return (
      <div className="addons-tab">
        <div className="addons-header">
          <h3>Add-on Services</h3>
          <button
            className="export-btn"
            onClick={() => handleExportData('addons')}
          >
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="addons-grid">
          {addons.map((addon) => (
            <div key={addon._id} className="addon-item">
              <div className="addon-header">
                <div className="addon-icon">
                  {addon.addonId?.includes('photography') && <Camera size={20} />}
                  {addon.addonId?.includes('sponsored') && <Star size={20} />}
                  {addon.addonId?.includes('review') && <Video size={20} />}
                </div>
                <div className="addon-info">
                  <h4>{addon.name}</h4>
                  <p>{addon.user?.name} - {addon.user?.email}</p>
                </div>
              </div>

              <div className="addon-details">
                <div className="addon-status">
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(addon.status) }}
                  >
                    {addon.status}
                  </div>
                </div>
                <div className="addon-date">
                  Purchased: {new Date(addon.purchasedAt).toLocaleDateString()}
                </div>
              </div>

              {addon.requiresBooking && (
                <div className="addon-booking">
                  <span>Requires booking</span>
                  <a
                    href={generateWhatsAppLink(addon, addon.user)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-link"
                  >
                    <MessageCircle size={14} />
                    Contact via WhatsApp
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    if (!showEditModal || !selectedSubscription) return null;

    return (
      <div className="modal-overlay">
        <div className="edit-modal">
          <div className="modal-header">
            <h3>Edit Subscription</h3>
            <button
              className="close-btn"
              onClick={() => setShowEditModal(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label>Subscription Tier</label>
              <select
                value={editForm.tier}
                onChange={(e) => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expires At</label>
              <input
                type="date"
                value={editForm.expiresAt}
                onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Max Listings</label>
              <input
                type="number"
                value={editForm.maxListings}
                onChange={(e) => setEditForm(prev => ({ ...prev, maxListings: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="cancel-btn"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSaveChanges}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedSubscription) return null;

    return (
      <div className="modal-overlay">
        <div className="details-modal">
          <div className="modal-header">
            <h3>Subscription Details</h3>
            <button
              className="close-btn"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="details-grid">
              <div className="detail-section">
                <h4>User Information</h4>
                <div className="detail-item">
                  <span>Name:</span>
                  <span>{selectedSubscription.user?.name}</span>
                </div>
                <div className="detail-item">
                  <span>Email:</span>
                  <span>{selectedSubscription.user?.email}</span>
                </div>
                <div className="detail-item">
                  <span>Phone:</span>
                  <span>{selectedSubscription.user?.profile?.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Subscription Details</h4>
                <div className="detail-item">
                  <span>Seller Type:</span>
                  <span>{selectedSubscription.sellerType}</span>
                </div>
                <div className="detail-item">
                  <span>Plan Tier:</span>
                  <span>{selectedSubscription.tier}</span>
                </div>
                <div className="detail-item">
                  <span>Status:</span>
                  <span>{selectedSubscription.status}</span>
                </div>
                <div className="detail-item">
                  <span>Max Listings:</span>
                  <span>{selectedSubscription.maxListings}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Payment Information</h4>
                <div className="detail-item">
                  <span>Total Paid:</span>
                  <span>{formatPrice(selectedSubscription.totalPaid || 0)}</span>
                </div>
                <div className="detail-item">
                  <span>Created:</span>
                  <span>{new Date(selectedSubscription.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span>Expires:</span>
                  <span>
                    {selectedSubscription.expiresAt ? 
                      new Date(selectedSubscription.expiresAt).toLocaleDateString() : 
                      'No expiry'}
                  </span>
                </div>
              </div>
            </div>

            {selectedSubscription.listings && selectedSubscription.listings.length > 0 && (
              <div className="detail-section">
                <h4>Associated Listings</h4>
                <div className="listings-list">
                  {selectedSubscription.listings.map((listing) => (
                    <div key={listing._id} className="listing-item">
                      <span>{listing.title}</span>
                      <span>{formatPrice(listing.price)}</span>
                      <span className="listing-status">{listing.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              className="close-btn"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="subscription-manager">
      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="manager-header">
        <h2>Subscription Management</h2>
        <p>Manage user subscriptions, payments, and add-on services</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={selectedTab === 'subscriptions' ? 'active' : ''}
          onClick={() => setSelectedTab('subscriptions')}
        >
          <Users size={16} />
          Subscriptions
        </button>
        <button
          className={selectedTab === 'payments' ? 'active' : ''}
          onClick={() => setSelectedTab('payments')}
        >
          <CreditCard size={16} />
          Payments
        </button>
        <button
          className={selectedTab === 'addons' ? 'active' : ''}
          onClick={() => setSelectedTab('addons')}
        >
          <Package size={16} />
          Add-ons
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading && (
          <div className="loading-spinner">
            <RefreshCw size={24} className="spinning" />
            <span>Loading...</span>
          </div>
        )}

        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'subscriptions' && renderSubscriptionsTab()}
        {selectedTab === 'payments' && renderPaymentsTab()}
        {selectedTab === 'addons' && renderAddonsTab()}
      </div>

      {/* Modals */}
      {renderEditModal()}
      {renderDetailsModal()}
    </div>
  );
};

export default SubscriptionManager;