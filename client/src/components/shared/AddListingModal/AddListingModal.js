// src/components/shared/AddListingModal/AddListingModal.js - Complete with Savings Integration
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  SAFETY_FEATURES, 
  COMFORT_FEATURES, 
  PERFORMANCE_FEATURES, 
  BODY_STYLES,
  FUEL_TYPES,
  DRIVETRAIN_TYPES,
  PRICE_TYPES,
  LISTING_STATUS,
  TRANSMISSION_TYPES,
  ENTERTAINMENT_FEATURES,
  COUNTRIES 
} from '../ReviewModal/constants/listingConstants.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import { dealerService } from '../../../services/dealerService.js';
import { listingService } from '../../../services/listingService.js';
import { useAuth } from '../../../context/AuthContext.js';
import './AddListingModal.css';
import ErrorBoundary from '../../ErrorBoundary.js';

// Helper functions
const getSafeFormValue = (obj, path, defaultValue = '') => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : defaultValue), obj);
};

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/images/placeholders/car.jpg';
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  if (!imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }
  
  return imageUrl;
};

const AddListingModal = ({ isOpen, onClose, onSubmit }) => {
  // Initial form state
  const defaultFormState = {
    // Basic Info
    title: '',
    description: '',
    shortDescription: '',
    condition: 'used',
    status: 'draft',
    bodyStyle: '',
    featured: false,
    dealer: '',
    category: '',
    
    // Specifications
    specifications: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: '',
      transmission: '',
      fuelType: '',
      engineSize: '',
      power: '',
      torque: '',
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
      vin: ''
    },
    safetyFeatures: [],
    comfortFeatures: [],
    performanceFeatures: [],
    entertainmentFeatures: [],
    features: [],

    // Enhanced Pricing with Savings
    price: '',
    priceType: 'fixed',
    priceOptions: {
      includesVAT: false,
      showPriceAsPOA: false,
      financeAvailable: false,
      leaseAvailable: false,
      monthlyPayment: '',
      // NEW: Savings fields
      originalPrice: '',
      savingsAmount: '',
      savingsPercentage: '',
      dealerDiscount: '',
      showSavings: false,
      savingsDescription: '',
      exclusiveDeal: false,
      savingsValidUntil: ''
    },

    // Location
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },

    // SEO
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    },

    // Service History
    serviceHistory: {
      hasServiceHistory: false,
      records: []
    }
  };

  // State management
  const [formData, setFormData] = useState(defaultFormState);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(false);

  const dispatch = useDispatch();
  const { user } = useAuth();

  // Refs
  const fileInputRef = useRef(null);
  const newFeatureRef = useRef(null);
  const keywordInputRef = useRef(null);

  // Tab configuration - Updated with Savings tab
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'specs', label: 'Specifications', icon: '🔧' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'media', label: 'Media', icon: '📸' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'savings', label: 'I3W Savings', icon: '🎯' }, // NEW
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'seo', label: 'SEO', icon: '🔍' }
  ];

  // NEW: Calculate savings automatically
  const calculateSavings = useCallback((originalPrice, currentPrice, dealerDiscount) => {
    let calculatedSavings = { amount: 0, percentage: 0, originalPriceCalc: 0 };

    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      // Calculate from original and current price
      calculatedSavings.amount = originalPrice - currentPrice;
      calculatedSavings.percentage = Math.round((calculatedSavings.amount / originalPrice) * 100);
      calculatedSavings.originalPriceCalc = originalPrice;
    } else if (dealerDiscount && currentPrice && dealerDiscount > 0) {
      // Calculate from dealer discount percentage
      const originalPriceFromDiscount = Math.round(currentPrice / (1 - dealerDiscount / 100));
      calculatedSavings.amount = originalPriceFromDiscount - currentPrice;
      calculatedSavings.percentage = dealerDiscount;
      calculatedSavings.originalPriceCalc = originalPriceFromDiscount;
    }

    return calculatedSavings;
  }, []);

  // NEW: Auto-update savings when relevant fields change
  useEffect(() => {
    const originalPrice = parseFloat(formData.priceOptions?.originalPrice) || 0;
    const currentPrice = parseFloat(formData.price) || 0;
    const dealerDiscount = parseFloat(formData.priceOptions?.dealerDiscount) || 0;

    if ((originalPrice && currentPrice) || (dealerDiscount && currentPrice)) {
      const calculated = calculateSavings(originalPrice, currentPrice, dealerDiscount);
      
      if (calculated.amount > 0) {
        setFormData(prev => ({
          ...prev,
          priceOptions: {
            ...prev.priceOptions,
            savingsAmount: calculated.amount.toString(),
            savingsPercentage: calculated.percentage.toString(),
            originalPrice: calculated.originalPriceCalc.toString(),
            showSavings: true
          }
        }));
      }
    }
  }, [formData.price, formData.priceOptions?.originalPrice, formData.priceOptions?.dealerDiscount, calculateSavings]);

  // Function to fetch dealers for dropdown
const fetchDealers = async () => {
  try {
    setLoadingDealers(true);
    const result = await dealerService.getAllDealers();
    
    if (result && result.success && result.dealers) {
      // Enhanced processing to ensure seller type information is preserved
      const processedDealers = result.dealers.map(dealer => ({
        ...dealer,
        // Ensure sellerType is properly set
        sellerType: dealer.sellerType || (dealer.privateSeller ? 'private' : 'dealership'),
        // Ensure display name is properly calculated
        displayName: dealer.sellerType === 'private' && dealer.privateSeller
          ? `${dealer.privateSeller.firstName} ${dealer.privateSeller.lastName}`
          : dealer.businessName
      }));
      
      setDealers(processedDealers);
      console.log('Processed dealers:', processedDealers);
    } else {
      console.error('Error fetching dealers:', result?.error || 'Unknown error');
      dispatch(addNotification({
        type: 'error',
        message: result?.error || 'Failed to load dealers'
      }));
    }
  } catch (error) {
    console.error('Error fetching dealers:', error);
    dispatch(addNotification({
      type: 'error',
      message: 'Failed to load dealers. Please try again.'
    }));
  } finally {
    setLoadingDealers(false);
  }
};

  // Debug logging for form state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Form Data:', formData);
    }
  }, [formData]);

  // Clean up URL objects when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image && image.preview && typeof URL.revokeObjectURL === 'function') {
          try {
            URL.revokeObjectURL(image.preview);
          } catch (err) {
            console.error('Error revoking object URL during cleanup:', err);
          }
        }
      });
    };
  }, [images]);

  // Load dealers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDealers();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormState);
      setErrors({});
      setImages([]);
      setPrimaryImageIndex(0);
      setActiveTab('basic');
    }
  }, [isOpen]);

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle nested specifications changes
  const handleSpecsChange = (e) => {
    const { name, value } = e.target;
    // Remove "specifications." from the name if it exists
    const fieldName = name.replace('specifications.', '');
    
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [fieldName]: value
      }
    }));
  
    // Clear any errors
    if (errors[`specifications.${fieldName}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`specifications.${fieldName}`];
        return newErrors;
      });
    }
  };

  // Handle nested location changes
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));

    if (errors[`location.${name}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`location.${name}`];
        return newErrors;
      });
    }
  };

  // Handle nested object changes
  const handleNestedChange = (e) => {
    const { name, value } = e.target;
    if (!name || !name.includes('.')) {
      console.error('Invalid nested field name:', name);
      return;
    }
    
    const [parent, child] = name.split('.');
    
    setFormData(prev => {
      // Ensure parent exists
      if (!prev[parent]) {
        prev[parent] = {};
      }
      
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      };
    });

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setImages([]);
    setPrimaryImageIndex(0);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle feature toggles
  const handleFeatureToggle = (category, feature) => {
    if (!category || !feature) {
      console.error('Invalid feature toggle parameters:', { category, feature });
      return;
    }

    setFormData(prev => {
      // Get current features array or initialize empty array if undefined
      const currentFeatures = Array.isArray(prev[category]) ? [...prev[category]] : [];
    
      // Create new array based on whether feature exists
      const updatedFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];

      return {
        ...prev,
        [category]: updatedFeatures
      };
    });
  };

  // Handle service history changes
  const handleServiceHistoryChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name === 'hasServiceHistory') {
      setFormData(prev => ({
        ...prev,
        serviceHistory: {
          ...prev.serviceHistory,
          hasServiceHistory: checked
        }
      }));
    }
  };

  // Handle image upload - Updated for S3
  const handleImageUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!validImageTypes.includes(file.type)) {
        console.error(`Invalid file type: ${file.type}`);
        return false;
      }
      if (file.size > maxSize) {
        console.error(`File too large: ${file.size} bytes`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Please upload valid image files (JPEG, PNG, or WebP) under 5MB'
      }));
      return;
    }
    
    // Create objects that include both File and preview URL
    const newImages = validFiles.map(file => {
      // Generate a preview URL for display
      const preview = URL.createObjectURL(file);
      
      // Ensure we store the actual File object
      return {
        file: file, // Store the actual File object
        preview: preview,
        name: file.name,
        type: file.type,
        size: file.size
      };
    });
    
    console.log(`Adding ${newImages.length} new images`);
    newImages.forEach((img, idx) => {
      console.log(`New image ${idx}: ${img.file.name}, ${img.file.type}, ${img.file.size} bytes`);
    });
    
    setImages(prev => [...prev, ...newImages]);
    
    // Clear error if it exists
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
    
    // Reset file input
    e.target.value = '';
  };

  // Remove image
  const removeImage = (index) => {
    if (index < 0 || index >= images.length) {
      console.error('Invalid image index to remove:', index);
      return;
    }
    
    // Revoke the object URL before removing the image to prevent memory leaks
    if (images[index] && images[index].preview) {
      URL.revokeObjectURL(images[index].preview);
    }
    
    setImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
    
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  // Handle new feature addition
  const handleNewFeature = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const feature = e.target.value.trim();
      
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), feature]
      }));

      e.target.value = '';
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    if (index < 0 || !Array.isArray(formData.features)) return;
    
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Handle keyword addition
  const handleKeywordAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const keyword = e.target.value.trim();

      setFormData(prev => {
        const seo = prev.seo || {};
        const keywords = Array.isArray(seo.keywords) ? [...seo.keywords] : [];
        
        return {
          ...prev,
          seo: {
            ...seo,
            keywords: [...keywords, keyword]
          }
        };
      });

      e.target.value = '';
    }
  };

  // Remove keyword
  const handleKeywordRemove = (index) => {
    if (index < 0 || !formData.seo || !Array.isArray(formData.seo.keywords)) return;
    
    setFormData(prev => {
      const seo = { ...prev.seo };
      seo.keywords = seo.keywords.filter((_, i) => i !== index);
      
      return {
        ...prev,
        seo
      };
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category?.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.dealer?.trim()) {
      newErrors.dealer = 'Dealer is required';
    }

    // Price validation - only required if not POA
    if (!formData.priceOptions?.showPriceAsPOA && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Price is required unless Price on Application is selected';
    }

    // NEW: Savings validation
    if (formData.priceOptions?.showSavings) {
      const originalPrice = parseFloat(formData.priceOptions.originalPrice) || 0;
      const currentPrice = parseFloat(formData.price) || 0;
      const dealerDiscount = parseFloat(formData.priceOptions.dealerDiscount) || 0;
      
      if (!originalPrice && !dealerDiscount) {
        newErrors['priceOptions.originalPrice'] = 'Original price or dealer discount is required for savings';
      }
      
      if (originalPrice && originalPrice <= currentPrice) {
        newErrors['priceOptions.originalPrice'] = 'Original price must be higher than current price';
      }
      
      if (dealerDiscount && (dealerDiscount <= 0 || dealerDiscount >= 100)) {
        newErrors['priceOptions.dealerDiscount'] = 'Dealer discount must be between 1% and 99%';
      }
    }

    // Specifications validation
    if (!formData.specifications?.make?.trim()) {
      newErrors['specifications.make'] = 'Make is required';
    }
    
    if (!formData.specifications?.model?.trim()) {
      newErrors['specifications.model'] = 'Model is required';
    }
    
    if (!formData.specifications?.transmission?.trim()) {
      newErrors['specifications.transmission'] = 'Transmission type is required';
    }
    
    if (!formData.specifications?.fuelType?.trim()) {
      newErrors['specifications.fuelType'] = 'Fuel type is required';
    }

    // Location validation
    if (!formData.location?.city?.trim()) {
      newErrors['location.city'] = 'City is required';
    }
    
    if (!formData.location?.country?.trim()) {
      newErrors['location.country'] = 'Country is required';
    }

    // Image validation
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with listingService
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    dispatch(addNotification({
      type: 'error',
      message: 'Please fill in all required fields'
    }));
    return;
  }

  setIsSubmitting(true);
  
  try {
    // Find the selected dealer to get full information
    const selectedDealer = dealers.find(dealer => dealer._id === formData.dealer);
    console.log('Selected dealer for listing:', selectedDealer);

    // Prepare the form data with enhanced dealer information
    const submitData = {
      title: formData.title || '',
      description: formData.description || '',
      shortDescription: formData.shortDescription || '',
      category: formData.category || '',
      condition: formData.condition || 'used',
      status: formData.status || 'active',
      dealerId: formData.dealer || '',
      featured: Boolean(formData.featured),
      
      // ENHANCED: Include full dealer information in the listing
      dealer: selectedDealer ? {
        _id: selectedDealer._id,
        name: selectedDealer.name || selectedDealer.displayName,
        businessName: selectedDealer.businessName,
        sellerType: selectedDealer.sellerType,
        contact: selectedDealer.contact,
        location: selectedDealer.location,
        verification: selectedDealer.verification,
        profile: selectedDealer.profile,
        // Include private seller info if applicable
        privateSeller: selectedDealer.privateSeller,
        logo: selectedDealer.profile?.logo
      } : null,
      
      price: Number(formData.price) || 0,
      priceType: formData.priceType || 'fixed',
      priceOptions: {
        includesVAT: Boolean(formData.priceOptions?.includesVAT),
        showPriceAsPOA: Boolean(formData.priceOptions?.showPriceAsPOA),
        financeAvailable: Boolean(formData.priceOptions?.financeAvailable),
        leaseAvailable: Boolean(formData.priceOptions?.leaseAvailable),
        monthlyPayment: formData.priceOptions?.monthlyPayment ? Number(formData.priceOptions.monthlyPayment) : null,
        // Savings options
        originalPrice: formData.priceOptions?.originalPrice ? Number(formData.priceOptions.originalPrice) : null,
        savingsAmount: formData.priceOptions?.savingsAmount ? Number(formData.priceOptions.savingsAmount) : null,
        savingsPercentage: formData.priceOptions?.savingsPercentage ? Number(formData.priceOptions.savingsPercentage) : null,
        dealerDiscount: formData.priceOptions?.dealerDiscount ? Number(formData.priceOptions.dealerDiscount) : null,
        showSavings: Boolean(formData.priceOptions?.showSavings),
        savingsDescription: formData.priceOptions?.savingsDescription || null,
        exclusiveDeal: Boolean(formData.priceOptions?.exclusiveDeal),
        savingsValidUntil: formData.priceOptions?.savingsValidUntil ? new Date(formData.priceOptions.savingsValidUntil) : null
      },
      
      safetyFeatures: Array.isArray(formData.safetyFeatures) ? formData.safetyFeatures : [],
      comfortFeatures: Array.isArray(formData.comfortFeatures) ? formData.comfortFeatures : [],
      performanceFeatures: Array.isArray(formData.performanceFeatures) ? formData.performanceFeatures : [],
      entertainmentFeatures: Array.isArray(formData.entertainmentFeatures) ? formData.entertainmentFeatures : [],
      features: Array.isArray(formData.features) ? formData.features : [],
      
      specifications: {
        make: formData.specifications?.make || '',
        model: formData.specifications?.model || '',
        year: Number(formData.specifications?.year) || new Date().getFullYear(),
        mileage: Number(formData.specifications?.mileage) || 0,
        transmission: formData.specifications?.transmission || '',
        fuelType: formData.specifications?.fuelType || '',
        engineSize: formData.specifications?.engineSize || '',
        power: formData.specifications?.power || '',
        torque: formData.specifications?.torque || '',
        drivetrain: formData.specifications?.drivetrain || '',
        exteriorColor: formData.specifications?.exteriorColor || '',
        interiorColor: formData.specifications?.interiorColor || '',
        vin: formData.specifications?.vin || ''
      },
      
      location: {
        address: formData.location?.address || '',
        city: formData.location?.city || '',
        state: formData.location?.state || '',
        country: formData.location?.country || '',
        postalCode: formData.location?.postalCode || ''
      },
      
      seo: {
        metaTitle: formData.seo?.metaTitle || '',
        metaDescription: formData.seo?.metaDescription || '',
        keywords: Array.isArray(formData.seo?.keywords) ? formData.seo.keywords : []
      },
      
      serviceHistory: formData.serviceHistory?.hasServiceHistory ? {
        hasServiceHistory: true,
        records: formData.serviceHistory.records || []
      } : {
        hasServiceHistory: false,
        records: []
      },
      
      // Add images and primary image index
      images: images,
      primaryImageIndex: primaryImageIndex
    };

    console.log('Submitting listing with enhanced dealer info:', {
      hasSavings: submitData.priceOptions.showSavings,
      dealerInfo: submitData.dealer,
      sellerType: submitData.dealer?.sellerType
    });
    
    // Call the onSubmit prop with the data
    if (onSubmit) {
      await onSubmit(submitData);
    }
    
    const sellerTypeText = selectedDealer?.sellerType === 'private' ? 'private seller' : 'dealership';
    dispatch(addNotification({
      type: 'success',
      message: submitData.priceOptions.showSavings ? 
        `Listing created with P${submitData.priceOptions.savingsAmount?.toLocaleString()} savings for ${sellerTypeText}!` :
        `Listing created successfully for ${sellerTypeText}`
    }));
    
    onClose();
  } catch (error) {
    console.error('Error creating listing:', error);
    dispatch(addNotification({
      type: 'error',
      message: error.message || 'Failed to create listing'
    }));
  } finally {
    setIsSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Listing</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={isSubmitting}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Basic Info Section */}
          <section className={`form-section ${activeTab === 'basic' ? 'active' : ''}`}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Vehicle Title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition*</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition || 'used'}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="certified">Certified Pre-Owned</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Listing Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || 'draft'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {LISTING_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bodyStyle">Body Style</label>
                <select
                  id="bodyStyle"
                  name="bodyStyle"
                  value={formData.bodyStyle || ''}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select Body Style</option>
                  {BODY_STYLES.map(style => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className={errors.category ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Category</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sports Car">Sports Car</option>
                  <option value="Performance Hatchback">Performance Hatchback</option>
                   <option value="Performance SUV">Performance SUV</option>
                    <option value="Performance Sedan">Performance Sedan</option>
                     <option value="Performance Wagon">Performance Wagon</option>
                      <option value="Performance Bakkie">Performance Bakkie</option>
                       <option value="Offroad SUV">Offroad SUV</option>
                       <option value="Offroad Bakkie">Offroad Bakkie</option>
                  <option value="Family">Family Car</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Wagon">Wagon</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Classic">Classic</option>
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

             <div className="form-group">
  <label htmlFor="dealer">Seller*</label>
  <select
    id="dealer"
    name="dealer"
    value={formData.dealer || ''}
    onChange={handleChange}
    className={errors.dealer ? 'error' : ''}
    disabled={isSubmitting || loadingDealers}
  >
    <option value="">Select Seller</option>
    {loadingDealers ? (
      <option disabled>Loading sellers...</option>
    ) : (
      dealers.map(dealer => {
        // Create display name based on seller type
           const displayName = dealer.sellerType === 'private' 
          ? (dealer.displayName || `${dealer.privateSeller?.firstName || ''} ${dealer.privateSeller?.lastName || ''}`.trim() || dealer.businessName)
          : dealer.businessName || 'Unnamed Seller';
        
        const sellerTypeLabel = dealer.sellerType === 'private' ? '(Private Seller)' : '(Dealership)';
        
            return (
          <option key={dealer._id} value={dealer._id}>
            {displayName} {sellerTypeLabel}
          </option>
        );
      })
    )}
  </select>
  {errors.dealer && <span className="error-message">{errors.dealer}</span>}
  <small>Choose the dealership or private seller for this listing</small>
</div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured || false}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'featured',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Featured Listing</span>
                </label>
              </div>

              <div className="form-group full-width">
                <label htmlFor="shortDescription">Short Description</label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Brief description for listing preview"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Full Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  className={errors.description ? 'error' : ''}
                  rows="6"
                  placeholder="Detailed vehicle description"
                  disabled={isSubmitting}
                />
                {errors.description && 
                  <span className="error-message">{errors.description}</span>
                }
              </div>
            </div>
          </section>

          {/* Specifications Section */}
          <section className={`form-section ${activeTab === 'specs' ? 'active' : ''}`}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="make">Make*</label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={getSafeFormValue(formData, 'specifications.make', '')}
                  onChange={handleSpecsChange}
                  placeholder="Make"
                  className={`form-input ${errors['specifications.make'] ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors['specifications.make'] && 
                  <span className="error-message">{errors['specifications.make']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="model">Model*</label>
                <input
                  type="text"
                  id="model"
                  name="specifications.model"
                  value={getSafeFormValue(formData, 'specifications.model', '')}
                  onChange={handleNestedChange}
                  className={errors['specifications.model'] ? 'error' : ''}
                  placeholder="e.g., M4 Competition"
                  disabled={isSubmitting}
                />
                {errors['specifications.model'] && 
                  <span className="error-message">{errors['specifications.model']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="year">Year*</label>
                <input
                  type="number"
                  id="year"
                  name="specifications.year"
                  value={getSafeFormValue(formData, 'specifications.year', new Date().getFullYear())}
                  onChange={handleNestedChange}
                  className={errors['specifications.year'] ? 'error' : ''}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  disabled={isSubmitting}
                />
                {errors['specifications.year'] && 
                  <span className="error-message">{errors['specifications.year']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Mileage* (km)</label>
                <input
                  type="number"
                  id="mileage"
                  name="specifications.mileage"
                  value={getSafeFormValue(formData, 'specifications.mileage', '')}
                  onChange={handleNestedChange}
                  className={errors['specifications.mileage'] ? 'error' : ''}
                  min="0"
                  disabled={isSubmitting}
                />
                {errors['specifications.mileage'] && 
                  <span className="error-message">{errors['specifications.mileage']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="transmission">Transmission*</label>
                <select
                  id="transmission"
                  name="specifications.transmission"
                  value={getSafeFormValue(formData, 'specifications.transmission', '')}
                  onChange={handleNestedChange}
                  className={errors['specifications.transmission'] ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Transmission</option>
                  {TRANSMISSION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors['specifications.transmission'] && 
                  <span className="error-message">{errors['specifications.transmission']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">Fuel Type*</label>
                <select
                  id="fuelType"
                  name="specifications.fuelType"
                  value={getSafeFormValue(formData, 'specifications.fuelType', '')}
                  onChange={handleNestedChange}
                  className={errors['specifications.fuelType'] ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Fuel Type</option>
                  {FUEL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors['specifications.fuelType'] && 
                  <span className="error-message">{errors['specifications.fuelType']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="engineSize">Engine Size</label>
                <input
                  type="text"
                  id="engineSize"
                  name="specifications.engineSize"
                  value={getSafeFormValue(formData, 'specifications.engineSize', '')}
                  onChange={handleNestedChange}
                  placeholder="e.g., 3.0L"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="power">Power Output</label>
                <input
                  type="text"
                  id="power"
                  name="specifications.power"
                  value={getSafeFormValue(formData, 'specifications.power', '')}
                  onChange={handleNestedChange}
                  placeholder="e.g., 503 hp"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivetrain">Drivetrain</label>
                <select
                  id="drivetrain"
                  name="specifications.drivetrain"
                  value={getSafeFormValue(formData, 'specifications.drivetrain', '')}
                  onChange={handleNestedChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select Drivetrain</option>
                  {DRIVETRAIN_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="exteriorColor">Exterior Color</label>
                <input
                  type="text"
                  id="exteriorColor"
                  name="specifications.exteriorColor"
                  value={getSafeFormValue(formData, 'specifications.exteriorColor', '')}
                  onChange={handleNestedChange}
                  placeholder="e.g., Alpine White"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="interiorColor">Interior Color</label>
                <input
                  type="text"
                  id="interiorColor"
                  name="specifications.interiorColor"
                  value={getSafeFormValue(formData, 'specifications.interiorColor', '')}
                  onChange={handleNestedChange}
                  placeholder="e.g., Black Leather"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN Number</label>
                <input
                  type="text"
                  id="vin"
                  name="specifications.vin"
                  value={getSafeFormValue(formData, 'specifications.vin', '')}
                  onChange={handleNestedChange}
                  placeholder="Vehicle Identification Number"
                  disabled={isSubmitting}
                />
              </div>

              {/* Service History Section */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasServiceHistory"
                    checked={formData.serviceHistory?.hasServiceHistory || false}
                    onChange={handleServiceHistoryChange}
                    disabled={isSubmitting}
                  />
                  <span>Vehicle has service history records</span>
                </label>
              </div>

              {formData.serviceHistory?.hasServiceHistory && (
                <div className="service-history-section">
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        serviceHistory: {
                          ...prev.serviceHistory,
                          records: [
                            ...prev.serviceHistory.records,
                            {
                              date: '',
                              mileage: '',
                              service: '',
                              provider: ''
                            }
                          ]
                        }
                      }));
                    }}
                    className="add-service-record-btn"
                    disabled={isSubmitting}
                  >
                    + Add Service Record
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Features Section */}
          <section className={`form-section ${activeTab === 'features' ? 'active' : ''}`}>
            <div className="form-group-container">
              <div className="form-group full-width">
                <label>Safety Features</label>
                <div className="features-grid">
                  {SAFETY_FEATURES.map(feature => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.safetyFeatures) && formData.safetyFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('safetyFeatures', feature)}
                        disabled={isSubmitting}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Comfort & Convenience</label>
                <div className="features-grid">
                  {COMFORT_FEATURES.map(feature => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.comfortFeatures) && formData.comfortFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('comfortFeatures', feature)}
                        disabled={isSubmitting}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Performance Features</label>
                <div className="features-grid">
                  {PERFORMANCE_FEATURES.map(feature => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.performanceFeatures) && formData.performanceFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('performanceFeatures', feature)}
                        disabled={isSubmitting}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Entertainment & Technology</label>
                <div className="features-grid">
                  {ENTERTAINMENT_FEATURES.map(feature => (
                    <label key={feature} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.entertainmentFeatures) && formData.entertainmentFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('entertainmentFeatures', feature)}
                        disabled={isSubmitting}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Additional Features</label>
                <div className="feature-tags">
                  {Array.isArray(formData.features) && formData.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      {feature}
                      <button 
                        type="button" 
                        onClick={() => removeFeature(index)}
                        className="remove-tag"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  ref={newFeatureRef}
                  placeholder="Type a new feature and press Enter"
                  onKeyDown={handleNewFeature}
                  disabled={isSubmitting}
                  className="feature-input"
                />
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section className={`form-section ${activeTab === 'media' ? 'active' : ''}`}>
            <div className="form-group">
              <label>Vehicle Images*</label>
              <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden-input"
                  disabled={isSubmitting}
                />
                <div className="upload-placeholder">
                  <span className="upload-icon">📸</span>
                  <span>Click or drag images here</span>
                  <small>Maximum 10 images, 5MB each (JPEG, PNG, or WebP)</small>
                </div>
              </div>
              {errors.images && <span className="error-message">{errors.images}</span>}

              {images.length > 0 && (
                <div className="image-previews">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img 
                        src={image.preview} 
                        alt={`Preview ${index + 1}`} 
                        onError={(e) => {
                          console.error(`Error loading preview for image ${index}`);
                          e.target.src = '/images/placeholders/default.jpg';
                        }}
                      />
                      <div className="image-preview-actions">
                        <button 
                          type="button" 
                          className="remove-image"
                          onClick={() => removeImage(index)}
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                        <label className="primary-image">
                          <input
                            type="radio"
                            name="primaryImage"
                            checked={index === primaryImageIndex}
                            onChange={() => setPrimaryImageIndex(index)}
                            disabled={isSubmitting}
                          />
                          <span>Primary</span> 
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Basic Pricing Section */}
          <section className={`form-section ${activeTab === 'pricing' ? 'active' : ''}`}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Price*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className={errors.price ? 'error' : ''}
                  placeholder="Enter price"
                  min="0"
                  disabled={isSubmitting || formData.priceOptions?.showPriceAsPOA}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="monthlyPayment">Monthly Payment (P)</label>
                <input
                  type="number"
                  id="monthlyPayment"
                  name="priceOptions.monthlyPayment"
                  value={getSafeFormValue(formData, 'priceOptions.monthlyPayment', '')}
                  onChange={handleNestedChange}
                  placeholder="Enter monthly payment"
                  min="0"
                  disabled={isSubmitting || formData.priceOptions?.showPriceAsPOA}
                />
                <small>Monthly payment amount (will display as "P X p/m")</small>
              </div>

              <div className="form-group">
                <label htmlFor="priceType">Price Type</label>
                <select
                  id="priceType"
                  name="priceType"
                  value={formData.priceType || 'fixed'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {PRICE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.includesVAT"
                    checked={formData.priceOptions?.includesVAT || false}
                    onChange={(e) => handleNestedChange({
                      target: {
                        name: 'priceOptions.includesVAT',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Price Includes VAT</span>
                </label>
              </div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.showPriceAsPOA"
                    checked={formData.priceOptions?.showPriceAsPOA || false}
                    onChange={(e) => handleNestedChange({
                      target: {
                        name: 'priceOptions.showPriceAsPOA',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Price on Application (POA)</span>
                </label>
              </div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.financeAvailable"
                    checked={formData.priceOptions?.financeAvailable || false}
                    onChange={(e) => handleNestedChange({
                      target: {
                        name: 'priceOptions.financeAvailable',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Finance Available</span>
                </label>
              </div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.leaseAvailable"
                    checked={formData.priceOptions?.leaseAvailable || false}
                    onChange={(e) => handleNestedChange({
                      target: {
                        name: 'priceOptions.leaseAvailable',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Lease Available</span>
                </label>
              </div>
            </div>
          </section>

          {/* NEW: I3W Savings Section */}
          <section className={`form-section ${activeTab === 'savings' ? 'active' : ''}`}>
            <div className="savings-section-header">
              <h3>🎯 I3W Car Culture Savings</h3>
              <p>Configure exclusive discounts and savings for customers who buy through I3W Car Culture</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group checkbox full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.showSavings"
                    checked={formData.priceOptions?.showSavings || false}
                    onChange={(e) => handleNestedChange({
                      target: {
                        name: 'priceOptions.showSavings',
                        value: e.target.checked
                      }
                    })}
                    disabled={isSubmitting}
                  />
                  <span>Enable I3W Savings for this listing</span>
                </label>
              </div>

              {formData.priceOptions?.showSavings && (
                <>
                  <div className="form-group">
                    <label htmlFor="originalPrice">Original Dealer Price (P)</label>
                    <input
                      type="number"
                      id="originalPrice"
                      name="priceOptions.originalPrice"
                      value={getSafeFormValue(formData, 'priceOptions.originalPrice', '')}
                      onChange={handleNestedChange}
                      placeholder="Enter original price"
                      min="0"
                      disabled={isSubmitting}
                      className={errors['priceOptions.originalPrice'] ? 'error' : ''}
                    />
                    {errors['priceOptions.originalPrice'] && 
                      <span className="error-message">{errors['priceOptions.originalPrice']}</span>
                    }
                    <small>The original price before I3W discount</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dealerDiscount">Dealer Discount (%)</label>
                    <input
                      type="number"
                      id="dealerDiscount"
                      name="priceOptions.dealerDiscount"
                      value={getSafeFormValue(formData, 'priceOptions.dealerDiscount', '')}
                      onChange={handleNestedChange}
                      placeholder="Enter discount percentage"
                      min="0"
                      max="99"
                      step="0.1"
                      disabled={isSubmitting}
                      className={errors['priceOptions.dealerDiscount'] ? 'error' : ''}
                    />
                    {errors['priceOptions.dealerDiscount'] && 
                      <span className="error-message">{errors['priceOptions.dealerDiscount']}</span>
                    }
                    <small>Discount percentage negotiated with dealer</small>
                  </div>

                  {(formData.priceOptions?.savingsAmount || formData.priceOptions?.savingsPercentage) && (
                    <div className="savings-preview">
                      <h4>💰 Savings Preview</h4>
                      <div className="savings-preview-content">
                        <div className="preview-row">
                          <span>Original Price:</span>
                          <span>P {Number(formData.priceOptions?.originalPrice || 0).toLocaleString()}</span>
                        </div>
                        <div className="preview-row">
                          <span>I3W Price:</span>
                          <span>P {Number(formData.price || 0).toLocaleString()}</span>
                        </div>
                        <div className="preview-row savings-amount">
                          <span>Customer Saves:</span>
                          <span>P {Number(formData.priceOptions?.savingsAmount || 0).toLocaleString()} ({formData.priceOptions?.savingsPercentage || 0}%)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label htmlFor="savingsDescription">Savings Description</label>
                    <textarea
                      id="savingsDescription"
                      name="priceOptions.savingsDescription"
                      value={getSafeFormValue(formData, 'priceOptions.savingsDescription', '')}
                      onChange={handleNestedChange}
                      placeholder="e.g., 'End of year clearance deal' or 'Exclusive I3W partnership discount'"
                      rows="2"
                      disabled={isSubmitting}
                    />
                    <small>Optional description for the savings offer</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="savingsValidUntil">Savings Valid Until</label>
                    <input
                      type="date"
                      id="savingsValidUntil"
                      name="priceOptions.savingsValidUntil"
                      value={getSafeFormValue(formData, 'priceOptions.savingsValidUntil', '')}
                      onChange={handleNestedChange}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isSubmitting}
                    />
                    <small>Leave empty for permanent offer</small>
                  </div>

                  <div className="form-group checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="priceOptions.exclusiveDeal"
                        checked={formData.priceOptions?.exclusiveDeal || false}
                        onChange={(e) => handleNestedChange({
                          target: {
                            name: 'priceOptions.exclusiveDeal',
                            value: e.target.checked
                          }
                        })}
                        disabled={isSubmitting}
                      />
                      <span>Mark as Exclusive I3W Deal</span>
                    </label>
                    <small>Exclusive deals get special highlighting and marketing priority</small>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Location Section */}
          <section className={`form-section ${activeTab === 'location' ? 'active' : ''}`}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.location?.address || ''}
                  onChange={handleLocationChange}
                  placeholder="Address"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City*</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.location?.city || ''}
                  onChange={handleLocationChange}
                  className={errors['location.city'] ? 'error' : ''}
                  placeholder="City"
                  disabled={isSubmitting}
                />
                {errors['location.city'] && 
                  <span className="error-message">{errors['location.city']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="state">State/Province</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.location?.state || ''}
                  onChange={handleLocationChange}
                  placeholder="State or Province"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country*</label>
                <select
                  id="country"
                  name="country"
                  value={formData.location?.country || ''}
                  onChange={handleLocationChange}
                  className={errors['location.country'] ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors['location.country'] && 
                  <span className="error-message">{errors['location.country']}</span>
                }
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.location?.postalCode || ''}
                  onChange={handleLocationChange}
                  placeholder="Postal Code"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* SEO Section */}
          <section className={`form-section ${activeTab === 'seo' ? 'active' : ''}`}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="metaTitle">Meta Title</label>
                <input
                  type="text"
                  id="metaTitle"
                  name="seo.metaTitle"
                  value={getSafeFormValue(formData, 'seo.metaTitle', '')}
                  onChange={handleNestedChange}
                  placeholder="SEO Meta Title"
                  maxLength={60}
                  disabled={isSubmitting}
                />
                <small>{getSafeFormValue(formData, 'seo.metaTitle', '').length}/60 characters</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="metaDescription">Meta Description</label>
                <textarea
                  id="metaDescription"
                  name="seo.metaDescription"
                  value={getSafeFormValue(formData, 'seo.metaDescription', '')}
                  onChange={handleNestedChange}
                  rows="3"
                  placeholder="SEO Meta Description"
                  maxLength={160}
                  disabled={isSubmitting}
                />
                <small>{getSafeFormValue(formData, 'seo.metaDescription', '').length}/160 characters</small>
              </div>

              <div className="form-group full-width">
                <label>Keywords</label>
                <div className="keywords-container">
                  {Array.isArray(formData.seo?.keywords) && formData.seo.keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">
                      {keyword}
                      <button 
                        type="button" 
                        onClick={() => handleKeywordRemove(index)}
                        className="remove-tag"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    ref={keywordInputRef}
                    placeholder="Add keywords (press Enter)"
                    onKeyDown={handleKeywordAdd}
                    disabled={isSubmitting}
                    className="keyword-input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 
                formData.priceOptions?.showSavings ? 
                  '🎯 Add Listing with Savings' : 
                  'Add Listing'
              }
            </button>
          </div>
        </form>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export wrapped in ErrorBoundary
export default function AddListingModalWithErrorBoundary(props) {
  return (
    <ErrorBoundary fallback={({ error }) => (
      <div className="error-fallback">
        <h3>Error Adding Listing</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )}>
      <AddListingModal {...props} />
    </ErrorBoundary>
  );
}