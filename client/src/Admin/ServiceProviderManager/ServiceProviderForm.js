// src/components/admin/ServiceProviderManager/ServiceProviderForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './ServiceProviderForm.css';
import { PROVIDER_TYPES } from './providerTypes.js';
import { DAYS_OF_WEEK } from './../../constants/general.js';

const ServiceProviderForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    providerType: PROVIDER_TYPES.CAR_RENTAL, // Remove DEALERSHIP as default
    businessType: 'independent',
    user: '',
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    profile: {
      description: '',
      specialties: [''],
      workingHours: {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '17:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { open: '', close: '' }
      }
    },
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: ''
    },
    status: 'active'
  });

  // Enhanced function to get image URL with S3 support
  const getImageUrl = (imageData, type = 'logo') => {
    try {
      if (!imageData) return `/images/placeholders/${type}.jpg`;

      // If imageData is a string, use it directly
      if (typeof imageData === 'string') {
        // Fix problematic S3 URLs with duplicate paths
        if (imageData.includes('/images/images/')) {
          return imageData.replace(/\/images\/images\//g, '/images/');
        }
        return imageData;
      }
      
      // If imageData is an object with url property
      if (imageData && typeof imageData === 'object') {
        const imageUrl = imageData.url || '';
        
        // If we have an S3 key but no URL, create proxy URL
        if (!imageUrl && imageData.key) {
          return `/api/images/s3-proxy/${imageData.key}`;
        }
        
        if (imageUrl) {
          // Fix problematic S3 URLs with duplicate paths
          if (imageUrl.includes('/images/images/')) {
            return imageUrl.replace(/\/images\/images\//g, '/images/');
          }
          return imageUrl;
        }
      }
      
      // Fallback to placeholder
      return `/images/placeholders/${type}.jpg`;
    } catch (error) {
      console.error(`Error getting ${type} image URL:`, error);
      return `/images/placeholders/${type}.jpg`;
    }
  };
  
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [adminUser, setAdminUser] = useState(null);
  const [existingProviders, setExistingProviders] = useState([]);
  
  const { user: currentUser } = useAuth();
  
  // Updated tabs configuration - removed dealership-specific tabs
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'contact', label: 'Contact & Location' },
    { id: 'profile', label: 'Profile' },
    { id: 'hours', label: 'Working Hours' },
    { id: 'social', label: 'Social Media' },
    { id: 'specific', label: 'Service Details' } // Renamed from 'Specific Details'
  ];

  // Fetch users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await http.get('/auth/users');
        if (response.data.success) {
          const allUsers = response.data.data || [];
          setUsers(allUsers);
          
          // Find the admin user to use as default for unassigned providers
          const adminUserFound = allUsers.find(user => user.role === 'admin');
          if (adminUserFound) {
            setAdminUser(adminUserFound);
            
            // If creating a new provider and no user is set, default to admin
            if (!initialData && !formData.user) {
              setFormData(prev => ({
                ...prev,
                user: adminUserFound._id
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [initialData]);

  // Check for existing providers but allow multiple of same type
  useEffect(() => {
    if (formData.user && formData.providerType) {
      // Clear previous warnings when user or provider type changes
      setWarning(null);
      setError(null);
      
      const checkExistingProvider = async () => {
        try {
          // Only check if we're creating a new provider, not editing an existing one
          if (!initialData) {
            const response = await http.get('/providers', {
              params: {
                user: formData.user,
                providerType: formData.providerType
              }
            });
            
            if (response.data.success && response.data.data.length > 0) {
              // Set a warning message instead of an error
              setExistingProviders(response.data.data);
              setWarning(`Note: This user already has ${response.data.data.length} ${formData.providerType} provider account(s). Multiple providers are allowed.`);
            } else {
              setExistingProviders([]);
              setWarning(null);
            }
          }
        } catch (err) {
          console.error('Error checking existing providers:', err);
        }
      };
      
      checkExistingProvider();
    }
  }, [formData.user, formData.providerType, initialData]);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      // Clone the initial data to avoid modifying it directly
      const formattedData = { ...initialData };
      
      // Ensure required nested objects exist
      formattedData.contact = formattedData.contact || {};
      formattedData.location = formattedData.location || {};
      formattedData.profile = formattedData.profile || {};
      formattedData.social = formattedData.social || {};
      
      // Ensure working hours are properly formatted
      if (formattedData.profile) {
        formattedData.profile.workingHours = formattedData.profile.workingHours || {};
        
        // Initialize empty hours for any missing days
        DAYS_OF_WEEK.forEach(day => {
          formattedData.profile.workingHours[day] = 
            formattedData.profile.workingHours[day] || { open: '', close: '' };
        });
      }
      
      // Ensure specialties is an array
      if (formattedData.profile && !Array.isArray(formattedData.profile.specialties)) {
        formattedData.profile.specialties = formattedData.profile.specialties 
          ? formattedData.profile.specialties.split(',') 
          : [''];
      }
      
      // Set logo and banner previews if available
      if (formattedData.profile?.logo) {
        setLogoPreview(getImageUrl(formattedData.profile.logo, 'logo'));
      }
      
      if (formattedData.profile?.banner) {
        setBannerPreview(getImageUrl(formattedData.profile.banner, 'banner'));
      }
      
      setFormData(formattedData);
    } else {
      // For new providers, set current admin user as default if available
      if (adminUser) {
        setFormData(prev => ({
          ...prev,
          user: adminUser._id || ''
        }));
      } else if (currentUser?.role === 'admin') {
        // If no admin user found yet but current user is admin, use current user
        setFormData(prev => ({
          ...prev,
          user: currentUser?.id || ''
        }));
      }
    }
  }, [initialData, adminUser, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        workingHours: {
          ...prev.profile.workingHours,
          [day]: {
            ...prev.profile.workingHours[day],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSpecialtiesChange = (index, value) => {
    const updatedSpecialties = [...formData.profile.specialties];
    updatedSpecialties[index] = value;
    
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        specialties: updatedSpecialties
      }
    }));
  };

  const addSpecialty = () => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        specialties: [...prev.profile.specialties, '']
      }
    }));
  };

  const removeSpecialty = (index) => {
    const updatedSpecialties = [...formData.profile.specialties];
    updatedSpecialties.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        specialties: updatedSpecialties
      }
    }));
  };

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [platform]: value
      }
    }));
  };

  // Enhanced Logo Change Handler
  const handleLogoChange = (file) => {
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError(`Invalid logo file type: ${file.type}. Please use JPEG, PNG, or WebP.`);
      return;
    }
    
    if (file.size > maxSize) {
      setError(`Logo file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Store the file for upload
    setLogo(file);
    
    // Clear any previous error
    setError(null);
    
    // Log for debugging
    console.log(`Logo prepared for upload: ${file.name}, ${file.type}, ${file.size} bytes`);
  };

  // Enhanced Banner Change Handler
  const handleBannerChange = (file) => {
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError(`Invalid banner file type: ${file.type}. Please use JPEG, PNG, or WebP.`);
      return;
    }
    
    if (file.size > maxSize) {
      setError(`Banner file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Store the file for upload
    setBanner(file);
    
    // Clear any previous error
    setError(null);
    
    // Log for debugging
    console.log(`Banner prepared for upload: ${file.name}, ${file.type}, ${file.size} bytes`);
  };

  // Enhanced handleSubmit Function for S3 Support
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Enhanced validation
    const validationErrors = [];
    
    if (!formData.businessName || formData.businessName.trim() === '') {
      validationErrors.push('Business name is required');
    }
    
    if (!formData.providerType) {
      validationErrors.push('Provider type is required');
    }
    
    if (!formData.businessType) {
      validationErrors.push('Business type is required');
    }
    
    // Validate provider type
    if (formData.providerType && !Object.values(PROVIDER_TYPES).includes(formData.providerType)) {
      validationErrors.push('Invalid provider type selected');
    }
    
    // Validate contact information
    if (formData.contact?.email && !/^\S+@\S+\.\S+$/.test(formData.contact.email)) {
      validationErrors.push('Please enter a valid email address');
    }
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    try {
      setLoading(true);
      
      // Create FormData for multipart upload
      const formDataToSubmit = new FormData();
      
      // Add simple fields directly
      formDataToSubmit.append('businessName', formData.businessName.trim());
      formDataToSubmit.append('providerType', formData.providerType);
      formDataToSubmit.append('businessType', formData.businessType);
      formDataToSubmit.append('status', formData.status);
      
      // Add user ID if creating new provider
      if (!initialData && formData.user) {
        formDataToSubmit.append('user', formData.user);
      }
      
      // Add JSON strings for nested objects
      formDataToSubmit.append('contact', JSON.stringify(formData.contact || {}));
      formDataToSubmit.append('location', JSON.stringify(formData.location || {}));
      formDataToSubmit.append('social', JSON.stringify(formData.social || {}));
      
      // Special handling for profile to preserve existing images if not updating
      const profileData = { ...formData.profile };
      
      // Clean up specialties array
      if (profileData.specialties) {
        profileData.specialties = profileData.specialties
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
      
      // If initialData exists and we're not uploading new images, preserve existing ones
      if (initialData && initialData.profile) {
        if (!logo && initialData.profile.logo) {
          profileData.logo = initialData.profile.logo;
          console.log('Preserving existing logo');
        }
        
        if (!banner && initialData.profile.banner) {
          profileData.banner = initialData.profile.banner;
          console.log('Preserving existing banner');
        }
      }
      
      formDataToSubmit.append('profile', JSON.stringify(profileData));
      
      // Add service-specific data based on provider type (excluding dealership)
      if (formData.providerType === PROVIDER_TYPES.CAR_RENTAL && formData.carRental) {
        formDataToSubmit.append('carRental', JSON.stringify(formData.carRental || {}));
      } else if (formData.providerType === PROVIDER_TYPES.TRAILER_RENTAL && formData.trailerRental) {
        formDataToSubmit.append('trailerRental', JSON.stringify(formData.trailerRental || {}));
      } else if (formData.providerType === PROVIDER_TYPES.PUBLIC_TRANSPORT && formData.publicTransport) {
        formDataToSubmit.append('publicTransport', JSON.stringify(formData.publicTransport || {}));
      } else if (formData.providerType === PROVIDER_TYPES.WORKSHOP && formData.workshop) {
        formDataToSubmit.append('workshop', JSON.stringify(formData.workshop || {}));
      }
      
      // Add images if updated
      if (logo) {
        formDataToSubmit.append('logo', logo);
        console.log('Adding logo file:', logo.name, logo.type, logo.size);
      }
      
      if (banner) {
        formDataToSubmit.append('banner', banner);
        console.log('Adding banner file:', banner.name, banner.type, banner.size);
      }
      
      // Log form structure for debugging
      console.log('Submitting provider form data:');
      for (let [key, value] of formDataToSubmit.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name}, ${value.type}, ${value.size} bytes`);
        } else if (['profile', 'contact', 'location', 'social'].includes(key)) {
          console.log(`${key}: ${value.substring(0, 50)}...`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Submit the form
      await onSubmit(formDataToSubmit);
      
      // Close the form on success
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle provider type change - update business type options
  const handleProviderTypeChange = (e) => {
    const providerType = e.target.value;
    
    // Set default business type based on provider type
    let defaultBusinessType = 'independent';
    
    if (providerType === PROVIDER_TYPES.WORKSHOP) {
      defaultBusinessType = 'authorized';
    } else if (providerType === PROVIDER_TYPES.PUBLIC_TRANSPORT) {
      defaultBusinessType = 'independent';
    }
    
    setFormData(prev => ({
      ...prev,
      providerType,
      businessType: defaultBusinessType
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="spm-service-provider-form-overlay">
      <div className="spm-service-provider-form-container">
        <div className="spm-service-provider-form-header">
          <div className="spm-header-content">
            <h2>{initialData ? 'Edit Service Provider' : 'Add New Service Provider'}</h2>
            <p className="spm-form-subtitle">
              Service providers can offer car rentals, trailer rentals, transport services, or workshop services. 
              Users can have multiple service providers of different types.
            </p>
          </div>
          <button className="spm-close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="spm-form-error-message">{error}</div>}
        {warning && <div className="spm-form-warning-message">{warning}</div>}
        
        {existingProviders.length > 0 && (
          <div className="spm-existing-providers">
            <h3>Existing Providers for Selected User:</h3>
            <ul className="spm-provider-list">
              {existingProviders.map(provider => (
                <li key={provider._id} className="spm-provider-list-item">
                  {provider.businessName} ({provider.providerType})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="spm-service-provider-form-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`spm-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="spm-service-provider-form">
          {activeTab === 'basic' && (
            <div className="spm-form-tab-content">
              <div className="spm-form-group">
                <label htmlFor="businessName">Business Name *</label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="spm-form-input"
                  placeholder="Enter your business name"
                />
              </div>
              
              <div className="spm-form-row">
                <div className="spm-form-group">
                  <label htmlFor="providerType">Service Type *</label>
                  <select
                    id="providerType"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleProviderTypeChange}
                    required
                    className="spm-form-select"
                  >
                    <option value={PROVIDER_TYPES.CAR_RENTAL}>Car Rental Service</option>
                    <option value={PROVIDER_TYPES.TRAILER_RENTAL}>Trailer Rental Service</option>
                    <option value={PROVIDER_TYPES.PUBLIC_TRANSPORT}>Public Transport Service</option>
                    <option value={PROVIDER_TYPES.WORKSHOP}>Workshop Service</option>
                  </select>
                  <small className="spm-field-note">
                    Note: Dealerships are managed separately in the Dealership Manager
                  </small>
                </div>
                
                <div className="spm-form-group">
                  <label htmlFor="businessType">Business Type *</label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    className="spm-form-select"
                  >
                    {formData.providerType === PROVIDER_TYPES.WORKSHOP && (
                      <>
                        <option value="authorized">Authorized Workshop</option>
                        <option value="independent">Independent Workshop</option>
                      </>
                    )}
                    {[PROVIDER_TYPES.CAR_RENTAL, PROVIDER_TYPES.TRAILER_RENTAL].includes(formData.providerType) && (
                      <>
                        <option value="independent">Independent</option>
                        <option value="franchise">Franchise</option>
                        <option value="certified">Certified</option>
                      </>
                    )}
                    {formData.providerType === PROVIDER_TYPES.PUBLIC_TRANSPORT && (
                      <>
                        <option value="independent">Independent</option>
                        <option value="authorized">Authorized</option>
                        <option value="government">Government</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="user">Associated User</label>
                <select
                  id="user"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  disabled={loadingUsers || initialData}
                  className="spm-form-select"
                >
                  <option value="">Unassigned (Admin Managed)</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                      {user.role === 'admin' ? ' - Admin' : ''}
                    </option>
                  ))}
                </select>
                {loadingUsers && <div className="spm-loading-indicator">Loading users...</div>}
                <small className="spm-field-note">
                  {initialData 
                    ? "User association cannot be changed when editing existing providers"
                    : "If unassigned, provider will be managed by admin account. Otherwise, select the user who will manage this provider."
                  }
                </small>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="spm-form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              <div className="spm-image-upload-section">
                <div className="spm-form-group">
                  <label>Logo</label>
                  <div className="spm-logo-upload-container">
                    {logoPreview ? (
                      <div className="spm-logo-preview">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          onError={(e) => {
                            console.error('Logo preview failed to load:', e.target.src);
                            e.target.src = '/images/placeholders/logo.jpg';
                          }}
                        />
                        <button 
                          type="button" 
                          className="spm-remove-image-btn"
                          onClick={() => {
                            setLogo(null);
                            setLogoPreview('');
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="spm-logo-upload-button">
                        <input
                          type="file"
                          id="logo"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoChange(e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="logo">Upload Logo</label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="spm-form-group">
                  <label>Banner</label>
                  <div className="spm-banner-upload-container">
                    {bannerPreview ? (
                      <div className="spm-banner-preview">
                        <img 
                          src={bannerPreview} 
                          alt="Banner Preview" 
                          onError={(e) => {
                            console.error('Banner preview failed to load:', e.target.src);
                            e.target.src = '/images/placeholders/banner.jpg';
                          }}
                        />
                        <button 
                          type="button" 
                          className="spm-remove-image-btn"
                          onClick={() => {
                            setBanner(null);
                            setBannerPreview('');
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="spm-banner-upload-button">
                        <input
                          type="file"
                          id="banner"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleBannerChange(e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="banner">Upload Banner</label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div className="spm-form-tab-content">
              <h3>Contact Information</h3>
              <div className="spm-form-row">
                <div className="spm-form-group">
                  <label htmlFor="contact.phone">Phone</label>
                  <input
                    type="tel"
                    id="contact.phone"
                    name="contact.phone"
                    value={formData.contact?.phone || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="+267 71 234 567"
                  />
                </div>
                
                <div className="spm-form-group">
                  <label htmlFor="contact.email">Email</label>
                  <input
                    type="email"
                    id="contact.email"
                    name="contact.email"
                    value={formData.contact?.email || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="business@example.com"
                  />
                </div>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="contact.website">Website</label>
                <input
                  type="url"
                  id="contact.website"
                  name="contact.website"
                  value={formData.contact?.website || ''}
                  onChange={handleChange}
                  className="spm-form-input"
                  placeholder="https://www.yourbusiness.com"
                />
              </div>
              
              <h3>Location</h3>
              <div className="spm-form-group">
                <label htmlFor="location.address">Street Address</label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location?.address || ''}
                  onChange={handleChange}
                  className="spm-form-input"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="spm-form-row">
                <div className="spm-form-group">
                  <label htmlFor="location.city">City</label>
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location?.city || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="Gaborone"
                  />
                </div>
                
                <div className="spm-form-group">
                  <label htmlFor="location.state">State/Province</label>
                  <input
                    type="text"
                    id="location.state"
                    name="location.state"
                    value={formData.location?.state || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="South East District"
                  />
                </div>
              </div>
              
              <div className="spm-form-row">
                <div className="spm-form-group">
                  <label htmlFor="location.country">Country</label>
                  <input
                    type="text"
                    id="location.country"
                    name="location.country"
                    value={formData.location?.country || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="Botswana"
                  />
                </div>
                
                <div className="spm-form-group">
                  <label htmlFor="location.postalCode">Postal Code</label>
                  <input
                    type="text"
                    id="location.postalCode"
                    name="location.postalCode"
                    value={formData.location?.postalCode || ''}
                    onChange={handleChange}
                    className="spm-form-input"
                    placeholder="Private Bag"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="spm-form-tab-content">
              <div className="spm-form-group">
                <label htmlFor="profile.description">Business Description</label>
                <textarea
                  id="profile.description"
                  name="profile.description"
                  value={formData.profile?.description || ''}
                  onChange={handleChange}
                  rows={5}
                  className="spm-form-textarea"
                  placeholder="Describe your business, services offered, and what makes you unique..."
                />
              </div>
              
              <div className="spm-form-group">
                <label>Services/Specialties</label>
                {formData.profile?.specialties?.map((specialty, index) => (
                  <div key={index} className="spm-specialty-input-row">
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => handleSpecialtiesChange(index, e.target.value)}
                      placeholder="Enter a service or specialty"
                      className="spm-form-input"
                    />
                    {formData.profile.specialties.length > 1 && (
                      <button 
                        type="button" 
                        className="spm-remove-specialty-btn"
                        onClick={() => removeSpecialty(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="spm-add-specialty-btn"
                  onClick={addSpecialty}
                >
                  + Add Service
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'hours' && (
            <div className="spm-form-tab-content">
              <h3>Business Hours</h3>
              <div className="spm-working-hours-container">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="spm-working-hours-row">
                    <div className="spm-day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <div className="spm-hours-inputs">
                      <div className="spm-hours-input-group">
                        <label>Open</label>
                        <input
                          type="time"
                          value={formData.profile?.workingHours?.[day]?.open || ''}
                          onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                          className="spm-form-input"
                        />
                      </div>
                      <div className="spm-hours-input-group">
                        <label>Close</label>
                        <input
                          type="time"
                          value={formData.profile?.workingHours?.[day]?.close || ''}
                          onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                          className="spm-form-input"
                        />
                      </div>
                      <div className="spm-closed-toggle">
                        <label>
                          <input
                            type="checkbox"
                            checked={!formData.profile?.workingHours?.[day]?.open}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleWorkingHoursChange(day, 'open', '');
                                handleWorkingHoursChange(day, 'close', '');
                              } else {
                                handleWorkingHoursChange(day, 'open', '09:00');
                                handleWorkingHoursChange(day, 'close', '17:00');
                              }
                            }}
                          />
                          Closed
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'social' && (
            <div className="spm-form-tab-content">
              <h3>Social Media & Communication</h3>
              <div className="spm-form-group">
                <label htmlFor="social.facebook">Facebook</label>
                <div className="spm-social-input-group">
                  <span className="spm-social-prefix">facebook.com/</span>
                  <input
                    type="text"
                    id="social.facebook"
                    value={formData.social?.facebook || ''}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    placeholder="your-business-page"
                    className="spm-form-input"
                  />
                </div>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="social.instagram">Instagram</label>
                <div className="spm-social-input-group">
                  <span className="spm-social-prefix">instagram.com/</span>
                  <input
                    type="text"
                    id="social.instagram"
                    value={formData.social?.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="yourbusiness"
                    className="spm-form-input"
                  />
                </div>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="social.twitter">Twitter/X</label>
                <div className="spm-social-input-group">
                  <span className="spm-social-prefix">x.com/</span>
                  <input
                    type="text"
                    id="social.twitter"
                    value={formData.social?.twitter || ''}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="yourbusiness"
                    className="spm-form-input"
                  />
                </div>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="social.whatsapp">WhatsApp Business</label>
                <div className="spm-social-input-group">
                  <span className="spm-social-prefix">+</span>
                  <input
                    type="text"
                    id="social.whatsapp"
                    value={formData.social?.whatsapp || ''}
                    onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                    placeholder="26771234567"
                    className="spm-form-input"
                  />
                </div>
                <small className="spm-field-note">
                  Enter full international number (e.g., 26771234567 for Botswana)
                </small>
              </div>
            </div>
          )}
          
          {activeTab === 'specific' && (
            <div className="spm-form-tab-content">
              {/* Display fields specific to the provider type */}
              {formData.providerType === PROVIDER_TYPES.CAR_RENTAL && (
                <div className="spm-specific-fields">
                  <h3>Car Rental Details</h3>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="carRental.fleetSize">Fleet Size</label>
                      <input
                        type="number"
                        id="carRental.fleetSize"
                        name="carRental.fleetSize"
                        value={formData.carRental?.fleetSize || ''}
                        onChange={handleChange}
                        min="0"
                        className="spm-form-input"
                        placeholder="Number of vehicles"
                      />
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="carRental.minimumRentalPeriod">Minimum Rental (days)</label>
                      <input
                        type="number"
                        id="carRental.minimumRentalPeriod"
                        name="carRental.minimumRentalPeriod"
                        value={formData.carRental?.minimumRentalPeriod || '1'}
                        onChange={handleChange}
                        min="1"
                        className="spm-form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="carRental.depositRequired">Deposit Required</label>
                      <select
                        id="carRental.depositRequired"
                        name="carRental.depositRequired"
                        value={formData.carRental?.depositRequired?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="carRental.insuranceIncluded">Insurance Included</label>
                      <select
                        id="carRental.insuranceIncluded"
                        name="carRental.insuranceIncluded"
                        value={formData.carRental?.insuranceIncluded?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.providerType === PROVIDER_TYPES.TRAILER_RENTAL && (
                <div className="spm-specific-fields">
                  <h3>Trailer Rental Details</h3>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="trailerRental.requiresVehicleInspection">Vehicle Inspection Required</label>
                      <select
                        id="trailerRental.requiresVehicleInspection"
                        name="trailerRental.requiresVehicleInspection"
                        value={formData.trailerRental?.requiresVehicleInspection?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="trailerRental.towingCapacityRequirement">Towing Capacity Check</label>
                      <select
                        id="trailerRental.towingCapacityRequirement"
                        name="trailerRental.towingCapacityRequirement"
                        value={formData.trailerRental?.towingCapacityRequirement?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Required</option>
                        <option value="false">Not Required</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="trailerRental.deliveryAvailable">Delivery Available</label>
                      <select
                        id="trailerRental.deliveryAvailable"
                        name="trailerRental.deliveryAvailable"
                        value={formData.trailerRental?.deliveryAvailable?.toString() || 'false'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    
                    {formData.trailerRental?.deliveryAvailable?.toString() === 'true' && (
                      <div className="spm-form-group">
                        <label htmlFor="trailerRental.deliveryFee">Delivery Fee (Pula)</label>
                        <input
                          type="number"
                          id="trailerRental.deliveryFee"
                          name="trailerRental.deliveryFee"
                          value={formData.trailerRental?.deliveryFee || ''}
                          onChange={handleChange}
                          min="0"
                          className="spm-form-input"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {formData.providerType === PROVIDER_TYPES.PUBLIC_TRANSPORT && (
                <div className="spm-specific-fields">
                  <h3>Public Transport Details</h3>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="publicTransport.routesCount">Number of Routes</label>
                      <input
                        type="number"
                        id="publicTransport.routesCount"
                        name="publicTransport.routesCount"
                        value={formData.publicTransport?.routesCount || ''}
                        onChange={handleChange}
                        min="0"
                        className="spm-form-input"
                        placeholder="Number of transport routes"
                      />
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="publicTransport.fleetSize">Fleet Size</label>
                      <input
                        type="number"
                        id="publicTransport.fleetSize"
                        name="publicTransport.fleetSize"
                        value={formData.publicTransport?.fleetSize || ''}
                        onChange={handleChange}
                        min="0"
                        className="spm-form-input"
                        placeholder="Number of vehicles"
                      />
                    </div>
                  </div>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="publicTransport.licensedOperator">Licensed Operator</label>
                      <select
                        id="publicTransport.licensedOperator"
                        name="publicTransport.licensedOperator"
                        value={formData.publicTransport?.licensedOperator?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="publicTransport.regulatoryCompliance">Compliance Status</label>
                      <input
                        type="text"
                        id="publicTransport.regulatoryCompliance"
                        name="publicTransport.regulatoryCompliance"
                        value={formData.publicTransport?.regulatoryCompliance || ''}
                        onChange={handleChange}
                        placeholder="e.g., Fully Compliant, Pending Approval"
                        className="spm-form-input"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {formData.providerType === PROVIDER_TYPES.WORKSHOP && (
                <div className="spm-specific-fields">
                  <h3>Workshop Details</h3>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="workshop.warrantyOffered">Warranty Offered</label>
                      <select
                        id="workshop.warrantyOffered"
                        name="workshop.warrantyOffered"
                        value={formData.workshop?.warrantyOffered?.toString() || 'true'}
                        onChange={handleChange}
                        className="spm-form-select"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    
                    {formData.workshop?.warrantyOffered?.toString() === 'true' && (
                      <div className="spm-form-group">
                        <label htmlFor="workshop.warrantyPeriod">Warranty Period</label>
                        <input
                          type="text"
                          id="workshop.warrantyPeriod"
                          name="workshop.warrantyPeriod"
                          value={formData.workshop?.warrantyPeriod || ''}
                          onChange={handleChange}
                          placeholder="e.g., 3 months, 6 months, 1 year"
                          className="spm-form-input"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="spm-form-group">
                    <label htmlFor="workshop.certifications">Certifications & Qualifications</label>
                    <textarea
                      id="workshop.certifications"
                      name="workshop.certifications"
                      value={Array.isArray(formData.workshop?.certifications) 
                        ? formData.workshop.certifications.join(', ') 
                        : formData.workshop?.certifications || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const certifications = value.split(',').map(cert => cert.trim()).filter(Boolean);
                        setFormData(prev => ({
                          ...prev,
                          workshop: {
                            ...prev.workshop,
                            certifications
                          }
                        }));
                      }}
                      placeholder="Enter certifications separated by commas (e.g., ASE Certified, Brand Authorized, etc.)"
                      rows={3}
                      className="spm-form-textarea"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="spm-form-actions">
            <button 
              type="button" 
              className="spm-cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="spm-save-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Update Provider' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceProviderForm;