// client/src/Admin/ServiceVerification/ServiceVerificationPage.js
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, Eye, FileText, User,
  Phone, Mail, MapPin, Calendar, AlertTriangle,
  Search, Filter, Download, RefreshCw, Building
} from 'lucide-react';
import axios from '../../config/axios';
import './ServiceVerificationPage.css';

const ServiceVerificationPage = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    serviceType: 'all',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    loadVerificationRequests();
  }, [filters]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.serviceType !== 'all') queryParams.append('serviceType', filters.serviceType);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await axios.get(`/admin/service-verifications?${queryParams}`);
      setVerificationRequests(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (requestId, action, notes = '') => {
    try {
      setProcessingAction(requestId);
      
      const response = await axios.post(`/admin/service-verifications/${requestId}/${action}`, {
        notes: notes
      });

      if (response.data.success) {
        // Update the request in the list
        setVerificationRequests(prev => 
          prev.map(req => 
            req._id === requestId 
              ? { ...req, verificationStatus: action, reviewedAt: new Date() }
              : req
          )
        );
        
        // Close modal if open
        setSelectedRequest(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} service`);
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'verified': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'car_dealership': return '🚗';
      case 'car_rental': return '🚙';
      case 'trailer_rental': return '🚛';
      case 'public_transport': return '🚌';
      case 'workshop': return '🔧';
      case 'car_wash': return '🧽';
      case 'towing': return '🚜';
      case 'tire_service': return '⚙️';
      default: return '🏢';
    }
  };

  const formatServiceType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <p>Loading verification requests...</p>
      </div>
    );
  }

  return (
    <div className="service-verification-page">
      {/* Header */}
      <div className="verification-header">
        <div className="header-content">
          <h1>Service Verification</h1>
          <p>Review and verify business service applications</p>
        </div>
        
        <div className="header-actions">
          <button className="refresh-button" onClick={() => loadVerificationRequests()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="verification-filters">
        <div className="filters-row">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by business name or user..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select 
              value={filters.serviceType}
              onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="car_dealership">Car Dealership</option>
              <option value="car_rental">Car Rental</option>
              <option value="trailer_rental">Trailer Rental</option>
              <option value="public_transport">Public Transport</option>
              <option value="workshop">Auto Workshop</option>
              <option value="car_wash">Car Wash</option>
              <option value="towing">Towing Service</option>
              <option value="tire_service">Tire Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="verification-stats">
        <div className="stat-card">
          <div className="stat-number">
            {verificationRequests.filter(r => r.verificationStatus === 'pending').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {verificationRequests.filter(r => r.verificationStatus === 'verified').length}
          </div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {verificationRequests.filter(r => r.verificationStatus === 'rejected').length}
          </div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{verificationRequests.length}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Verification Requests List */}
      <div className="verification-list">
        {verificationRequests.length === 0 ? (
          <div className="empty-state">
            <Building size={48} />
            <h3>No verification requests</h3>
            <p>No service verification requests match your current filters.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {verificationRequests.map(request => (
              <VerificationCard 
                key={request._id}
                request={request}
                onView={() => setSelectedRequest(request)}
                onQuickAction={handleVerificationAction}
                isProcessing={processingAction === request._id}
                getStatusColor={getStatusColor}
                getServiceTypeIcon={getServiceTypeIcon}
                formatServiceType={formatServiceType}
              />
            ))}
          </div>
        )}
      </div>

      {/* Verification Detail Modal */}
      {selectedRequest && (
        <VerificationDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAction={handleVerificationAction}
          isProcessing={processingAction === selectedRequest._id}
          getStatusColor={getStatusColor}
          formatServiceType={formatServiceType}
        />
      )}
    </div>
  );
};

// Verification Card Component
const VerificationCard = ({ 
  request, 
  onView, 
  onQuickAction, 
  isProcessing,
  getStatusColor,
  getServiceTypeIcon,
  formatServiceType 
}) => {
  return (
    <div className="verification-card">
      <div className="card-header">
        <div className="service-info">
          <span className="service-icon">
            {getServiceTypeIcon(request.serviceType)}
          </span>
          <div className="service-details">
            <h3>{request.serviceName}</h3>
            <p>{formatServiceType(request.serviceType)}</p>
          </div>
        </div>
        
        <span className={`status-badge ${getStatusColor(request.verificationStatus)}`}>
          {request.verificationStatus}
        </span>
      </div>

      <div className="card-body">
        <div className="user-info">
          <User size={14} />
          <span>{request.userName}</span>
        </div>
        
        <div className="location-info">
          <MapPin size={14} />
          <span>{request.location?.city || 'Location not specified'}</span>
        </div>
        
        <div className="date-info">
          <Calendar size={14} />
          <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
        </div>
        
        <div className="documents-info">
          <FileText size={14} />
          <span>{request.verificationDocuments?.length || 0} documents</span>
        </div>
      </div>

      <div className="card-actions">
        <button className="view-button" onClick={onView}>
          <Eye size={14} />
          View Details
        </button>
        
        {request.verificationStatus === 'pending' && (
          <div className="quick-actions">
            <button 
              className="approve-button"
              onClick={() => onQuickAction(request._id, 'approve')}
              disabled={isProcessing}
            >
              <CheckCircle size={14} />
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
            <button 
              className="reject-button"
              onClick={() => onQuickAction(request._id, 'reject')}
              disabled={isProcessing}
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Verification Detail Modal Component
const VerificationDetailModal = ({ 
  request, 
  onClose, 
  onAction, 
  isProcessing,
  getStatusColor,
  formatServiceType 
}) => {
  const [actionNotes, setActionNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);

  const handleAction = (action) => {
    setSelectedAction(action);
  };

  const confirmAction = () => {
    if (selectedAction) {
      onAction(request._id, selectedAction, actionNotes);
      setSelectedAction(null);
      setActionNotes('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Service Verification Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Service Information */}
          <div className="section">
            <h3>Service Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Service Name:</label>
                <span>{request.serviceName}</span>
              </div>
              <div className="info-item">
                <label>Service Type:</label>
                <span>{formatServiceType(request.serviceType)}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${getStatusColor(request.verificationStatus)}`}>
                  {request.verificationStatus}
                </span>
              </div>
              <div className="info-item">
                <label>Submitted:</label>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="section">
            <h3>Business Owner Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{request.userName}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{request.userEmail}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{request.contactInfo?.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>WhatsApp:</label>
                <span>{request.contactInfo?.whatsapp || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="section">
            <h3>Location Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Address:</label>
                <span>{request.location?.address || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>City:</label>
                <span>{request.location?.city || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Service Description */}
          <div className="section">
            <h3>Service Description</h3>
            <p className="description">{request.description}</p>
          </div>

          {/* Operating Hours */}
          {request.operatingHours && (
            <div className="section">
              <h3>Operating Hours</h3>
              <div className="hours-grid">
                {Object.entries(request.operatingHours).map(([day, hours]) => (
                  <div key={day} className="hours-item">
                    <span className="day">{day.charAt(0).toUpperCase() + day.slice(1)}:</span>
                    <span className="hours">
                      {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Documents */}
          <div className="section">
            <h3>Verification Documents</h3>
            {request.verificationDocuments?.length > 0 ? (
              <div className="documents-list">
                {request.verificationDocuments.map((doc, index) => (
                  <div key={index} className="document-item">
                    <FileText size={16} />
                    <span>{doc.type}</span>
                    <button className="view-doc-button">
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-documents">No documents uploaded</p>
            )}
          </div>

          {/* Action Notes */}
          {selectedAction && (
            <div className="section">
              <h3>Add Notes</h3>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add notes about your decision (optional)"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          {!selectedAction ? (
            <>
              <button className="cancel-button" onClick={onClose}>
                Close
              </button>
              {request.verificationStatus === 'pending' && (
                <>
                  <button 
                    className="reject-action-button"
                    onClick={() => handleAction('reject')}
                  >
                    <XCircle size={16} />
                    Reject Service
                  </button>
                  <button 
                    className="approve-action-button"
                    onClick={() => handleAction('approve')}
                  >
                    <CheckCircle size={16} />
                    Approve Service
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button 
                className="cancel-button" 
                onClick={() => setSelectedAction(null)}
              >
                Cancel
              </button>
              <button 
                className={`confirm-button ${selectedAction}`}
                onClick={confirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Confirm ${selectedAction}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceVerificationPage;
