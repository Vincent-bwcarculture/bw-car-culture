// client/src/Admin/RoleManager/RoleManager.js
import React, { useState, useEffect } from 'react';
import { 
  User, 
  PenTool, 
  Car, 
  Package, 
  Building2,
  Shield,
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Search,
  Users,
  MapPin
} from 'lucide-react';
import './RoleManager.css';

const RoleManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Role configuration
  const roleConfig = {
    journalist: {
      title: 'Content Journalist',
      icon: PenTool,
      color: '#06b6d4',
      description: 'Creates articles and automotive content'
    },
    dealership_admin: {
      title: 'Dealership Admin',
      icon: Car,
      color: '#e74c3c',
      description: 'Manages car dealership operations'
    },
    courier: {
      title: 'Courier Service',
      icon: Package,
      color: '#7c3aed',
      description: 'Provides delivery and courier services'
    },
    transport_admin: {
      title: 'Transport Admin',
      icon: Users,
      color: '#3498db',
      description: 'Manages public transportation services'
    },
    transport_coordinator: {
      title: 'Transport Coordinator',
      icon: MapPin,
      color: '#f39c12',
      description: 'Coordinates transport routes'
    },
    rental_admin: {
      title: 'Rental Admin',
      icon: Building2,
      color: '#9b59b6',
      description: 'Manages car rental services'
    },
    ministry_official: {
      title: 'Ministry Official',
      icon: Shield,
      color: '#34495e',
      description: 'Government transport oversight'
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus, filterRole]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const params = new URLSearchParams({
        status: filterStatus,
        limit: 20
      });
      
      if (filterRole !== 'all') {
        params.append('requestType', filterRole);
      }

      const response = await fetch(`/api/admin/role-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests(data.data || []);
        } else {
          setError(data.message || 'Failed to load requests');
        }
      } else {
        setError(`Failed to load requests: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setError('Network error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action, notes = '') => {
    try {
      setActionLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/role-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action,
          adminNotes: notes
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(`Role request ${action} successfully`);
        setSelectedRequest(null);
        loadRequests(); // Reload the list
      } else {
        setError(data.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      setError(`Network error: Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  const renderRequestCard = (request) => {
    const role = roleConfig[request.role] || {
      title: request.role,
      icon: User,
      color: '#6b7280',
      description: 'Role request'
    };
    
    const IconComponent = role.icon;

    return (
      <div key={request._id} className="role-request-card">
        <div className="request-header">
          <div className="request-role-info">
            <div 
              className="role-icon"
              style={{ backgroundColor: role.color }}
            >
              <IconComponent size={20} />
            </div>
            <div className="role-details">
              <h3>{role.title}</h3>
              <p>{role.description}</p>
            </div>
          </div>
          
          <div className="request-status">
            <span className={`status-badge ${request.status}`}>
              {request.status === 'pending' && <Clock size={14} />}
              {request.status === 'approved' && <CheckCircle size={14} />}
              {request.status === 'rejected' && <XCircle size={14} />}
              {request.status}
            </span>
          </div>
        </div>

        <div className="request-user-info">
          <div className="user-basic-info">
            <div className="user-detail">
              <User size={16} />
              <span>{request.userName}</span>
            </div>
            <div className="user-detail">
              <span>📧</span>
              <span>{request.userEmail}</span>
            </div>
            <div className="user-detail">
              <span>📅</span>
              <span>Applied {formatDate(request.submittedAt)}</span>
            </div>
          </div>
        </div>

        {/* Show application data for journalists */}
        {request.role === 'journalist' && request.applicationData && (
          <div className="journalist-application-preview">
            <h4>📝 Application Summary</h4>
            {request.applicationData.writingExperience && (
              <div className="application-field">
                <strong>Writing Experience:</strong>
                <p>{request.applicationData.writingExperience.substring(0, 120)}...</p>
              </div>
            )}
            {request.applicationData.specializations?.length > 0 && (
              <div className="application-field">
                <strong>Specializations:</strong>
                <div className="specializations">
                  {request.applicationData.specializations.slice(0, 3).map((spec, index) => (
                    <span key={index} className="specialization-tag">
                      {spec.replace('_', ' ')}
                    </span>
                  ))}
                  {request.applicationData.specializations.length > 3 && (
                    <span className="more-specs">+{request.applicationData.specializations.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="request-actions">
          <button 
            className="view-btn"
            onClick={() => setSelectedRequest(request)}
          >
            <Eye size={16} />
            View Details
          </button>
          
          {request.status === 'pending' && (
            <>
              <button 
                className="approve-btn"
                onClick={() => handleRequestAction(request._id, 'approved')}
                disabled={actionLoading}
              >
                <CheckCircle size={16} />
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleRequestAction(request._id, 'rejected')}
                disabled={actionLoading}
              >
                <XCircle size={16} />
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderRequestModal = () => {
    if (!selectedRequest) return null;

    const role = roleConfig[selectedRequest.role] || {
      title: selectedRequest.role,
      icon: User,
      color: '#6b7280'
    };

    return (
      <div className="request-modal-overlay" onClick={() => setSelectedRequest(null)}>
        <div className="request-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{role.title} Application Details</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedRequest(null)}
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            <div className="applicant-info">
              <h3>👤 Applicant Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span>Name:</span>
                  <span>{selectedRequest.userName}</span>
                </div>
                <div className="info-item">
                  <span>Email:</span>
                  <span>{selectedRequest.userEmail}</span>
                </div>
                <div className="info-item">
                  <span>Applied:</span>
                  <span>{formatDate(selectedRequest.submittedAt)}</span>
                </div>
                <div className="info-item">
                  <span>Status:</span>
                  <span className={`status-text ${selectedRequest.status}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed application data for journalists */}
            {selectedRequest.role === 'journalist' && selectedRequest.applicationData && (
              <div className="application-details">
                <h3>📝 Journalist Application Details</h3>
                
                {selectedRequest.applicationData.writingExperience && (
                  <div className="detail-section">
                    <h4>✍️ Writing Experience</h4>
                    <p>{selectedRequest.applicationData.writingExperience}</p>
                  </div>
                )}

                {selectedRequest.applicationData.portfolio && (
                  <div className="detail-section">
                    <h4>📂 Portfolio / Sample Work</h4>
                    <p>{selectedRequest.applicationData.portfolio}</p>
                  </div>
                )}

                {selectedRequest.applicationData.specializations?.length > 0 && (
                  <div className="detail-section">
                    <h4>🎯 Content Specializations</h4>
                    <div className="specializations">
                      {selectedRequest.applicationData.specializations.map((spec, index) => (
                        <span key={index} className="specialization-tag">
                          {spec.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.applicationData.motivation && (
                  <div className="detail-section">
                    <h4>💭 Motivation & Content Vision</h4>
                    <p>{selectedRequest.applicationData.motivation}</p>
                  </div>
                )}

                {selectedRequest.applicationData.socialMediaHandles && (
                  <div className="detail-section">
                    <h4>🌐 Social Media / Online Presence</h4>
                    <p>{selectedRequest.applicationData.socialMediaHandles}</p>
                  </div>
                )}
              </div>
            )}

            {/* Review notes */}
            {selectedRequest.notes && (
              <div className="review-notes">
                <h3>📋 Admin Notes</h3>
                <p>{selectedRequest.notes}</p>
                {selectedRequest.reviewedBy && (
                  <small>Reviewed by: {selectedRequest.reviewedBy} on {formatDate(selectedRequest.reviewedAt)}</small>
                )}
              </div>
            )}
          </div>

          {selectedRequest.status === 'pending' && (
            <div className="modal-actions">
              <button 
                className="approve-btn"
                onClick={() => handleRequestAction(selectedRequest._id, 'approved')}
                disabled={actionLoading}
              >
                <CheckCircle size={16} />
                {actionLoading ? 'Processing...' : 'Approve Request'}
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleRequestAction(selectedRequest._id, 'rejected')}
                disabled={actionLoading}
              >
                <XCircle size={16} />
                {actionLoading ? 'Processing...' : 'Reject Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="role-manager-container">
      <div className="page-header">
        <div className="header-content">
          <h1>🔐 Role Management</h1>
          <p>Review and manage user role applications</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{requests.filter(r => r.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-number">{requests.filter(r => r.role === 'journalist').length}</span>
            <span className="stat-label">Journalists</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="journalist">Journalist</option>
          <option value="dealership_admin">Dealership Admin</option>
          <option value="courier">Courier</option>
          <option value="transport_admin">Transport Admin</option>
          <option value="transport_coordinator">Transport Coordinator</option>
          <option value="rental_admin">Rental Admin</option>
          <option value="ministry_official">Ministry Official</option>
        </select>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="message success">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Requests List */}
      <div className="requests-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading role requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No Role Requests Found</h3>
            <p>No role requests match your current filters.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map(renderRequestCard)}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {renderRequestModal()}
    </div>
  );
};

export default RoleManager;
