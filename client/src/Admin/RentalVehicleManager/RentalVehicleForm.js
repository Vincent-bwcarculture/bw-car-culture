// src/components/admin/RentalVehicleManager/RentalVehicleForm.js
import React, { useState, useEffect } from 'react';
import './RentalVehicleForm.css';
import ImageUpload from '../../components/shared/ReviewModal/ImageUpload.js';

const RentalVehicleForm = ({ isOpen, onClose, onSubmit, initialData, providers }) => {
  const [formData, setFormData] = useState({
    vehicleData: {
      name: '',
      description: '',
      shortDescription: '',
      category: 'Sedan',
      providerId: '',
      specifications: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        transmission: 'automatic',
        fuelType: 'petrol',
        engineSize: '',
        power: '',
        seats: 5,
        doors: 4,
        mileage: 0,
        fuelEconomy: '',
        exteriorColor: '',
        interiorColor: ''
      },
      features: [''],
      rates: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        security: 0,
        includesVAT: true
      },
      rentalTerms: {
        minimumAge: 21,
        minimumRentalPeriod: 1,
        depositRequired: true,
        licenseRequired: true,
        fuelPolicy: 'full-to-full',
        mileageLimit: 0,
        lateFeeRate: 0,
        additionalDriverFee: 0
      },
      location: {
        city: '',
        country: ''
      },
      status: 'available',
      availability: 'available'
    },
    images: [],
    primaryImage: 0,
    keepImages: true
  });

  // Add at the beginning of the RentalVehicleForm component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedRentalImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedRentalImages') || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem('failedRentalImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'features', label: 'Features' },
    { id: 'rates', label: 'Rates & Terms' },
    { id: 'location', label: 'Location' },
    { id: 'images', label: 'Images' }
  ];

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      // Prepare initial form data from existing rental vehicle
      const preparedData = {
        vehicleData: {
          ...initialData,
          // Remove unnecessary fields that should not be sent in API requests
          images: undefined,
          _id: undefined,
          __v: undefined,
          createdAt: undefined,
          updatedAt: undefined
        },
        keepImages: true,
        primaryImage: 0
      };
      
      setFormData(preparedData);
      
      // Set up image previews for existing images
      if (initialData.images && initialData.images.length > 0) {
        const previews = initialData.images.map(img => img.url);
        setImagePreviewUrls(previews);
        
        // Find primary image index
        const primaryIndex = initialData.images.findIndex(img => img.isPrimary);
        if (primaryIndex !== -1) {
          setFormData(prev => ({
            ...prev,
            primaryImage: primaryIndex
          }));
        }
      }
    } else if (providers && providers.length > 0) {
      // Set the first provider as default for new rentals
      setFormData(prev => ({
        ...prev,
        vehicleData: {
          ...prev.vehicleData,
          providerId: providers[0]._id
        }
      }));
    }
  }, [initialData, providers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields with dot notation
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        vehicleData: {
          ...prev.vehicleData,
          [parent]: {
            ...prev.vehicleData[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        vehicleData: {
          ...prev.vehicleData,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    }
  };

  const handleFeaturesChange = (index, value) => {
    const updatedFeatures = [...formData.vehicleData.features];
    updatedFeatures[index] = value;
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        features: updatedFeatures
      }
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        features: [...prev.vehicleData.features, '']
      }
    }));
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...formData.vehicleData.features];
    updatedFeatures.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        features: updatedFeatures
      }
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        location: {
          ...prev.vehicleData.location,
          [name]: value
        }
      }
    }));
  };

  const handleSpecificationsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        specifications: {
          ...prev.vehicleData.specifications,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' ? Number(value) : value
        }
      }
    }));
  };

  const handleRatesChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        rates: {
          ...prev.vehicleData.rates,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' || name === 'daily' || name === 'weekly' || 
                  name === 'monthly' || name === 'security' ? 
                  parseFloat(value) : value
        }
      }
    }));
  };

  const handleRentalTermsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      vehicleData: {
        ...prev.vehicleData,
        rentalTerms: {
          ...prev.vehicleData.rentalTerms,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' ? Number(value) : value
        }
      }
    }));
  };

// Enhanced image upload handler for S3
const handleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;
  
  // Validate files before uploading
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  const validFiles = files.filter(file => {
    const isValidType = validImageTypes.includes(file.type);
    const isValidSize = file.size <= maxSize;
    
    if (!isValidType) {
      console.error(`Invalid file type: ${file.type}`);
    }
    
    if (!isValidSize) {
      console.error(`File too large: ${file.size} bytes`);
    }
    
    return isValidType && isValidSize;
  });
  
  if (validFiles.length === 0) {
    setError('Please upload valid image files (JPEG, PNG, or WebP) under 5MB');
    return;
  }
  
  // Add to imageFiles array for submission
  setImageFiles(prev => [...prev, ...validFiles]);
  
  // Create preview URLs
  const newImagePreviewUrls = validFiles.map(file => URL.createObjectURL(file));
  setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls]);
  
  // Clear any existing error
  if (error && error.includes('image')) {
    setError(null);
  }
};

  const removeImage = (index) => {
    // Remove from state arrays
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove preview URL and revoke object URL to avoid memory leaks
    const urlToRemove = imagePreviewUrls[index];
    URL.revokeObjectURL(urlToRemove);
    
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // If removing primary image, set first image as primary
    if (formData.primaryImage === index) {
      setFormData(prev => ({
        ...prev,
        primaryImage: 0
      }));
    } else if (formData.primaryImage > index) {
      // Adjust primary image index if it's after the removed image
      setFormData(prev => ({
        ...prev,
        primaryImage: prev.primaryImage - 1
      }));
    }
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      primaryImage: index
    }));
  };

// Modify the handleSubmit function for better S3 handling
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  
  // Validate form data
  if (!formData.vehicleData.name || !formData.vehicleData.providerId) {
    setError('Please provide a name and select a provider');
    return;
  }
  
  if (!formData.vehicleData.specifications.make || !formData.vehicleData.specifications.model) {
    setError('Please provide vehicle make and model');
    return;
  }
  
  if (formData.vehicleData.rates.daily <= 0) {
    setError('Please provide a valid daily rate');
    return;
  }
  
  if (!initialData && imageFiles.length === 0) {
    setError('Please upload at least one image');
    return;
  }
  
  try {
    setLoading(true);
    
    // Prepare FormData for S3 uploads
    const formDataForSubmit = new FormData();
    
    // Add vehicleData as JSON string
    formDataForSubmit.append('vehicleData', JSON.stringify(formData.vehicleData));
    
    // Add keepImages flag
    formDataForSubmit.append('keepImages', formData.keepImages);
    
    // Add primaryImage index
    formDataForSubmit.append('primaryImage', formData.primaryImage);
    
    // Add image files
    imageFiles.forEach(file => {
      formDataForSubmit.append('images', file);
    });
    
    // Log form data being submitted (for debugging)
    console.log('Submitting rental vehicle data:', {
      vehicleData: formData.vehicleData,
      keepImages: formData.keepImages,
      primaryImage: formData.primaryImage,
      imageCount: imageFiles.length
    });
    
    // Submit to the API
    await onSubmit(formDataForSubmit);
    
    // Clear form and close
    onClose();
  } catch (err) {
    console.error('Error submitting form:', err);
    setError(err.response?.data?.message || 'Failed to save vehicle. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="rental-vehicle-form-overlay">
      <div className="rental-vehicle-form-container">
        <div className="rental-vehicle-form-header">
          <h2>{initialData ? 'Edit Rental Vehicle' : 'Add New Rental Vehicle'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="form-error-message">{error}</div>}
        
        <div className="rental-vehicle-form-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="rental-vehicle-form">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="form-tab-content">
              <div className="form-group">
                <label htmlFor="name">Vehicle Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.vehicleData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Toyota Corolla 2022"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="providerId">Provider *</label>
                <select
                  id="providerId"
                  name="providerId"
                  value={formData.vehicleData.providerId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Provider</option>
                  {providers?.map(provider => (
                    <option key={provider._id} value={provider._id}>
                      {provider.businessName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.vehicleData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Sports Car">Sports Car</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Wagon">Wagon</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Compact">Compact</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="shortDescription">Short Description</label>
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.vehicleData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief description (max 200 characters)"
                  maxLength={200}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Full Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.vehicleData.description}
                  onChange={handleChange}
                  required
                  placeholder="Detailed description of the vehicle"
                  rows={5}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.vehicleData.status}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="availability">Availability</label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.vehicleData.availability}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div className="form-tab-content">
              <h3>Vehicle Specifications</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="make">Make *</label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={formData.vehicleData.specifications.make}
                    onChange={handleSpecificationsChange}
                    required
                    placeholder="e.g. Toyota"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="model">Model *</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.vehicleData.specifications.model}
                    onChange={handleSpecificationsChange}
                    required
                    placeholder="e.g. Corolla"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="year">Year *</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.vehicleData.specifications.year}
                    onChange={handleSpecificationsChange}
                    required
                    min={1900}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="mileage">Mileage (km)</label>
                  <input
                    type="number"
                    id="mileage"
                    name="mileage"
                    value={formData.vehicleData.specifications.mileage}
                    onChange={handleSpecificationsChange}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transmission">Transmission</label>
                  <select
                    id="transmission"
                    name="transmission"
                    value={formData.vehicleData.specifications.transmission}
                    onChange={handleSpecificationsChange}
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="cvt">CVT</option>
                    <option value="semi-automatic">Semi-Automatic</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="fuelType">Fuel Type</label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={formData.vehicleData.specifications.fuelType}
                    onChange={handleSpecificationsChange}
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="plugin_hybrid">Plug-in Hybrid</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="engineSize">Engine Size</label>
                  <input
                    type="text"
                    id="engineSize"
                    name="engineSize"
                    value={formData.vehicleData.specifications.engineSize}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. 2.0L"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="power">Power</label>
                  <input
                    type="text"
                    id="power"
                    name="power"
                    value={formData.vehicleData.specifications.power}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. 150 HP"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="seats">Seats *</label>
                  <input
                    type="number"
                    id="seats"
                    name="seats"
                    value={formData.vehicleData.specifications.seats}
                    onChange={handleSpecificationsChange}
                    required
                    min={1}
                    max={20}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="doors">Doors</label>
                  <input
                    type="number"
                    id="doors"
                    name="doors"
                    value={formData.vehicleData.specifications.doors}
                    onChange={handleSpecificationsChange}
                    min={1}
                    max={6}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fuelEconomy">Fuel Economy</label>
                  <input
                    type="text"
                    id="fuelEconomy"
                    name="fuelEconomy"
                    value={formData.vehicleData.specifications.fuelEconomy}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. 7.5L/100km"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="exteriorColor">Exterior Color</label>
                  <input
                    type="text"
                    id="exteriorColor"
                    name="exteriorColor"
                    value={formData.vehicleData.specifications.exteriorColor}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. Silver"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="interiorColor">Interior Color</label>
                  <input
                    type="text"
                    id="interiorColor"
                    name="interiorColor"
                    value={formData.vehicleData.specifications.interiorColor}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. Black"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="form-tab-content">
              <h3>Vehicle Features</h3>
              <div className="features-container">
                {formData.vehicleData.features.map((feature, index) => (
                  <div key={index} className="feature-input-row">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeaturesChange(index, e.target.value)}
                      placeholder="Enter a feature (e.g. 'Air Conditioning')"
                    />
                    {formData.vehicleData.features.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-feature-btn"
                        onClick={() => removeFeature(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-feature-btn"
                  onClick={addFeature}
                >
                  + Add Feature
                </button>
              </div>
            </div>
          )}
          
          {/* Rates & Terms Tab */}
          {activeTab === 'rates' && (
            <div className="form-tab-content">
              <h3>Rental Rates</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="daily">Daily Rate (P) *</label>
                  <input
                    type="number"
                    id="daily"
                    name="daily"
                    value={formData.vehicleData.rates.daily}
                    onChange={handleRatesChange}
                    required
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="weekly">Weekly Rate (P)</label>
                  <input
                    type="number"
                    id="weekly"
                    name="weekly"
                    value={formData.vehicleData.rates.weekly}
                    onChange={handleRatesChange}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monthly">Monthly Rate (P)</label>
                  <input
                    type="number"
                    id="monthly"
                    name="monthly"
                    value={formData.vehicleData.rates.monthly}
                    onChange={handleRatesChange}
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="security">Security Deposit (P)</label>
                  <input
                    type="number"
                    id="security"
                    name="security"
                    value={formData.vehicleData.rates.security}
                    onChange={handleRatesChange}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="includesVAT"
                    checked={formData.vehicleData.rates.includesVAT}
                    onChange={handleRatesChange}
                  />
                  Rates include VAT
                </label>
              </div>
              
              <h3>Rental Terms</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minimumAge">Minimum Driver Age</label>
                  <input
                    type="number"
                    id="minimumAge"
                    name="minimumAge"
                    value={formData.vehicleData.rentalTerms.minimumAge}
                    onChange={handleRentalTermsChange}
                    min={18}
                    max={99}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="minimumRentalPeriod">Minimum Rental Period (days)</label>
                  <input
                    type="number"
                    id="minimumRentalPeriod"
                    name="minimumRentalPeriod"
                    value={formData.vehicleData.rentalTerms.minimumRentalPeriod}
                    onChange={handleRentalTermsChange}
                    min={1}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fuelPolicy">Fuel Policy</label>
                  <select
                    id="fuelPolicy"
                    name="fuelPolicy"
                    value={formData.vehicleData.rentalTerms.fuelPolicy}
                    onChange={handleRentalTermsChange}
                  >
                    <option value="full-to-full">Full to Full</option>
                    <option value="full-to-empty">Full to Empty</option>
                    <option value="same-to-same">Same to Same</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="mileageLimit">Mileage Limit (0 for unlimited)</label>
                  <input
                    type="number"
                    id="mileageLimit"
                    name="mileageLimit"
                    value={formData.vehicleData.rentalTerms.mileageLimit}
                    onChange={handleRentalTermsChange}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="additionalDriverFee">Additional Driver Fee (P)</label>
                <input
                  type="number"
                  id="additionalDriverFee"
                  name="additionalDriverFee"
                  value={formData.vehicleData.rentalTerms.additionalDriverFee}
                  onChange={handleRentalTermsChange}
                  min={0}
                  step={0.01}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lateFeeRate">Late Return Fee (P/day)</label>
                <input
                  type="number"
                  id="lateFeeRate"
                  name="lateFeeRate"
                  value={formData.vehicleData.rentalTerms.lateFeeRate}
                  onChange={handleRentalTermsChange}
                  min={0}
                  step={0.01}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="depositRequired"
                    checked={formData.vehicleData.rentalTerms.depositRequired}
                    onChange={handleRentalTermsChange}
                  />
                  Security deposit required
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="licenseRequired"
                    checked={formData.vehicleData.rentalTerms.licenseRequired}
                    onChange={handleRentalTermsChange}
                  />
                  Driver's license required
                </label>
              </div>
            </div>
          )}
          
          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="form-tab-content">
              <h3>Vehicle Location</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.vehicleData.location.city}
                    onChange={handleLocationChange}
                    required
                    placeholder="e.g. Gaborone"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.vehicleData.location.country}
                    onChange={handleLocationChange}
                    required
                    placeholder="e.g. Botswana"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="form-tab-content">
              <h3>Vehicle Images</h3>
              
              {initialData && initialData.images && initialData.images.length > 0 && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.keepImages}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          keepImages: e.target.checked
                        }));
                      }}
                    />
                    Keep existing images
                  </label>
                </div>
              )}
              
              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  id="vehicle-images"
                  style={{ display: 'none' }}
                />
                <label htmlFor="vehicle-images" className="upload-image-btn">
                  + Upload Images
                </label>
                
                <p className="upload-note">
                  You can upload multiple images at once. The first image will be the primary image.
                </p>
              </div>
              
             {imagePreviewUrls.length > 0 && (
  <div className="image-previews">
    <h4>Images ({imagePreviewUrls.length})</h4>
    <div className="image-grid">
      {imagePreviewUrls.map((url, index) => (
        <div 
          key={index} 
          className={`image-preview-container ${formData.primaryImage === index ? 'primary' : ''}`}
        >
          <img 
            src={url} 
            alt={`Vehicle preview ${index + 1}`} 
            className="image-preview"
            onError={(e) => {
              const originalSrc = e.target.src;
              console.error(`Preview image failed to load: ${originalSrc}`);
              
              // Mark this image as failed
              markFailedImage(originalSrc);
              
              // For S3 URLs, try the proxy endpoint
              if (originalSrc.includes('amazonaws.com')) {
                // Extract key from S3 URL
                const key = originalSrc.split('.amazonaws.com/').pop();
                if (key) {
                  // Normalize the key
                  const normalizedKey = key.replace(/images\/images\//g, 'images/');
                  e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                  return;
                }
              }
              
              // Final fallback
              e.target.src = '/images/placeholders/rental.jpg';
            }}
          />
          <div className="image-preview-actions">
            <button
              type="button"
              className={`primary-toggle ${formData.primaryImage === index ? 'is-primary' : ''}`}
              onClick={() => setPrimaryImage(index)}
              title={formData.primaryImage === index ? 'Primary Image' : 'Set as Primary'}
            >
              {formData.primaryImage === index ? '★' : '☆'}
            </button>
            <button
              type="button"
              className="remove-image"
              onClick={() => removeImage(index)}
              title="Remove Image"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalVehicleForm;