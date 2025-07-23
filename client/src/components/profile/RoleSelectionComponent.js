// client/src/components/profile/RoleSelectionComponent.js
import React, { useState, useEffect } from 'react';
import { 
  User, Users, Car, Truck, Building2, Shield, 
  MapPin, Phone, Mail, FileText, Upload, 
  Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import './RoleSelectionComponent.css';

const RoleSelectionComponent = ({ profileData, refreshProfile }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [formData, setFormData] = useState({
    // Business Details
    businessName: '',
    businessType: '',
    licenseNumber: '',
    taxId: '',
    registrationNumber: '',
    
    // Contact Details
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    city: '',
    website: '',
    
    // Verification Documents
    businessLicense: null,
    taxCertificate: null,
    idDocument: null,
    proofOfAddress: null,
    
    // Role-specific fields
    serviceType: '',
    dealershipType: '',
    transportRoutes: '',
    fleetSize: '',
    operatingAreas: '',
    employeeId: '',
    department: '',
    ministryName: '',
    position: '',
    
    // Additional Information
    experience: '',
    description: '',
    specializations: ''
  });

  const availableRoles = {
    'dealership_admin': {
      id: 'dealership_admin',
      title: 'Dealership Admin',
      icon: Car,
      color: '#e74c3c',
      description: 'Manage car dealership listings and inventory',
      requiresApproval: true,
      benefits: [
        'Upload and manage vehicle listings',
        'Access to pricing tools',
        'Customer management dashboard',
        'Sales analytics and reports'
      ],
      requiredFields: ['businessName', 'businessType', 'licenseNumber', 'businessPhone', 'businessAddress'],
      requiredDocs: ['businessLicense', 'idDocument']
    },
    'transport_admin': {
      id: 'transport_admin',
      title: 'Public Transport Admin',
      icon: Users,
      color: '#3498db',
      description: 'Manage public transportation services',
      requiresApproval: true,
      benefits: [
        'Route management system',
        'Fleet tracking capabilities',
        'Passenger analytics',
        'Schedule optimization tools'
      ],
      requiredFields: ['businessName', 'serviceType', 'fleetSize', 'operatingAreas', 'businessPhone'],
      requiredDocs: ['businessLicense', 'idDocument', 'taxCertificate']
    },
    'rental_admin': {
      id: 'rental_admin',
      title: 'Car Rental Company Admin',
      icon: Building2,
      color: '#9b59b6',
      description: 'Manage car rental services and fleet',
      requiresApproval: true,
      benefits: [
        'Fleet management system',
        'Booking management',
        'Customer tracking',
        'Revenue analytics'
      ],
      requiredFields: ['businessName', 'businessType', 'fleetSize', 'businessPhone', 'businessAddress'],
      requiredDocs: ['businessLicense', 'idDocument', 'taxCertificate']
    },
    'transport_coordinator': {
      id: 'transport_coordinator',
      title: 'Public Transport Coordinator',
      icon: MapPin,
      color: '#f39c12',
      description: 'Coordinate public transport operations',
      requiresApproval: true,
      benefits: [
        'Route coordination tools',
        'Real-time tracking',
        'Driver communication',
        'Performance monitoring'
      ],
      requiredFields: ['employeeId', 'department', 'position', 'businessPhone'],
      requiredDocs: ['idDocument', 'proofOfAddress']
    },
    'taxi_driver': {
      id: 'taxi_driver',
      title: 'Taxi Driver',
      icon: Truck,
      color: '#27ae60',
      description: 'Professional taxi driver services',
      requiresApproval: true,
      benefits: [
        'Driver dashboard',
        'Trip tracking',
        'Earnings management',
        'Customer ratings'
      ],
      requiredFields: ['licenseNumber', 'businessPhone', 'operatingAreas'],
      requiredDocs: ['idDocument', 'businessLicense']
    },
    'ministry_official': {
      id: 'ministry_official',
      title: 'Ministry Official',
      icon: Shield,
      color: '#34495e',
      description: 'Government transport ministry access',
      requiresApproval: true,
      benefits: [
        'Regulatory oversight tools',
        'Policy management',
        'Industry analytics',
        'Compliance monitoring'
      ],
      requiredFields: ['ministryName', 'department', 'position', 'employeeId'],
      requiredDocs: ['idDocument', 'proofOfAddress']
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/role-requests', {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const validateForm = () => {
    if (!selectedRole) return { isValid: false, message: 'Please select a role' };
    
    const role = availableRoles[selectedRole];
    if (!role) return { isValid: false, message: 'Invalid role selected' };

    // Check required fields
    const missingFields = role.requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      return { 
        isValid: false, 
        message: `Please fill in all required fields: ${missingFields.join(', ')}` 
      };
    }

    // Check required documents
    const missingDocs = role.requiredDocs.filter(doc => !formData[doc]);
    if (missingDocs.length > 0) {
      return { 
        isValid: false, 
        message: `Please upload all required documents: ${missingDocs.join(', ')}` 
      };
    }

    return { isValid: true };
  };

  const submitRoleRequest = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Add basic request data
      formDataToSend.append('requestType', selectedRole);
      formDataToSend.append('reason', `Application for ${availableRoles[selectedRole].title} role`);
      
      // Add form fields as JSON
      const requestData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        licenseNumber: formData.licenseNumber,
        taxId: formData.taxId,
        registrationNumber: formData.registrationNumber,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,
        businessAddress: formData.businessAddress,
        city: formData.city,
        website: formData.website,
        serviceType: formData.serviceType,
        dealershipType: formData.dealershipType,
        transportRoutes: formData.transportRoutes,
        fleetSize: formData.fleetSize,
        operatingAreas: formData.operatingAreas,
        employeeId: formData.employeeId,
        department: formData.department,
        ministryName: formData.ministryName,
        position: formData.position,
        experience: formData.experience,
        description: formData.description,
        specializations: formData.specializations
      };
      
      formDataToSend.append('requestData', JSON.stringify(requestData));
      
      // Add file uploads
      Object.keys(formData).forEach(key => {
        if (formData[key] instanceof File) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/role-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Role request submitted successfully! You will receive an email when it\'s reviewed.');
        setSelectedRole('');
        setFormData({});
        setIsExpanded(false);
        fetchPendingRequests();
        if (refreshProfile) refreshProfile();
      } else {
        alert(result.message || 'Failed to submit role request');
      }
    } catch (error) {
      console.error('Error submitting role request:', error);
      alert('Failed to submit role request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <div className="role-pending-requests">
        <h4>Your Role Requests</h4>
        {pendingRequests.map((request, index) => {
          const role = availableRoles[request.requestType];
          const StatusIcon = request.status === 'pending' ? Clock : 
                           request.status === 'approved' ? CheckCircle : 
                           XCircle;
          
          return (
            <div key={index} className={`role-request-item role-request-${request.status}`}>
              <div className="role-request-info">
                {role && <role.icon size={20} />}
                <div>
                  <strong>{role?.title || request.requestType}</strong>
                  <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="role-request-status">
                <StatusIcon size={18} />
                <span>{request.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRoleForm = () => {
    if (!selectedRole) return null;
    
    const role = availableRoles[selectedRole];
    
    return (
      <div className="role-form-container">
        <div className="role-form-header">
          <h4>Application for {role.title}</h4>
          <p>{role.description}</p>
        </div>

        <div className="role-form-sections">
          {/* Business Information Section */}
          {(role.requiredFields.includes('businessName') || role.requiredFields.includes('businessType')) && (
            <div className="role-form-section">
              <h5>Business Information</h5>
              <div className="role-form-grid">
                {role.requiredFields.includes('businessName') && (
                  <div className="role-form-field">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Enter your business name"
                    />
                  </div>
                )}
                
                {role.requiredFields.includes('businessType') && (
                  <div className="role-form-field">
                    <label>Business Type *</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                    >
                      <option value="">Select business type</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="corporation">Corporation</option>
                      <option value="llc">LLC</option>
                    </select>
                  </div>
                )}
                
                {role.requiredFields.includes('licenseNumber') && (
                  <div className="role-form-field">
                    <label>License Number *</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                )}
                
                <div className="role-form-field">
                  <label>Tax ID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="Enter tax ID number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          <div className="role-form-section">
            <h5>Contact Information</h5>
            <div className="role-form-grid">
              {role.requiredFields.includes('businessPhone') && (
                <div className="role-form-field">
                  <label>Business Phone *</label>
                  <input
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="+267 XX XXX XXX"
                  />
                </div>
              )}
              
              <div className="role-form-field">
                <label>Business Email</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              
              {role.requiredFields.includes('businessAddress') && (
                <div className="role-form-field role-form-field-full">
                  <label>Business Address *</label>
                  <textarea
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="Enter complete business address"
                    rows="3"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Role-specific fields */}
          {role.id === 'transport_admin' && (
            <div className="role-form-section">
              <h5>Transportation Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Service Type *</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  >
                    <option value="">Select service type</option>
                    <option value="bus">Bus Service</option>
                    <option value="taxi">Taxi Service</option>
                    <option value="shuttle">Shuttle Service</option>
                    <option value="freight">Freight Transport</option>
                  </select>
                </div>
                
                <div className="role-form-field">
                  <label>Fleet Size *</label>
                  <input
                    type="number"
                    value={formData.fleetSize}
                    onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                    placeholder="Number of vehicles"
                  />
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Operating Areas *</label>
                  <textarea
                    value={formData.operatingAreas}
                    onChange={(e) => handleInputChange('operatingAreas', e.target.value)}
                    placeholder="List the areas where you operate"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          {role.id === 'ministry_official' && (
            <div className="role-form-section">
              <h5>Government Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Ministry Name *</label>
                  <input
                    type="text"
                    value={formData.ministryName}
                    onChange={(e) => handleInputChange('ministryName', e.target.value)}
                    placeholder="Ministry of Transport and Communications"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department name"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Position *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Your position/title"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="Government employee ID"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Section */}
          <div className="role-form-section">
            <h5>Required Documents</h5>
            <div className="role-form-docs">
              {role.requiredDocs.map(doc => (
                <div key={doc} className="role-form-doc-upload">
                  <label>
                    {doc === 'businessLicense' && 'Business License *'}
                    {doc === 'taxCertificate' && 'Tax Certificate *'}
                    {doc === 'idDocument' && 'ID Document *'}
                    {doc === 'proofOfAddress' && 'Proof of Address *'}
                  </label>
                  <div className="role-file-upload">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(doc, e.target.files[0])}
                      id={`file-${doc}`}
                    />
                    <label htmlFor={`file-${doc}`} className="role-file-label">
                      <Upload size={18} />
                      {formData[doc] ? formData[doc].name : 'Choose file'}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="role-form-section">
            <h5>Additional Information</h5>
            <div className="role-form-field">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us more about your business and why you need this role"
                rows="4"
              />
            </div>
          </div>
        </div>

        <div className="role-form-actions">
          <button
            onClick={() => setSelectedRole('')}
            className="role-form-cancel"
          >
            Cancel
          </button>
          <button
            onClick={submitRoleRequest}
            disabled={loading}
            className="role-form-submit"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-header">
        <div className="role-selection-title">
          <Users size={20} />
          <h3>Role & Access Management</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="role-selection-toggle"
        >
          {isExpanded ? 'Hide Options' : 'Request Business Access'}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {renderPendingRequests()}

      {isExpanded && (
        <div className="role-selection-content">
          <div className="role-selection-intro">
            <h4>Apply for Business Roles</h4>
            <p>Select a role that matches your business needs. All business roles require verification and admin approval.</p>
          </div>

          {!selectedRole && (
            <div className="role-options-grid">
              {Object.values(availableRoles).map(role => {
                const IconComponent = role.icon;
                
                return (
                  <div
                    key={role.id}
                    className="role-option-card"
                    onClick={() => setSelectedRole(role.id)}
                    style={{ '--role-color': role.color }}
                  >
                    <div className="role-option-icon">
                      <IconComponent size={24} />
                    </div>
                    <div className="role-option-content">
                      <h4>{role.title}</h4>
                      <p>{role.description}</p>
                      <div className="role-option-benefits">
                        <strong>Benefits:</strong>
                        <ul>
                          {role.benefits.slice(0, 2).map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                          {role.benefits.length > 2 && (
                            <li>+{role.benefits.length - 2} more...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="role-option-footer">
                      <span className="role-approval-required">
                        <AlertCircle size={14} />
                        Requires Approval
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {renderRoleForm()}
        </div>
      )}
    </div>
  );
};

export default RoleSelectionComponent;
