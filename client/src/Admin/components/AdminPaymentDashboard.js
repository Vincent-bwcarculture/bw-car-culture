// client/src/Admin/components/AdminPaymentDashboard.js
// Enhanced Admin Dashboard for Manual Payment Management

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Eye, CheckCircle, XCircle, Clock, 
  DollarSign, Users, FileText, Download, Filter,
  Search, Calendar, TrendingUp, AlertCircle,
  RefreshCw, BarChart3, PieChart, Activity
} from 'lucide-react';
import axios from '../../config/axios.js';
import AdminManualPaymentApproval from './AdminManualPaymentApproval.js';
import './AdminPaymentDashboard.css';

const AdminPaymentDashboard = () => {
  // State management
  const [payments, setPayments] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Filter and search state
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7days',
    subscriptionTier: 'all',
    searchQuery: ''
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingReview: 0,
    approvedToday: 0,
    totalRevenue: 0,
    averageAmount: 0,
    conversionRate: 0
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  });

  useEffect(() => {
    fetchPaymentData();
    fetchPaymentStats();
  }, [filters, pagination.currentPage]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        status: filters.status,
        dateRange: filters.dateRange,
        tier: filters.subscriptionTier,
        search: filters.searchQuery
      });

      const [paymentsResponse, pendingResponse] = await Promise.all([
        axios.get(`/api/admin/payments/list?${params}`),
        axios.get('/api/admin/payments/pending-manual')
      ]);

      if (paymentsResponse.data.success) {
        setPayments(paymentsResponse.data.data);
        setPagination(prev => ({
          ...prev,
          totalPages: paymentsResponse.data.pagination?.totalPages || 1,
          total: paymentsResponse.data.pagination?.total || 0
        }));
      }

      if (pendingResponse.data.success) {
        setPendingSubmissions(pendingResponse.data.data.pendingSubmissions);
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
      setError(error.response?.data?.message || 'Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await axios.get('/api/admin/payments/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleApprovePayment = (submission) => {
    setSelectedPayment(submission);
    setShowApprovalModal(true);
  };

  const handlePaymentApproved = (approvalData) => {
    // Refresh data after approval
    fetchPaymentData();
    fetchPaymentStats();
    setShowApprovalModal(false);
    setSelectedPayment(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `P${Number(amount || 0).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { icon: Clock, color: 'orange', text: 'Pending' },
      'proof_submitted': { icon: FileText, color: 'blue', text: 'Proof Submitted' },
      'completed': { icon: CheckCircle, color: 'green', text: 'Completed' },
      'failed': { icon: XCircle, color: 'red', text: 'Failed' },
      'cancelled': { icon: XCircle, color: 'gray', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`payment-status-badge status-${config.color}`}>
        <IconComponent size={14} />
        {config.text}
      </span>
    );
  };

  return (
    <div className="admin-payment-dashboard">
      {/* Dashboard Header */}
      <div className="payment-dashboard-header">
        <div className="dashboard-title">
          <h1>Payment Management</h1>
          <p>Monitor and approve manual payments</p>
        </div>
        <div className="dashboard-actions">
          <button 
            className="refresh-btn"
            onClick={() => fetchPaymentData()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="payment-stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingReview}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.approvedToday}</h3>
            <p>Approved Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPayments}</h3>
            <p>Total Payments</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="payment-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="proof_submitted">Proof Submitted</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Subscription Tier:</label>
          <select 
            value={filters.subscriptionTier}
            onChange={(e) => handleFilterChange('subscriptionTier', e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range:</label>
          <select 
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search:</label>
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by user email, transaction ref..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingSubmissions.length > 0 && (
        <div className="pending-approvals-section">
          <div className="section-header">
            <h2>
              <AlertCircle size={20} />
              Pending Manual Approvals ({pendingSubmissions.length})
            </h2>
          </div>
          
          <div className="pending-approvals-grid">
            {pendingSubmissions.map((submission) => (
              <div key={submission._id} className="pending-approval-card">
                <div className="approval-card-header">
                  <div className="user-info">
                    <h4>{submission.listingData?.title || 'Unknown Vehicle'}</h4>
                    <p>{submission.userEmail}</p>
                  </div>
                  <div className="amount-badge">
                    {formatCurrency(50)} {/* Default basic price */}
                  </div>
                </div>
                
                <div className="approval-card-body">
                  <div className="submission-details">
                    <span>Tier: {submission.adminReview?.subscriptionTier?.toUpperCase() || 'BASIC'}</span>
                    <span>Submitted: {formatDate(submission.submittedAt)}</span>
                  </div>
                  
                  {submission.paymentProof?.submitted && (
                    <div className="proof-indicator">
                      <FileText size={14} />
                      Proof submitted
                    </div>
                  )}
                </div>
                
                <div className="approval-card-actions">
                  <button 
                    className="approve-payment-btn"
                    onClick={() => handleApprovePayment(submission)}
                  >
                    <CheckCircle size={16} />
                    Review & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="payments-table-section">
        <div className="section-header">
          <h2>Payment History</h2>
          <div className="table-info">
            Showing {Math.min(pagination.limit, payments.length)} of {pagination.total} payments
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>User</th>
                <th>Amount</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-row">
                    <RefreshCw size={20} className="spinning" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No payments found for the selected filters
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <div className="transaction-cell">
                        <span className="transaction-ref">{payment.transactionRef}</span>
                        {payment.proofOfPayment?.submitted && (
                          <span className="proof-indicator">
                            <FileText size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-email">{payment.userEmail || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="amount-cell">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td>
                      <span className={`tier-badge tier-${payment.subscriptionTier}`}>
                        {payment.subscriptionTier?.toUpperCase()}
                      </span>
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      <span className="method-badge">{payment.paymentMethod}</span>
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(payment.createdAt)}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => {/* Handle view payment details */}}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        {payment.proofOfPayment?.file && (
                          <button 
                            className="download-btn"
                            onClick={() => {/* Handle download proof */}}
                            title="Download proof"
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button 
              className="pagination-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Manual Payment Approval Modal */}
      {showApprovalModal && selectedPayment && (
        <div className="admin-modal-overlay">
          <AdminManualPaymentApproval
            submission={selectedPayment}
            onPaymentApproved={handlePaymentApproved}
            onClose={() => setShowApprovalModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDashboard;
