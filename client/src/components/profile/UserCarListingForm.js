// client/src/components/profile/UserCarListingForm.js - COMPLETE FULL VERSION

import React, { useState, useEffect, useCallback } from 'react';
import { imageService } from '../../services/imageService.js';
import './UserCarListingForm.css';

const UserCarListingForm = ({ onSubmit, onCancel, initialData = null, isEdit = false }) => {
  // Default form structure - COMPLETE
  const defaultFormData = {
    title: '',
    description: '',
    price: '',
    category: 'sedan',
    condition: 'used',
    
    specifications: {
      make: '',
      model: '',
      year: '',
      mileage: '',
      transmission: 'automatic',
      fuelType: 'petrol',
      engine: '',
      color: '',
      doors: '',
      seats: '',
      drivetrain: '',
      bodyType: '',
      vin: ''
    },
    
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      whatsapp: '',
      location: {
        city: '',
        state: '',
        address: '',
        country: 'Botswana'
      }
    },
    
    location: {
      city: '',
      state: '',
      address: '',
      country: 'Botswana'
    },
    
    features: {
      comfort: [],
      safety: [],
      technology: [],
      performance: [],
      exterior: [],
      interior: []
    },
    
    images: [],
    profilePicture: '',
    sellerType: 'private',
    
    privateSeller: {
      firstName: '',
      lastName: '',
      idNumber: '',
      preferredContactMethod: 'both',
      canShowContactInfo: true
    },
    
    businessInfo: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      vatNumber: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: ''
    },
    
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      tiktok: ''
    },
    
    priceOptions: {
      negotiable: false,
      showSavings: false,
      originalPrice: '',
      savingsAmount: '',
      savingsPercentage: '',
      dealerDiscount: '',
      exclusiveDeal: false,
      priceValidUntil: ''
    },
    
    additionalInfo: {
      serviceHistory: '',
      accidents: '',
      modifications: '',
      warranty: '',
      inspection: '',
      financing: false,
      tradeIn: false,
      urgentSale: false,
      reasonForSelling: ''
    },
    
    availability: {
      availableFrom: '',
      viewingTimes: '',
      testDrivePolicy: '',
      deliveryAvailable: false,
      pickupLocation: ''
    }
  };

  // All form states
  const [formData, setFormData] = useState(initialData || defaultFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentTab, setCurrentTab] = useState('basic');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-fill states
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [showAutoFillPrompt, setShowAutoFillPrompt] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(null);

  // Feature options - COMPLETE
  const featureOptions = {
    comfort: [
      'Air Conditioning', 'Climate Control', 'Heated Seats', 'Cooled Seats',
      'Leather Seats', 'Power Seats', 'Memory Seats', 'Massage Seats',
      'Sunroof', 'Panoramic Roof', 'Dual Zone Climate', 'Rear AC',
      'Lumbar Support', 'Heated Steering Wheel', 'Adjustable Pedals'
    ],
    safety: [
      'ABS', 'ESP', 'Airbags', 'Side Airbags', 'Curtain Airbags',
      'Backup Camera', 'Parking Sensors', 'Blind Spot Monitoring',
      'Lane Departure Warning', 'Lane Keep Assist', 'Collision Warning',
      'Automatic Emergency Braking', 'Adaptive Cruise Control',
      'Stability Control', 'Traction Control', 'Hill Start Assist',
      'Tire Pressure Monitoring', 'Security System', 'Immobilizer'
    ],
    technology: [
      'Bluetooth', 'Apple CarPlay', 'Android Auto', 'WiFi Hotspot',
      'Navigation System', 'GPS', 'Touch Screen', 'Voice Control',
      'Premium Sound System', 'Wireless Charging', 'USB Ports',
      'Aux Input', 'CD Player', 'Digital Dashboard', 'HUD Display',
      'Keyless Entry', 'Keyless Start', 'Remote Start', 'Smart Key'
    ],
    performance: [
      'Turbo', 'Supercharged', 'Sport Mode', 'Eco Mode',
      'All Wheel Drive', 'Four Wheel Drive', 'Limited Slip Differential',
      'Sport Suspension', 'Air Suspension', 'Adjustable Suspension',
      'Performance Tires', 'Brembo Brakes', 'Sport Exhaust'
    ],
    exterior: [
      'Alloy Wheels', 'Chrome Trim', 'Roof Rails', 'Running Boards',
      'Fog Lights', 'LED Headlights', 'Xenon Headlights', 'DRL',
      'Tinted Windows', 'Power Windows', 'Electric Mirrors',
      'Heated Mirrors', 'Folding Mirrors', 'Spoiler', 'Body Kit',
      'Mud Flaps', 'Tow Hook', 'Spare Tire'
    ],
    interior: [
      'Wood Trim', 'Carbon Fiber Trim', 'Ambient Lighting',
      'Reading Lights', 'Cup Holders', 'Armrest', 'Floor Mats',
      'Cargo Cover', 'Cargo Net', 'Hooks', 'Power Outlets',
      'Cigarette Lighter', 'Ashtray', 'Vanity Mirror', 'Coat Hooks',
      'Bottle Holders', 'Magazine Pockets', 'Umbrella Holder'
    ]
  };

  // Vehicle categories - COMPLETE
  const vehicleCategories = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'wagon', label: 'Station Wagon' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'van', label: 'Van' },
    { value: 'minivan', label: 'Minivan' },
    { value: 'crossover', label: 'Crossover' },
    { value: 'luxury', label: 'Luxury Car' },
    { value: 'sports', label: 'Sports Car' },
    { value: 'electric', label: 'Electric Vehicle' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'commercial', label: 'Commercial Vehicle' }
  ];

  // Show message utility
  const showMessage = useCallback((type, text) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  }, []);

  // Load user profile data for auto-fill
  const loadUserProfileData = useCallback(async () => {
    try {
      setAutoFillLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await fetch('/api/user/profile/form-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setAutoFillData(result.data);
          setProfileCompletion(result.data.profileCompletion);
          
          // Show auto-fill prompt if we have useful data and form is empty
          const hasUsefulData = result.data.contact?.phone || 
                               result.data.contact?.location?.city || 
                               result.data.sellerName;
          
          const formIsEmpty = !formData.contact.sellerName && 
                             !formData.contact.phone && 
                             !formData.contact.location.city;

          if (hasUsefulData && formIsEmpty && !isEdit) {
            setShowAutoFillPrompt(true);
          }
          
          console.log('✅ User profile data loaded for auto-fill:', {
            hasContact: !!result.data.contact?.phone,
            hasLocation: !!result.data.contact?.location?.city,
            sellerType: result.data.sellerType,
            profileCompletion: result.data.profileCompletion
          });
        }
      } else {
        console.warn('Failed to load user profile data:', response.status);
      }
    } catch (error) {
      console.error('Error loading user profile data:', error);
    } finally {
      setAutoFillLoading(false);
    }
  }, [formData.contact.sellerName, formData.contact.phone, formData.contact.location.city, isEdit]);

  // Apply auto-fill data to form
  const applyAutoFill = useCallback((selective = false, fields = []) => {
    if (!autoFillData) return;

    const updates = {};

    // Define which fields to auto-fill
    const fieldsToFill = selective ? fields : [
      'sellerName', 'contact', 'profilePicture', 'sellerType', 'businessInfo', 'privateSeller', 'social'
    ];

    // Apply seller name
    if (fieldsToFill.includes('sellerName') && autoFillData.sellerName && !formData.contact.sellerName) {
      updates['contact.sellerName'] = autoFillData.sellerName;
    }

    // Apply contact information
    if (fieldsToFill.includes('contact')) {
      if (autoFillData.contact?.phone && !formData.contact.phone) {
        updates['contact.phone'] = autoFillData.contact.phone;
      }
      if (autoFillData.contact?.email && !formData.contact.email) {
        updates['contact.email'] = autoFillData.contact.email;
      }
      if (autoFillData.contact?.whatsapp && !formData.contact.whatsapp) {
        updates['contact.whatsapp'] = autoFillData.contact.whatsapp;
      }

      // Location
      if (autoFillData.contact?.location?.city && !formData.contact.location.city) {
        updates['contact.location.city'] = autoFillData.contact.location.city;
      }
      if (autoFillData.contact?.location?.state && !formData.contact.location.state) {
        updates['contact.location.state'] = autoFillData.contact.location.state;
      }
      if (autoFillData.contact?.location?.address && !formData.contact.location.address) {
        updates['contact.location.address'] = autoFillData.contact.location.address;
      }
      
      // Also update main location fields
      if (autoFillData.contact?.location?.city && !formData.location.city) {
        updates['location.city'] = autoFillData.contact.location.city;
      }
      if (autoFillData.contact?.location?.state && !formData.location.state) {
        updates['location.state'] = autoFillData.contact.location.state;
      }
      if (autoFillData.contact?.location?.address && !formData.location.address) {
        updates['location.address'] = autoFillData.contact.location.address;
      }
    }

    // Apply profile picture
    if (fieldsToFill.includes('profilePicture') && autoFillData.profilePicture && !formData.profilePicture) {
      updates.profilePicture = autoFillData.profilePicture;
    }

    // Apply seller type
    if (fieldsToFill.includes('sellerType') && autoFillData.sellerType && !formData.sellerType) {
      updates.sellerType = autoFillData.sellerType;
    }

    // Apply business information if dealership
    if (fieldsToFill.includes('businessInfo') && autoFillData.businessInfo && autoFillData.sellerType === 'dealership') {
      if (!formData.businessInfo.businessName && autoFillData.businessInfo.businessName) {
        updates['businessInfo.businessName'] = autoFillData.businessInfo.businessName;
      }
      if (!formData.businessInfo.businessType && autoFillData.businessInfo.businessType) {
        updates['businessInfo.businessType'] = autoFillData.businessInfo.businessType;
      }
      if (!formData.businessInfo.registrationNumber && autoFillData.businessInfo.registrationNumber) {
        updates['businessInfo.registrationNumber'] = autoFillData.businessInfo.registrationNumber;
      }
      if (!formData.businessInfo.vatNumber && autoFillData.businessInfo.vatNumber) {
        updates['businessInfo.vatNumber'] = autoFillData.businessInfo.vatNumber;
      }
    }

    // Apply private seller info if private seller
    if (fieldsToFill.includes('privateSeller') && autoFillData.privateSeller && autoFillData.sellerType === 'private') {
      if (!formData.privateSeller?.firstName && autoFillData.privateSeller.firstName) {
        updates['privateSeller.firstName'] = autoFillData.privateSeller.firstName;
      }
      if (!formData.privateSeller?.lastName && autoFillData.privateSeller.lastName) {
        updates['privateSeller.lastName'] = autoFillData.privateSeller.lastName;
      }
      if (!formData.privateSeller?.idNumber && autoFillData.privateSeller.idNumber) {
        updates['privateSeller.idNumber'] = autoFillData.privateSeller.idNumber;
      }
    }

    // Apply social media
    if (fieldsToFill.includes('social') && autoFillData.social) {
      Object.keys(autoFillData.social).forEach(platform => {
        if (autoFillData.social[platform] && !formData.social?.[platform]) {
          updates[`social.${platform}`] = autoFillData.social[platform];
        }
      });
    }

    // Apply updates to form
    if (Object.keys(updates).length > 0) {
      const updatedFormData = { ...formData };
      
      Object.keys(updates).forEach(key => {
        const keys = key.split('.');
        let current = updatedFormData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = updates[key];
      });

      setFormData(updatedFormData);
      setShowAutoFillPrompt(false);

      // Show success message
      const fieldsCount = Object.keys(updates).length;
      showMessage('success', `Auto-filled ${fieldsCount} field${fieldsCount > 1 ? 's' : ''} from your profile`);
      
      console.log('✅ Auto-fill applied:', updates);
    }
  }, [autoFillData, formData, showMessage]);

  // Save form data back to profile
  const saveToProfile = useCallback(async () => {
    if (!autoFillData) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const profileUpdateData = {
        contact: {
          phone: formData.contact.phone,
          location: {
            city: formData.contact.location.city,
            state: formData.contact.location.state,
            address: formData.contact.location.address
          }
        },
        profilePicture: formData.profilePicture,
        social: formData.social
      };

      const response = await fetch('/api/user/profile/update-from-listing', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdateData)
      });

      if (response.ok) {
        console.log('✅ Profile updated from listing form');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }, [formData, autoFillData]);

  // Load profile data on component mount
  useEffect(() => {
    if (!isEdit && !autoFillData) {
      loadUserProfileData();
    }
  }, [loadUserProfileData, isEdit, autoFillData]);

const validatePricing = () => {
  const errors = {};
  
  // Parse prices as numbers for comparison
  const currentPrice = parseFloat(formData.price);
  const originalPrice = formData.priceOptions?.originalPrice ? parseFloat(formData.priceOptions.originalPrice) : null;
  const savingsAmount = formData.priceOptions?.savingsAmount ? parseFloat(formData.priceOptions.savingsAmount) : null;
  
  // Validate current price
  if (!currentPrice || currentPrice <= 0) {
    errors.price = 'Current price is required and must be greater than 0';
  }
  
  // If showing savings, validate original price
  if (formData.priceOptions?.showSavings) {
    if (!originalPrice || originalPrice <= 0) {
      errors['priceOptions.originalPrice'] = 'Original price is required when showing savings';
    } else if (originalPrice <= currentPrice) {
      // FIXED: Proper number comparison for large numbers
      errors['priceOptions.originalPrice'] = `Original price (${originalPrice.toLocaleString()}) must be higher than current price (${currentPrice.toLocaleString()})`;
    }
    
    // Validate savings amount if provided
    if (savingsAmount) {
      const calculatedSavings = originalPrice - currentPrice;
      if (Math.abs(savingsAmount - calculatedSavings) > 0.01) { // Allow for small floating point differences
        errors['priceOptions.savingsAmount'] = `Savings amount should be ${calculatedSavings.toLocaleString()}`;
      }
    }
  }
  
  return errors;
};
  
  // Form validation - COMPLETE
 const validateForm = () => {
  const errors = {};
  
  // Basic validation
  if (!formData.title.trim() || formData.title.length < 10) {
    errors.title = 'Title must be at least 10 characters long';
  }
  
  if (!formData.description.trim() || formData.description.length < 20) {
    errors.description = 'Description must be at least 20 characters long';
  }
  
  // FIXED: Use the new pricing validation
  const pricingErrors = validatePricing();
  Object.assign(errors, pricingErrors);
  
  // Specifications validation
  if (!formData.specifications.make.trim()) {
    errors['specifications.make'] = 'Make is required';
  }
  
  if (!formData.specifications.model.trim()) {
    errors['specifications.model'] = 'Model is required';
  }
  
  if (!formData.specifications.year || formData.specifications.year < 1900 || formData.specifications.year > new Date().getFullYear() + 2) {
    errors['specifications.year'] = 'Valid year is required';
  }
  
  // Contact validation
  if (!formData.contact.sellerName.trim()) {
    errors['contact.sellerName'] = 'Seller name is required';
  }
  
  if (!formData.contact.phone.trim()) {
    errors['contact.phone'] = 'Phone number is required';
  }
  
  // Private seller validation
  if (formData.sellerType === 'private') {
    if (!formData.privateSeller.firstName.trim()) {
      errors['privateSeller.firstName'] = 'First name is required for private sellers';
    }
    if (!formData.privateSeller.lastName.trim()) {
      errors['privateSeller.lastName'] = 'Last name is required for private sellers';
    }
  }
  
  // Business validation
  if (formData.sellerType === 'dealership') {
    if (!formData.businessInfo.businessName.trim()) {
      errors['businessInfo.businessName'] = 'Business name is required for dealerships';
    }
    if (!formData.businessInfo.businessType.trim()) {
      errors['businessInfo.businessType'] = 'Business type is required for dealerships';
    }
  }
  
  return errors;
};

const handlePriceChange = (e) => {
  const { name, value } = e.target;
  
  // Update the form data
  handleInputChange(e);
  
  // Real-time validation for pricing fields
  if (name === 'price' || name === 'priceOptions.originalPrice') {
    setTimeout(() => {
      const pricingErrors = validatePricing();
      setErrors(prev => ({
        ...prev,
        ...pricingErrors,
        // Clear pricing errors if validation passes
        ...(Object.keys(pricingErrors).length === 0 && {
          price: undefined,
          'priceOptions.originalPrice': undefined,
          'priceOptions.savingsAmount': undefined
        })
      }));
    }, 100); // Small delay to ensure state is updated
  }
};

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const keys = name.split('.');
      if (keys.length === 2) {
        setFormData(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (keys.length === 3) {
        setFormData(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: {
              ...prev[keys[0]][keys[1]],
              [keys[2]]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (category, feature) => {
    setFormData(prev => {
      const currentFeatures = Array.isArray(prev.features[category]) ? [...prev.features[category]] : [];
      const updatedFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];
      
      return {
        ...prev,
        features: {
          ...prev.features,
          [category]: updatedFeatures
        }
      };
    });
  };


const handleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length > 15) {
    showMessage('error', 'Maximum 15 images allowed');
    return;
  }

  const maxSize = 8 * 1024 * 1024; // 8MB
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  const invalidFiles = files.filter(file => 
    file.size > maxSize || !validTypes.includes(file.type.toLowerCase())
  );
  
  if (invalidFiles.length > 0) {
    showMessage('error', 'Some files are invalid. Use JPEG/PNG/WebP under 8MB each.');
    return;
  }

  console.log(`📸 Selected ${files.length} valid images`);
  
  // Store files for upload
  setImageFiles(files);
  
  // Create previews
  const previews = files.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    name: file.name,
    size: file.size
  }));
  
  setImagePreviews(previews);
  
  // Clear errors
  if (errors.images) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.images;
      return newErrors;
    });
  }
  
  showMessage('success', `${files.length} images selected`);
};

  // Handle primary image selection
  const handlePrimaryImageSelect = (index) => {
    setPrimaryImageIndex(index);
  };

const setPrimaryImage = (index) => {
  setPrimaryImageIndex(index);
  console.log(`📸 Set primary image to index ${index}`);
};

  // Remove image
const removeImage = (index) => {
  const newFiles = imageFiles.filter((_, i) => i !== index);
  const newPreviews = imagePreviews.filter((_, i) => i !== index);
  
  setImageFiles(newFiles);
  setImagePreviews(newPreviews);
  
  // Revoke the URL to prevent memory leaks
  if (imagePreviews[index]) {
    URL.revokeObjectURL(imagePreviews[index].preview);
  }
  
  // Update primary image index if needed
  if (primaryImageIndex >= newFiles.length) {
    setPrimaryImageIndex(0);
  }
  
  console.log(`📸 Removed image at index ${index}, ${newFiles.length} images remaining`);
};

  // Handle form submission
const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  if (isSubmitting) return;
  
  setLoading(true);
  setIsSubmitting(true);
  
  try {
    // Validate form first
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      showMessage('error', firstError);
      return;
    }

    console.log(`📤 Starting submission with ${imageFiles?.length || 0} images`);

    // ========================================
    // STEP 1: Upload images if any
    // ========================================
    let uploadedImages = [];
    
    if (imageFiles && imageFiles.length > 0) {
      showMessage('info', `Uploading ${imageFiles.length} images...`);
      
      try {
        const formData = new FormData();
        imageFiles.forEach((file, index) => {
          formData.append(`image${index}`, file);
          console.log(`📎 Added file ${index}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        });
        formData.append('folder', 'user-listings');

        console.log('🔄 Uploading to /api/user/upload-images...');
        
        const uploadResponse = await fetch('/api/user/upload-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        console.log(`📤 Upload response status: ${uploadResponse.status}`);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('📤 Upload failed response:', errorText);
          throw new Error(`Image upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('📤 Upload result:', uploadResult);
        
        if (!uploadResult.success || !uploadResult.images) {
          throw new Error(uploadResult.message || 'Image upload failed - no images returned');
        }

        uploadedImages = uploadResult.images;
        console.log(`✅ Images uploaded successfully: ${uploadedImages.length} images`);
        showMessage('success', `${uploadedImages.length} images uploaded successfully!`);
        
      } catch (uploadError) {
        console.error('📤 ❌ Image upload failed:', uploadError);
        showMessage('error', `Image upload failed: ${uploadError.message}`);
        return; // Stop submission if image upload fails
      }
    }

    // ========================================
    // STEP 2: Prepare complete listing data
    // ========================================
    const listingData = {
      // Basic Information
      title: formData.title,
      description: formData.description,
      category: formData.category,
      condition: formData.condition,
      sellerType: formData.sellerType,
      
      // Pricing Information
      pricing: {
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.priceOptions?.originalPrice ? 
          parseFloat(formData.priceOptions.originalPrice) : null,
        negotiable: formData.priceOptions?.negotiable || false,
        showSavings: formData.priceOptions?.showSavings || false,
        savingsAmount: formData.priceOptions?.savingsAmount ? 
          parseFloat(formData.priceOptions.savingsAmount) : null
      },
      
      // Vehicle Specifications
      specifications: {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        engineType: formData.engineType,
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        bodyType: formData.bodyType,
        drivetrain: formData.drivetrain,
        exteriorColor: formData.exteriorColor,
        interiorColor: formData.interiorColor,
        numberOfSeats: formData.numberOfSeats ? parseInt(formData.numberOfSeats) : null,
        numberOfDoors: formData.numberOfDoors ? parseInt(formData.numberOfDoors) : null,
        engineSize: formData.engineSize,
        numberOfCylinders: formData.numberOfCylinders ? parseInt(formData.numberOfCylinders) : null,
        vin: formData.vin
      },
      
      // Features
      features: {
        keyFeatures: formData.keyFeatures || [],
        safetyFeatures: formData.safetyFeatures || [],
        comfortFeatures: formData.comfortFeatures || [],
        entertainmentFeatures: formData.entertainmentFeatures || []
      },
      
      // Contact Information
      contact: {
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail,
        whatsapp: formData.whatsappNumber,
        preferredContact: formData.preferredContact || 'phone'
      },
      
      // Location
      location: {
        city: formData.location.city,
        state: formData.location.state,
        address: formData.location.address
      },
      
      // Social Media (if provided)
      social: formData.social || {},
      
      // Private Seller Info (if applicable)
      privateSeller: formData.sellerType === 'private' ? {
        firstName: formData.privateSeller?.firstName,
        lastName: formData.privateSeller?.lastName,
        idNumber: formData.privateSeller?.idNumber,
        preferredContactMethod: formData.privateSeller?.preferredContactMethod
      } : null,
      
      // Business Info (if applicable)
      businessInfo: formData.sellerType === 'dealership' ? {
        businessName: formData.businessInfo?.businessName,
        businessType: formData.businessInfo?.businessType,
        registrationNumber: formData.businessInfo?.registrationNumber,
        vatNumber: formData.businessInfo?.vatNumber
      } : null,
      
      // Additional Information
      additionalInfo: {
        serviceHistory: formData.additionalInfo?.serviceHistory,
        accidents: formData.additionalInfo?.accidents,
        modifications: formData.additionalInfo?.modifications,
        warranty: formData.additionalInfo?.warranty,
        inspection: formData.additionalInfo?.inspection,
        reasonForSelling: formData.additionalInfo?.reasonForSelling
      },
      
      // Availability
      availability: {
        viewingTimes: formData.availability?.viewingTimes,
        availableFrom: formData.availability?.availableFrom,
        urgentSale: formData.availability?.urgentSale || false
      },
      
      // Uploaded Images with metadata
      images: uploadedImages.map((img, index) => ({
        url: img.url,
        key: img.key,
        thumbnail: img.thumbnail || img.url,
        isPrimary: index === primaryImageIndex,
        size: img.size,
        mimetype: img.mimetype
      })),
      
      // Submission Metadata
      submissionType: 'free_tier', // or could be dynamic based on selection
      status: 'pending_approval',
      submittedAt: new Date().toISOString()
    };

    console.log(`📋 Prepared listing data:`, {
      title: listingData.title,
      imageCount: listingData.images.length,
      price: listingData.pricing.price,
      primaryImageIndex: primaryImageIndex
    });

    // ========================================
    // STEP 3: Submit listing to backend
    // ========================================
    showMessage('info', 'Submitting your listing...');
    console.log('🔄 Submitting listing to /api/user/submit-listing...');
    
    const submitResponse = await fetch('/api/user/submit-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ listingData })
    });

    console.log(`📋 Submission response status: ${submitResponse.status}`);

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('📋 Submission failed response:', errorText);
      throw new Error(`Listing submission failed: ${submitResponse.status} - ${errorText}`);
    }

    const result = await submitResponse.json();
    console.log('📋 Submission result:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Submission failed');
    }

    console.log('✅ Listing submitted successfully!');
    showMessage('success', 'Your listing has been submitted for approval! You will be notified once it\'s reviewed.');
    
    // Reset form to clean state
    resetForm();
    
    // Call parent callback if provided
    if (onSubmit) {
      onSubmit(result);
    }

  } catch (error) {
    console.error('❌ Form submission failed:', error);
    showMessage('error', `Submission failed: ${error.message}`);
  } finally {
    setLoading(false);
    setIsSubmitting(false);
  }
};

// Reset form to initial state
const resetForm = () => {
  // Clear image files and previews
  if (imagePreviews.length > 0) {
    imagePreviews.forEach(preview => {
      URL.revokeObjectURL(preview.preview);
    });
  }
  
  setImageFiles([]);
  setImagePreviews([]);
  setPrimaryImageIndex(0);
  
  // Reset form data to initial state
  setFormData({
    // Basic Information
    title: '',
    description: '',
    category: '',
    condition: '',
    sellerType: 'private',
    
    // Pricing
    price: '',
    priceOptions: {
      originalPrice: '',
      negotiable: false,
      showSavings: false,
      savingsAmount: ''
    },
    
    // Vehicle Specifications
    make: '',
    model: '',
    year: '',
    engineType: '',
    transmission: '',
    fuelType: '',
    mileage: '',
    bodyType: '',
    drivetrain: '',
    exteriorColor: '',
    interiorColor: '',
    numberOfSeats: '',
    numberOfDoors: '',
    engineSize: '',
    numberOfCylinders: '',
    vin: '',
    
    // Features
    keyFeatures: [],
    safetyFeatures: [],
    comfortFeatures: [],
    entertainmentFeatures: [],
    
    // Contact Information
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    whatsappNumber: '',
    preferredContact: 'phone',
    
    // Location
    location: {
      city: '',
      state: '',
      address: ''
    },
    
    // Social Media
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      tiktok: '',
      youtube: ''
    }
  });
  
  // Clear errors
  setErrors({});
  
  console.log(`🔄 Form reset to initial state`);
};

  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '' },
    { id: 'specs', label: 'Specifications', icon: '⚙️' },
    { id: 'features', label: 'Features', icon: '' },
    { id: 'contact', label: 'Contact', icon: '' },
    { id: 'images', label: 'Images', icon: '' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'additional', label: 'Additional', icon: '📋' }
  ];

  return (
    <div className="ulisting-form-container">
      {/* Auto-fill loading indicator */}
      {autoFillLoading && (
        <div className="ulisting-auto-fill-loading">
          <div className="ulisting-spinner"></div>
          <span>Loading your profile data...</span>
        </div>
      )}

      {/* Auto-fill prompt */}
      {showAutoFillPrompt && autoFillData && (
        <div className="ulisting-auto-fill-prompt">
          <div className="ulisting-auto-fill-content">
            <h4>🚀 Speed up your listing!</h4>
            <p>We found information in your profile that can be used to fill this form:</p>
            
            <div className="ulisting-auto-fill-preview">
              {autoFillData.sellerName && (
                <div className="ulisting-auto-fill-item">
                  <span className="ulisting-field-name">Name:</span>
                  <span className="ulisting-field-value">{autoFillData.sellerName}</span>
                </div>
              )}
              {autoFillData.contact?.phone && (
                <div className="ulisting-auto-fill-item">
                  <span className="ulisting-field-name">Phone:</span>
                  <span className="ulisting-field-value">{autoFillData.contact.phone}</span>
                </div>
              )}
              {autoFillData.contact?.location?.city && (
                <div className="ulisting-auto-fill-item">
                  <span className="ulisting-field-name">Location:</span>
                  <span className="ulisting-field-value">{autoFillData.contact.location.city}</span>
                </div>
              )}
              {autoFillData.sellerType && (
                <div className="ulisting-auto-fill-item">
                  <span className="ulisting-field-name">Seller Type:</span>
                  <span className="ulisting-field-value">{autoFillData.sellerType}</span>
                </div>
              )}
            </div>
            
            <div className="ulisting-auto-fill-actions">
              <button 
                type="button"
                className="ulisting-auto-fill-accept"
                onClick={() => applyAutoFill()}
              >
                Auto-fill form
              </button>
              <button 
                type="button"
                className="ulisting-auto-fill-decline"
                onClick={() => setShowAutoFillPrompt(false)}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile completion indicator */}
      {profileCompletion && !showAutoFillPrompt && (
        <div className="ulisting-profile-completion-status">
          <h5>Profile Completion</h5>
          <div className="ulisting-completion-items">
            <span className={`ulisting-completion-item ${profileCompletion.basicInfo ? 'complete' : 'incomplete'}`}>
              {profileCompletion.basicInfo ? '✅' : '⭕'} Basic Info
            </span>
            <span className={`ulisting-completion-item ${profileCompletion.contactInfo ? 'complete' : 'incomplete'}`}>
              {profileCompletion.contactInfo ? '✅' : '⭕'} Contact
            </span>
            <span className={`ulisting-completion-item ${profileCompletion.locationInfo ? 'complete' : 'incomplete'}`}>
              {profileCompletion.locationInfo ? '✅' : '⭕'} Location
            </span>
            <span className={`ulisting-completion-item ${profileCompletion.profilePicture ? 'complete' : 'incomplete'}`}>
              {profileCompletion.profilePicture ? '✅' : '⭕'} Picture
            </span>
          </div>
          {autoFillData && (
            <button 
              type="button"
              className="ulisting-manual-auto-fill"
              onClick={() => setShowAutoFillPrompt(true)}
            >
              Use Profile Data
            </button>
          )}
        </div>
      )}

      {/* Form header */}
      <div className="ulisting-form-header">
        <h3>{isEdit ? 'Edit Car Listing' : 'Create New Car Listing'}</h3>
        <p>Fill in the details below to {isEdit ? 'update' : 'create'} your car listing</p>
      </div>

      {/* Message display */}
      {message && (
        <div className={`ulisting-form-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Tab navigation */}
      <div className="ulisting-form-tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`ulisting-form-tab-button ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form content */}
      <form onSubmit={handleFormSubmit}>
        {/* Basic Info Tab */}
        <div className={`ulisting-form-section ${currentTab === 'basic' ? 'active' : ''}`}>
          <h4>Basic Information</h4>
          
          <div className="ulisting-form-grid">
            <div className="ulisting-form-group full-width">
              <label htmlFor="title">Car Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., 2020 Toyota Camry XLE - Low Mileage, Excellent Condition"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="ulisting-error-message">{errors.title}</span>}
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your car's condition, features, maintenance history, and any additional details that would interest potential buyers..."
                rows="5"
                className={errors.description ? 'error' : ''}
              />
              {errors.description && <span className="ulisting-error-message">{errors.description}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select category</option>
                {vehicleCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <span className="ulisting-error-message">{errors.category}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={errors.condition ? 'error' : ''}
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified">Certified Pre-Owned</option>
                <option value="damaged">Damaged</option>
                <option value="salvage">Salvage</option>
              </select>
              {errors.condition && <span className="ulisting-error-message">{errors.condition}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="sellerType">Seller Type *</label>
              <select
                id="sellerType"
                name="sellerType"
                value={formData.sellerType}
                onChange={handleInputChange}
              >
                <option value="private">Private Seller</option>
                <option value="dealership">Dealership</option>
              </select>
            </div>
          </div>
        </div>

        {/* Specifications Tab */}
        <div className={`ulisting-form-section ${currentTab === 'specs' ? 'active' : ''}`}>
          <h4>Vehicle Specifications</h4>
          
          <div className="ulisting-form-grid">
            <div className="ulisting-form-group">
              <label htmlFor="specifications.make">Make *</label>
              <input
                type="text"
                id="specifications.make"
                name="specifications.make"
                value={formData.specifications.make}
                onChange={handleInputChange}
                placeholder="e.g., Toyota"
                className={errors['specifications.make'] ? 'error' : ''}
              />
              {errors['specifications.make'] && <span className="ulisting-error-message">{errors['specifications.make']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.model">Model *</label>
              <input
                type="text"
                id="specifications.model"
                name="specifications.model"
                value={formData.specifications.model}
                onChange={handleInputChange}
                placeholder="e.g., Camry"
                className={errors['specifications.model'] ? 'error' : ''}
              />
              {errors['specifications.model'] && <span className="ulisting-error-message">{errors['specifications.model']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.year">Year *</label>
              <input
                type="number"
                id="specifications.year"
                name="specifications.year"
                value={formData.specifications.year}
                onChange={handleInputChange}
                placeholder="e.g., 2020"
                min="1900"
                max="2025"
                className={errors['specifications.year'] ? 'error' : ''}
              />
              {errors['specifications.year'] && <span className="ulisting-error-message">{errors['specifications.year']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.mileage">Mileage (km) *</label>
              <input
                type="number"
                id="specifications.mileage"
                name="specifications.mileage"
                value={formData.specifications.mileage}
                onChange={handleInputChange}
                placeholder="e.g., 50000"
                min="0"
                className={errors['specifications.mileage'] ? 'error' : ''}
              />
              {errors['specifications.mileage'] && <span className="ulisting-error-message">{errors['specifications.mileage']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.transmission">Transmission *</label>
              <select
                id="specifications.transmission"
                name="specifications.transmission"
                value={formData.specifications.transmission}
                onChange={handleInputChange}
                className={errors['specifications.transmission'] ? 'error' : ''}
              >
                <option value="">Select transmission</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
                <option value="semi-automatic">Semi-Automatic</option>
              </select>
              {errors['specifications.transmission'] && <span className="ulisting-error-message">{errors['specifications.transmission']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.fuelType">Fuel Type *</label>
              <select
                id="specifications.fuelType"
                name="specifications.fuelType"
                value={formData.specifications.fuelType}
                onChange={handleInputChange}
                className={errors['specifications.fuelType'] ? 'error' : ''}
              >
                <option value="">Select fuel type</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="plug-in-hybrid">Plug-in Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
              {errors['specifications.fuelType'] && <span className="ulisting-error-message">{errors['specifications.fuelType']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.engine">Engine</label>
              <input
                type="text"
                id="specifications.engine"
                name="specifications.engine"
                value={formData.specifications.engine}
                onChange={handleInputChange}
                placeholder="e.g., 2.4L I4, 3.5L V6"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.color">Color</label>
              <input
                type="text"
                id="specifications.color"
                name="specifications.color"
                value={formData.specifications.color}
                onChange={handleInputChange}
                placeholder="e.g., Silver, Black, White"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.doors">Doors</label>
              <select
                id="specifications.doors"
                name="specifications.doors"
                value={formData.specifications.doors}
                onChange={handleInputChange}
              >
                <option value="">Select doors</option>
                <option value="2">2 doors</option>
                <option value="3">3 doors</option>
                <option value="4">4 doors</option>
                <option value="5">5 doors</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.seats">Seats</label>
              <select
                id="specifications.seats"
                name="specifications.seats"
                value={formData.specifications.seats}
                onChange={handleInputChange}
              >
                <option value="">Select seats</option>
                <option value="2">2 seats</option>
                <option value="4">4 seats</option>
                <option value="5">5 seats</option>
                <option value="7">7 seats</option>
                <option value="8">8+ seats</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.drivetrain">Drivetrain</label>
              <select
                id="specifications.drivetrain"
                name="specifications.drivetrain"
                value={formData.specifications.drivetrain}
                onChange={handleInputChange}
              >
                <option value="">Select drivetrain</option>
                <option value="fwd">Front-wheel drive</option>
                <option value="rwd">Rear-wheel drive</option>
                <option value="awd">All-wheel drive</option>
                <option value="4wd">4-wheel drive</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="specifications.vin">VIN (optional)</label>
              <input
                type="text"
                id="specifications.vin"
                name="specifications.vin"
                value={formData.specifications.vin}
                onChange={handleInputChange}
                placeholder="Vehicle Identification Number"
                maxLength="17"
              />
            </div>
          </div>
        </div>

        {/* Features Tab */}
        <div className={`ulisting-form-section ${currentTab === 'features' ? 'active' : ''}`}>
          <h4>Vehicle Features</h4>
          
          <div className="ulisting-features-container">
            {Object.keys(featureOptions).map(category => (
              <div key={category} className="ulisting-feature-category">
                <h5>{category.charAt(0).toUpperCase() + category.slice(1)} Features</h5>
                <div className="ulisting-checkbox-group">
                  {featureOptions[category].map(feature => (
                    <label key={feature} className="ulisting-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features[category].includes(feature)}
                        onChange={() => handleFeatureToggle(category, feature)}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Tab */}
        <div className={`ulisting-form-section ${currentTab === 'contact' ? 'active' : ''}`}>
          <h4>Contact Information</h4>
          
          <div className="ulisting-form-grid">
            {/* Private Seller Fields */}
            {formData.sellerType === 'private' && (
              <>
                <div className="ulisting-form-group">
                  <label htmlFor="privateSeller.firstName">First Name *</label>
                  <input
                    type="text"
                    id="privateSeller.firstName"
                    name="privateSeller.firstName"
                    value={formData.privateSeller.firstName}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                    className={errors['privateSeller.firstName'] ? 'error' : ''}
                  />
                  {errors['privateSeller.firstName'] && <span className="ulisting-error-message">{errors['privateSeller.firstName']}</span>}
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="privateSeller.lastName">Last Name *</label>
                  <input
                    type="text"
                    id="privateSeller.lastName"
                    name="privateSeller.lastName"
                    value={formData.privateSeller.lastName}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                    className={errors['privateSeller.lastName'] ? 'error' : ''}
                  />
                  {errors['privateSeller.lastName'] && <span className="ulisting-error-message">{errors['privateSeller.lastName']}</span>}
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="privateSeller.idNumber">ID Number</label>
                  <input
                    type="text"
                    id="privateSeller.idNumber"
                    name="privateSeller.idNumber"
                    value={formData.privateSeller.idNumber}
                    onChange={handleInputChange}
                    placeholder="Your ID number"
                  />
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="privateSeller.preferredContactMethod">Preferred Contact Method</label>
                  <select
                    id="privateSeller.preferredContactMethod"
                    name="privateSeller.preferredContactMethod"
                    value={formData.privateSeller.preferredContactMethod}
                    onChange={handleInputChange}
                  >
                    <option value="both">Phone & WhatsApp</option>
                    <option value="phone">Phone Only</option>
                    <option value="whatsapp">WhatsApp Only</option>
                    <option value="email">Email Only</option>
                  </select>
                </div>
              </>
            )}

            {/* Business Fields */}
            {formData.sellerType === 'dealership' && (
              <>
                <div className="ulisting-form-group">
                  <label htmlFor="businessInfo.businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessInfo.businessName"
                    name="businessInfo.businessName"
                    value={formData.businessInfo.businessName}
                    onChange={handleInputChange}
                    placeholder="Your business name"
                    className={errors['businessInfo.businessName'] ? 'error' : ''}
                  />
                  {errors['businessInfo.businessName'] && <span className="ulisting-error-message">{errors['businessInfo.businessName']}</span>}
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="businessInfo.businessType">Business Type *</label>
                  <select
                    id="businessInfo.businessType"
                    name="businessInfo.businessType"
                    value={formData.businessInfo.businessType}
                    onChange={handleInputChange}
                    className={errors['businessInfo.businessType'] ? 'error' : ''}
                  >
                    <option value="">Select business type</option>
                    <option value="independent">Independent Dealer</option>
                    <option value="franchise">Franchise Dealer</option>
                    <option value="certified">Certified Dealer</option>
                    <option value="used">Used Car Dealer</option>
                    <option value="luxury">Luxury Car Dealer</option>
                  </select>
                  {errors['businessInfo.businessType'] && <span className="ulisting-error-message">{errors['businessInfo.businessType']}</span>}
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="businessInfo.registrationNumber">Registration Number</label>
                  <input
                    type="text"
                    id="businessInfo.registrationNumber"
                    name="businessInfo.registrationNumber"
                    value={formData.businessInfo.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="Business registration number"
                  />
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="businessInfo.vatNumber">VAT Number</label>
                  <input
                    type="text"
                    id="businessInfo.vatNumber"
                    name="businessInfo.vatNumber"
                    value={formData.businessInfo.vatNumber}
                    onChange={handleInputChange}
                    placeholder="VAT registration number"
                  />
                </div>
              </>
            )}

            {/* Common Contact Fields */}
            <div className="ulisting-form-group">
              <label htmlFor="contact.sellerName">Display Name *</label>
              <input
                type="text"
                id="contact.sellerName"
                name="contact.sellerName"
                value={formData.contact.sellerName}
                onChange={handleInputChange}
                placeholder="Name to display on listing"
                className={errors['contact.sellerName'] ? 'error' : ''}
              />
              {errors['contact.sellerName'] && <span className="ulisting-error-message">{errors['contact.sellerName']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.phone">Phone Number *</label>
              <input
                type="tel"
                id="contact.phone"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleInputChange}
                placeholder="e.g., +267 12345678"
                className={errors['contact.phone'] ? 'error' : ''}
              />
              {errors['contact.phone'] && <span className="ulisting-error-message">{errors['contact.phone']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.email">Email</label>
              <input
                type="email"
                id="contact.email"
                name="contact.email"
                value={formData.contact.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className={errors['contact.email'] ? 'error' : ''}
              />
              {errors['contact.email'] && <span className="ulisting-error-message">{errors['contact.email']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.whatsapp">WhatsApp</label>
              <input
                type="tel"
                id="contact.whatsapp"
                name="contact.whatsapp"
                value={formData.contact.whatsapp}
                onChange={handleInputChange}
                placeholder="e.g., +267 12345678"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.location.city">Contact City *</label>
              <input
                type="text"
                id="contact.location.city"
                name="contact.location.city"
                value={formData.contact.location.city}
                onChange={handleInputChange}
                placeholder="e.g., Gaborone"
                className={errors['contact.location.city'] ? 'error' : ''}
              />
              {errors['contact.location.city'] && <span className="ulisting-error-message">{errors['contact.location.city']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.location.state">Contact State/Region</label>
              <input
                type="text"
                id="contact.location.state"
                name="contact.location.state"
                value={formData.contact.location.state}
                onChange={handleInputChange}
                placeholder="e.g., South-East"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="contact.location.address">Contact Address</label>
              <input
                type="text"
                id="contact.location.address"
                name="contact.location.address"
                value={formData.contact.location.address}
                onChange={handleInputChange}
                placeholder="Street address or area"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="location.city">Vehicle Location - City *</label>
              <input
                type="text"
                id="location.city"
                name="location.city"
                value={formData.location.city}
                onChange={handleInputChange}
                placeholder="Where is the car located?"
                className={errors['location.city'] ? 'error' : ''}
              />
              {errors['location.city'] && <span className="ulisting-error-message">{errors['location.city']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="location.state">Vehicle Location - State</label>
              <input
                type="text"
                id="location.state"
                name="location.state"
                value={formData.location.state}
                onChange={handleInputChange}
                placeholder="State or region"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="location.address">Vehicle Location - Address</label>
              <input
                type="text"
                id="location.address"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                placeholder="Specific address or area where car can be viewed"
              />
            </div>

            {/* Social Media Links */}
            <div className="ulisting-form-group full-width">
              <h5>Social Media (Optional)</h5>
              <div className="ulisting-social-grid">
                {Object.keys(formData.social).map(platform => (
                  <div key={platform} className="ulisting-form-group">
                    <label htmlFor={`social.${platform}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                    <input
                      type="url"
                      id={`social.${platform}`}
                      name={`social.${platform}`}
                      value={formData.social[platform]}
                      onChange={handleInputChange}
                      placeholder={`Your ${platform} profile URL`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images Tab */}
        <div className={`ulisting-form-section ${currentTab === 'images' ? 'active' : ''}`}>
          <h4>Vehicle Images</h4>
          
          <div className="ulisting-form-group">
            <label htmlFor="images">Upload Images (Max 15 images, 8MB per image) *</label>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className={errors.images ? 'error' : ''}
            />
            {errors.images && <span className="ulisting-error-message">{errors.images}</span>}
            <p className="ulisting-form-help">
              Tip: First image will be the main image. You can change this after uploading.
            </p>
          </div>

          {/* Image previews */}
          {imagePreviews.length > 0 && (
  <div className="ulisting-image-previews">
    <h5>Selected Images ({imagePreviews.length}/15)</h5>
    <div className="ulisting-image-grid">
      {imagePreviews.map((previewObj, index) => (
        <div key={index} className={`ulisting-image-preview ${primaryImageIndex === index ? 'primary' : ''}`}>
          {/* FIXED: Use previewObj.preview instead of just preview */}
          <img 
            src={previewObj.preview} 
            alt={`Preview ${index + 1}`}
            onError={(e) => {
              console.error(`Error loading preview ${index}`);
              e.target.src = '/images/placeholders/car.jpg';
            }}
          />
          <div className="ulisting-image-overlay">
            <button
              type="button"
              className="ulisting-primary-btn"
              onClick={() => handlePrimaryImageSelect(index)}
              title="Set as primary image"
            >
              {primaryImageIndex === index ? '⭐ Primary' : 'Set Primary'}
            </button>
            <button
              type="button"
              className="ulisting-remove-btn"
              onClick={() => removeImage(index)}
              title="Remove image"
            >
              ✕
            </button>
          </div>
          <div className="ulisting-image-info">
            <span>Image {index + 1}</span>
            {/* FIXED: Use previewObj.size instead of imageFiles[index]?.size */}
            <span>{(previewObj.size / 1024 / 1024).toFixed(1)}MB</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        </div>

        {/* Pricing Tab */}
        <div className={`ulisting-form-section ${currentTab === 'pricing' ? 'active' : ''}`}>
          <h4>Pricing Information</h4>
          
          <div className="ulisting-form-grid">
            <div className="ulisting-form-group">
              <label htmlFor="price">Price (BWP) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="e.g., 150000"
                step="0.01"
                min="0"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="ulisting-error-message">{errors.price}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="priceOptions.originalPrice">Original Price (if on sale)</label>
              <input
                type="number"
                id="priceOptions.originalPrice"
                name="priceOptions.originalPrice"
                value={formData.priceOptions.originalPrice}
                onChange={handlePriceChange}
                placeholder="e.g., 180000"
                step="0.01"
                min="0"
                className={errors['priceOptions.originalPrice'] ? 'error' : ''}
              />
              {errors['priceOptions.originalPrice'] && <span className="ulisting-error-message">{errors['priceOptions.originalPrice']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="priceOptions.dealerDiscount">Dealer Discount (%)</label>
              <input
                type="number"
                id="priceOptions.dealerDiscount"
                name="priceOptions.dealerDiscount"
                value={formData.priceOptions.dealerDiscount}
                onChange={handleInputChange}
                placeholder="e.g., 10"
                min="0"
                max="100"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="priceOptions.priceValidUntil">Price Valid Until</label>
              <input
                type="date"
                id="priceOptions.priceValidUntil"
                name="priceOptions.priceValidUntil"
                value={formData.priceOptions.priceValidUntil}
                onChange={handleInputChange}
              />
            </div>

            <div className="ulisting-form-group full-width">
              <div className="ulisting-checkbox-group">
                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.negotiable"
                    checked={formData.priceOptions.negotiable}
                    onChange={handleInputChange}
                  />
                  <span>Price is negotiable</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.exclusiveDeal"
                    checked={formData.priceOptions.exclusiveDeal}
                    onChange={handleInputChange}
                  />
                  <span>Exclusive deal</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.financing"
                    checked={formData.additionalInfo.financing}
                    onChange={handleInputChange}
                  />
                  <span>Financing available</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.tradeIn"
                    checked={formData.additionalInfo.tradeIn}
                    onChange={handleInputChange}
                  />
                  <span>Trade-in accepted</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Tab */}
        <div className={`ulisting-form-section ${currentTab === 'additional' ? 'active' : ''}`}>
          <h4>Additional Information</h4>
          
          <div className="ulisting-form-grid">
            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.serviceHistory">Service History</label>
              <textarea
                id="additionalInfo.serviceHistory"
                name="additionalInfo.serviceHistory"
                value={formData.additionalInfo.serviceHistory}
                onChange={handleInputChange}
                placeholder="Describe the service history, maintenance records, etc."
                rows="3"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.accidents">Accident History</label>
              <textarea
                id="additionalInfo.accidents"
                name="additionalInfo.accidents"
                value={formData.additionalInfo.accidents}
                onChange={handleInputChange}
                placeholder="Any accidents or damage history"
                rows="3"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.modifications">Modifications</label>
              <textarea
                id="additionalInfo.modifications"
                name="additionalInfo.modifications"
                value={formData.additionalInfo.modifications}
                onChange={handleInputChange}
                placeholder="Any modifications or upgrades made to the vehicle"
                rows="3"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="additionalInfo.warranty">Warranty Information</label>
              <input
                type="text"
                id="additionalInfo.warranty"
                name="additionalInfo.warranty"
                value={formData.additionalInfo.warranty}
                onChange={handleInputChange}
                placeholder="Warranty details"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="additionalInfo.inspection">Inspection Status</label>
              <input
                type="text"
                id="additionalInfo.inspection"
                name="additionalInfo.inspection"
                value={formData.additionalInfo.inspection}
                onChange={handleInputChange}
                placeholder="e.g., Recently inspected, needs inspection"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.reasonForSelling">Reason for Selling</label>
              <textarea
                id="additionalInfo.reasonForSelling"
                name="additionalInfo.reasonForSelling"
                value={formData.additionalInfo.reasonForSelling}
                onChange={handleInputChange}
                placeholder="Why are you selling this vehicle?"
                rows="3"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="availability.viewingTimes">Viewing Times</label>
              <textarea
                id="availability.viewingTimes"
                name="availability.viewingTimes"
                value={formData.availability.viewingTimes}
                onChange={handleInputChange}
                placeholder="When can potential buyers view the car?"
                rows="2"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="availability.availableFrom">Available From</label>
              <input
                type="date"
                id="availability.availableFrom"
                name="availability.availableFrom"
                value={formData.availability.availableFrom}
                onChange={handleInputChange}
              />
            </div>

            <div className="ulisting-form-group full-width">
              <div className="ulisting-checkbox-group">
                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="availability.deliveryAvailable"
                    checked={formData.availability.deliveryAvailable}
                    onChange={handleInputChange}
                  />
                  <span>Delivery available</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.urgentSale"
                    checked={formData.additionalInfo.urgentSale}
                    onChange={handleInputChange}
                  />
                  <span>Urgent sale</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="privateSeller.canShowContactInfo"
                    checked={formData.privateSeller.canShowContactInfo}
                    onChange={handleInputChange}
                  />
                  <span>Allow contact information to be shown publicly</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit section */}
        <div className="ulisting-form-submit-section">
          <div className="ulisting-submit-info">
            {autoFillData && (
              <p className="ulisting-auto-fill-info">
                💡 Tip: Your profile information will be saved automatically for future listings
              </p>
            )}
            <div className="ulisting-form-summary">
              <h5>Form Summary</h5>
              <div className="ulisting-summary-items">
                <span>✓ Basic Info: {formData.title ? 'Complete' : 'Missing'}</span>
                <span>✓ Specifications: {formData.specifications.make && formData.specifications.model ? 'Complete' : 'Missing'}</span>
                <span>✓ Contact: {formData.contact.sellerName && formData.contact.phone ? 'Complete' : 'Missing'}</span>
                <span>✓ Images: {imageFiles.length > 0 || formData.images.length > 0 ? `${imageFiles.length || formData.images.length} uploaded` : 'Missing'}</span>
                <span>✓ Pricing: {formData.price ? 'Complete' : 'Missing'}</span>
              </div>
            </div>
          </div>
          
          <div className="ulisting-form-actions">
            <button type="button" className="ulisting-form-cancel-btn" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="ulisting-form-submit-btn" disabled={loading || isSubmitting}>
              {loading ? (
                <>
                  <div className="ulisting-loading-spinner"></div>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Listing' : 'Create Listing'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserCarListingForm;