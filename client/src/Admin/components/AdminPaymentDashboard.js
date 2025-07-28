// client/src/Admin/components/AdminPaymentDashboard.js
// Complete Enhanced Admin Dashboard for Manual Payment Management

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

      console.log('🔍 Fetching payment data with filters:', filters);

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        status: filters.status,
        dateRange: filters.dateRange,
        tier: filters.subscriptionTier,
        search: filters.searchQuery
      });

      // CORRECTED: Remove /api prefix to match admin endpoint pattern
      const [paymentsResponse, pendingResponse] = await Promise.all([
        axios.get(`/admin/payments/list?${params}`),     // ✅ No /api prefix
        axios.get('/admin/payments/pending-manual')      // ✅ No /api prefix
      ]);

      console.log('📊 Payments Response:', paymentsResponse.data);
      console.log('⏳ Pending Response:', pendingResponse.data);

      if (paymentsResponse.data.success) {
        setPayments(paymentsResponse.data.data || []);
        if (paymentsResponse.data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: paymentsResponse.data.pagination.totalPages || 1,
            total: paymentsResponse.data.pagination.total || 0
          }));
        }
      }

      if (pendingResponse.data.success) {
        const pendingData = pendingResponse.data.data;
        
        // ENHANCED: Combine both pendingPayments and pendingSubmissions
        const allPendingItems = [
          ...(pendingData.pendingPayments || []),
          ...(pendingData.pendingSubmissions || [])
        ];
        
        setPendingSubmissions(allPendingItems);
        
        console.log('🎯 Debug - Pending items found:', {
          pendingPayments: pendingData.pendingPayments?.length || 0,
          pendingSubmissions: pendingData.pendingSubmissions?.length || 0,
          totalPending: allPendingItems.length
        });
      }

      console.log('✅ Payment data fetched successfully');

    } catch (error) {
      console.error('❌ Error fetching payment data:', error);
      setError(error.response?.data?.message || 'Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      console.log('📈 Fetching payment statistics...');
      
      // CORRECTED: Remove /api prefix
      const response = await axios.get('/admin/payments/stats');  // ✅ No /api prefix
      
      console.log('📊 Stats Response:', response.data);
      
      if (response.data.success) {
        setStats(response.data.data);
        console.log('✅ Payment stats updated');
      }
      
    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      // Don't show error for stats, it's not critical
    }
  };

  const handleApprovePayment = (submission) => {
    console.log('🔧 Opening approval modal for:', submission);
    setSelectedPayment(submission);
    setShowApprovalModal(true);
  };

  const handlePaymentApproved = (approvalData) => {
    console.log('✅ Payment approved, refreshing data...');
    // Refresh data after approval
    fetchPaymentData();
    fetchPaymentStats();
    setShowApprovalModal(false);
    setSelectedPayment(null);
  };

  const handleFilterChange = (key, value) => {
    console.log(`🔍 Filter changed: ${key} = ${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // ENHANCED: Function for viewing proof of payment
  const handleViewProof = async (paymentId) => {
    try {
      console.log('🔍 Viewing proof for payment:', paymentId);
      
      // Try to get proof from the payment data first
      const payment = payments.find(p => p._id === paymentId);
      if (payment?.proofOfPayment?.file?.url) {
        window.open(payment.proofOfPayment.file.url, '_blank');
        return;
      }
      
      // If not found in local data, fetch from API
      const response = await axios.get(`/admin/payments/proof/${paymentId}`);
      if (response.data.success && response.data.data.file?.url) {
        window.open(response.data.data.file.url, '_blank');
      } else {
        alert('No proof of payment file found');
      }
    } catch (error) {
      console.error('Error viewing proof:', error);
      alert('Error accessing proof of payment');
    }
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

  // ENHANCED: Updated status badge with new statuses
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { icon: Clock, color: 'orange', text: 'Pending' },
      'pending_review': { icon: Clock, color: 'orange', text: 'Pending Review' },  // ADDED
      'proof_submitted': { icon: FileText, color: 'blue', text: 'Proof Submitted' },
      'completed': { icon: CheckCircle, color: 'green', text: 'Completed' },
      'approved': { icon: CheckCircle, color: 'green', text: 'Approved' },          // ADDED
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
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchPaymentData();
              fetchPaymentStats();
            }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <div>
            <strong>Error:</strong> {error}
            <br />
            <button 
              onClick={() => {
                setError('');
                fetchPaymentData();
              }}
              style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="payment-stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
            <small>This month</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingReview}</h3>
            <p>Pending Review</p>
            <small>Requires action</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.approvedToday}</h3>
            <p>Approved Today</p>
            <small>Manual approvals</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPayments}</h3>
            <p>Total Payments</p>
            <small>{stats.conversionRate}% success rate</small>
          </div>
        </div>
      </div>

      {/* ENHANCED: Filters and Search */}
      <div className="payment-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="pending_review">Pending Review</option>  {/* ADDED */}
            <option value="proof_submitted">Proof Submitted</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>            {/* ADDED */}
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
            <option value="all">All Time</option>
            <option value="1day">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by user email, transaction ref..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* ENHANCED: Pending Approvals Section */}
      {pendingSubmissions.length > 0 && (
        <div className="pending-approvals-section">
          <h2>
            <AlertCircle size={20} />
            Pending Manual Payment Approvals ({pendingSubmissions.length})
          </h2>
          <div className="pending-approvals-grid">
            {pendingSubmissions.map((submission, index) => {
              // ENHANCED: Handle both payment objects and submission objects
              const isPayment = submission.transactionRef || submission.paymentMethod;
              const displayData = isPayment ? {
                id: submission._id,
                userEmail: submission.userEmail || 'Unknown User',
                submittedAt: submission.createdAt,
                amount: submission.amount,
                tier: submission.subscriptionTier,
                status: submission.status,
                hasProof: submission.proofOfPayment?.file?.url,
                type: 'payment'
              } : {
                id: submission._id,
                userEmail: submission.userEmail || submission.submitterEmail || 'Unknown User',
                submittedAt: submission.submittedAt,
                amount: submission.adminReview?.totalCost,
                tier: submission.adminReview?.subscriptionTier,
                status: submission.status,
                hasProof: submission.proofOfPayment?.file?.url,
                listingData: submission.listingData,
                type: 'submission'
              };

              return (
                <div key={displayData.id || index} className="pending-approval-card">
                  <div className="approval-card-header">
                    <div className="user-info">
                      <h4>{displayData.userEmail}</h4>
                      <p>Submitted: {formatDate(displayData.submittedAt)}</p>
                      <small>Type: {displayData.type} | Status: {displayData.status}</small>
                    </div>
                    <div className="amount-badge">
                      {formatCurrency(displayData.amount || 50)}
                    </div>
                  </div>

                  <div className="approval-card-body">
                    <div className="submission-details">
                      <span><strong>Tier:</strong> {(displayData.tier || 'basic').toUpperCase()}</span>
                      {displayData.listingData && (
                        <span><strong>Listing:</strong> {displayData.listingData.make} {displayData.listingData.model}</span>
                      )}
                      {submission.adminReview?.adminNotes && (
                        <span><strong>Notes:</strong> {submission.adminReview.adminNotes}</span>
                      )}
                    </div>
                    
                    {displayData.hasProof && (
                      <div className="proof-indicator">
                        <FileText size={14} />
                        Payment proof submitted
                        <button 
                          className="view-proof-btn"
                          onClick={() => handleViewProof(displayData.id)}
                          title="View Proof of Payment"
                        >
                          <Eye size={12} />
                          View Proof
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="approval-card-actions">
                    <button
                      className="approve-payment-btn"
                      onClick={() => handleApprovePayment(submission)}
                    >
                      <CreditCard size={16} />
                      Approve Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ENHANCED: Payments Table */}
      <div className="payments-table-section">
        <div className="table-header">
          <h2>Payment History</h2>
          <p>Showing {payments.length} of {pagination.total} payments</p>
        </div>

        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>TRANSACTION</th>
                <th>USER</th>
                <th>AMOUNT</th>
                <th>TIER</th>
                <th>STATUS</th>
                <th>METHOD</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row">
                  <td colSpan="8">
                    <RefreshCw size={20} className="spinning" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan="8">
                    {error ? 'Error loading payments - please retry' : 'No payments found for the selected filters'}
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr key={payment._id || index}>
                    <td>
                      <span className="transaction-ref">{payment.transactionRef || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-email">{payment.userEmail || 'N/A'}</span>
                        {payment.userName && <small>{payment.userName}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="amount-cell">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td>
                      <span className={`tier-badge tier-${payment.subscriptionTier}`}>
                        {(payment.subscriptionTier || 'Basic').toUpperCase()}
                      </span>
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      <span className="method-badge">{payment.paymentMethod || 'Manual'}</span>
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(payment.createdAt)}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn" 
                          title="View Details"
                          onClick={() => console.log('View payment:', payment)}
                        >
                          <Eye size={14} />
                        </button>
                        {(payment.proofOfPayment?.file?.url || payment.proofOfPayment) && (
                          <button 
                            className="download-btn" 
                            title="View Proof of Payment"
                            onClick={() => handleViewProof(payment._id)}
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
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedPayment(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDashboard;
