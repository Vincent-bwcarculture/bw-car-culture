// client/src/components/profile/UserCarListingForm.js
// ABSOLUTELY COMPLETE PRODUCTION VERSION - EVERY SINGLE SECTION INCLUDED

import React, { useState, useEffect, useCallback } from 'react';
import { imageService } from '../../services/imageService.js';
import './UserCarListingForm.css';

const UserCarListingForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null, 
  isEdit = false,
  // ✅ Dynamic tier support props
  selectedPlan = 'free',        // Can be 'free', 'basic', 'premium', etc.
  selectedAddons = [],          // Array of selected addon IDs
  pricingData = null,           // Pricing data from parent component
  mode = 'create'
}) => {
  
  // ===== DYNAMIC PRICING CALCULATION =====
  const calculatePricingDetails = (planId, addons, pricingData) => {
    // Default to free tier if no pricing data
    if (!pricingData || !pricingData.loaded) {
      return {
        name: "Free Listing",
        price: 0,
        duration: 30,
        addonCost: 0,
        totalCost: 0,
        addons: [],
        hasAddons: false
      };
    }

    // Get plan info
    const planInfo = pricingData.tiers[planId] || pricingData.tiers['free'];
    let addonCost = 0;
    let addonDetails = [];

    // Calculate addon costs
    if (addons && Array.isArray(addons)) {
      addons.forEach(addonId => {
        if (pricingData.addons && pricingData.addons[addonId]) {
          const addon = pricingData.addons[addonId];
          addonCost += addon.price || 0;
          addonDetails.push({
            id: addonId,
            name: addon.name,
            price: addon.price || 0,
            description: addon.description || ''
          });
        }
      });
    }

    const totalCost = (planInfo.price || 0) + addonCost;

    return {
      name: planInfo.name || "Free Listing",
      price: planInfo.price || 0,
      duration: planInfo.duration || 30,
      addonCost: addonCost,
      totalCost: totalCost,
      addons: addonDetails,
      hasAddons: addonDetails.length > 0
    };
  };

  // ===== DYNAMIC SUBMISSION TYPE =====
  const getSubmissionType = (planId) => {
    if (!planId || planId === 'free') {
      return 'free_review';  // Changed from 'free_tier' to match working format
    }
    return 'paid_review';  // For basic, premium, etc.
  };

  // Default form structure - COMPLETE with all fields
  const defaultFormData = {
    title: '',
    description: '',
    price: '',
    category: 'sedan',
    condition: 'used',
    
    // Individual fields for backward compatibility
    make: '',
    model: '',
    year: '',
    mileage: '',
    transmission: 'automatic',
    fuelType: 'petrol',
    engineType: '',
    engineSize: '',
    exteriorColor: '',
    interiorColor: '',
    bodyType: '',
    drivetrain: 'fwd',
    numberOfSeats: 5,
    numberOfDoors: 4,
    numberOfCylinders: null,
    
    specifications: {
      make: '',
      model: '',
      year: '',
      mileage: '',
      transmission: 'automatic',
      fuelType: 'petrol',
      engine: '',
      engineSize: '',
      color: '',
      doors: '',
      seats: '',
      drivetrain: '',
      bodyType: '',
      vin: '',
      exteriorColor: '',
      interiorColor: '',
      numberOfSeats: null,
      numberOfDoors: null,
      numberOfCylinders: null
    },
    
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      whatsapp: '',
      preferredContactMethod: 'both',
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
      safetyFeatures: [],
      comfortFeatures: [],
      entertainmentFeatures: [],
      exteriorFeatures: [],
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
      priceValidUntil: '',
      paymentMethods: ['cash'],
      financeAvailable: false,
      leaseAvailable: false
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
      reasonForSelling: '',
      previousOwners: '',
      registrationStatus: 'current',
      insuranceStatus: 'current'
    },
    
    availability: {
      availableFrom: '',
      viewingTimes: '',
      testDrivePolicy: 'allowed',
      deliveryAvailable: false,
      pickupLocation: '',
      showroomAddress: '',
      appointmentRequired: false
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

  // Feature options - COMPLETE with all categories
  const featureOptions = {
    safetyFeatures: [
      'ABS (Anti-lock Braking)', 'Electronic Stability Control', 'Traction Control',
      'Airbags (Front)', 'Airbags (Side)', 'Airbags (Curtain)', 'Knee Airbags',
      'Blind Spot Monitoring', 'Lane Departure Warning', 'Lane Keep Assist',
      'Forward Collision Warning', 'Automatic Emergency Braking',
      'Parking Sensors (Front)', 'Parking Sensors (Rear)', 'Backup Camera',
      '360 Degree Camera', 'Cross Traffic Alert', 'Driver Attention Monitor',
      'Adaptive Headlights', 'Automatic High Beams', 'Night Vision'
    ],
    comfortFeatures: [
      'Air Conditioning', 'Climate Control', 'Dual Zone Climate',
      'Leather Seats', 'Heated Seats', 'Cooled Seats', 'Power Seats',
      'Memory Seats', 'Lumbar Support', 'Massage Seats',
      'Sunroof', 'Panoramic Sunroof', 'Moonroof',
      'Power Windows', 'Tinted Windows', 'Rain Sensing Wipers',
      'Cruise Control', 'Adaptive Cruise Control',
      'Keyless Entry', 'Push Button Start', 'Remote Start'
    ],
    entertainmentFeatures: [
      'Navigation System', 'GPS', 'Satellite Radio',
      'Bluetooth Connectivity', 'Wi-Fi Hotspot', 'Wireless Charging',
      'Touch Screen Display', 'Digital Instrument Cluster', 'Head-Up Display',
      'Apple CarPlay', 'Android Auto', 'Voice Control',
      'USB Ports', 'USB-C Ports', '12V Outlets', 'Wireless Phone Charger',
      'Premium Sound System', 'Surround Sound', 'Subwoofer',
      'DVD Player', 'Rear Entertainment System', 'Gaming Console Ready'
    ],
    exteriorFeatures: [
      'Alloy Wheels', 'Performance Wheels', 'Run Flat Tires',
      'LED Headlights', 'HID Headlights', 'Xenon Headlights',
      'LED Daytime Running Lights', 'Fog Lights', 'Cornering Lights',
      'Power Mirrors', 'Heated Mirrors', 'Auto-Dimming Mirrors',
      'Side Steps', 'Running Boards', 'Roof Rails', 'Roof Rack',
      'Tow Hook', 'Trailer Hitch', 'Bed Liner', 'Tonneau Cover',
      'Spoiler', 'Body Kit', 'Chrome Trim', 'Black Trim'
    ],
    // Additional feature categories for compatibility
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

  // ===== AUTO-FILL FUNCTIONALITY =====
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

  // Enhanced pricing validation
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
        errors['priceOptions.originalPrice'] = `Original price (${originalPrice.toLocaleString()}) must be higher than current price (${currentPrice.toLocaleString()})`;
      }
      
      // Validate savings amount if provided
      if (savingsAmount) {
        const calculatedSavings = originalPrice - currentPrice;
        if (Math.abs(savingsAmount - calculatedSavings) > 0.01) {
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
    
    // Use the enhanced pricing validation
    const pricingErrors = validatePricing();
    Object.assign(errors, pricingErrors);
    
    // Specifications validation (check both individual fields and nested specs)
    const make = formData.make || formData.specifications?.make;
    const model = formData.model || formData.specifications?.model;
    const year = formData.year || formData.specifications?.year;
    
    if (!make?.trim()) {
      errors['specifications.make'] = 'Make is required';
    }
    
    if (!model?.trim()) {
      errors['specifications.model'] = 'Model is required';
    }
    
    if (!year || year < 1900 || year > new Date().getFullYear() + 2) {
      errors['specifications.year'] = 'Valid year is required';
    }
    
    // Contact validation
    if (!formData.contact?.sellerName?.trim()) {
      errors['contact.sellerName'] = 'Seller name is required';
    }
    
    if (!formData.contact?.phone?.trim()) {
      errors['contact.phone'] = 'Phone number is required';
    }
    
    // Private seller validation
    if (formData.sellerType === 'private') {
      if (!formData.privateSeller?.firstName?.trim()) {
        errors['privateSeller.firstName'] = 'First name is required for private sellers';
      }
      if (!formData.privateSeller?.lastName?.trim()) {
        errors['privateSeller.lastName'] = 'Last name is required for private sellers';
      }
    }
    
    // Business validation
    if (formData.sellerType === 'dealership') {
      if (!formData.businessInfo?.businessName?.trim()) {
        errors['businessInfo.businessName'] = 'Business name is required for dealerships';
      }
      if (!formData.businessInfo?.businessType?.trim()) {
        errors['businessInfo.businessType'] = 'Business type is required for dealerships';
      }
    }
    
    return errors;
  };

  // Handle input changes with enhanced nested property support
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

  // Enhanced price change handler
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
      }, 100);
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

  // Enhanced image upload handler
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

  console.log(`📸 Selected ${files.length} images in order:`, files.map(f => f.name));
  
  // FIXED: Keep files in exact selection order
  setImageFiles(files);
  
  // FIXED: Create previews in same order, first image is always primary
  const previews = files.map((file, index) => ({
    file,
    preview: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    isPrimary: index === 0, // First selected image is always primary
    index: index
  }));
  
  setImagePreviews(previews);
  
  // FIXED: Primary image is always index 0 (first selected)
  setPrimaryImageIndex(0);
  
  // Clear errors
  if (errors.images) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.images;
      return newErrors;
    });
  }
  
  showMessage('success', `${files.length} images selected. First image will be the main image.`);
};

  // Handle primary image selection
 const handlePrimaryImageSelect = (index) => {
  setPrimaryImageIndex(index);
  
  // Update previews to reflect new primary
  setImagePreviews(prev => prev.map((preview, i) => ({
    ...preview,
    isPrimary: i === index
  })));
  
  console.log(`📸 Primary image changed to index ${index}: ${imagePreviews[index]?.name}`);
  showMessage('success', `Primary image updated to: ${imagePreviews[index]?.name}`);
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

  // ===== ENHANCED FORM SUBMISSION WITH DYNAMIC TIER SUPPORT =====
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
          const formDataUpload = new FormData();
          imageFiles.forEach((file, index) => {
            formDataUpload.append(`image${index}`, file);
            console.log(`📎 Added file ${index}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          });
          formDataUpload.append('folder', 'user-listings');

          console.log('🔄 Uploading to /api/user/upload-images...');
          
          const uploadResponse = await fetch('https://bw-car-culture-api.vercel.app/api/user/upload-images', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formDataUpload
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
      // STEP 2: Calculate dynamic pricing details
      // ========================================
      const calculatedPricingDetails = calculatePricingDetails(selectedPlan, selectedAddons, pricingData);
      const dynamicSubmissionType = getSubmissionType(selectedPlan);
      const isFreeTier = !selectedPlan || selectedPlan === 'free';

      console.log('🔍 DYNAMIC TIER SUPPORT:', {
        selectedPlan: selectedPlan,
        selectedAddons: selectedAddons,
        pricingDetails: calculatedPricingDetails,
        submissionType: dynamicSubmissionType,
        isFreeTier: isFreeTier,
        totalCost: calculatedPricingDetails.totalCost,
        planName: calculatedPricingDetails.name
      });

      // ========================================
      // STEP 3: Prepare complete listing data with ALL fields
      // ========================================
      const listingData = {
        // Basic Information
        title: formData.title || '',
        description: formData.description || '',
        category: formData.category || 'sedan',
        condition: formData.condition || 'used',
        sellerType: formData.sellerType || 'private',
        
        // Enhanced Pricing Information - FIXED: Check multiple locations
        pricing: {
          price: parseFloat(formData.price) || 0,
          originalPrice: formData.priceOptions?.originalPrice ? 
            parseFloat(formData.priceOptions.originalPrice) : null,
          negotiable: formData.priceOptions?.negotiable || false,
          showSavings: formData.priceOptions?.showSavings || false,
          savingsAmount: formData.priceOptions?.savingsAmount ? 
            parseFloat(formData.priceOptions.savingsAmount) : null,
          currency: "BWP"
        },
        
        // Enhanced Vehicle Specifications - Map from both individual and nested fields
        specifications: {
          make: formData.make || formData.specifications?.make || '',
          model: formData.model || formData.specifications?.model || '',
          year: formData.year ? parseInt(formData.year) : (formData.specifications?.year ? parseInt(formData.specifications.year) : null),
          engineType: formData.engineType || formData.specifications?.engineType || formData.specifications?.engine || '',
          transmission: formData.transmission || formData.specifications?.transmission || '',
          fuelType: formData.fuelType || formData.specifications?.fuelType || '',
          mileage: formData.mileage ? parseInt(formData.mileage) : (formData.specifications?.mileage ? parseInt(formData.specifications.mileage) : null),
          bodyType: formData.bodyType || formData.specifications?.bodyType || '',
          drivetrain: formData.drivetrain || formData.specifications?.drivetrain || '',
          exteriorColor: formData.exteriorColor || formData.specifications?.exteriorColor || formData.specifications?.color || '',
          interiorColor: formData.interiorColor || formData.specifications?.interiorColor || '',
          numberOfSeats: formData.numberOfSeats ? parseInt(formData.numberOfSeats) : (formData.specifications?.numberOfSeats ? parseInt(formData.specifications.numberOfSeats) : (formData.specifications?.seats ? parseInt(formData.specifications.seats) : null)),
          numberOfDoors: formData.numberOfDoors ? parseInt(formData.numberOfDoors) : (formData.specifications?.numberOfDoors ? parseInt(formData.specifications.numberOfDoors) : (formData.specifications?.doors ? parseInt(formData.specifications.doors) : null)),
          engineSize: formData.engineSize || formData.specifications?.engineSize || '',
          numberOfCylinders: formData.numberOfCylinders ? parseInt(formData.numberOfCylinders) : (formData.specifications?.numberOfCylinders ? parseInt(formData.specifications.numberOfCylinders) : null)
        },
        
        // Enhanced Contact Information - Multiple fallback sources
        contact: {
          sellerName: formData.contact?.sellerName || 
            (formData.privateSeller?.firstName && formData.privateSeller?.lastName 
              ? `${formData.privateSeller.firstName} ${formData.privateSeller.lastName}`.trim()
              : formData.businessInfo?.businessName || ''),
          phone: formData.contact?.phone || '',
          email: formData.contact?.email || '', 
          whatsapp: formData.contact?.whatsapp || formData.contact?.phone || '',
          preferredContactMethod: formData.privateSeller?.preferredContactMethod || formData.contact?.preferredContactMethod || 'both',
          location: {
            city: formData.contact?.location?.city || formData.location?.city || '',
            state: formData.contact?.location?.state || formData.location?.state || '',
            address: formData.contact?.location?.address || formData.location?.address || '',
            country: 'Botswana'
          }
        },
        
        // Location Information (separate from contact location)
        location: {
          city: formData.location?.city || formData.contact?.location?.city || '',
          state: formData.location?.state || formData.contact?.location?.state || '',
          address: formData.location?.address || formData.contact?.location?.address || '',
          country: 'Botswana'
        },
        
        // Enhanced Features - Support multiple feature categories
        features: {
          safetyFeatures: Array.isArray(formData.features?.safetyFeatures) ? formData.features.safetyFeatures : [],
          comfortFeatures: Array.isArray(formData.features?.comfortFeatures) ? formData.features.comfortFeatures : [],
          entertainmentFeatures: Array.isArray(formData.features?.entertainmentFeatures) ? formData.features.entertainmentFeatures : [],
          exteriorFeatures: Array.isArray(formData.features?.exteriorFeatures) ? formData.features.exteriorFeatures : [],
          comfort: Array.isArray(formData.features?.comfort) ? formData.features.comfort : [],
          safety: Array.isArray(formData.features?.safety) ? formData.features.safety : [],
          technology: Array.isArray(formData.features?.technology) ? formData.features.technology : [],
          performance: Array.isArray(formData.features?.performance) ? formData.features.performance : [],
          exterior: Array.isArray(formData.features?.exterior) ? formData.features.exterior : [],
          interior: Array.isArray(formData.features?.interior) ? formData.features.interior : []
        },
        
        // Social Media
        social: {
          facebook: formData.social?.facebook || '',
          instagram: formData.social?.instagram || '',
          twitter: formData.social?.twitter || '',
          linkedin: formData.social?.linkedin || '',
          youtube: formData.social?.youtube || '',
          tiktok: formData.social?.tiktok || ''
        },
        
        // Private Seller Info (if applicable)
        privateSeller: formData.sellerType === 'private' ? {
          firstName: formData.privateSeller?.firstName || '',
          lastName: formData.privateSeller?.lastName || '',
          idNumber: formData.privateSeller?.idNumber || '',
          preferredContactMethod: formData.privateSeller?.preferredContactMethod || 'both',
          canShowContactInfo: formData.privateSeller?.canShowContactInfo !== false
        } : null,
        
        // Business Info (if applicable)
        businessInfo: formData.sellerType === 'dealership' ? {
          businessName: formData.businessInfo?.businessName || '',
          businessType: formData.businessInfo?.businessType || '',
          registrationNumber: formData.businessInfo?.registrationNumber || '',
          vatNumber: formData.businessInfo?.vatNumber || ''
        } : null,
        
        // Enhanced Additional Information
        additionalInfo: {
          serviceHistory: formData.additionalInfo?.serviceHistory || '',
          accidents: formData.additionalInfo?.accidents || '',
          modifications: formData.additionalInfo?.modifications || '',
          warranty: formData.additionalInfo?.warranty || '',
          inspection: formData.additionalInfo?.inspection || '',
          financing: formData.additionalInfo?.financing || false,
          tradeIn: formData.additionalInfo?.tradeIn || false,
          urgentSale: formData.additionalInfo?.urgentSale || false,
          reasonForSelling: formData.additionalInfo?.reasonForSelling || '',
          previousOwners: formData.additionalInfo?.previousOwners || '',
          registrationStatus: formData.additionalInfo?.registrationStatus || 'current',
          insuranceStatus: formData.additionalInfo?.insuranceStatus || 'current'
        },
        
        // Enhanced Availability
        availability: {
          availableFrom: formData.availability?.availableFrom || '',
          viewingTimes: formData.availability?.viewingTimes || '',
          testDrivePolicy: formData.availability?.testDrivePolicy || 'allowed',
          deliveryAvailable: formData.availability?.deliveryAvailable || false,
          pickupLocation: formData.availability?.pickupLocation || '',
          showroomAddress: formData.availability?.showroomAddress || '',
          appointmentRequired: formData.availability?.appointmentRequired || false,
          urgentSale: formData.availability?.urgentSale || false
        },
        
        // Enhanced Price Options
        priceOptions: {
          negotiable: formData.priceOptions?.negotiable || false,
          showSavings: formData.priceOptions?.showSavings || false,
          originalPrice: formData.priceOptions?.originalPrice || '',
          savingsAmount: formData.priceOptions?.savingsAmount || '',
          savingsPercentage: formData.priceOptions?.savingsPercentage || '',
          dealerDiscount: formData.priceOptions?.dealerDiscount || '',
          exclusiveDeal: formData.priceOptions?.exclusiveDeal || false,
          priceValidUntil: formData.priceOptions?.priceValidUntil || '',
          paymentMethods: formData.priceOptions?.paymentMethods || ['cash'],
          financeAvailable: formData.priceOptions?.financeAvailable || false,
          leaseAvailable: formData.priceOptions?.leaseAvailable || false
        },
        
        // Images with enhanced metadata
        images: uploadedImages?.map((img, index) => ({
          url: img.url,
          key: img.key,
          thumbnail: img.thumbnail || img.url,
          isPrimary: index === primaryImageIndex,
          size: img.size,
          mimetype: img.mimetype
        })) || [],
        
        // Enhanced image metadata
        imageFiles: imageFiles?.map((file, index) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          isPrimary: index === primaryImageIndex
        })) || [],
        primaryImageIndex: primaryImageIndex || 0,
        
        // Profile picture
        profilePicture: formData.profilePicture || '',
        
        // ===== 🎯 DYNAMIC PLAN DATA (CRITICAL FOR ADMIN INTERFACE) =====
        selectedPlan: selectedPlan || 'free',           // ← Dynamic: free, basic, premium, etc.
        selectedAddons: selectedAddons || [],           // ← Dynamic: array of selected addons
        pricingDetails: calculatedPricingDetails,       // ← Dynamic: calculated based on actual plan
        
        // ===== 🎯 DYNAMIC SUBMISSION METADATA =====
        status: "pending_review",
        submissionType: dynamicSubmissionType,          // ← Dynamic: free_review or paid_review
        submissionSource: "user_form",
        
        // ===== 🎯 ORIGINAL SUBMISSION DATA (FOR ADMIN INTERFACE) =====
        originalSubmissionData: {
          title: formData.title || '',
          description: formData.description || '',
          category: formData.category || 'sedan',
          condition: formData.condition || 'used',
          sellerType: formData.sellerType || 'private',
          pricing: {
            price: parseFloat(formData.price) || 0,
            currency: "BWP"
          },
          specifications: {
            make: formData.make || formData.specifications?.make || '',
            model: formData.model || formData.specifications?.model || '',
            year: formData.year ? parseInt(formData.year) : (formData.specifications?.year ? parseInt(formData.specifications.year) : null)
          },
          contact: {
            sellerName: formData.contact?.sellerName || '',
            phone: formData.contact?.phone || '',
            email: formData.contact?.email || ''
          },
          selectedPlan: selectedPlan || 'free',
          selectedAddons: selectedAddons || [],
          pricingDetails: calculatedPricingDetails,
          status: "pending_review",
          submissionType: dynamicSubmissionType,
          submittedAt: new Date().toISOString()
        }
      };

      // ========================================
      // DEBUG: Log the complete data structure
      // ========================================
      console.log('🔍 DEBUGGING COMPLETE FORM DATA STRUCTURE:');
      console.log('📋 Dynamic tier support:', {
        selectedPlan: listingData.selectedPlan,
        selectedAddons: listingData.selectedAddons,
        pricingDetails: listingData.pricingDetails,
        submissionType: listingData.submissionType,
        isFreeTier: isFreeTier
      });

      console.log('📋 Prepared listingData structure:', {
        title: listingData.title,
        hasContact: !!listingData.contact,
        contactSellerName: listingData.contact?.sellerName,
        contactPhone: listingData.contact?.phone,
        hasSpecifications: !!listingData.specifications,
        specMake: listingData.specifications?.make,
        specModel: listingData.specifications?.model,
        hasPricing: !!listingData.pricing,
        pricingPrice: listingData.pricing?.price,
        imageCount: listingData.images?.length || 0,
        hasOriginalSubmissionData: !!listingData.originalSubmissionData
      });

      // Check for common issues
      const debugIssues = [];
      if (!listingData.title || listingData.title.trim() === '') {
        debugIssues.push('❌ Title is empty');
      }
      if (!listingData.contact?.sellerName || listingData.contact.sellerName.trim() === '') {
        debugIssues.push('❌ contact.sellerName is empty');
      }
      if (!listingData.contact?.phone || listingData.contact.phone.trim() === '') {
        debugIssues.push('❌ contact.phone is empty');
      }
      if (!listingData.specifications?.make || listingData.specifications.make.trim() === '') {
        debugIssues.push('❌ specifications.make is empty');
      }
      if (!listingData.specifications?.model || listingData.specifications.model.trim() === '') {
        debugIssues.push('❌ specifications.model is empty');
      }
      if (!listingData.pricing?.price || listingData.pricing.price <= 0) {
        debugIssues.push('❌ pricing.price is empty or invalid');
      }
      if (!listingData.selectedPlan) {
        debugIssues.push('❌ selectedPlan is missing');
      }
      if (!listingData.pricingDetails) {
        debugIssues.push('❌ pricingDetails is missing');
      }

      if (debugIssues.length > 0) {
        console.log('🚨 VALIDATION ISSUES FOUND:');
        debugIssues.forEach(issue => console.log(issue));
      } else {
        console.log('✅ All required fields appear to be populated');
      }

      // ========================================
      // STEP 4: Submit listing to backend
      // ========================================
      showMessage('info', 'Submitting your listing...');
      console.log('🔄 Submitting listing to /api/user/submit-listing...');
      
      const submitResponse = await fetch('https://bw-car-culture-api.vercel.app/api/user/submit-listing', {
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
      
      // Show success message based on tier
      if (isFreeTier) {
        showMessage('success', '🎉 FREE listing submitted for review! No payment required - we\'ll contact you within 24-48 hours.');
      } else {
        showMessage('success', `🎉 ${calculatedPricingDetails.name} submitted for review! Total cost: P${calculatedPricingDetails.totalCost.toLocaleString()}`);
      }
      
      // Save to profile for future listings
      await saveToProfile();
      
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
    setFormData(defaultFormData);
    
    // Clear errors
    setErrors({});
    
    console.log(`🔄 Form reset to initial state`);
  };

  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'specs', label: 'Specifications', icon: '⚙️' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'images', label: 'Images', icon: '📸' },
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
                className="ulisting-auto-fill-selective"
                onClick={() => applyAutoFill(true, ['contact', 'sellerName'])}
              >
                Fill contact only
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

      {/* Dynamic Tier Indicator */}
      {selectedPlan && selectedPlan !== 'free' && (
        <div className="ulisting-tier-indicator">
          <div className="ulisting-tier-badge">
            <span className="ulisting-tier-name">{selectedPlan.toUpperCase()} PLAN</span>
            <span className="ulisting-tier-addons">
              {selectedAddons.length > 0 ? `+ ${selectedAddons.length} addon(s)` : 'No addons'}
            </span>
          </div>
        </div>
      )}

      {/* Form header */}
      <div className="ulisting-form-header">
        <h3>{isEdit ? 'Edit Car Listing' : 'Create New Car Listing'}</h3>
        <p>Fill in the details below to {isEdit ? 'update' : 'create'} your car listing</p>
        {selectedPlan === 'free' && (
          <div className="ulisting-free-tier-notice">
            🎉 You're creating a FREE listing! No payment required after admin approval.
          </div>
        )}
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
              <label htmlFor="make">Make *</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make || formData.specifications?.make}
                onChange={handleInputChange}
                placeholder="e.g., Toyota"
                className={errors['specifications.make'] ? 'error' : ''}
              />
              {errors['specifications.make'] && <span className="ulisting-error-message">{errors['specifications.make']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="model">Model *</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model || formData.specifications?.model}
                onChange={handleInputChange}
                placeholder="e.g., Camry"
                className={errors['specifications.model'] ? 'error' : ''}
              />
              {errors['specifications.model'] && <span className="ulisting-error-message">{errors['specifications.model']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="year">Year *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year || formData.specifications?.year}
                onChange={handleInputChange}
                placeholder="e.g., 2020"
                min="1900"
                max="2025"
                className={errors['specifications.year'] ? 'error' : ''}
              />
              {errors['specifications.year'] && <span className="ulisting-error-message">{errors['specifications.year']}</span>}
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="mileage">Mileage (km) *</label>
              <input
                type="number"
                id="mileage"
                name="mileage"
                value={formData.mileage || formData.specifications?.mileage}
                onChange={handleInputChange}
                placeholder="e.g., 50000"
                min="0"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="transmission">Transmission *</label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission || formData.specifications?.transmission}
                onChange={handleInputChange}
              >
                <option value="">Select transmission</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
                <option value="semi-automatic">Semi-Automatic</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="fuelType">Fuel Type *</label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType || formData.specifications?.fuelType}
                onChange={handleInputChange}
              >
                <option value="">Select fuel type</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="plug-in-hybrid">Plug-in Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="engineType">Engine</label>
              <input
                type="text"
                id="engineType"
                name="engineType"
                value={formData.engineType || formData.specifications?.engine}
                onChange={handleInputChange}
                placeholder="e.g., 2.4L I4, 3.5L V6"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="exteriorColor">Color</label>
              <input
                type="text"
                id="exteriorColor"
                name="exteriorColor"
                value={formData.exteriorColor || formData.specifications?.color}
                onChange={handleInputChange}
                placeholder="e.g., Silver, Black, White"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="numberOfDoors">Doors</label>
              <select
                id="numberOfDoors"
                name="numberOfDoors"
                value={formData.numberOfDoors || formData.specifications?.doors}
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
              <label htmlFor="numberOfSeats">Seats</label>
              <select
                id="numberOfSeats"
                name="numberOfSeats"
                value={formData.numberOfSeats || formData.specifications?.seats}
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
              <label htmlFor="drivetrain">Drivetrain</label>
              <select
                id="drivetrain"
                name="drivetrain"
                value={formData.drivetrain || formData.specifications?.drivetrain}
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
                value={formData.specifications?.vin || ''}
                onChange={handleInputChange}
                placeholder="Vehicle Identification Number"
                maxLength="17"
              />
            </div>
          </div>
        </div>

        {/* Features Tab - COMPLETE */}
        <div className={`ulisting-form-section ${currentTab === 'features' ? 'active' : ''}`}>
          <h4>Vehicle Features</h4>
          
          <div className="ulisting-features-container">
            {Object.keys(featureOptions).map(category => (
              <div key={category} className="ulisting-feature-category">
                <h5>{category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Features</h5>
                <div className="ulisting-checkbox-group">
                  {featureOptions[category].map(feature => (
                    <label key={feature} className="ulisting-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features[category]?.includes(feature) || false}
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

        {/* Contact Tab - COMPLETE */}
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
                    value={formData.privateSeller?.firstName || ''}
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
                    value={formData.privateSeller?.lastName || ''}
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
                    value={formData.privateSeller?.idNumber || ''}
                    onChange={handleInputChange}
                    placeholder="Your ID number"
                  />
                </div>

                <div className="ulisting-form-group">
                  <label htmlFor="privateSeller.preferredContactMethod">Preferred Contact Method</label>
                  <select
                    id="privateSeller.preferredContactMethod"
                    name="privateSeller.preferredContactMethod"
                    value={formData.privateSeller?.preferredContactMethod || 'both'}
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
                    value={formData.businessInfo?.businessName || ''}
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
                    value={formData.businessInfo?.businessType || ''}
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
                    value={formData.businessInfo?.registrationNumber || ''}
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
                    value={formData.businessInfo?.vatNumber || ''}
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
                value={formData.contact?.sellerName || ''}
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
                value={formData.contact?.phone || ''}
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
                value={formData.contact?.email || ''}
                onChange={handleInputChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="contact.whatsapp">WhatsApp</label>
              <input
                type="tel"
                id="contact.whatsapp"
                name="contact.whatsapp"
                value={formData.contact?.whatsapp || ''}
                onChange={handleInputChange}
                placeholder="e.g., +267 12345678"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="location.city">Vehicle Location - City *</label>
              <input
                type="text"
                id="location.city"
                name="location.city"
                value={formData.location?.city || ''}
                onChange={handleInputChange}
                placeholder="Where is the car located?"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="location.state">Vehicle Location - State</label>
              <input
                type="text"
                id="location.state"
                name="location.state"
                value={formData.location?.state || ''}
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
                value={formData.location?.address || ''}
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

        {/* Images Tab - COMPLETE */}
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
    <strong>Tip:</strong> Images will appear in the order you select them. 
    The first image you select will be the main image.
  </p>
</div>

          {/* Image previews */}
         {imagePreviews.length > 0 && (
  <div className="ulisting-image-previews">
    <h5>Selected Images ({imagePreviews.length}/15) - In selection order</h5>
    <div className="ulisting-image-grid">
      {imagePreviews.map((previewObj, index) => (
        <div 
          key={index} 
          className={`ulisting-image-preview ${index === 0 ? 'primary' : ''}`}
        >
          <img 
            src={previewObj.preview} 
            alt={`Preview ${index + 1}`}
            onError={(e) => {
              console.error(`Error loading preview ${index}`);
              e.target.src = '/images/placeholders/car.jpg';
            }}
          />
          <div className="ulisting-image-overlay">
            {/* Optional: Keep primary selection button */}
            <button
              type="button"
              className="ulisting-primary-btn"
              onClick={() => handlePrimaryImageSelect(index)}
              title="Set as primary image"
            >
              {index === 0 ? '⭐ Main Image' : 
               primaryImageIndex === index ? '⭐ Primary' : 'Set Primary'}
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
            <span>
              {index === 0 ? '🏆 Main' : `#${index + 1}`} • 
              {(previewObj.size / 1024 / 1024).toFixed(1)}MB
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        </div>

        {/* Pricing Tab - COMPLETE */}
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
                value={formData.priceOptions?.originalPrice || ''}
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
                value={formData.priceOptions?.dealerDiscount || ''}
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
                value={formData.priceOptions?.priceValidUntil || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="ulisting-form-group full-width">
              <div className="ulisting-checkbox-group">
                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.negotiable"
                    checked={formData.priceOptions?.negotiable || false}
                    onChange={handleInputChange}
                  />
                  <span>Price is negotiable</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="priceOptions.exclusiveDeal"
                    checked={formData.priceOptions?.exclusiveDeal || false}
                    onChange={handleInputChange}
                  />
                  <span>Exclusive deal</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.financing"
                    checked={formData.additionalInfo?.financing || false}
                    onChange={handleInputChange}
                  />
                  <span>Financing available</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.tradeIn"
                    checked={formData.additionalInfo?.tradeIn || false}
                    onChange={handleInputChange}
                  />
                  <span>Trade-in accepted</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Tab - COMPLETE */}
        <div className={`ulisting-form-section ${currentTab === 'additional' ? 'active' : ''}`}>
          <h4>Additional Information</h4>
          
          <div className="ulisting-form-grid">
            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.serviceHistory">Service History</label>
              <textarea
                id="additionalInfo.serviceHistory"
                name="additionalInfo.serviceHistory"
                value={formData.additionalInfo?.serviceHistory || ''}
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
                value={formData.additionalInfo?.accidents || ''}
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
                value={formData.additionalInfo?.modifications || ''}
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
                value={formData.additionalInfo?.warranty || ''}
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
                value={formData.additionalInfo?.inspection || ''}
                onChange={handleInputChange}
                placeholder="e.g., Recently inspected, needs inspection"
              />
            </div>

            <div className="ulisting-form-group full-width">
              <label htmlFor="additionalInfo.reasonForSelling">Reason for Selling</label>
              <textarea
                id="additionalInfo.reasonForSelling"
                name="additionalInfo.reasonForSelling"
                value={formData.additionalInfo?.reasonForSelling || ''}
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
                value={formData.availability?.viewingTimes || ''}
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
                value={formData.availability?.availableFrom || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="ulisting-form-group full-width">
              <div className="ulisting-checkbox-group">
                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="availability.deliveryAvailable"
                    checked={formData.availability?.deliveryAvailable || false}
                    onChange={handleInputChange}
                  />
                  <span>Delivery available</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="additionalInfo.urgentSale"
                    checked={formData.additionalInfo?.urgentSale || false}
                    onChange={handleInputChange}
                  />
                  <span>Urgent sale</span>
                </label>

                <label className="ulisting-checkbox-label">
                  <input
                    type="checkbox"
                    name="privateSeller.canShowContactInfo"
                    checked={formData.privateSeller?.canShowContactInfo !== false}
                    onChange={handleInputChange}
                  />
                  <span>Allow contact information to be shown publicly</span>
                </label>
              </div>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="availability.pickupLocation">Pickup Location</label>
              <input
                type="text"
                id="availability.pickupLocation"
                name="availability.pickupLocation"
                value={formData.availability?.pickupLocation || ''}
                onChange={handleInputChange}
                placeholder="Where can buyers pick up the vehicle?"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="availability.testDrivePolicy">Test Drive Policy</label>
              <select
                id="availability.testDrivePolicy"
                name="availability.testDrivePolicy"
                value={formData.availability?.testDrivePolicy || 'allowed'}
                onChange={handleInputChange}
              >
                <option value="allowed">Test drives allowed</option>
                <option value="appointment">By appointment only</option>
                <option value="not-allowed">No test drives</option>
                <option value="licensed-only">Licensed drivers only</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="additionalInfo.previousOwners">Previous Owners</label>
              <input
                type="text"
                id="additionalInfo.previousOwners"
                name="additionalInfo.previousOwners"
                value={formData.additionalInfo?.previousOwners || ''}
                onChange={handleInputChange}
                placeholder="How many previous owners?"
              />
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="additionalInfo.registrationStatus">Registration Status</label>
              <select
                id="additionalInfo.registrationStatus"
                name="additionalInfo.registrationStatus"
                value={formData.additionalInfo?.registrationStatus || 'current'}
                onChange={handleInputChange}
              >
                <option value="current">Current registration</option>
                <option value="expired">Expired registration</option>
                <option value="pending">Registration pending</option>
                <option value="not-registered">Not registered</option>
              </select>
            </div>

            <div className="ulisting-form-group">
              <label htmlFor="additionalInfo.insuranceStatus">Insurance Status</label>
              <select
                id="additionalInfo.insuranceStatus"
                name="additionalInfo.insuranceStatus"
                value={formData.additionalInfo?.insuranceStatus || 'current'}
                onChange={handleInputChange}
              >
                <option value="current">Currently insured</option>
                <option value="expired">Insurance expired</option>
                <option value="not-insured">Not insured</option>
              </select>
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
                <span>✓ Specifications: {(formData.make || formData.specifications?.make) && (formData.model || formData.specifications?.model) ? 'Complete' : 'Missing'}</span>
                <span>✓ Contact: {formData.contact?.sellerName && formData.contact?.phone ? 'Complete' : 'Missing'}</span>
                <span>✓ Images: {imageFiles.length > 0 || formData.images?.length > 0 ? `${imageFiles.length || formData.images?.length} uploaded` : 'Missing'}</span>
                <span>✓ Pricing: {formData.price ? 'Complete' : 'Missing'}</span>
              </div>
            </div>
            
            {/* Dynamic plan summary */}
            {selectedPlan && (
              <div className="ulisting-plan-summary">
                <h5>Selected Plan: {selectedPlan.toUpperCase()}</h5>
                {selectedAddons.length > 0 && (
                  <div className="ulisting-selected-addons">
                    <span>Add-ons: {selectedAddons.join(', ')}</span>
                  </div>
                )}
                {selectedPlan === 'free' && (
                  <div className="ulisting-free-notice">
                    🎉 No payment required! Your listing will go live after admin approval.
                  </div>
                )}
                {selectedPlan !== 'free' && pricingData && (
                  <div className="ulisting-paid-notice">
                    💳 Payment required after admin approval. Total: P{calculatePricingDetails(selectedPlan, selectedAddons, pricingData).totalCost.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Progress indicator */}
            <div className="ulisting-progress-indicator">
              <div className="ulisting-progress-bar">
                <div 
                  className="ulisting-progress-fill" 
                  style={{ width: `${Math.min(100, (
                    (formData.title ? 20 : 0) +
                    ((formData.make || formData.specifications?.make) && (formData.model || formData.specifications?.model) ? 20 : 0) +
                    (formData.contact?.sellerName && formData.contact?.phone ? 20 : 0) +
                    (imageFiles.length > 0 ? 20 : 0) +
                    (formData.price ? 20 : 0)
                  ))}%` }}
                ></div>
              </div>
              <span className="ulisting-progress-text">
                {Math.min(100, (
                  (formData.title ? 20 : 0) +
                  ((formData.make || formData.specifications?.make) && (formData.model || formData.specifications?.model) ? 20 : 0) +
                  (formData.contact?.sellerName && formData.contact?.phone ? 20 : 0) +
                  (imageFiles.length > 0 ? 20 : 0) +
                  (formData.price ? 20 : 0)
                ))}% Complete
              </span>
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
                  {isEdit ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                isEdit ? 'Update Listing' : (selectedPlan === 'free' ? 'Submit for FREE Review' : 'Submit Listing')
              )}
            </button>
          </div>

          {/* Debug information - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="ulisting-debug-info">
              <details>
                <summary>Debug Information</summary>
                <div className="ulisting-debug-content">
                  <h6>Form State:</h6>
                  <pre>{JSON.stringify({
                    selectedPlan,
                    selectedAddons,
                    formDataKeys: Object.keys(formData),
                    imageCount: imageFiles.length,
                    errorsCount: Object.keys(errors).length
                  }, null, 2)}</pre>
                  
                  <h6>Validation Errors:</h6>
                  <pre>{JSON.stringify(errors, null, 2)}</pre>
                  
                  {pricingData && (
                    <>
                      <h6>Pricing Calculation:</h6>
                      <pre>{JSON.stringify(calculatePricingDetails(selectedPlan, selectedAddons, pricingData), null, 2)}</pre>
                    </>
                  )}

                  <h6>Form Data Sample:</h6>
                  <pre>{JSON.stringify({
                    title: formData.title,
                    make: formData.make || formData.specifications?.make,
                    model: formData.model || formData.specifications?.model,
                    price: formData.price,
                    sellerName: formData.contact?.sellerName,
                    phone: formData.contact?.phone,
                    featureCount: Object.values(formData.features).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
                  }, null, 2)}</pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserCarListingForm;