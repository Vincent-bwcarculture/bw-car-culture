// client/src/components/profile/RoleSelectionComponent.js
// COMPLETE VERSION - Current Working Code with Courier Role Integrated

import React, { useState, useEffect } from 'react';
import { 
  User, Users, Car, Truck, Building2, Shield, 
  MapPin, Phone, Mail, FileText, Upload, 
  Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, ChevronDown, ChevronUp, Package  // Added Package icon for courier
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
    
    // NEW: Courier-specific fields
    transportModes: [],
    deliveryCapacity: '',
    operatingSchedule: '',
    coverageAreas: '',
    courierExperience: '',
    
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
      requiredFields: [],
      requiredDocs: []
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
      requiredFields: [],
      requiredDocs: []
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
      requiredFields: [],
      requiredDocs: []
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
      requiredFields: [],
      requiredDocs: []
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
      requiredFields: [],
      requiredDocs: []
    },
    // NEW: Courier role
    'courier': {
      id: 'courier',
      title: 'Courier Service Provider',
      icon: Package,
      color: '#7c3aed',
      description: 'Deliver packages and goods using various transport modes',
      requiresApproval: true,
      benefits: [
        'Trip posting and management',
        'Transport proof uploads',
        'Delivery capacity management',
        'Earnings analytics',
        'Customer rating system',
        'Flexible schedule management'
      ],
      requiredFields: [],
      requiredDocs: []
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
      requiredFields: [],
      requiredDocs: []
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching pending requests from /user/role-requests');
      
      const response = await fetch('/user/role-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('Pending requests data:', data);
          setPendingRequests(data.data || []);
        } else {
          console.error('Non-JSON response for pending requests');
          setPendingRequests([]);
        }
      } else {
        console.error('Failed to fetch pending requests:', response.status, response.statusText);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
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

  // NEW: Handle transport modes for courier
  const handleTransportModeChange = (mode, isChecked) => {
    setFormData(prev => ({
      ...prev,
      transportModes: isChecked 
        ? [...prev.transportModes, mode]
        : prev.transportModes.filter(m => m !== mode)
    }));
  };

  const validateForm = () => {
    if (!selectedRole) return { isValid: false, message: 'Please select a role' };
    
    const role = availableRoles[selectedRole];
    if (!role) return { isValid: false, message: 'Invalid role selected' };

    // Basic validation - just check if role is selected
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
      
      // Prepare request data as JSON (simplified for now)
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
        specializations: formData.specializations,
        // NEW: Courier-specific data
        transportModes: formData.transportModes,
        deliveryCapacity: formData.deliveryCapacity,
        operatingSchedule: formData.operatingSchedule,
        coverageAreas: formData.coverageAreas,
        courierExperience: formData.courierExperience
      };

      console.log('Submitting role request:', {
        requestType: selectedRole,
        reason: `Application for ${availableRoles[selectedRole].title} role`,
        requestData: requestData
      });

      const response = await fetch('/role-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestType: selectedRole,
          reason: `Application for ${availableRoles[selectedRole].title} role`,
          requestData: requestData
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        alert(`Server error: Expected JSON response but got ${contentType}. Check browser console for details.`);
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        const textResponse = await response.text();
        console.error('Raw response:', textResponse);
        alert('Server error: Invalid JSON response. Check browser console for details.');
        return;
      }
      
      if (response.ok) {
        alert('Role request submitted successfully! You will receive an email when it\'s reviewed.');
        setSelectedRole('');
        setFormData({
          businessName: '', businessType: '', licenseNumber: '', taxId: '', 
          registrationNumber: '', businessPhone: '', businessEmail: '', 
          businessAddress: '', city: '', website: '', serviceType: '', 
          dealershipType: '', transportRoutes: '', fleetSize: '', 
          operatingAreas: '', employeeId: '', department: '', ministryName: '', 
          position: '', experience: '', description: '', specializations: '',
          // Reset courier fields
          transportModes: [], deliveryCapacity: '', operatingSchedule: '', 
          coverageAreas: '', courierExperience: '',
          businessLicense: null, taxCertificate: null, idDocument: null, proofOfAddress: null
        });
        setIsExpanded(false);
        fetchPendingRequests();
        if (refreshProfile) refreshProfile();
      } else {
        console.error('Server error response:', result);
        alert(result?.message || `Server error (${response.status}): ${response.statusText}`);
      }
    } catch (error) {
      console.error('Network/Request error:', error);
      alert(`Network error: ${error.message}. Check your connection and try again.`);
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
          const RoleIcon = role?.icon; // Fix: Store the icon component in a variable
          
          return (
            <div key={index} className={`role-request-item role-request-${request.status}`}>
              <div className="role-request-info">
                {RoleIcon && <RoleIcon size={20} />} {/* Fix: Use the capitalized variable as a component */}
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
          
          <div className="role-improvement-notice">
            <AlertCircle size={16} />
            <span>Providing more information and documents significantly increases your approval chances!</span>
          </div>
        </div>

        <div className="role-form-sections">
          {/* Business Information Section */}
          <div className="role-form-section">
            <h5>Business Information</h5>
            <div className="role-form-grid">
              {(selectedRole === 'dealership_admin' || selectedRole === 'transport_admin' || selectedRole === 'rental_admin') && (
                <div className="role-form-field">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>
              )}
              
              {(selectedRole === 'dealership_admin' || selectedRole === 'rental_admin') && (
                <div className="role-form-field">
                  <label>Business Type</label>
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
              
              {(selectedRole === 'dealership_admin' || selectedRole === 'taxi_driver') && (
                <div className="role-form-field">
                  <label>License Number</label>
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

          {/* Contact Information Section */}
          <div className="role-form-section">
            <h5>Contact Information</h5>
            <div className="role-form-grid">
              <div className="role-form-field">
                <label>Business Phone</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                  placeholder="+267 XX XXX XXX"
                />
              </div>
              
              <div className="role-form-field">
                <label>Business Email</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              
              {(selectedRole === 'dealership_admin' || selectedRole === 'transport_admin' || selectedRole === 'rental_admin') && (
                <div className="role-form-field role-form-field-full">
                  <label>Business Address</label>
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

          {/* Transportation Details Section */}
          {selectedRole === 'transport_admin' && (
            <div className="role-form-section">
              <h5>Transportation Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Service Type</label>
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
                  <label>Fleet Size</label>
                  <input
                    type="number"
                    value={formData.fleetSize}
                    onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                    placeholder="Number of vehicles"
                  />
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Operating Areas</label>
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

          {/* NEW: Courier-specific Section */}
          {selectedRole === 'courier' && (
            <div className="role-form-section">
              <h5>Courier Service Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field role-form-field-full">
                  <label>Transport Modes Available</label>
                  <div className="role-checkbox-group">
                    {[
                      { value: 'private_car', label: 'Private Car' },
                      { value: 'taxi', label: 'Taxi' },
                      { value: 'combi', label: 'Combi' },
                      { value: 'bus', label: 'Bus' },
                      { value: 'motorcycle', label: 'Motorcycle' },
                      { value: 'bicycle', label: 'Bicycle' },
                      { value: 'walking', label: 'Walking' }
                    ].map(mode => (
                      <label key={mode.value} className="role-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.transportModes.includes(mode.value)}
                          onChange={(e) => handleTransportModeChange(mode.value, e.target.checked)}
                        />
                        <span>{mode.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="role-form-field">
                  <label>Delivery Capacity</label>
                  <input
                    type="text"
                    value={formData.deliveryCapacity}
                    onChange={(e) => handleInputChange('deliveryCapacity', e.target.value)}
                    placeholder="e.g., 2kg, small box, medium bag, suitcase"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Operating Schedule</label>
                  <textarea
                    value={formData.operatingSchedule}
                    onChange={(e) => handleInputChange('operatingSchedule', e.target.value)}
                    placeholder="Describe your availability (e.g., weekends, evenings, flexible schedule)"
                    rows="3"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Coverage Areas</label>
                  <textarea
                    value={formData.coverageAreas}
                    onChange={(e) => handleInputChange('coverageAreas', e.target.value)}
                    placeholder="Which areas/routes do you frequently travel? (e.g., Gaborone-Maun, local Gabs deliveries)"
                    rows="3"
                  />
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Courier Experience</label>
                  <textarea
                    value={formData.courierExperience}
                    onChange={(e) => handleInputChange('courierExperience', e.target.value)}
                    placeholder="Tell us about your experience with deliveries, why you want to be a courier, and how you plan to ensure safe delivery"
                    rows="4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Government Details Section */}
          {selectedRole === 'ministry_official' && (
            <div className="role-form-section">
              <h5>Government Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Ministry Name</label>
                  <input
                    type="text"
                    value={formData.ministryName}
                    onChange={(e) => handleInputChange('ministryName', e.target.value)}
                    placeholder="Ministry of Transport and Communications"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department name"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Your position/title"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Employee ID</label>
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

          {/* Supporting Documents Section */}
          <div className="role-form-section">
            <h5>Supporting Documents (Optional)</h5>
            <p className="role-docs-note">Upload documents to improve your approval chances</p>
            <div className="role-form-docs">
              <div className="role-form-doc-upload">
                <label>Business License</label>
                <div className="role-file-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('businessLicense', e.target.files[0])}
                    id="file-businessLicense"
                  />
                  <label htmlFor="file-businessLicense" className="role-file-label">
                    <Upload size={18} />
                    {formData.businessLicense ? formData.businessLicense.name : 'Choose file'}
                  </label>
                </div>
              </div>
              
              <div className="role-form-doc-upload">
                <label>Tax Certificate</label>
                <div className="role-file-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('taxCertificate', e.target.files[0])}
                    id="file-taxCertificate"
                  />
                  <label htmlFor="file-taxCertificate" className="role-file-label">
                    <Upload size={18} />
                    {formData.taxCertificate ? formData.taxCertificate.name : 'Choose file'}
                  </label>
                </div>
              </div>
              
              <div className="role-form-doc-upload">
                <label>ID Document</label>
                <div className="role-file-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('idDocument', e.target.files[0])}
                    id="file-idDocument"
                  />
                  <label htmlFor="file-idDocument" className="role-file-label">
                    <Upload size={18} />
                    {formData.idDocument ? formData.idDocument.name : 'Choose file'}
                  </label>
                </div>
              </div>
              
              <div className="role-form-doc-upload">
                <label>Proof of Address</label>
                <div className="role-file-upload">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('proofOfAddress', e.target.files[0])}
                    id="file-proofOfAddress"
                  />
                  <label htmlFor="file-proofOfAddress" className="role-file-label">
                    <Upload size={18} />
                    {formData.proofOfAddress ? formData.proofOfAddress.name : 'Choose file'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
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

          {selectedRole && renderRoleForm()}
        </div>
      )}
    </div>
  );
};

export default RoleSelectionComponent;