// client/src/components/profile/CarListingManager/EnhancedCarListingManager.js - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Car, 
  DollarSign, 
  User, 
  Building, 
  Star, 
  CheckCircle,
  CreditCard,
  Info,
  Upload,
  X,
  Camera,
  FileText,
  Calculator,
  Plus,
  Minus
} from 'lucide-react';
import './CarListingManager.css';

const EnhancedCarListingManager = ({ action, userVehicles, onVehicleListed, onCancel, profileData }) => {
  // Smart seller detection state
  const [sellerType, setSellerType] = useState('');
  const [showSellerTypeSelection, setShowSellerTypeSelection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Original CarListingManager state
  const [currentStep, setCurrentStep] = useState('seller_type'); // Start with seller type
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Vehicle listing form state
  const [listingForm, setListingForm] = useState({
    // Basic vehicle info
    make: '',
    model: '',
    year: '',
    variant: '',
    color: '',
    mileage: '',
    fuelType: 'petrol',
    transmission: 'manual',
    bodyType: 'sedan',
    condition: 'excellent',
    
    // Pricing and sale info
    price: '',
    negotiable: true,
    currency: 'BWP',
    
    // Vehicle identification
    vin: '',
    licensePlate: '',
    registrationNumber: '',
    
    // Description and features
    description: '',
    features: [],
    modifications: '',
    
    // Location
    location: {
      city: '',
      area: '',
      coordinates: null
    },
    
    // Contact info
    contactPreference: 'both',
    hideContactInfo: false,
    
    // Images
    images: [],
    mainImageIndex: 0,
    
    // Subscription tier - will be set based on seller type and plan
    subscriptionTier: 'basic'
  });

  // Valuation form state
  const [valuationForm, setValuationForm] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    condition: '',
    additionalInfo: '',
    images: []
  });

  // Dual pricing structure with complete details
  const subscriptionPricing = {
    private: {
      basic: { 
        price: 50, 
        duration: 30, 
        name: 'Individual Basic',
        listings: 1,
        photos: 8,
        features: [
          'Basic listing visibility',
          'Up to 8 photos',
          'Direct buyer contact',
          '30-day listing duration',
          'Basic search placement',
          'Email notifications'
        ],
        description: 'Perfect for selling your personal vehicle'
      },
      standard: { 
        price: 100, 
        duration: 30, 
        name: 'Individual Plus',
        listings: 1,
        photos: 12,
        features: [
          'Enhanced listing visibility',
          'Up to 12 photos',
          'Priority search placement',
          'Social media promotion',
          '30-day listing duration',
          'Advanced buyer matching',
          'SMS + Email notifications',
          'Listing performance analytics'
        ],
        popular: true,
        description: 'Get more visibility and better buyer matching'
      },
      premium: { 
        price: 200, 
        duration: 30, 
        name: 'Individual Pro',
        listings: 1,
        photos: 15,
        features: [
          'Premium listing visibility',
          'Up to 15 photos',
          'Featured placement',
          'Professional photography tips',
          'Extended 45-day duration',
          'Priority customer support',
          'Advanced analytics',
          'Multiple listing formats',
          'Buyer verification'
        ],
        description: 'Maximum exposure and professional features'
      }
    },
    dealership: {
      basic: { 
        price: 1000, 
        duration: 30, 
        name: 'Dealership Starter',
        listings: 15,
        photos: 10,
        features: [
          '15 vehicle listings per month',
          '10 photos per listing',
          'Business dashboard access',
          'Basic inventory management',
          'Customer inquiry management',
          'Basic analytics and reporting',
          'Email support',
          'Mobile app access'
        ],
        description: 'Perfect for small dealerships getting started'
      },
      standard: { 
        price: 2500, 
        duration: 30, 
        name: 'Dealership Professional',
        listings: 35,
        photos: 15,
        features: [
          '35 vehicle listings per month',
          '15 photos per listing',
          'Advanced business dashboard',
          'Inventory management system',
          'Customer relationship management',
          '3x social media marketing boost',
          'Advanced analytics and insights',
          'Phone support',
          'API access',
          'Custom branding options'
        ],
        popular: true,
        description: 'Ideal for growing dealerships with more inventory'
      },
      premium: { 
        price: 6000, 
        duration: 30, 
        name: 'Dealership Enterprise',
        listings: 100,
        photos: 20,
        features: [
          '100 vehicle listings per month',
          '20 photos per listing',
          'Premium dashboard with full customization',
          'Advanced inventory and CRM system',
          'Unlimited social media marketing',
          'Priority customer support',
          'White-label solutions',
          'Advanced API access',
          'Professional photography service (included)',
          'Listing management service (included)',
          'Video review coverage (included)',
          'Dedicated account manager'
        ],
        savings: 3700,
        badge: 'All Inclusive',
        description: 'Complete solution with all add-ons included'
      }
    }
  };

  // Smart seller type detection
  const detectSellerType = () => {
    if (!profileData) return 'private';

    const indicators = {
      hasBusinessInfo: profileData?.businessProfile?.businessName || profileData?.dealership,
      activeListings: profileData?.activeListings || 0,
      totalListings: profileData?.totalListings || 0,
      hasBusinessEmail: profileData?.email?.includes('@') && !['gmail', 'yahoo', 'hotmail', 'outlook'].some(domain => profileData.email.includes(domain)),
      hasBusinessRole: profileData?.role === 'dealer' || profileData?.role === 'business',
      recentListingVolume: profileData?.recentListings || 0,
      hasMultipleVehicles: userVehicles?.length >= 3
    };

    // Business/Dealership indicators
    if (indicators.hasBusinessInfo || 
        indicators.activeListings >= 5 || 
        indicators.totalListings >= 10 ||
        indicators.hasBusinessRole ||
        indicators.recentListingVolume >= 3) {
      return 'dealership';
    }

    return 'private';
  };

  useEffect(() => {
    if (action === 'create') {
      // Auto-detect seller type on component mount
      const detectedType = detectSellerType();
      
      // If clearly a dealership, set automatically
      if (detectedType === 'dealership') {
        setSellerType('dealership');
        setCurrentStep('pricing');
      } else {
        // For private sellers or uncertain cases, show selection if they have business indicators
        const hasAnyBusinessIndicators = profileData?.activeListings >= 2 || 
                                        profileData?.totalListings >= 3 ||
                                        userVehicles?.length >= 3;
        
        if (hasAnyBusinessIndicators) {
          setShowSellerTypeSelection(true);
        } else {
          setSellerType('private');
          setCurrentStep('pricing');
        }
      }
    } else if (action === 'valuation') {
      setCurrentStep('valuation');
    }
  }, [profileData, action]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSellerTypeSelection = (type) => {
    setSellerType(type);
    setShowSellerTypeSelection(false);
    setCurrentStep('pricing');
  };

  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    setListingForm(prev => ({ ...prev, subscriptionTier: planId }));
    setCurrentStep('vehicle_details');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setListingForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationChange = (field, value) => {
    setListingForm(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleFeatureToggle = (feature) => {
    setListingForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = async (e, type = 'listing') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        const response = await axios.post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        return response.data.data;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      if (type === 'listing') {
        setListingForm(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));
      } else {
        setValuationForm(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));
      }

      showMessage('success', `${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      showMessage('error', 'Failed to upload images. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index, type = 'listing') => {
    if (type === 'listing') {
      setListingForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        mainImageIndex: prev.mainImageIndex >= index ? Math.max(0, prev.mainImageIndex - 1) : prev.mainImageIndex
      }));
    } else {
      setValuationForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const setMainImage = (index) => {
    setListingForm(prev => ({
      ...prev,
      mainImageIndex: index
    }));
  };

  const validateForm = () => {
    const required = ['make', 'model', 'year', 'price', 'description'];
    const missing = required.filter(field => !listingForm[field]);
    
    if (missing.length > 0) {
      showMessage('error', `Please fill in: ${missing.join(', ')}`);
      return false;
    }
    
    if (listingForm.images.length === 0) {
      showMessage('error', 'Please upload at least one photo');
      return false;
    }
    
    if (!listingForm.location.city) {
      showMessage('error', 'Please specify the vehicle location');
      return false;
    }
    
    return true;
  };

  const proceedWithPayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const plan = subscriptionPricing[sellerType][selectedPlan];
      
      const paymentData = {
        amount: plan.price,
        planType: sellerType === 'dealership' ? 'subscription' : 'per_listing',
        sellerType: sellerType,
        planId: selectedPlan,
        duration: plan.duration,
        listingData: listingForm // Include listing data for processing after payment
      };
      
      const response = await fetch('/api/payments/initiate-listing-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (data.success && data.data.paymentLink) {
        // Store listing data in localStorage for post-payment processing
        localStorage.setItem('pendingListing', JSON.stringify(listingForm));
        localStorage.setItem('pendingSellerType', sellerType);
        
        // Redirect to Flutterwave
        window.location.href = data.data.paymentLink;
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showMessage('error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleValuationSubmit = async () => {
    if (!valuationForm.make || !valuationForm.model || !valuationForm.year || !valuationForm.condition) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/valuations/request', {
        ...valuationForm,
        requestedBy: profileData?.id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        showMessage('success', 'Valuation request submitted! You\'ll receive your estimate within 24 hours.');
        setValuationForm({
          make: '',
          model: '',
          year: '',
          mileage: '',
          condition: '',
          additionalInfo: '',
          images: []
        });
      }
    } catch (error) {
      console.error('Valuation submission error:', error);
      showMessage('error', 'Failed to submit valuation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `P${price.toLocaleString()}`;
  };

  const getSellerTypeInfo = (type) => {
    const info = {
      private: {
        title: 'Private Seller',
        description: 'Individual selling personal vehicles',
        icon: User,
        color: '#3b82f6',
        priceRange: 'P50 - P200 per listing',
        bestFor: 'Individuals selling 1-2 vehicles occasionally'
      },
      dealership: {
        title: 'Business Dealership',
        description: 'Professional car dealership business',
        icon: Building,
        color: '#f59e0b',
        priceRange: 'P1,000 - P6,000 monthly',
        bestFor: 'Businesses selling multiple vehicles regularly'
      }
    };
    return info[type];
  };

  // Available vehicle features
  const availableFeatures = [
    'Air Conditioning', 'Power Steering', 'Power Windows', 'Central Locking',
    'ABS Brakes', 'Airbags', 'Alloy Wheels', 'Sunroof', 'Navigation System',
    'Bluetooth', 'USB/Aux Input', 'Reverse Camera', 'Parking Sensors',
    'Cruise Control', 'Leather Seats', 'Heated Seats', 'Electric Seats',
    'Keyless Entry', 'Push Start', 'Tinted Windows', 'Fog Lights',
    'Roof Rails', 'Towbar', 'Service History', 'Single Owner'
  ];

  // Render seller type selection
  const renderSellerTypeSelection = () => {
    if (!showSellerTypeSelection) return null;

    return (
      <div className="seller-type-selection">
        <div className="selection-header">
          <h3>How are you selling your vehicle?</h3>
          <p>Choose the option that best describes your selling situation</p>
        </div>

        <div className="seller-options">
          {['private', 'dealership'].map(type => {
            const info = getSellerTypeInfo(type);
            const IconComponent = info.icon;
            
            return (
              <div key={type} className="seller-option-card">
                <div className="option-header">
                  <div className="option-icon" style={{ backgroundColor: info.color }}>
                    <IconComponent size={24} />
                  </div>
                  <div className="option-info">
                    <h4>{info.title}</h4>
                    <p>{info.description}</p>
                  </div>
                </div>
                
                <div className="option-pricing">
                  <span className="price-range">{info.priceRange}</span>
                  <span className="best-for">Best for: {info.bestFor}</span>
                </div>
                
                <button 
                  className="select-option-btn"
                  onClick={() => handleSellerTypeSelection(type)}
                >
                  Select {info.title}
                </button>
              </div>
            );
          })}
        </div>

        <div className="help-text">
          <Info size={16} />
          <span>Not sure? Choose "Private Seller" for personal vehicle sales or "Business Dealership" if you sell vehicles regularly as a business.</span>
        </div>
      </div>
    );
  };

  // Render pricing selection
  const renderPricingSelection = () => {
    if (currentStep !== 'pricing' || !sellerType) return null;

    const plans = subscriptionPricing[sellerType];
    const sellerInfo = getSellerTypeInfo(sellerType);

    return (
      <div className="pricing-selection">
        <div className="pricing-header">
          <div className="detected-seller-type">
            <div className="detection-info">
              <sellerInfo.icon size={20} />
              <span>Selected: <strong>{sellerInfo.title}</strong></span>
            </div>
            <button 
              className="change-type-btn"
              onClick={() => setShowSellerTypeSelection(true)}
            >
              Change
            </button>
          </div>
          
          <h3>Choose Your {sellerInfo.title} Plan</h3>
          <p>{sellerInfo.description}</p>
        </div>

        <div className="plans-grid">
          {Object.entries(plans).map(([planId, plan]) => (
            <div key={planId} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              {plan.savings && <div className="savings-badge">Save {formatPrice(plan.savings)}</div>}
              
              <div className="plan-header">
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  {formatPrice(plan.price)}
                  <span className="price-period">
                    {sellerType === 'dealership' ? '/month' : '/listing'}
                  </span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>

              {sellerType === 'dealership' && (
                <div className="plan-limits">
                  <span>{plan.listings} listings</span>
                  <span>{plan.photos} photos each</span>
                </div>
              )}

              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <CheckCircle size={14} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className="select-plan-btn"
                onClick={() => handlePlanSelection(planId)}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render vehicle details form
  const renderVehicleDetailsForm = () => {
    if (currentStep !== 'vehicle_details') return null;

    return (
      <div className="vehicle-details-form">
        <div className="form-header">
          <h3>Vehicle Details</h3>
          <p>Provide accurate information to attract serious buyers</p>
        </div>

        <div className="form-sections">
          {/* Basic Information */}
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Make *</label>
                <input
                  type="text"
                  name="make"
                  value={listingForm.make}
                  onChange={handleInputChange}
                  placeholder="Toyota, BMW, Mercedes..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  name="model"
                  value={listingForm.model}
                  onChange={handleInputChange}
                  placeholder="Corolla, X5, C-Class..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={listingForm.year}
                  onChange={handleInputChange}
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Variant</label>
                <input
                  type="text"
                  name="variant"
                  value={listingForm.variant}
                  onChange={handleInputChange}
                  placeholder="2.0L Turbo, Sport, Base..."
                />
              </div>
              
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={listingForm.color}
                  onChange={handleInputChange}
                  placeholder="White, Black, Silver..."
                />
              </div>
              
              <div className="form-group">
                <label>Mileage (km)</label>
                <input
                  type="number"
                  name="mileage"
                  value={listingForm.mileage}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="50000"
                />
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="form-section">
            <h4>Technical Details</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Fuel Type</label>
                <select
                  name="fuelType"
                  value={listingForm.fuelType}
                  onChange={handleInputChange}
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Transmission</label>
                <select
                  name="transmission"
                  value={listingForm.transmission}
                  onChange={handleInputChange}
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Body Type</label>
                <select
                  name="bodyType"
                  value={listingForm.bodyType}
                  onChange={handleInputChange}
                >
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="wagon">Wagon</option>
                  <option value="pickup">Pickup</option>
                  <option value="van">Van</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Condition</label>
                <select
                  name="condition"
                  value={listingForm.condition}
                  onChange={handleInputChange}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h4>Pricing</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Price (BWP) *</label>
                <input
                  type="number"
                  name="price"
                  value={listingForm.price}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="150000"
                  required
                />
              </div>
              
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="negotiable"
                    name="negotiable"
                    checked={listingForm.negotiable}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="negotiable">Price negotiable</label>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h4>Location</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={listingForm.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  placeholder="Gaborone, Francistown..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Area</label>
                <input
                  type="text"
                  value={listingForm.location.area}
                  onChange={(e) => handleLocationChange('area', e.target.value)}
                  placeholder="Block 6, Extension 2..."
                />
              </div>
            </div>
          </div>

          {/* Vehicle Features */}
          <div className="form-section">
            <h4>Features</h4>
            <div className="features-grid">
              {availableFeatures.map(feature => (
                <div key={feature} className="feature-checkbox">
                  <input
                    type="checkbox"
                    id={feature}
                    checked={listingForm.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                  />
                  <label htmlFor={feature}>{feature}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-section">
            <h4>Description</h4>
            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                name="description"
                value={listingForm.description}
                onChange={handleInputChange}
                placeholder="Describe your vehicle in detail... Include any recent maintenance, special features, or reasons for selling."
                rows="6"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h4>Photos</h4>
            <p>Upload high-quality photos to attract more buyers</p>
            
            <div className="image-upload-area">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageUploading}
                id="listing-images"
                style={{ display: 'none' }}
              />
              <label htmlFor="listing-images" className="upload-btn">
                <Upload size={20} />
                {imageUploading ? 'Uploading...' : 'Upload Photos'}
              </label>
            </div>

            {listingForm.images.length > 0 && (
              <div className="uploaded-images">
                {listingForm.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image.url} alt={`Vehicle ${index + 1}`} />
                    <div className="image-controls">
                      {index === listingForm.mainImageIndex && (
                        <span className="main-badge">Main</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setMainImage(index)}
                        className="set-main-btn"
                      >
                        <Star size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-btn"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-btn"
            onClick={() => setCurrentStep('pricing')}
          >
            Back to Pricing
          </button>
          <button 
            type="button"
            className="continue-btn"
            onClick={proceedWithPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ${formatPrice(subscriptionPricing[sellerType][selectedPlan]?.price)} & List Vehicle`}
          </button>
        </div>
      </div>
    );
  };

  // Render valuation form
  const renderValuationForm = () => {
    if (currentStep !== 'valuation') return null;

    return (
      <div className="valuation-form">
        <div className="form-header">
          <h3>Get Your Car Valued</h3>
          <p>Get a professional estimate of your car's market value within 24 hours</p>
        </div>

        <div className="valuation-info">
          <div className="info-cards">
            <div className="info-card">
              <h4>How It Works</h4>
              <ul>
                <li>Provide basic vehicle information</li>
                <li>Upload photos (optional but recommended)</li>
                <li>Our experts analyze market data</li>
                <li>Receive valuation within 24 hours</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>What You Get</h4>
              <ul>
                <li>Current market value estimate</li>
                <li>Pricing recommendations</li>
                <li>Market trend analysis</li>
                <li>Selling strategy advice</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="form-sections">
          <div className="form-section">
            <h4>Vehicle Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Make *</label>
                <input
                  type="text"
                  value={valuationForm.make}
                  onChange={(e) => setValuationForm(prev => ({ ...prev, make: e.target.value }))}
                  placeholder="Toyota, BMW, etc."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  value={valuationForm.model}
                  onChange={(e) => setValuationForm(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Corolla, X5, etc."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  value={valuationForm.year}
                  onChange={(e) => setValuationForm(prev => ({ ...prev, year: e.target.value }))}
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Mileage (km)</label>
                <input
                  type="number"
                  value={valuationForm.mileage}
                  onChange={(e) => setValuationForm(prev => ({ ...prev, mileage: e.target.value }))}
                  placeholder="50000"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Overall Condition *</label>
                <select
                  value={valuationForm.condition}
                  onChange={(e) => setValuationForm(prev => ({ ...prev, condition: e.target.value }))}
                  required
                >
                  <option value="">Select condition</option>
                  <option value="excellent">Excellent - Like new</option>
                  <option value="good">Good - Minor wear</option>
                  <option value="fair">Fair - Some issues</option>
                  <option value="poor">Poor - Needs work</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                value={valuationForm.additionalInfo}
                onChange={(e) => setValuationForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Any modifications, recent repairs, known issues, service history, etc."
                rows="4"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Vehicle Photos (Optional but Recommended)</h4>
            <p>Photos help us provide a more accurate valuation</p>
            
            <div className="image-upload-area">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'valuation')}
                disabled={imageUploading}
                id="valuation-images"
                style={{ display: 'none' }}
              />
              <label htmlFor="valuation-images" className="upload-btn">
                <Camera size={20} />
                {imageUploading ? 'Uploading...' : 'Upload Photos'}
              </label>
            </div>

            {valuationForm.images.length > 0 && (
              <div className="uploaded-images">
                {valuationForm.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image.url} alt={`Valuation ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index, 'valuation')}
                      className="remove-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="submit-btn"
            onClick={handleValuationSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Valuation Request'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-car-listing-manager">
      {/* Header */}
      <div className="listing-header">
        <div className="header-content">
          <Car size={24} />
          <div>
            <h2>
              {action === 'valuation' ? 'Get Vehicle Valuation' : 'List Your Vehicle for Sale'}
            </h2>
            <p>
              {action === 'valuation' 
                ? 'Get a professional market value estimate' 
                : 'Smart pricing based on your selling profile'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Content based on current step */}
      {showSellerTypeSelection && renderSellerTypeSelection()}
      {currentStep === 'pricing' && renderPricingSelection()}
      {currentStep === 'vehicle_details' && renderVehicleDetailsForm()}
      {currentStep === 'valuation' && renderValuationForm()}
    </div>
  );
};

export default EnhancedCarListingManager;
