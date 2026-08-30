// client/src/components/profile/RoleSelectionComponent.js
// COMPLETE VERSION - Fixed API calls to use correct API server

import React, { useState, useEffect } from 'react';
import {
  User, Users, Car, Truck, Building2, Shield,
  MapPin, Phone, Mail, FileText, Upload,
  Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, ChevronDown, ChevronUp, Package, PenTool,
  Network, Wrench
} from 'lucide-react';
import './RoleSelectionComponent.css';

const RoleSelectionComponent = ({ profileData, refreshProfile }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAccessCode, setShowAccessCode] = useState(false);
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
    
    // Courier-specific fields
    transportModes: [],
    deliveryCapacity: '',
    operatingSchedule: '',
    coverageAreas: '',
    courierExperience: '',
    
    // Journalist-specific fields
    writingExperience: '',
    portfolio: '',
    specializations: [],
    motivation: '',
    socialMediaHandles: '',

    // Association-specific fields
    associationName: '',
    associationType: '',
    associationRegistrationNumber: '',
    areaOfOperation: '',
    memberCount: '',
    associationDescription: '',

    // Mechanic-specific fields
    workshopName: '',
    workshopType: '',
    yearsExperience: '',
    mechanicSpecializations: [],
    brandSpecializations: [],
    locationsOfOperation: '',
    certifications: '',
    mobileService: false,
    workshopCapacity: '',

    // Additional Information
    experience: '',
    description: '',

    // Access code (bypass)
    accessCode: '',
    // Existing business claim
    claimedBusinessId: '',
  });

  // Business search state
  const [bizSearchQuery, setBizSearchQuery] = useState('');
  const [bizSearchResults, setBizSearchResults] = useState([]);
  const [bizSearching, setBizSearching] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState(null);

  // API Configuration - Use environment variable or fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

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
    // Courier role
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
    // Journalist role
    'journalist': {
      id: 'journalist',
      title: 'Content Journalist',
      icon: PenTool,
      color: '#06b6d4',
      description: 'Create articles and automotive content for the platform',
      requiresApproval: true,
      benefits: [
        'Create and publish articles',
        'Automotive content management',
        'Traffic-based reward system',
        'Content analytics dashboard',
        'Featured author profile',
        'Content monetization tools'
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
    },
    'association': {
      id: 'association',
      title: 'Association',
      icon: Network,
      color: '#0f766e',
      description: 'Represent a transport or industry association (e.g. taxi associations)',
      requiresApproval: true,
      benefits: [
        'Association management dashboard',
        'Member oversight tools',
        'Industry representation features',
        'Regulatory liaison access',
        'Collective reporting tools'
      ],
      requiredFields: [],
      requiredDocs: []
    },
    'mechanic': {
      id: 'mechanic',
      title: 'Mechanic / Workshop',
      icon: Wrench,
      color: '#e67e22',
      description: 'Register your garage or mobile mechanic service to get found by vehicle owners',
      requiresApproval: true,
      benefits: [
        'Professional workshop profile page',
        'Get found by vehicle owners needing repairs',
        'Showcase specializations and certifications',
        'Customer reviews and ratings',
        'Service booking and inquiry management',
        'List mobile or walk-in services'
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
      
      // FIXED: Use correct API URL
      const response = await fetch(`${API_BASE_URL}/user/role-requests`, {
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

  const searchBusinesses = async (query) => {
    if (!query || query.length < 2) { setBizSearchResults([]); return; }
    setBizSearching(true);
    try {
      let url = '';
      if (selectedRole === 'dealership_admin') {
        url = `${API_BASE_URL}/dealers?search=${encodeURIComponent(query)}&limit=8`;
      } else if (selectedRole === 'transport_admin') {
        url = `${API_BASE_URL}/services?search=${encodeURIComponent(query)}&providerType=public_transport&limit=8`;
      } else if (selectedRole === 'rental_admin') {
        url = `${API_BASE_URL}/services?search=${encodeURIComponent(query)}&providerType=car_rental&limit=8`;
      } else {
        setBizSearching(false);
        return;
      }
      const res = await fetch(url);
      const data = await res.json();
      const items = data.dealers || data.data || [];
      setBizSearchResults(items);
    } catch (_) {
      setBizSearchResults([]);
    } finally {
      setBizSearching(false);
    }
  };

  const selectBusiness = (biz) => {
    setSelectedBiz(biz);
    handleInputChange('claimedBusinessId', biz._id);
    setBizSearchQuery('');
    setBizSearchResults([]);
  };

  const clearSelectedBiz = () => {
    setSelectedBiz(null);
    handleInputChange('claimedBusinessId', '');
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

  // Handle transport modes for courier
  const handleTransportModeChange = (mode, isChecked) => {
    setFormData(prev => ({
      ...prev,
      transportModes: isChecked 
        ? [...prev.transportModes, mode]
        : prev.transportModes.filter(m => m !== mode)
    }));
  };

  // Handle specializations for journalist
  const handleSpecializationChange = (specialization, isChecked) => {
    setFormData(prev => ({
      ...prev,
      specializations: isChecked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  // Handle mechanic service specializations
  const handleMechanicSpecializationChange = (spec, isChecked) => {
    setFormData(prev => ({
      ...prev,
      mechanicSpecializations: isChecked
        ? [...prev.mechanicSpecializations, spec]
        : prev.mechanicSpecializations.filter(s => s !== spec)
    }));
  };

  // Handle mechanic brand specializations (with "All Brands" toggle)
  const ALL_BRANDS_KEY = 'all_brands';
  const handleBrandSpecializationChange = (brand, isChecked) => {
    setFormData(prev => {
      if (brand === ALL_BRANDS_KEY) {
        return { ...prev, brandSpecializations: isChecked ? [ALL_BRANDS_KEY] : [] };
      }
      const without = prev.brandSpecializations.filter(b => b !== brand && b !== ALL_BRANDS_KEY);
      return { ...prev, brandSpecializations: isChecked ? [...without, brand] : without };
    });
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
      
      // Prepare request data as JSON
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
        // Courier-specific data
        transportModes: formData.transportModes,
        deliveryCapacity: formData.deliveryCapacity,
        operatingSchedule: formData.operatingSchedule,
        coverageAreas: formData.coverageAreas,
        courierExperience: formData.courierExperience,
        // Journalist-specific data
        writingExperience: formData.writingExperience,
        portfolio: formData.portfolio,
        motivation: formData.motivation,
        socialMediaHandles: formData.socialMediaHandles,
        // Association-specific data
        associationName: formData.associationName,
        associationType: formData.associationType,
        associationRegistrationNumber: formData.associationRegistrationNumber,
        areaOfOperation: formData.areaOfOperation,
        memberCount: formData.memberCount,
        associationDescription: formData.associationDescription,
        // Mechanic-specific data
        workshopName: formData.workshopName,
        workshopType: formData.workshopType,
        yearsExperience: formData.yearsExperience,
        mechanicSpecializations: formData.mechanicSpecializations,
        brandSpecializations: formData.brandSpecializations,
        locationsOfOperation: formData.locationsOfOperation,
        certifications: formData.certifications,
        mobileService: formData.mobileService,
        workshopCapacity: formData.workshopCapacity,
        // Access code (bypass)
        accessCode: formData.accessCode,
        // Existing business claim
        claimedBusinessId: formData.claimedBusinessId || undefined
      };

      console.log('Submitting role request:', {
        requestType: selectedRole,
        reason: `Application for ${availableRoles[selectedRole].title} role`,
        requestData: requestData
      });

      // FIXED: Use correct API URL
      const response = await fetch(`${API_BASE_URL}/role-requests`, {
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
        if (result.autoApproved) {
          alert(`Access granted! Your "${availableRoles[selectedRole]?.title}" role has been activated.`);
        } else {
          alert('Role request submitted successfully! You will receive an email when it\'s reviewed.');
        }
        setSelectedRole('');
        setShowAccessCode(false);
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
          // Reset journalist fields
          writingExperience: '', portfolio: '', motivation: '', socialMediaHandles: '',
          // Reset association fields
          associationName: '', associationType: '', associationRegistrationNumber: '',
          areaOfOperation: '', memberCount: '', associationDescription: '',
          // Reset mechanic fields
          workshopName: '', workshopType: '', yearsExperience: '', mechanicSpecializations: [],
          brandSpecializations: [], locationsOfOperation: '',
          certifications: '', mobileService: false, workshopCapacity: '',
          businessLicense: null, taxCertificate: null, idDocument: null, proofOfAddress: null,
          accessCode: '',
          claimedBusinessId: ''
        });
        setSelectedBiz(null);
        setBizSearchQuery('');
        setBizSearchResults([]);
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

          {/* Claim Existing Business */}
          {(selectedRole === 'dealership_admin' || selectedRole === 'transport_admin' || selectedRole === 'rental_admin') && (
            <div className="role-form-section">
              <h5>Claim Existing Business <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontSize: '0.8em' }}>(optional)</span></h5>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.83rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                If your business already exists on the platform, search and select it to link it to your account upon approval.
              </p>
              {selectedBiz ? (
                <div className="rsc-selected-biz">
                  <div className="rsc-selected-biz-name">
                    <CheckCircle size={15} style={{ color: '#6ee7b7', flexShrink: 0 }} />
                    {selectedBiz.businessName}
                  </div>
                  <button className="rsc-clear-biz-btn" onClick={clearSelectedBiz} type="button">
                    <XCircle size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div className="rsc-biz-search-wrapper">
                  <div className="rsc-biz-search-input-row">
                    <input
                      type="text"
                      className="rsc-biz-search-input"
                      placeholder="Search by business name or city..."
                      value={bizSearchQuery}
                      onChange={(e) => {
                        setBizSearchQuery(e.target.value);
                        searchBusinesses(e.target.value);
                      }}
                    />
                    {bizSearching && <span className="rsc-biz-searching">Searching…</span>}
                  </div>
                  {bizSearchResults.length > 0 && (
                    <div className="rsc-biz-results">
                      {bizSearchResults.map(biz => (
                        <button
                          key={biz._id}
                          type="button"
                          className="rsc-biz-result-item"
                          onClick={() => selectBusiness(biz)}
                        >
                          <span className="rsc-biz-result-name">{biz.businessName}</span>
                          {(biz.location?.city || biz.contact?.city) && (
                            <span className="rsc-biz-result-city">{biz.location?.city || biz.contact?.city}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
              
              {(selectedRole === 'dealership_admin' || selectedRole === 'transport_admin' || selectedRole === 'rental_admin' || selectedRole === 'association' || selectedRole === 'mechanic') && (
                <div className="role-form-field role-form-field-full">
                  <label>Business / Workshop Address</label>
                  <textarea
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="Enter complete workshop address (leave blank if fully mobile)"
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

          {/* Courier-specific Section */}
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

          {/* Journalist-specific Section */}
          {selectedRole === 'journalist' && (
            <div className="role-form-section">
              <h5>Journalism & Writing Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field role-form-field-full">
                  <label>Writing Experience</label>
                  <textarea
                    value={formData.writingExperience}
                    onChange={(e) => handleInputChange('writingExperience', e.target.value)}
                    placeholder="Describe your writing background, experience in journalism, previous publications, etc."
                    rows="4"
                  />
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Portfolio / Sample Work</label>
                  <textarea
                    value={formData.portfolio}
                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    placeholder="Share links to your published articles, blog posts, or writing samples. Include automotive content if available."
                    rows="3"
                  />
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Content Specializations</label>
                  <div className="role-checkbox-group">
                    {[
                      { value: 'automotive_news', label: 'Automotive News' },
                      { value: 'car_reviews', label: 'Car Reviews' },
                      { value: 'buying_guides', label: 'Buying Guides' },
                      { value: 'maintenance_tips', label: 'Maintenance Tips' },
                      { value: 'transport_policy', label: 'Transport Policy' },
                      { value: 'industry_analysis', label: 'Industry Analysis' },
                      { value: 'local_events', label: 'Local Automotive Events' },
                      { value: 'technology', label: 'Auto Technology' }
                    ].map(spec => (
                      <label key={spec.value} className="role-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec.value)}
                          onChange={(e) => handleSpecializationChange(spec.value, e.target.checked)}
                        />
                        <span>{spec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="role-form-field role-form-field-full">
                  <label>Motivation & Content Vision</label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder="Why do you want to write for Bw Car Culture? What type of content do you plan to create? How will you contribute to the automotive community?"
                    rows="4"
                  />
                </div>
                
                <div className="role-form-field">
                  <label>Social Media / Online Presence</label>
                  <textarea
                    value={formData.socialMediaHandles}
                    onChange={(e) => handleInputChange('socialMediaHandles', e.target.value)}
                    placeholder="Share your social media handles, personal website, or any online presence that showcases your writing or automotive interests"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Association Details Section */}
          {selectedRole === 'association' && (
            <div className="role-form-section">
              <h5>Association Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Association Name</label>
                  <input
                    type="text"
                    value={formData.associationName}
                    onChange={(e) => handleInputChange('associationName', e.target.value)}
                    placeholder="e.g. Gaborone Taxi Operators Association"
                  />
                </div>

                <div className="role-form-field">
                  <label>Association Type</label>
                  <select
                    value={formData.associationType}
                    onChange={(e) => handleInputChange('associationType', e.target.value)}
                  >
                    <option value="">Select association type</option>
                    <option value="taxi_association">Taxi Association</option>
                    <option value="transport_association">Transport Association</option>
                    <option value="combi_association">Combi Association</option>
                    <option value="bus_operators">Bus Operators Association</option>
                    <option value="auto_industry">Auto Industry Association</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="role-form-field">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    value={formData.associationRegistrationNumber}
                    onChange={(e) => handleInputChange('associationRegistrationNumber', e.target.value)}
                    placeholder="Official registration/permit number"
                  />
                </div>

                <div className="role-form-field">
                  <label>Number of Members</label>
                  <input
                    type="number"
                    value={formData.memberCount}
                    onChange={(e) => handleInputChange('memberCount', e.target.value)}
                    placeholder="Approximate number of members"
                    min="1"
                  />
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Area of Operation</label>
                  <textarea
                    value={formData.areaOfOperation}
                    onChange={(e) => handleInputChange('areaOfOperation', e.target.value)}
                    placeholder="Describe the geographic areas or routes your association covers"
                    rows="3"
                  />
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Association Description</label>
                  <textarea
                    value={formData.associationDescription}
                    onChange={(e) => handleInputChange('associationDescription', e.target.value)}
                    placeholder="Describe your association's purpose, goals, and how you oversee your members"
                    rows="4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mechanic / Workshop Section */}
          {selectedRole === 'mechanic' && (
            <div className="role-form-section">
              <h5>Workshop / Service Details</h5>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label>Workshop / Business Name</label>
                  <input
                    type="text"
                    value={formData.workshopName}
                    onChange={(e) => handleInputChange('workshopName', e.target.value)}
                    placeholder="e.g. Kagiso Auto Repairs"
                  />
                </div>

                <div className="role-form-field">
                  <label>Workshop Type</label>
                  <select
                    value={formData.workshopType}
                    onChange={(e) => handleInputChange('workshopType', e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="independent">Independent Workshop</option>
                    <option value="authorized">Authorized / Franchise Workshop</option>
                    <option value="mobile">Mobile Mechanic (no fixed location)</option>
                    <option value="home_based">Home-based Workshop</option>
                    <option value="dealership_workshop">Dealership Workshop</option>
                  </select>
                </div>

                <div className="role-form-field">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="role-form-field">
                  <label>Workshop Capacity (number of bays/lifts)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workshopCapacity}
                    onChange={(e) => handleInputChange('workshopCapacity', e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Certifications / Qualifications</label>
                  <textarea
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    placeholder="List any formal trade certificates, manufacturer certifications, or training (e.g. City & Guilds, Toyota certified, etc.)"
                    rows="3"
                  />
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Specializations</label>
                  <div className="role-checkbox-group">
                    {[
                      { value: 'engine_repair', label: 'Engine Repair & Rebuild' },
                      { value: 'transmission', label: 'Transmission & Gearbox' },
                      { value: 'electrical', label: 'Electrical & Electronics' },
                      { value: 'brakes', label: 'Brake Systems' },
                      { value: 'suspension', label: 'Suspension & Steering' },
                      { value: 'aircon', label: 'Air Conditioning (HVAC)' },
                      { value: 'diagnostics', label: 'Diagnostics & Scanning' },
                      { value: 'body_panel', label: 'Body & Panel Work' },
                      { value: 'tyres', label: 'Tyres & Wheel Alignment' },
                      { value: 'exhaust', label: 'Exhaust & Emissions' },
                      { value: 'auto_glass', label: 'Auto Glass & Windscreens' },
                      { value: 'detailing', label: 'Detailing & Polishing' },
                      { value: '4x4_offroad', label: '4×4 & Off-road' },
                      { value: 'performance', label: 'Performance & Tuning' },
                    ].map(spec => (
                      <label key={spec.value} className="role-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.mechanicSpecializations.includes(spec.value)}
                          onChange={(e) => handleMechanicSpecializationChange(spec.value, e.target.checked)}
                        />
                        <span>{spec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="role-form-field role-form-field-full">
                  <label className="role-checkbox-item" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.mobileService}
                      onChange={(e) => handleInputChange('mobileService', e.target.checked)}
                    />
                    <span>I offer mobile / call-out services (come to the customer's location)</span>
                  </label>
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Vehicle Brand Specializations</label>
                  <div className="role-checkbox-group">
                    <label className="role-checkbox-item role-checkbox-item--highlight">
                      <input
                        type="checkbox"
                        checked={formData.brandSpecializations.includes(ALL_BRANDS_KEY)}
                        onChange={(e) => handleBrandSpecializationChange(ALL_BRANDS_KEY, e.target.checked)}
                      />
                      <span>All Brands (General Workshop)</span>
                    </label>
                    {[
                      'Toyota', 'Volkswagen (VW)', 'BMW', 'Mercedes-Benz', 'Ford',
                      'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Isuzu', 'Mitsubishi',
                      'Land Rover / Range Rover', 'Audi', 'Renault', 'Peugeot',
                      'Chevrolet / Opel', 'Lexus', 'Honda', 'Subaru', 'Volvo',
                      'Jeep', 'Suzuki', 'Fiat / Alfa Romeo', 'Other / Uncommon'
                    ].map(brand => (
                      <label key={brand} className="role-checkbox-item" style={formData.brandSpecializations.includes(ALL_BRANDS_KEY) ? { opacity: 0.4 } : {}}>
                        <input
                          type="checkbox"
                          checked={formData.brandSpecializations.includes(brand)}
                          disabled={formData.brandSpecializations.includes(ALL_BRANDS_KEY)}
                          onChange={(e) => handleBrandSpecializationChange(brand, e.target.checked)}
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Locations / Areas of Operation</label>
                  <textarea
                    value={formData.locationsOfOperation}
                    onChange={(e) => handleInputChange('locationsOfOperation', e.target.value)}
                    placeholder="List the towns and areas you serve, e.g. Gaborone, Tlokweng, Mogoditshane, Francistown (if nationwide write 'Nationwide')"
                    rows="2"
                  />
                </div>

                <div className="role-form-field role-form-field-full">
                  <label>Tell us about your workshop</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your experience, the types of vehicles you work on, what makes your service stand out, and any additional information you'd like potential customers to know."
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

        {/* Access Code */}
        <div className="role-access-code-section">
          <button
            type="button"
            className="role-access-code-toggle"
            onClick={() => setShowAccessCode(prev => !prev)}
          >
            Have an access code?
          </button>
          {showAccessCode && (
            <input
              type="password"
              className="role-access-code-input"
              value={formData.accessCode}
              onChange={(e) => handleInputChange('accessCode', e.target.value)}
              placeholder="Enter access code"
              autoComplete="off"
            />
          )}
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