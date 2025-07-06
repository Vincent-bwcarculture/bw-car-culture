// client/src/components/profile/RoleSelection.js
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Car, 
  Shield, 
  Briefcase, 
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import './RoleSelection.css';

const RoleSelection = ({ profileData, refreshProfile }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isRequestingRole, setIsRequestingRole] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Role configurations
  const availableRoles = [
    {
      id: 'dealer',
      title: 'Dealer',
      description: 'Sell cars and manage inventory',
      icon: Car,
      color: '#3b82f6',
      requiresVerification: true,
      benefits: ['List unlimited vehicles', 'Access dealer dashboard', 'Advanced analytics'],
      requirements: ['Business registration', 'Valid trading license', 'Address verification']
    },
    {
      id: 'provider',
      title: 'Service Provider',
      description: 'Offer automotive services',
      icon: Briefcase,
      color: '#059669',
      requiresVerification: true,
      benefits: ['List services', 'Manage bookings', 'Customer reviews'],
      requirements: ['Service certification', 'Business details', 'Insurance proof']
    },
    {
      id: 'ministry',
      title: 'Ministry Official',
      description: 'Government transport oversight',
      icon: Shield,
      color: '#dc2626',
      requiresVerification: true,
      benefits: ['Access transport data', 'Monitor compliance', 'Approve services'],
      requirements: ['Government ID', 'Department verification', 'Official documents']
    },
    {
      id: 'coordinator',
      title: 'Transport Coordinator',
      description: 'Manage transport stations',
      icon: MapPin,
      color: '#f59e0b',
      requiresVerification: true,
      benefits: ['Manage queues', 'Coordinate routes', 'Monitor operations'],
      requirements: ['Station assignment', 'Training certificate', 'Authorization letter']
    }
  ];

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/role-requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const getCurrentUserRole = () => {
    if (!profileData) return 'user';
    return profileData.role || 'user';
  };

  const hasRole = (roleId) => {
    const currentRole = getCurrentUserRole();
    return currentRole === roleId || 
           (roleId === 'dealer' && profileData?.dealership) ||
           (roleId === 'provider' && profileData?.providerId) ||
           (roleId === 'coordinator' && profileData?.coordinatorProfile?.isCoordinator);
  };

  const hasPendingRequest = (roleId) => {
    return pendingRequests.some(req => 
      req.requestType === roleId && req.status === 'pending'
    );
  };

  const handleRoleRequest = async (roleId) => {
    setSelectedRole(roleId);
    setShowRequestForm(true);
    setRequestData({});
  };

  const submitRoleRequest = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = `/api/${selectedRole}-requests`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: selectedRole,
          ...requestData
        })
      });

      if (response.ok) {
        setShowRequestForm(false);
        setSelectedRole('');
        setRequestData({});
        fetchPendingRequests();
        
        // Show success message
        alert(`${selectedRole} role request submitted successfully! You'll receive an email when it's reviewed.`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to submit request'}`);
      }
    } catch (error) {
      console.error('Error submitting role request:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatus = (roleId) => {
    const request = pendingRequests.find(req => req.requestType === roleId);
    if (!request) return null;
    
    return {
      status: request.status,
      submittedAt: request.createdAt,
      reviewNotes: request.reviewNotes
    };
  };

  const renderRoleCard = (role) => {
    const IconComponent = role.icon;
    const userHasRole = hasRole(role.id);
    const isPending = hasPendingRequest(role.id);
    const requestStatus = getRequestStatus(role.id);
    
    return (
      <div key={role.id} className={`role-card ${userHasRole ? 'role-card-active' : ''}`}>
        <div className="role-card-header">
          <div className="role-icon" style={{ backgroundColor: role.color }}>
            <IconComponent size={24} />
          </div>
          <div className="role-info">
            <h3 className="role-title">{role.title}</h3>
            <p className="role-description">{role.description}</p>
          </div>
          <div className="role-status">
            {userHasRole ? (
              <div className="status-badge status-active">
                <CheckCircle size={16} />
                <span>Active</span>
              </div>
            ) : isPending ? (
              <div className="status-badge status-pending">
                <Clock size={16} />
                <span>Pending</span>
              </div>
            ) : (
              <button 
                className="request-role-btn"
                onClick={() => handleRoleRequest(role.id)}
              >
                Request Access
              </button>
            )}
          </div>
        </div>
        
        <div className="role-details">
          <div className="role-benefits">
            <h4>Benefits:</h4>
            <ul>
              {role.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
          
          {role.requiresVerification && (
            <div className="role-requirements">
              <h4>Requirements:</h4>
              <ul>
                {role.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {requestStatus && (
            <div className="request-status">
              <h4>Request Status:</h4>
              <p className={`status-text status-${requestStatus.status}`}>
                {requestStatus.status.charAt(0).toUpperCase() + requestStatus.status.slice(1)}
              </p>
              {requestStatus.reviewNotes && (
                <p className="review-notes">{requestStatus.reviewNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRequestForm = () => {
    const role = availableRoles.find(r => r.id === selectedRole);
    if (!role) return null;

    return (
      <div className="request-form-overlay">
        <div className="request-form">
          <div className="form-header">
            <h3>Request {role.title} Access</h3>
            <button 
              className="close-btn"
              onClick={() => setShowRequestForm(false)}
            >
              ×
            </button>
          </div>
          
          <div className="form-content">
            {selectedRole === 'dealer' && (
              <>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    value={requestData.businessName || ''}
                    onChange={(e) => setRequestData({...requestData, businessName: e.target.value})}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Business Type *</label>
                  <select
                    value={requestData.businessType || ''}
                    onChange={(e) => setRequestData({...requestData, businessType: e.target.value})}
                    required
                  >
                    <option value="">Select business type</option>
                    <option value="dealership">Dealership</option>
                    <option value="private_seller">Private Seller</option>
                    <option value="auction_house">Auction House</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trading License Number *</label>
                  <input
                    type="text"
                    value={requestData.licenseNumber || ''}
                    onChange={(e) => setRequestData({...requestData, licenseNumber: e.target.value})}
                    placeholder="Enter license number"
                    required
                  />
                </div>
              </>
            )}
            
            {selectedRole === 'provider' && (
              <>
                <div className="form-group">
                  <label>Service Type *</label>
                  <select
                    value={requestData.serviceType || ''}
                    onChange={(e) => setRequestData({...requestData, serviceType: e.target.value})}
                    required
                  >
                    <option value="">Select service type</option>
                    <option value="mechanic">Mechanic</option>
                    <option value="body_shop">Body Shop</option>
                    <option value="detailing">Car Detailing</option>
                    <option value="towing">Towing Service</option>
                    <option value="parts_dealer">Parts Dealer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    value={requestData.businessName || ''}
                    onChange={(e) => setRequestData({...requestData, businessName: e.target.value})}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience *</label>
                  <input
                    type="number"
                    value={requestData.experience || ''}
                    onChange={(e) => setRequestData({...requestData, experience: e.target.value})}
                    placeholder="Years in business"
                    min="0"
                    required
                  />
                </div>
              </>
            )}
            
            {selectedRole === 'ministry' && (
              <>
                <div className="form-group">
                  <label>Ministry/Department *</label>
                  <input
                    type="text"
                    value={requestData.ministryName || ''}
                    onChange={(e) => setRequestData({...requestData, ministryName: e.target.value})}
                    placeholder="e.g., Ministry of Transport"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Your Position *</label>
                  <input
                    type="text"
                    value={requestData.position || ''}
                    onChange={(e) => setRequestData({...requestData, position: e.target.value})}
                    placeholder="Your official position"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={requestData.employeeId || ''}
                    onChange={(e) => setRequestData({...requestData, employeeId: e.target.value})}
                    placeholder="Government employee ID"
                    required
                  />
                </div>
              </>
            )}
            
            {selectedRole === 'coordinator' && (
              <>
                <div className="form-group">
                  <label>Station/Terminal *</label>
                  <input
                    type="text"
                    value={requestData.stationName || ''}
                    onChange={(e) => setRequestData({...requestData, stationName: e.target.value})}
                    placeholder="Station you want to coordinate"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transport Experience *</label>
                  <select
                    value={requestData.experience || ''}
                    onChange={(e) => setRequestData({...requestData, experience: e.target.value})}
                    required
                  >
                    <option value="">Select experience level</option>
                    <option value="less_than_1">Less than 1 year</option>
                    <option value="1_to_3">1-3 years</option>
                    <option value="3_to_5">3-5 years</option>
                    <option value="more_than_5">More than 5 years</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                value={requestData.reason || ''}
                onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                placeholder="Tell us why you need this role and any additional information..."
                rows="4"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="btn-cancel"
              onClick={() => setShowRequestForm(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn-submit"
              onClick={submitRoleRequest}
              disabled={loading || !requestData.businessName}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="role-selection-container">
      <div className="section-header">
        <div className="header-content">
          <Users size={24} />
          <div>
            <h2>Role Management</h2>
            <p>Request access to additional features and capabilities</p>
          </div>
        </div>
        <div className="current-role">
          <span>Current Role: </span>
          <span className="role-badge">{getCurrentUserRole()}</span>
        </div>
      </div>
      
      <div className="roles-grid">
        {availableRoles.map(renderRoleCard)}
      </div>
      
      {pendingRequests.length > 0 && (
        <div className="pending-requests">
          <h3>Your Pending Requests</h3>
          <div className="requests-list">
            {pendingRequests.map((request, index) => (
              <div key={index} className="request-item">
                <div className="request-info">
                  <span className="request-type">{request.requestType}</span>
                  <span className="request-date">
                    Submitted {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={`request-status status-${request.status}`}>
                  {request.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showRequestForm && renderRequestForm()}
    </div>
  );
};

export default RoleSelection;
