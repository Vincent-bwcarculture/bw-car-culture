// src/components/admin/DealershipManager/DealershipForm.js - Updated for Private Sellers
import React, { useState, useEffect } from 'react';
import { http } from '../../config/axios.js';
import './DealershipForm.css';
import dealerService from '../../services/dealerService.js';

const DealershipForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    // NEW: Seller type selection
    sellerType: 'dealership', // 'dealership' or 'private'
    
    businessName: '',
    businessType: 'independent',
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
      coordinates: {
        type: 'Point',
        coordinates: [0, 0]
      }
    },
    verification: {
      status: 'pending',
      documents: []
    },
    profile: {
      description: '',
      specialties: [],
      workingHours: {
        monday: { open: '', close: '' },
        tuesday: { open: '', close: '' },
        wednesday: { open: '', close: '' },
        thursday: { open: '', close: '' },
        friday: { open: '', close: '' },
        saturday: { open: '', close: '' },
        sunday: { open: '', close: '' }
      }
    },
    subscription: {
      tier: 'basic', // Changed from 'plan' to 'tier'
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    user: '',
    status: 'active',
    
    // NEW: Private seller specific fields
    privateSeller: {
      firstName: '',
      lastName: '',
      preferredContactMethod: 'both',
      canShowContactInfo: true
    }
  });

  // Helper functions for failed image handling
  const checkFailedImage = (url, type = 'logo') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem(`failedDealership${type.charAt(0).toUpperCase() + type.slice(1)}s`) || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  };

  const markFailedImage = (url, type = 'logo') => {
    try {
      const storageKey = `failedDealership${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      const failedImages = JSON.parse(localStorage.getItem(storageKey) || '{}');
      failedImages[url] = Date.now();
      
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      
      localStorage.setItem(storageKey, JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
    }
  };
  
  const [users, setUsers] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await http.get('/auth/users');
        
        if (response.data && response.data.success) {
          const eligibleUsers = response.data.data.filter(
            user => user.role !== 'dealer' || !user.dealership
          );
          setUsers(eligibleUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Initialize form data when editing an existing seller
  useEffect(() => {
    if (initialData) {
      const clonedData = JSON.parse(JSON.stringify(initialData));
      
      setFormData({
        ...clonedData,
        sellerType: clonedData.sellerType || 'dealership',
        contact: clonedData.contact || {
          phone: '',
          email: '',
          website: ''
        },
        location: clonedData.location || {
          address: '',
          city: '',
          state: '',
          country: '',
          coordinates: {
            type: 'Point',
            coordinates: [0, 0]
          }
        },
        verification: clonedData.verification || {
          status: 'pending',
          documents: []
        },
        profile: clonedData.profile || {
          description: '',
          specialties: [],
          workingHours: {
            monday: { open: '', close: '' },
            tuesday: { open: '', close: '' },
            wednesday: { open: '', close: '' },
            thursday: { open: '', close: '' },
            friday: { open: '', close: '' },
            saturday: { open: '', close: '' },
            sunday: { open: '', close: '' }
          }
        },
        subscription: clonedData.subscription || {
          tier: 'basic',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        privateSeller: clonedData.privateSeller || {
          firstName: '',
          lastName: '',
          preferredContactMethod: 'both',
          canShowContactInfo: true
        }
      });
      
      // Set image previews
      if (clonedData.profile?.logo) {
        setLogoPreview(clonedData.profile.logo);
      }
      
      if (clonedData.profile?.banner) {
        setBannerPreview(clonedData.profile.banner);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const keys = name.split('.');
      if (keys.length === 2) {
        const [parent, child] = keys;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (keys.length === 4 && keys[1] === 'coordinates' && keys[2] === 'coordinates') {
        const index = parseInt(keys[3], 10);
        setFormData(prev => {
          const newCoordinates = [...(prev.location.coordinates.coordinates || [0, 0])];
          newCoordinates[index] = parseFloat(value) || 0;
          return {
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                ...prev.location.coordinates,
                coordinates: newCoordinates
              }
            }
          };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // NEW: Handle seller type change
  const handleSellerTypeChange = (e) => {
    const newSellerType = e.target.value;
    setFormData(prev => ({
      ...prev,
      sellerType: newSellerType,
      // Reset businessName when switching types
      businessName: '',
      // Clear business type for private sellers
      businessType: newSellerType === 'dealership' ? 'independent' : ''
    }));
  };

  const handleSpecialtiesChange = (e) => {
    const specialties = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
    
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        specialties
      }
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [type]: 'Invalid file type. Please use JPG, PNG, or WebP.'
      }));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [type]: 'File too large. Maximum size is 5MB.'
      }));
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'logo') {
          setLogoPreview(event.target.result);
          setLogoFile(file);
          console.log(`Logo file prepared for upload: ${file.name}, ${file.type}, ${file.size} bytes`);
        } else if (type === 'banner') {
          setBannerPreview(event.target.result);
          setBannerFile(file);
          console.log(`Banner file prepared for upload: ${file.name}, ${file.type}, ${file.size} bytes`);
        }
      };
      reader.readAsDataURL(file);
      
      setErrors(prev => ({
        ...prev,
        [type]: null
      }));
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      setErrors(prev => ({
        ...prev,
        [type]: `Failed to process ${type} file. Please try again.`
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

  // Updated validation for both seller types
  const validateForm = () => {
    const newErrors = {};
    
    // Common validations
    if (!formData.user && !initialData) {
      newErrors.user = 'User association is required';
    }
    
    if (!formData.contact.email) {
      newErrors['contact.email'] = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contact.email)) {
      newErrors['contact.email'] = 'Valid email is required';
    }
    
    if (!formData.location.city) {
      newErrors['location.city'] = 'City is required';
    }
    
    if (!formData.location.country) {
      newErrors['location.country'] = 'Country is required';
    }
    
    // Seller type specific validations
    if (formData.sellerType === 'dealership') {
      // Dealership validations
      if (!formData.businessName || formData.businessName.trim() === '') {
        newErrors.businessName = 'Business name is required';
      }
      
      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }
      
      if (!formData.contact.phone) {
        newErrors['contact.phone'] = 'Phone number is required for dealerships';
      }
    } else if (formData.sellerType === 'private') {
      // Private seller validations
      if (!formData.privateSeller.firstName || formData.privateSeller.firstName.trim() === '') {
        newErrors['privateSeller.firstName'] = 'First name is required';
      }
      
      if (!formData.privateSeller.lastName || formData.privateSeller.lastName.trim() === '') {
        newErrors['privateSeller.lastName'] = 'Last name is required';
      }
      
      // Auto-generate businessName for private sellers
      if (formData.privateSeller.firstName && formData.privateSeller.lastName) {
        formData.businessName = `${formData.privateSeller.firstName} ${formData.privateSeller.lastName}`;
      }
      
      // Phone is optional for private sellers but recommended
      if (!formData.contact.phone) {
        // Just a warning, not an error
        console.warn('Phone number recommended for better contact options');
      }
    }
    
    console.log('Validation checking:', {
      sellerType: formData.sellerType,
      businessName: formData.businessName,
      privateSeller: formData.privateSeller,
      errors: newErrors
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isSubmitting) {
    console.log('Form already being submitted, preventing duplicate');
    return;
  }
  
  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);
  setLoading(true);
  
  try {
    console.log(`Starting ${formData.sellerType} creation/update with:`, 
      formData.sellerType === 'private' 
        ? `${formData.privateSeller.firstName} ${formData.privateSeller.lastName}`
        : formData.businessName
    );
    
    // Create properly structured seller object
    const sellerData = {
      sellerType: formData.sellerType,
      businessName: formData.businessName,
      // FIXED: Only include businessType for dealerships
      ...(formData.sellerType === 'dealership' && { businessType: formData.businessType }),
      status: formData.status,
      user: formData.user,
      contact: formData.contact,
      location: formData.location,
      verification: formData.verification,
      profile: {
        description: formData.profile.description,
        specialties: formData.profile.specialties,
        // Only include working hours for dealerships
        ...(formData.sellerType === 'dealership' && { workingHours: formData.profile.workingHours })
      },
      subscription: formData.subscription,
      // Include private seller data if applicable
      ...(formData.sellerType === 'private' && { privateSeller: formData.privateSeller })
    };
    
    console.log('Final seller data being sent:', sellerData);
    
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) submitButton.disabled = true;
    
    let result;
    
    if (initialData) {
      console.log('Updating existing seller with ID:', initialData._id);
      result = await dealerService.updateDealer(
        initialData._id, 
        sellerData,
        logoFile,
        bannerFile
      );
    } else {
      console.log('Creating new seller:', sellerData);
      result = await dealerService.createDealer(
        sellerData,
        logoFile,
        bannerFile
      );
    }
    
    console.log('Seller saved successfully:', result);
    
    if (onSubmit) {
      await onSubmit(result);
    }
    
    onClose();
  } catch (error) {
    console.error('Form submission error:', error);
    
    if (error.response?.data?.errors) {
      setErrors(error.response.data.errors);
    } else {
      setErrors({
        form: error.message || `An error occurred while saving the ${formData.sellerType === 'private' ? 'private seller' : 'dealership'}.`
      });
    }
    
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) submitButton.disabled = false;
    
    setIsSubmitting(false);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
    
    return () => {
      setIsSubmitting(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="dealership-form-modal">
        <div className="modal-header">
          <h2>
            {initialData 
              ? `Edit ${initialData.sellerType === 'private' ? 'Private Seller' : 'Dealership'}` 
              : 'Add New Seller'
            }
          </h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="dealership-form">
          {errors.form && <div className="form-error">{errors.form}</div>}

          {/* NEW: Seller Type Selection */}
          <div className="form-section">
            <h3>Seller Type</h3>
            
            <div className="form-group">
              <label>Type of Seller *</label>
              <div className="seller-type-selection">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sellerType"
                    value="dealership"
                    checked={formData.sellerType === 'dealership'}
                    onChange={handleSellerTypeChange}
                  />
                  <span className="radio-label">
                    <strong>Dealership</strong>
                    <small>Car dealership or business</small>
                  </span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sellerType"
                    value="private"
                    checked={formData.sellerType === 'private'}
                    onChange={handleSellerTypeChange}
                  />
                  <span className="radio-label">
                    <strong>Private Seller</strong>
                    <small>Individual person selling their car</small>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Basic Information</h3>
            
            {/* Conditional fields based on seller type */}
            {formData.sellerType === 'dealership' ? (
              // Dealership fields
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={errors.businessName ? 'error' : ''}
                      placeholder="Enter business name"
                    />
                    {errors.businessName && <div className="error-message">{errors.businessName}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label>Business Type *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={errors.businessType ? 'error' : ''}
                    >
                      <option value="independent">Independent</option>
                      <option value="franchise">Franchise</option>
                      <option value="certified">Certified</option>
                    </select>
                    {errors.businessType && <div className="error-message">{errors.businessType}</div>}
                  </div>
                </div>
              </>
            ) : (
              // Private seller fields
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="privateSeller.firstName"
                      value={formData.privateSeller.firstName}
                      onChange={handleChange}
                      className={errors['privateSeller.firstName'] ? 'error' : ''}
                      placeholder="Enter first name"
                    />
                    {errors['privateSeller.firstName'] && <div className="error-message">{errors['privateSeller.firstName']}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="privateSeller.lastName"
                      value={formData.privateSeller.lastName}
                      onChange={handleChange}
                      className={errors['privateSeller.lastName'] ? 'error' : ''}
                      placeholder="Enter last name"
                    />
                    {errors['privateSeller.lastName'] && <div className="error-message">{errors['privateSeller.lastName']}</div>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Display Name (Optional)</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="How you'd like to be shown publicly (defaults to full name)"
                    />
                    <small>If left empty, will use "{formData.privateSeller.firstName} {formData.privateSeller.lastName}"</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Preferred Contact Method</label>
                    <select
                      name="privateSeller.preferredContactMethod"
                      value={formData.privateSeller.preferredContactMethod}
                      onChange={handleChange}
                    >
                      <option value="both">Phone & Email</option>
                      <option value="phone">Phone Only</option>
                      <option value="email">Email Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="privateSeller.canShowContactInfo"
                      checked={formData.privateSeller.canShowContactInfo}
                      onChange={(e) => handleChange({
                        target: {
                          name: 'privateSeller.canShowContactInfo',
                          value: e.target.checked
                        }
                      })}
                    />
                    <span>Allow contact information to be shown to potential buyers</span>
                  </label>
                </div>
              </>
            )}
            
            {!initialData && (
              <div className="form-group">
                <label>Associated User *</label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  className={errors.user ? 'error' : ''}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.user && <div className="error-message">{errors.user}</div>}
              </div>
            )}
            
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  Phone Number {formData.sellerType === 'dealership' ? '*' : '(Recommended)'}
                </label>
                <input
                  type="text"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  className={errors['contact.phone'] ? 'error' : ''}
                  placeholder="Enter phone number"
                />
                {errors['contact.phone'] && <div className="error-message">{errors['contact.phone']}</div>}
                {formData.sellerType === 'private' && (
                  <small>Recommended for better contact with potential buyers</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  className={errors['contact.email'] ? 'error' : ''}
                  placeholder="Enter email address"
                />
                {errors['contact.email'] && <div className="error-message">{errors['contact.email']}</div>}
              </div>
            </div>
            
            {formData.sellerType === 'dealership' && (
              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  name="contact.website"
                  value={formData.contact.website}
                  onChange={handleChange}
                  placeholder="Enter website URL"
                />
              </div>
            )}
          </div>

          {/* Rest of the form sections remain the same */}
          <div className="form-section">
            <h3>Location</h3>
            
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                placeholder="Enter address"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className={errors['location.city'] ? 'error' : ''}
                  placeholder="Enter city"
                />
                {errors['location.city'] && <div className="error-message">{errors['location.city']}</div>}
              </div>
              
              <div className="form-group">
                <label>State/Province</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="Enter state or province"
                />
              </div>
              
              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  className={errors['location.country'] ? 'error' : ''}
                  placeholder="Enter country"
                />
                {errors['location.country'] && <div className="error-message">{errors['location.country']}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Latitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  name="location.coordinates.coordinates[1]"
                  value={formData.location.coordinates?.coordinates?.[1] || ''}
                  onChange={handleChange}
                  placeholder="e.g., -24.6282"
                />
              </div>
              
              <div className="form-group">
                <label>Longitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  name="location.coordinates.coordinates[0]"
                  value={formData.location.coordinates?.coordinates?.[0] || ''}
                  onChange={handleChange}
                  placeholder="e.g., 25.9231"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>{formData.sellerType === 'dealership' ? 'Dealership' : 'Seller'} Profile</h3>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="profile.description"
                value={formData.profile?.description || ''}
                onChange={handleChange}
                rows="4"
                placeholder={formData.sellerType === 'dealership' 
                  ? "Describe your dealership, services, and what makes you special..."
                  : "Tell potential buyers about yourself and why they should trust you..."
                }
              />
            </div>
            
            <div className="form-group">
              <label>
                {formData.sellerType === 'dealership' ? 'Specialties' : 'Interested In'} (comma-separated)
              </label>
              <input
                type="text"
                value={formData.profile?.specialties?.join(', ') || ''}
                onChange={handleSpecialtiesChange}
                placeholder={formData.sellerType === 'dealership' 
                  ? "e.g. Sports Cars, Luxury Vehicles, SUVs"
                  : "e.g. Sports Cars, Classic Cars, Family Vehicles"
                }
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>{formData.sellerType === 'dealership' ? 'Logo' : 'Profile Picture'}</label>
                <div className="file-input-container">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, 'logo')}
                  />
                  {errors.logo && <div className="error-message">{errors.logo}</div>}
                </div>
                {logoPreview && (
                  <div className="image-preview">
                    <img 
                      src={logoPreview} 
                      alt={`${formData.sellerType === 'dealership' ? 'Logo' : 'Profile'} preview`} 
                      onError={(e) => {
                        const originalSrc = e.target.src;
                        console.error(`${formData.sellerType === 'dealership' ? 'Logo' : 'Profile'} preview failed to load: ${originalSrc}`);
                        
                        markFailedImage(originalSrc, 'logo');
                        
                        if (originalSrc.includes('amazonaws.com')) {
                          const key = originalSrc.split('.amazonaws.com/').pop();
                          if (key) {
                            const normalizedKey = key.replace(/images\/images\//g, 'images/');
                            e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                            return;
                          }
                        }
                        
                        if (!originalSrc.includes('/images/placeholders/')) {
                          const filename = originalSrc.split('/').pop();
                          if (filename) {
                            e.target.src = `/uploads/dealers/${filename}`;
                            return;
                          }
                        }
                        
                        e.target.src = '/images/placeholders/dealer-logo.jpg';
                      }}
                    />
                  </div>
                )}
              </div>
              
              {formData.sellerType === 'dealership' && (
                <div className="form-group">
                  <label>Banner</label>
                  <div className="file-input-container">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileChange(e, 'banner')}
                    />
                    {errors.banner && <div className="error-message">{errors.banner}</div>}
                  </div>
                  {bannerPreview && (
                    <div className="image-preview banner-preview">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        onError={(e) => {
                          const originalSrc = e.target.src;
                          console.error(`Banner preview failed to load: ${originalSrc}`);
                          
                          markFailedImage(originalSrc, 'banner');
                          
                          if (originalSrc.includes('amazonaws.com')) {
                            const key = originalSrc.split('.amazonaws.com/').pop();
                            if (key) {
                              const normalizedKey = key.replace(/images\/images\//g, 'images/');
                              e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                              return;
                            }
                          }
                          
                          if (!originalSrc.includes('/images/placeholders/')) {
                            const filename = originalSrc.split('/').pop();
                            if (filename) {
                              e.target.src = `/uploads/dealers/${filename}`;
                              return;
                            }
                          }
                          
                          e.target.src = '/images/placeholders/dealer-banner.jpg';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Business Hours - Only for Dealerships */}
          {formData.sellerType === 'dealership' && (
            <div className="form-section">
              <h3>Business Hours</h3>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div className="form-row" key={day}>
                  <div className="form-group hours-label">
                    <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                  </div>
                  <div className="form-group hours-input">
                    <label>Open</label>
                    <input
                      type="time"
                      value={formData.profile.workingHours[day].open}
                      onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                    />
                  </div>
                  <div className="form-group hours-input">
                    <label>Close</label>
                    <input
                      type="time"
                      value={formData.profile.workingHours[day].close}
                      onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-section">
            <h3>Subscription</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Plan</label>
                <select
                  name="subscription.tier"
                  value={formData.subscription?.tier || 'basic'}
                  onChange={handleChange}
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  name="subscription.status"
                  value={formData.subscription?.status || 'active'}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="subscription.expiresAt"
                  value={formData.subscription?.expiresAt || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting || loading}
            >
              {loading ? 'Saving...' : (
                initialData 
                  ? `Update ${formData.sellerType === 'private' ? 'Private Seller' : 'Dealership'}` 
                  : `Create ${formData.sellerType === 'private' ? 'Private Seller' : 'Dealership'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealershipForm;