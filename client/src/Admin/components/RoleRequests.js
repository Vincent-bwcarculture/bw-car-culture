// client/src/Admin/RoleManager/RoleManager.js
// ENHANCED VERSION - Better styling, more application details, unique classes

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
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Award,
  Calendar,
  Briefcase
} from 'lucide-react';
import './RoleRequests.css';

const RoleManager = () => {
  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

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

  // Role configuration with enhanced details
  const roleConfig = {
    journalist: {
      title: 'Content Journalist',
      icon: PenTool,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      description: 'Creates articles and automotive content'
    },
    dealership_admin: {
      title: 'Dealership Admin',
      icon: Car,
      color: '#e74c3c',
      bgColor: 'rgba(231, 76, 60, 0.1)',
      description: 'Manages car dealership operations'
    },
    courier: {
      title: 'Courier Service',
      icon: Package,
      color: '#7c3aed',
      bgColor: 'rgba(124, 58, 237, 0.1)',
      description: 'Provides delivery and courier services'
    },
    transport_admin: {
      title: 'Transport Admin',
      icon: Users,
      color: '#3498db',
      bgColor: 'rgba(52, 152, 219, 0.1)',
      description: 'Manages public transportation services'
    },
    transport_coordinator: {
      title: 'Transport Coordinator',
      icon: MapPin,
      color: '#f39c12',
      bgColor: 'rgba(243, 156, 18, 0.1)',
      description: 'Coordinates transport routes'
    },
    rental_admin: {
      title: 'Rental Admin',
      icon: Building2,
      color: '#9b59b6',
      bgColor: 'rgba(155, 89, 182, 0.1)',
      description: 'Manages car rental services'
    },
    ministry_official: {
      title: 'Ministry Official',
      icon: Shield,
      color: '#34495e',
      bgColor: 'rgba(52, 73, 94, 0.1)',
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

      const response = await fetch(`${API_BASE_URL}/api/admin/role-requests?${params}`, {
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
      
      const response = await fetch(`${API_BASE_URL}/api/admin/role-requests/${requestId}`, {
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
        loadRequests();
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
      request.requestType?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    const role = roleConfig[request.requestType] || {
      title: request.requestType,
      icon: User,
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      description: 'Role request'
    };
    
    const IconComponent = role.icon;

    return (
      <div key={request._id} className="bw-role-card">
        <div className="bw-role-card__header">
          <div className="bw-role-card__info">
            <div 
              className="bw-role-card__icon"
              style={{ backgroundColor: role.color }}
            >
              <IconComponent size={22} />
            </div>
            <div className="bw-role-card__details">
              <h3 className="bw-role-card__title">{role.title}</h3>
              <p className="bw-role-card__description">{role.description}</p>
            </div>
          </div>
          
          <div className="bw-role-card__status">
            <span className={`bw-status-badge bw-status-badge--${request.status}`}>
              {request.status === 'pending' && <Clock size={14} />}
              {request.status === 'approved' && <CheckCircle size={14} />}
              {request.status === 'rejected' && <XCircle size={14} />}
              {request.status}
            </span>
          </div>
        </div>

        <div className="bw-role-card__user-info">
          <div className="bw-user-details">
            <div className="bw-user-detail">
              <User size={16} />
              <span className="bw-user-detail__text">{request.userName}</span>
            </div>
            <div className="bw-user-detail">
              <Mail size={16} />
              <span className="bw-user-detail__text">{request.userEmail}</span>
            </div>
            <div className="bw-user-detail">
              <Calendar size={16} />
              <span className="bw-user-detail__text">Applied {formatDate(request.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Application Preview */}
        {request.requestType === 'journalist' && request.roleSpecificInfo && (
          <div className="bw-app-preview bw-app-preview--journalist">
            <h4 className="bw-app-preview__title">
              <FileText size={16} />
              Journalist Application Summary
            </h4>
            
            {request.roleSpecificInfo.writingExperience && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">Writing Experience:</strong>
                <p className="bw-app-field__content">
                  {request.roleSpecificInfo.writingExperience.substring(0, 150)}
                  {request.roleSpecificInfo.writingExperience.length > 150 && '...'}
                </p>
              </div>
            )}

            {request.roleSpecificInfo.portfolio && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">
                  <Globe size={14} />
                  Portfolio:
                </strong>
                <p className="bw-app-field__content">
                  {request.roleSpecificInfo.portfolio.substring(0, 100)}
                  {request.roleSpecificInfo.portfolio.length > 100 && '...'}
                </p>
              </div>
            )}

            {request.roleSpecificInfo.specializations?.length > 0 && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">
                  <Award size={14} />
                  Specializations:
                </strong>
                <div className="bw-tags">
                  {request.roleSpecificInfo.specializations.slice(0, 4).map((spec, index) => (
                    <span key={index} className="bw-tag bw-tag--journalist">
                      {spec.replace('_', ' ')}
                    </span>
                  ))}
                  {request.roleSpecificInfo.specializations.length > 4 && (
                    <span className="bw-tag-more">+{request.roleSpecificInfo.specializations.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            {request.roleSpecificInfo.motivation && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">Motivation:</strong>
                <p className="bw-app-field__content">
                  {request.roleSpecificInfo.motivation.substring(0, 120)}
                  {request.roleSpecificInfo.motivation.length > 120 && '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Courier Preview */}
        {request.requestType === 'courier' && request.roleSpecificInfo && (
          <div className="bw-app-preview bw-app-preview--courier">
            <h4 className="bw-app-preview__title">
              <Package size={16} />
              Courier Application Summary
            </h4>
            
            {request.roleSpecificInfo.transportModes?.length > 0 && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">Transport Modes:</strong>
                <div className="bw-tags">
                  {request.roleSpecificInfo.transportModes.slice(0, 4).map((mode, index) => (
                    <span key={index} className="bw-tag bw-tag--courier">
                      {mode.replace('_', ' ')}
                    </span>
                  ))}
                  {request.roleSpecificInfo.transportModes.length > 4 && (
                    <span className="bw-tag-more">+{request.roleSpecificInfo.transportModes.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            {request.roleSpecificInfo.deliveryCapacity && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">Capacity:</strong>
                <p className="bw-app-field__content">{request.roleSpecificInfo.deliveryCapacity}</p>
              </div>
            )}

            {request.roleSpecificInfo.coverageAreas && (
              <div className="bw-app-field">
                <strong className="bw-app-field__label">Coverage Areas:</strong>
                <p className="bw-app-field__content">
                  {request.roleSpecificInfo.coverageAreas.substring(0, 100)}
                  {request.roleSpecificInfo.coverageAreas.length > 100 && '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Business Info Preview */}
        {(request.businessInfo?.businessName || request.contactInfo?.businessPhone) && (
          <div className="bw-business-preview">
            <h4 className="bw-business-preview__title">
              <Briefcase size={16} />
              Business Information
            </h4>
            <div className="bw-business-details">
              {request.businessInfo?.businessName && (
                <div className="bw-business-detail">
                  <Building2 size={14} />
                  <span>{request.businessInfo.businessName}</span>
                </div>
              )}
              {request.contactInfo?.businessPhone && (
                <div className="bw-business-detail">
                  <Phone size={14} />
                  <span>{request.contactInfo.businessPhone}</span>
                </div>
              )}
              {request.contactInfo?.businessEmail && (
                <div className="bw-business-detail">
                  <Mail size={14} />
                  <span>{request.contactInfo.businessEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bw-role-card__actions">
          <button 
            className="bw-btn bw-btn--view"
            onClick={() => setSelectedRequest(request)}
          >
            <Eye size={16} />
            View Full Details
          </button>
          
          {request.status === 'pending' && (
            <>
              <button 
                className="bw-btn bw-btn--approve"
                onClick={() => handleRequestAction(request._id, 'approved')}
                disabled={actionLoading}
              >
                <CheckCircle size={16} />
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button 
                className="bw-btn bw-btn--reject"
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

    const role = roleConfig[selectedRequest.requestType] || {
      title: selectedRequest.requestType,
      icon: User,
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)'
    };

    return (
      <div className="bw-modal-overlay" onClick={() => setSelectedRequest(null)}>
        <div className="bw-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bw-modal__header">
            <div className="bw-modal__title-section">
              <div 
                className="bw-modal__role-icon"
                style={{ backgroundColor: role.color }}
              >
                <role.icon size={24} />
              </div>
              <h2 className="bw-modal__title">{role.title} Application Details</h2>
            </div>
            <button 
              className="bw-modal__close"
              onClick={() => setSelectedRequest(null)}
            >
              ×
            </button>
          </div>

          <div className="bw-modal__content">
            {/* Applicant Information */}
            <div className="bw-modal-section">
              <h3 className="bw-modal-section__title">
                <User size={20} />
                Applicant Information
              </h3>
              <div className="bw-info-grid">
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Full Name:</span>
                  <span className="bw-info-item__value">{selectedRequest.userName}</span>
                </div>
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Email Address:</span>
                  <span className="bw-info-item__value">{selectedRequest.userEmail}</span>
                </div>
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Application Date:</span>
                  <span className="bw-info-item__value">{formatDate(selectedRequest.createdAt)}</span>
                </div>
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Current Status:</span>
                  <span className={`bw-status-text bw-status-text--${selectedRequest.status}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Priority Level:</span>
                  <span className="bw-info-item__value">{selectedRequest.priority || 'Normal'}</span>
                </div>
                <div className="bw-info-item">
                  <span className="bw-info-item__label">Request ID:</span>
                  <span className="bw-info-item__value bw-mono">{selectedRequest._id}</span>
                </div>
              </div>
            </div>

            {/* Business Information */}
            {(selectedRequest.businessInfo || selectedRequest.contactInfo) && (
              <div className="bw-modal-section">
                <h3 className="bw-modal-section__title">
                  <Briefcase size={20} />
                  Business Information
                </h3>
                <div className="bw-info-grid">
                  {selectedRequest.businessInfo?.businessName && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Business Name:</span>
                      <span className="bw-info-item__value">{selectedRequest.businessInfo.businessName}</span>
                    </div>
                  )}
                  {selectedRequest.businessInfo?.businessType && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Business Type:</span>
                      <span className="bw-info-item__value">{selectedRequest.businessInfo.businessType}</span>
                    </div>
                  )}
                  {selectedRequest.businessInfo?.licenseNumber && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">License Number:</span>
                      <span className="bw-info-item__value bw-mono">{selectedRequest.businessInfo.licenseNumber}</span>
                    </div>
                  )}
                  {selectedRequest.businessInfo?.taxId && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Tax ID:</span>
                      <span className="bw-info-item__value bw-mono">{selectedRequest.businessInfo.taxId}</span>
                    </div>
                  )}
                  {selectedRequest.contactInfo?.businessPhone && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Business Phone:</span>
                      <span className="bw-info-item__value">{selectedRequest.contactInfo.businessPhone}</span>
                    </div>
                  )}
                  {selectedRequest.contactInfo?.businessEmail && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Business Email:</span>
                      <span className="bw-info-item__value">{selectedRequest.contactInfo.businessEmail}</span>
                    </div>
                  )}
                  {selectedRequest.contactInfo?.businessAddress && (
                    <div className="bw-info-item bw-info-item--full">
                      <span className="bw-info-item__label">Business Address:</span>
                      <span className="bw-info-item__value">{selectedRequest.contactInfo.businessAddress}</span>
                    </div>
                  )}
                  {selectedRequest.businessInfo?.website && (
                    <div className="bw-info-item">
                      <span className="bw-info-item__label">Website:</span>
                      <span className="bw-info-item__value">
                        <a href={selectedRequest.businessInfo.website} target="_blank" rel="noopener noreferrer">
                          {selectedRequest.businessInfo.website}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Journalist Application */}
            {selectedRequest.requestType === 'journalist' && selectedRequest.roleSpecificInfo && (
              <div className="bw-modal-section">
                <h3 className="bw-modal-section__title">
                  <PenTool size={20} />
                  Journalism Application Details
                </h3>
                
                {selectedRequest.roleSpecificInfo.writingExperience && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      <FileText size={18} />
                      Writing Experience & Background
                    </h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.writingExperience}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.portfolio && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      <Globe size={18} />
                      Portfolio & Sample Work
                    </h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.portfolio}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.specializations?.length > 0 && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      <Award size={18} />
                      Content Specializations
                    </h4>
                    <div className="bw-detail-block__content">
                      <div className="bw-tags bw-tags--large">
                        {selectedRequest.roleSpecificInfo.specializations.map((spec, index) => (
                          <span key={index} className="bw-tag bw-tag--journalist bw-tag--large">
                            {spec.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.motivation && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      💭 Motivation & Content Vision
                    </h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.motivation}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.socialMediaHandles && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      🌐 Social Media & Online Presence
                    </h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.socialMediaHandles}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Courier Application */}
            {selectedRequest.requestType === 'courier' && selectedRequest.roleSpecificInfo && (
              <div className="bw-modal-section">
                <h3 className="bw-modal-section__title">
                  <Package size={20} />
                  Courier Service Details
                </h3>
                
                {selectedRequest.roleSpecificInfo.transportModes?.length > 0 && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">
                      🚗 Available Transport Modes
                    </h4>
                    <div className="bw-detail-block__content">
                      <div className="bw-tags bw-tags--large">
                        {selectedRequest.roleSpecificInfo.transportModes.map((mode, index) => (
                          <span key={index} className="bw-tag bw-tag--courier bw-tag--large">
                            {mode.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.deliveryCapacity && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">📦 Delivery Capacity</h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.deliveryCapacity}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.operatingSchedule && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">⏰ Operating Schedule</h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.operatingSchedule}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.coverageAreas && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">📍 Coverage Areas</h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.coverageAreas}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.roleSpecificInfo.courierExperience && (
                  <div className="bw-detail-block">
                    <h4 className="bw-detail-block__title">📋 Courier Experience</h4>
                    <div className="bw-detail-block__content">
                      <p>{selectedRequest.roleSpecificInfo.courierExperience}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Application Reason */}
            {selectedRequest.reason && (
              <div className="bw-modal-section">
                <h3 className="bw-modal-section__title">
                  <FileText size={20} />
                  Application Reason
                </h3>
                <div className="bw-detail-block__content">
                  <p>{selectedRequest.reason}</p>
                </div>
              </div>
            )}

            {/* Admin Review Notes */}
            {(selectedRequest.adminNotes || selectedRequest.reviewNotes) && (
              <div className="bw-modal-section bw-modal-section--admin">
                <h3 className="bw-modal-section__title">📋 Admin Review Notes</h3>
                <div className="bw-detail-block__content">
                  <p>{selectedRequest.adminNotes || selectedRequest.reviewNotes}</p>
                  {selectedRequest.reviewedByName && (
                    <div className="bw-review-meta">
                      <small>
                        Reviewed by <strong>{selectedRequest.reviewedByName}</strong> on {formatDate(selectedRequest.reviewedAt)}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedRequest.status === 'pending' && (
            <div className="bw-modal__actions">
              <button 
                className="bw-btn bw-btn--approve bw-btn--large"
                onClick={() => handleRequestAction(selectedRequest._id, 'approved')}
                disabled={actionLoading}
              >
                <CheckCircle size={18} />
                {actionLoading ? 'Processing...' : 'Approve Application'}
              </button>
              <button 
                className="bw-btn bw-btn--reject bw-btn--large"
                onClick={() => handleRequestAction(selectedRequest._id, 'rejected')}
                disabled={actionLoading}
              >
                <XCircle size={18} />
                {actionLoading ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bw-role-manager">
      <div className="bw-page-header">
        <div className="bw-page-header__content">
          <h1 className="bw-page-header__title">🔐 Role Management Dashboard</h1>
          <p className="bw-page-header__subtitle">Review and manage user role applications</p>
        </div>
        <div className="bw-page-header__stats">
          <div className="bw-stat">
            <span className="bw-stat__number">{requests.filter(r => r.status === 'pending').length}</span>
            <span className="bw-stat__label">Pending Applications</span>
          </div>
          <div className="bw-stat">
            <span className="bw-stat__number">{requests.filter(r => r.requestType === 'journalist').length}</span>
            <span className="bw-stat__label">Journalist Applications</span>
          </div>
          <div className="bw-stat">
            <span className="bw-stat__number">{requests.filter(r => r.status === 'approved').length}</span>
            <span className="bw-stat__label">Approved</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bw-filters">
        <div className="bw-search">
          <Search size={20} />
          <input
            className="bw-search__input"
            type="text"
            placeholder="Search by name, email, or role type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="bw-filter-select"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select 
          className="bw-filter-select"
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="journalist">Content Journalist</option>
          <option value="dealership_admin">Dealership Admin</option>
          <option value="courier">Courier Service</option>
          <option value="transport_admin">Transport Admin</option>
          <option value="transport_coordinator">Transport Coordinator</option>
          <option value="rental_admin">Rental Admin</option>
          <option value="ministry_official">Ministry Official</option>
        </select>
      </div>

      {/* Messages */}
      {error && (
        <div className="bw-message bw-message--error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bw-message bw-message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="bw-requests-section">
        {loading ? (
          <div className="bw-loading">
            <div className="bw-loading__spinner"></div>
            <p className="bw-loading__text">Loading role requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bw-empty">
            <Users size={64} />
            <h3 className="bw-empty__title">No Role Requests Found</h3>
            <p className="bw-empty__text">No role requests match your current filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="bw-requests-grid">
            {filteredRequests.map(renderRequestCard)}
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {renderRequestModal()}
    </div>
  );
};

export default RoleManager;