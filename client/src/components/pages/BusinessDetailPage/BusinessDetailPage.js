// src/components/pages/BusinessDetailPage/BusinessDetailPage.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { debounce } from 'lodash';
import { 
  Star, QrCode, MessageSquare, Plus, Eye, User, Hash, Car, Heart, Share
} from 'lucide-react';
import { http } from '../../../config/axios.js';
import { useInternalAnalytics } from '../../../hooks/useInternalAnalytics.js';
import { useAuth } from '../../../context/AuthContext.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
import ReviewForm from '../../ReviewForm/ReviewForm.js';
import QRCodeScanner from '../../QRScanner/QRCodeScanner.js';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import ShareModal from '../../shared/ShareModal.js';
import './BusinessDetailPage.css';

const BusinessDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Analytics hook
  const { trackListingView, trackDealerContact, trackPhoneClick, trackFavorite, trackSearch, trackFilterUsage, trackEvent } = useInternalAnalytics();
  const { user, isAuthenticated } = useAuth();
  
  // Core state
  const [business, setBusiness] = useState(null);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
   const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMethod, setReviewMethod] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [serviceCode, setServiceCode] = useState('');
  // Pagination state
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsPagination, setListingsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsCount, setListingsCount] = useState(0);
  
  // Inventory state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPagination, setInventoryPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    make: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    category: '',
    condition: '',
    fuelType: '',
    transmission: '',
    serviceType: '',
    routeType: '',
    destination: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    makes: [],
    models: [],
    categories: [],
    years: [],
    serviceTypes: [],
    destinations: []
  });
  
  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sharingBusiness, setSharingBusiness] = useState(false);
  const shareButtonRef = useRef(null);
  const [imageErrors, setImageErrors] = useState({ banner: false, logo: false });
  
  // Business type detection
  const [businessType, setBusinessType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const isDealer = businessType === 'dealer';
  const isService = businessType === 'service';
  const isRentalService = isService && (
    serviceType === 'car_rental' || 
    serviceType === 'trailer_rental' || 
    serviceType === 'public_transport'
  );

  // Cache for failed images
  const checkFailedImage = useCallback((url, category = 'business') => {
    try {
      const storageKey = `failed${category.charAt(0).toUpperCase() + category.slice(1)}Images`;
      const failedImages = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  }, []);

  const markFailedImage = useCallback((url, category = 'business') => {
    try {
      const storageKey = `failed${category.charAt(0).toUpperCase() + category.slice(1)}Images`;
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
  }, []);

  // Initialize business type and analytics tracking
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type');
    
    if (path.includes('/dealerships/')) {
      setBusinessType('dealer');
      setActiveTab('about');
    } else if (path.includes('/services/')) {
      setBusinessType('service');
      setActiveTab('about');
      
      if (typeParam) {
        setServiceType(typeParam);
      }
    }
  }, []);

  // Track page view when business loads
  useEffect(() => {
    if (business && business._id) {
      trackListingView(business._id, {
        businessName: business.businessName,
        businessType: businessType,
        serviceType: serviceType,
        location: business.location?.city || business.location?.country
      });

       // NEW: Load reviews when business loads
      loadBusinessReviews();
    }
  }, [business, businessType, serviceType, trackListingView]);

  // Fetch business data
  useEffect(() => {
    fetchBusiness();
  }, [id, businessType]);

  // Fetch listings when business changes
  useEffect(() => {
    if (business && (isDealer || isRentalService)) {
      fetchListings();
    }
  }, [business, isRentalService, listingsPage]);

  // Fetch inventory when tab changes
  useEffect(() => {
    if (business && activeTab === 'inventory') {
      fetchInventory();
    }
  }, [business, activeTab, inventoryPage]);

  // Check if business is saved
  useEffect(() => {
    if (business) {
      const savedKey = `saved${businessType.charAt(0).toUpperCase() + businessType.slice(1)}s`;
      const savedBusinesses = JSON.parse(localStorage.getItem(savedKey) || '[]');
      setIsSaved(savedBusinesses.includes(business._id));
    }
  }, [business, businessType]);

  // Filter listings when filters change
  useEffect(() => {
    if (listings.length > 0) {
      const filtered = applyFilters(listings);
      setFilteredListings(filtered);
    }
  }, [listings, filters]);

  // Update available filters when listings change
  useEffect(() => {
    if (listings.length > 0) {
      updateAvailableFilters(listings);
    }
  }, [listings]);

  useEffect(() => {
  if (showReviewModal && business) {
    console.log('=== REVIEW FORM DEBUG ===');
    console.log('Business object:', business);
    console.log('business._id:', business._id);
    console.log('business.user:', business.user);
    console.log('reviewMethod:', reviewMethod);
    console.log('ID being sent to ReviewForm:', business._id);
    console.log('========================');
  }
}, [showReviewModal, business, reviewMethod]);

  const fetchBusiness = async () => {
    if (!businessType) return;
    
    try {
      setLoading(true);
      setError(null);
  
      let endpoint = '';
      if (businessType === 'dealer') {
        endpoint = `/dealers/${id}`;
      } else if (businessType === 'service') {
        endpoint = `/providers/${id}`;
      }
  
      const response = await http.get(endpoint);
      
      if (response.data.success) {
        setBusiness(response.data.data);
        
        if (isService && !serviceType && response.data.data?.providerType) {
          setServiceType(response.data.data.providerType);
        }
      } else {
        throw new Error(response.data.message || `Failed to fetch ${businessType}`);
      }
    } catch (error) {
      console.error(`Error fetching ${businessType}:`, error);
      setError(`Failed to load ${businessType} information. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    if ((!isDealer && !isRentalService) || !business) return;
    
    try {
      setListingsLoading(true);
      
      const businessId = id;
      
      let endpoint = '';
      if (isDealer) {
        endpoint = `/listings/dealer/${businessId}`;
      } else if (serviceType === 'car_rental') {
        endpoint = `/rentals?providerId=${businessId}`;
      } else if (serviceType === 'trailer_rental') {
        endpoint = `/trailers?providerId=${businessId}`;
      } else if (serviceType === 'public_transport') {
        endpoint = `/transport?providerId=${businessId}`;
      }
      
      const response = await http.get(endpoint, {
        params: { page: listingsPage, limit: 12 }
      });
      
      if (response.data && response.data.success) {
        const items = response.data.data || 
                      response.data.vehicles || 
                      response.data.trailers || 
                      response.data.routes || 
                      [];
        
        setListings(items);
        setListingsCount(response.data.total || items.length || 0);
        
        setListingsPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.total || items.length || 0
        });
      } else {
        setListings([]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

 // Load business reviews
  const loadBusinessReviews = async () => {
    if (!business?._id) return;
    
    try {
      setReviewsLoading(true);
      const endpoint = businessType === 'dealer' 
        ? `/reviews/dealer/${business._id}`
        : `/reviews/service/${business._id}`;
        
      const response = await http.get(endpoint);
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setReviewStats(response.data.data.stats || {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

 // REPLACE THE THREE EXISTING HANDLERS WITH THESE UPDATED VERSIONS:

// NEW: Handle starting a review directly from business profile
const handleStartReview = () => {
  // Since user is on business profile, directly start general review
  setReviewMethod('general');
  setShowReviewModal(true);
};

// UPDATED: Start QR code scanning (only used when coming from navigation)
const handleQRScan = () => {
  setReviewMethod('qr');
  setShowQRScanner(true);
};

// UPDATED: Handle QR scan result
const handleQRResult = (qrData) => {
  setShowQRScanner(false);
  
  const [serviceType, serviceId, providerId, serviceName] = qrData.split('|');
  
  if (providerId === business._id) {
    setReviewMethod('qr');
    setShowReviewModal(true);
  } else {
    alert('This QR code is not for this business. Please scan the correct QR code.');
  }
};

// UPDATED: Handle service code submission
const handleServiceCodeSubmit = () => {
  if (!serviceCode.trim()) {
    alert('Please enter a service code');
    return;
  }
  
  setReviewMethod('service_code');
  setShowReviewModal(true);
};

// NEW: Handle review submission completion
const handleReviewSubmitted = (result) => {
  console.log('Review submission result:', result);
  console.log('Business data:', business);
  console.log('Business user field:', business.user);
  console.log('Business _id field:', business._id);
  
  if (result.success) {
    alert(result.message || 'Review submitted successfully!');
    setShowReviewModal(false);
    setReviewMethod(null);
    setServiceCode('');
    
    // Refresh the page to show updated ratings
    window.location.reload();
  } else {
    alert(result.message || 'Failed to submit review. Please try again.');
  }
};

  const fetchInventory = async () => {
    if (!business) return;
    
    try {
      setInventoryLoading(true);
      
      const businessId = id;
      const endpoint = `/inventory?businessId=${businessId}`;
      
      const response = await http.get(endpoint, {
        params: { page: inventoryPage, limit: 12 }
      });
      
      if (response.data && response.data.success) {
        const items = response.data.data || [];
        setInventoryItems(items);
        
        setInventoryPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.total || items.length || 0
        });
      } else {
        // Generate sample inventory for demo
        const sampleInventory = generateSampleInventory(business);
        setInventoryItems(sampleInventory);
        setInventoryPagination({
          currentPage: 1,
          totalPages: 1,
          total: sampleInventory.length
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryItems([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const generateSampleInventory = (business) => {
    return [
      {
        _id: 'inv1',
        title: 'Performance Exhaust System',
        category: 'Parts',
        price: 1200,
        originalPrice: 1500,
        condition: 'New',
        images: ['/images/placeholders/part.jpg'],
        stock: { quantity: 5 },
        specifications: {
          brand: 'TurboMax',
          material: 'Stainless Steel',
          compatibleWith: 'Multiple Toyota models',
          weight: '8.5 kg'
        },
        features: ['Increased Horsepower', 'Deeper Sound', 'Easy Installation'],
        business: {
          _id: business._id,
          businessName: business.businessName,
          logo: business.profile?.logo,
          location: business.location
        }
      },
      {
        _id: 'inv2',
        title: 'Official Racing Team T-Shirt',
        category: 'Apparel',
        price: 250,
        condition: 'New',
        images: ['/images/placeholders/part.jpg'],
        stock: { quantity: 20 },
        specifications: {
          brand: 'RaceFashion',
          material: '100% Cotton',
          sizes: 'S, M, L, XL',
          color: 'Red/Black'
        },
        business: {
          _id: business._id,
          businessName: business.businessName,
          logo: business.profile?.logo,
          location: business.location
        }
      }
    ];
  };

  // Filter functions
  const updateAvailableFilters = useCallback((items) => {
    const makes = new Set();
    const models = new Set();
    const categories = new Set();
    const years = new Set();
    const serviceTypes = new Set();
    const destinations = new Set();

    items.forEach(item => {
      // For vehicles
      if (item.make || item.specifications?.make) {
        makes.add(item.make || item.specifications.make);
      }
      if (item.model || item.specifications?.model) {
        models.add(item.model || item.specifications.model);
      }
      if (item.category || item.specifications?.category) {
        categories.add(item.category || item.specifications.category);
      }
      if (item.year || item.specifications?.year) {
        years.add(item.year || item.specifications.year);
      }
      
      // For transport routes
      if (item.serviceType) {
        serviceTypes.add(item.serviceType);
      }
      if (item.destination) {
        destinations.add(item.destination);
      }
    });

    setAvailableFilters({
      makes: Array.from(makes).sort(),
      models: Array.from(models).sort(),
      categories: Array.from(categories).sort(),
      years: Array.from(years).sort((a, b) => b - a),
      serviceTypes: Array.from(serviceTypes).sort(),
      destinations: Array.from(destinations).sort()
    });
  }, []);

  const applyFilters = useCallback((items) => {
    return items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          item.title,
          item.name,
          item.make,
          item.model,
          item.specifications?.make,
          item.specifications?.model,
          item.description,
          item.origin,
          item.destination
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Make filter
      if (filters.make) {
        const itemMake = item.make || item.specifications?.make;
        if (!itemMake || itemMake.toLowerCase() !== filters.make.toLowerCase()) {
          return false;
        }
      }

      // Model filter
      if (filters.model) {
        const itemModel = item.model || item.specifications?.model;
        if (!itemModel || itemModel.toLowerCase() !== filters.model.toLowerCase()) {
          return false;
        }
      }

      // Price filters
      if (filters.minPrice && item.price < parseInt(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && item.price > parseInt(filters.maxPrice)) {
        return false;
      }

      // Year filters
      if (filters.minYear) {
        const itemYear = item.year || item.specifications?.year;
        if (!itemYear || itemYear < parseInt(filters.minYear)) {
          return false;
        }
      }
      if (filters.maxYear) {
        const itemYear = item.year || item.specifications?.year;
        if (!itemYear || itemYear > parseInt(filters.maxYear)) {
          return false;
        }
      }

      // Category filter
      if (filters.category) {
        const itemCategory = item.category || item.specifications?.category;
        if (!itemCategory || itemCategory.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      // Service type filter (for transport)
      if (filters.serviceType && item.serviceType) {
        if (item.serviceType.toLowerCase() !== filters.serviceType.toLowerCase()) {
          return false;
        }
      }

      // Destination filter (for transport)
      if (filters.destination && item.destination) {
        if (!item.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  // Debounced filter application
  const debouncedApplyFilters = useMemo(
    () => debounce(() => {
      if (listings.length > 0) {
        const filtered = applyFilters(listings);
        setFilteredListings(filtered);
        
        // Track filter usage
        const activeFilters = Object.entries(filters).filter(([_, value]) => value).length;
        if (activeFilters > 0) {
          trackFilterUsage(filters, filtered.length);
        }
      }
    }, 300),
    [filters, listings, applyFilters, trackFilterUsage]
  );

  useEffect(() => {
    debouncedApplyFilters();
    return () => debouncedApplyFilters.cancel();
  }, [debouncedApplyFilters]);

  // Event handlers
  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      
      // Clear model when make changes
      if (name === 'make') {
        newFilters.model = '';
      }
      
      return newFilters;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      make: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      category: '',
      condition: '',
      fuelType: '',
      transmission: '',
      serviceType: '',
      routeType: '',
      destination: ''
    });
    
    // Track filter clearing - using safer analytics approach
    if (business && business._id) {
      trackEvent('filters_cleared', {
        businessId: business._id,
        businessType
      });
    }
  }, [business, businessType, trackEvent]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    
    // Track tab changes safely
    if (business && business._id) {
      trackEvent('tab_change', {
        businessId: business._id,
        businessType,
        tab,
        previousTab: activeTab
      });
    }
  }, [business, businessType, activeTab, trackEvent]);

  const toggleSaveBusiness = useCallback(() => {
    if (!business) return;
    
    const savedKey = `saved${businessType.charAt(0).toUpperCase() + businessType.slice(1)}s`;
    const savedBusinesses = JSON.parse(localStorage.getItem(savedKey) || '[]');
    
    if (isSaved) {
      const newSavedBusinesses = savedBusinesses.filter(id => id !== business._id);
      localStorage.setItem(savedKey, JSON.stringify(newSavedBusinesses));
      setIsSaved(false);
      trackFavorite(business._id, 'business', 'remove');
    } else {
      const newSavedBusinesses = [...savedBusinesses, business._id];
      localStorage.setItem(savedKey, JSON.stringify(newSavedBusinesses));
      setIsSaved(true);
      trackFavorite(business._id, 'business', 'add');
    }
  }, [business, businessType, isSaved, trackFavorite]);

  const handleContact = useCallback(() => {
    if (!business || !business.contact) return;
    
    // Track dealer contact safely
    if (business._id) {
      trackDealerContact(business._id, 'email');
    }
    
    if (business.contact.email) {
      window.location.href = `mailto:${business.contact.email}?subject=Inquiry about your ${businessType === 'dealer' ? 'dealership' : 'business'} on I3W Car Culture`;
    } else if (business.contact.phone) {
      window.location.href = `tel:${business.contact.phone}`;
    }
  }, [business, businessType, trackDealerContact]);
  
  const handleWhatsAppContact = useCallback(() => {
    if (!business || !business.contact?.phone) return;
    
    // Track WhatsApp contact safely
    if (business._id) {
      trackDealerContact(business._id, 'whatsapp');
    }
    
    const phone = business.contact.phone.replace(/\D/g, '');
    const message = `Hello ${business.businessName}, I'm interested in your ${isDealer ? 'vehicles' : isRentalService ? 'rental services' : 'services'} listed on I3W Car Culture.`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  }, [business, isDealer, isRentalService, trackDealerContact]);

  const handlePhoneClick = useCallback((phoneNumber) => {
    trackPhoneClick(phoneNumber, 'business_detail');
    window.location.href = `tel:${phoneNumber}`;
  }, [trackPhoneClick]);

  const handleWebsiteClick = useCallback(() => {
    if (!business || !business.contact?.website) return;
    
    // Track website clicks safely
    if (business._id) {
      trackEvent('website_click', {
        businessId: business._id,
        businessType,
        website: business.contact.website
      });
    }
    
    let website = business.contact.website;
    if (!website.startsWith('http')) {
      website = `https://${website}`;
    }
    
    window.open(website, '_blank');
  }, [business, businessType, trackEvent]);

  const handleShareItem = useCallback((item, buttonRef) => {
    setSelectedItem(item);
    setSharingBusiness(false);
    shareButtonRef.current = buttonRef;
    setShareModalOpen(true);
    
    // Track item sharing safely
    if (business && business._id && item && item._id) {
      trackEvent('item_share', {
        businessId: business._id,
        itemId: item._id || item.id,
        itemType: isDealer ? 'vehicle' : serviceType
      });
    }
  }, [business, isDealer, serviceType, trackEvent]);
  
  const handleShareBusiness = useCallback((event) => {
    shareButtonRef.current = event.currentTarget;
    setSharingBusiness(true);
    setSelectedItem(null);
    setShareModalOpen(true);
    
    // Track business sharing safely
    if (business && business._id) {
      trackEvent('business_share', {
        businessId: business._id,
        businessType
      });
    }
  }, [business, businessType, trackEvent]);

  // Image handling
  const getBusinessImageUrl = useCallback((imageData, type = 'business') => {
    if (!imageData) {
      return `/images/placeholders/${getPlaceholderByType(type)}.jpg`;
    }
    
    try {
      let imageUrl = '';
      
      if (typeof imageData === 'string') {
        imageUrl = imageData;
        if (imageUrl.includes('/images/images/')) {
          imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
        }
      } else if (imageData && typeof imageData === 'object') {
        imageUrl = imageData.url || '';
        if (imageUrl && imageUrl.includes('/images/images/')) {
          imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
        }
      }
      
      if (!imageUrl) {
        return `/images/placeholders/${getPlaceholderByType(type)}.jpg`;
      }
      
      if (checkFailedImage(imageUrl, type)) {
        return `/images/placeholders/${getPlaceholderByType(type)}.jpg`;
      }
      
      if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `/${imageUrl}`;
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`Error processing ${type} image URL:`, error);
      return `/images/placeholders/${getPlaceholderByType(type)}.jpg`;
    }
  }, [checkFailedImage]);

  const getPlaceholderByType = (type) => {
    switch (type) {
      case 'banner': return 'dealer-banner';
      case 'logo': return 'dealer-logo';
      case 'vehicle': return 'car';
      case 'rental': return 'rental';
      case 'trailer': return 'trailer';
      case 'transport': return 'transport';
      case 'inventory': return 'part';
      case 'avatar': return 'avatar';
      default: return 'default';
    }
  };

  // Utility functions
  const formatWorkingHours = (hours) => {
    if (!hours) return 'Not available';
    
    const { open, close } = hours;
    if (!open || !close) return 'Closed';
    
    return `${open} - ${close}`;
  };

  const getBusinessTypeLabel = (type, serviceType) => {
    if (type?.toLowerCase() === 'independent' && isDealer) {
      return 'Independent Dealer';
    } else if (type?.toLowerCase() === 'franchise' && isDealer) {
      return 'Franchise Dealer';
    } else if (type?.toLowerCase() === 'certified' && isDealer) {
      return 'Certified Dealer';
    }
    
    if (serviceType === 'workshop') {
      if (type?.toLowerCase() === 'authorized') {
        return 'Authorized Workshop';
      } else if (type?.toLowerCase() === 'independent') {
        return 'Independent Workshop';
      }
    } else if (serviceType === 'public_transport') {
      if (type?.toLowerCase() === 'bus') {
        return 'Bus Service';
      } else if (type?.toLowerCase() === 'taxi') {
        return 'Taxi Service';
      }
      return 'Transport Provider';
    } else if (serviceType === 'car_rental') {
      return 'Car Rental Service';
    } else if (serviceType === 'trailer_rental') {
      return 'Trailer Rental Service';
    }
    
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Service Provider';
  };

  const getRentalsTitle = () => {
    if (serviceType === 'car_rental') {
      return 'Rental Vehicles';
    } else if (serviceType === 'trailer_rental') {
      return 'Rental Trailers';
    } else if (serviceType === 'public_transport') {
      return 'Transport Routes';
    }
    return 'Available Units';
  };

  // Get available models for selected make
  const availableModels = useMemo(() => {
    if (!filters.make) return availableFilters.models;
    
    const modelsForMake = listings
      .filter(item => (item.make || item.specifications?.make) === filters.make)
      .map(item => item.model || item.specifications?.model)
      .filter(Boolean);
    
    return [...new Set(modelsForMake)].sort();
  }, [filters.make, listings, availableFilters.models]);

  if (loading) {
    return (
      <div className="bcc-business-detail-loading-page">
        <div className="bcc-business-detail-spinner"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="bcc-business-detail-error-page">
        <div className="bcc-business-detail-error-container">
          <h2>{error || `${businessType === 'dealer' ? 'Dealership' : 'Service'} not found`}</h2>
          <p>The {businessType} you're looking for doesn't exist or has been removed.</p>
          <button 
            className="bcc-business-detail-back-button"
            onClick={() => navigate(`/${businessType === 'dealer' ? 'dealerships' : 'services'}`)}
          >
            ← Back to {businessType === 'dealer' ? 'Dealerships' : 'Services'}
          </button>
        </div>
      </div>
    );
  }

return (
  <div className="bcc-business-detail-page">
    {/* FIXED: Banner section - only banner image and action buttons */}
    <div className="bcc-business-detail-banner">
      {business.profile?.banner && !imageErrors.banner ? (
        <img 
          src={getBusinessImageUrl(business.profile.banner, 'banner')}
          alt={`${business.businessName} banner`}
          className="bcc-business-detail-banner-image"
          onError={(e) => {
            const originalSrc = e.target.src;
            markFailedImage(originalSrc, 'banner');
            setImageErrors(prev => ({ ...prev, banner: true }));
          }}
        />
      ) : (
        <div className="bcc-business-detail-default-banner">
          {business.businessName}
        </div>
      )}
      
      {/* Save/Share buttons stay on banner */}
      <div className="bcc-business-detail-action-buttons">
        <button 
          className={`bcc-business-detail-save-button ${isSaved ? 'saved' : ''}`}
          onClick={toggleSaveBusiness}
          aria-label={isSaved ? 'Remove from saved' : `Save ${businessType}`}
        >
          {isSaved ? '♥' : '♡'}
        </button>
        <button
          className="bcc-business-detail-share-button"
          onClick={handleShareBusiness}
          aria-label={`Share ${businessType}`}
        >
          ↗
        </button>
        {/* NEW: Add review button */}
          <button 
            className="bcc-business-detail-review-button"
            onClick={handleStartReview}
            disabled={!isAuthenticated}
            title={isAuthenticated ? 'Leave a review' : 'Login to leave a review'}
          >
            <Star size={16} />
            <span className="button-text">Review</span>
          </button>
      </div>
    </div>

    {/* FIXED: Business info header - separate from banner */}
    <div className="bcc-business-detail-content-header">
      <div className="bcc-business-detail-header-container">
        <div className="bcc-business-detail-logo-container">
          {business.profile?.logo && !imageErrors.logo ? (
            <img 
              src={getBusinessImageUrl(business.profile.logo, 'logo')}
              alt={`${business.businessName} logo`}
              className="bcc-business-detail-logo"
              onError={(e) => {
                const originalSrc = e.target.src;
                markFailedImage(originalSrc, 'logo');
                setImageErrors(prev => ({ ...prev, logo: true }));
              }}
            />
          ) : (
            <div className="bcc-business-detail-logo-placeholder">
              {business.businessName.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="bcc-business-detail-header-info">
          <div className="bcc-business-detail-title-container">
            <h1>{business.businessName}</h1>
            {business.verification?.status === 'verified' && (
              <div className="bcc-business-detail-verified">✓ Verified</div>
            )}
          </div>
          
          <div className="bcc-business-detail-business-info">
            <span className="bcc-business-detail-type">
              {getBusinessTypeLabel(business.businessType, serviceType)}
            </span>
            {business.location && (
              <span className="bcc-business-detail-location">
                <i className="bcc-business-detail-location-icon"></i>
                {business.location.city}{business.location.country ? `, ${business.location.country}` : ''}
              </span>
            )}
          </div>
          
          <div className="bcc-business-detail-bottom-info">
            {business.metrics && (
              <div className="bcc-business-detail-metrics">
                {(isDealer || isRentalService) && (
                  <div className="bcc-business-detail-metric">
                    <span className="bcc-business-detail-metric-value">{listingsCount || business.metrics?.totalListings || 0}</span>
                    <span className="bcc-business-detail-metric-label">
                      {isDealer ? 'Listings' : serviceType === 'car_rental' ? 'Vehicles' : 
                       serviceType === 'trailer_rental' ? 'Trailers' : 'Routes'}
                    </span>
                  </div>
                )}
                
                {business.metrics.averageRating > 0 && (
                  <div className="bcc-business-detail-metric">
                    <span className="bcc-business-detail-metric-value">
                      <span className="bcc-business-detail-stars">
                        {"★".repeat(Math.floor(business.metrics.averageRating))}
                        {business.metrics.averageRating % 1 >= 0.5 ? "½" : ""}
                      </span>
                      <span className="bcc-business-detail-rating-number">
                        {business.metrics.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </span>
                    <span className="bcc-business-detail-metric-label">
                      {business.metrics.totalReviews} reviews
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="bcc-business-detail-actions">
              <button className="bcc-business-detail-contact-button" onClick={handleContact}>
                Contact {isDealer ? 'Dealer' : 'Business'}
              </button>
              
              {(business.social?.whatsapp || business.contact?.phone) && (
                <button className="bcc-business-detail-whatsapp-button" onClick={handleWhatsAppContact}>
                  WhatsApp
                </button>
              )}
              
              {business.contact?.website && (
                <button className="bcc-business-detail-website-button" onClick={handleWebsiteClick}>
                  Visit Website
                </button>
              )}
            </div>
          </div>
          
          <div className="bcc-business-detail-quick-contact">
            {business.contact?.phone && (
              <div className="bcc-business-detail-phone">
                <span className="bcc-business-detail-contact-label">Phone:</span>
                <a 
                  href={`tel:${business.contact.phone}`}
                  onClick={() => handlePhoneClick(business.contact.phone)}
                >
                  {business.contact.phone}
                </a>
              </div>
            )}
            {business.contact?.email && (
              <div className="bcc-business-detail-email">
                <span className="bcc-business-detail-contact-label">Email:</span>
                <a href={`mailto:${business.contact.email}`}>{business.contact.email}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* FIXED: Main content section - now properly positioned */}
    <div className="bcc-business-detail-content">
      <div className="bcc-business-detail-tabs">
        <button 
          className={`bcc-business-detail-tab-button ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => handleTabChange('about')}
        >
          About
        </button>
        
        {(isDealer || isRentalService) && (
          <button 
            className={`bcc-business-detail-tab-button ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => handleTabChange('listings')}
          >
            {isDealer ? 'Vehicles' : getRentalsTitle()} ({listingsCount || business.metrics?.totalListings || 0})
          </button>
        )}
        
        <button 
          className={`bcc-business-detail-tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleTabChange('inventory')}
        >
          Inventory ({inventoryPagination.total || 0})
        </button>
        
          <button 
            className={`bcc-business-detail-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => handleTabChange('reviews')}
          >
            Reviews ({reviewStats.totalReviews || business.metrics?.totalReviews || 0})
          </button>
        
        <button 
          className={`bcc-business-detail-tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => handleTabChange('contact')}
        >
          Contact
        </button>
      </div>
      
      <div className="bcc-business-detail-tab-content">
        {/* Keep all the existing tab content exactly as it is */}
        {activeTab === 'about' && (
          <div className="bcc-business-detail-about-tab">
            <div className="bcc-business-detail-description">
              <h2>About {business.businessName}</h2>
              <p>{business.profile?.description || 'No description available.'}</p>
              
              {business.profile?.specialties && business.profile.specialties.length > 0 && (
                <div className="bcc-business-detail-specialties-section">
                  <h3>Specialties</h3>
                  <div className="bcc-business-detail-specialties-list">
                    {business.profile.specialties.map((specialty, index) => (
                      <span className="bcc-business-detail-specialty-tag" key={index}>{specialty}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {business.social && Object.keys(business.social).length > 0 && (
                <div className="bcc-business-detail-social-section">
                  <h3>Connect With Us</h3>
                  <div className="bcc-business-detail-social-links">
                    {Object.entries(business.social).map(([platform, username]) => (
                      <a 
                        key={platform}
                        href={
                          platform === 'facebook' ? `https://facebook.com/${username}` :
                          platform === 'instagram' ? `https://instagram.com/${username}` :
                          platform === 'twitter' ? `https://twitter.com/${username}` :
                          platform === 'whatsapp' ? `https://wa.me/${username.replace(/\D/g, '')}` :
                          '#'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bcc-business-detail-social-link bcc-business-detail-social-${platform}`}
                        aria-label={`${business.businessName} on ${platform}`}
                        onClick={() => {
                          if (business && business._id) {
                            trackEvent('social_click', {
                              businessId: business._id,
                              platform,
                              businessType
                            });
                          }
                        }}
                      >
                        {
                          platform === 'facebook' ? 'f' :
                          platform === 'instagram' ? 'i' :
                          platform === 'twitter' ? 't' :
                          platform === 'whatsapp' ? 'w' : '?'
                        }
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bcc-business-detail-business-hours">
              <h3>Business Hours</h3>
              
              {business.profile?.workingHours ? (
                <table className="bcc-business-detail-hours-table">
                  <tbody>
                    <tr>
                      <td>Monday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.monday)}</td>
                    </tr>
                    <tr>
                      <td>Tuesday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.tuesday)}</td>
                    </tr>
                    <tr>
                      <td>Wednesday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.wednesday)}</td>
                    </tr>
                    <tr>
                      <td>Thursday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.thursday)}</td>
                    </tr>
                    <tr>
                      <td>Friday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.friday)}</td>
                    </tr>
                    <tr>
                      <td>Saturday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.saturday)}</td>
                    </tr>
                    <tr>
                      <td>Sunday</td>
                      <td>{formatWorkingHours(business.profile.workingHours.sunday)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="bcc-business-detail-no-hours">Working hours not provided</p>
              )}
            </div>
          </div>
        )}
        
        {/* Keep ALL the remaining tab content exactly as it is - listings, inventory, reviews, contact tabs */}
        {activeTab === 'listings' && (isDealer || isRentalService) && (
          // ... keep the entire listings tab content as-is
          <div className="bcc-business-detail-listings-tab">
            <h2>{isDealer ? 'Vehicles for Sale' : getRentalsTitle()}</h2>
            
            {/* Enhanced Filter Section */}
            {listings.length > 0 && (
              <div className="bcc-business-detail-filters">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h3>Filter {isDealer ? 'Vehicles' : getRentalsTitle()}</h3>
                  <button 
                    className="bcc-clear-filters-btn"
                    onClick={handleClearFilters}
                    style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="bcc-filters-row">
                  <div className="bcc-filter-group">
                    <label>Search</label>
                    <input
                      type="text"
                      className="bcc-filter-input"
                      placeholder={`Search ${isDealer ? 'vehicles' : 'items'}...`}
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  
                  {availableFilters.makes.length > 0 && (
                    <div className="bcc-filter-group">
                      <label>Make</label>
                      <select
                        className="bcc-filter-select"
                        value={filters.make}
                        onChange={(e) => handleFilterChange('make', e.target.value)}
                      >
                        <option value="">All Makes</option>
                        {availableFilters.makes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {availableModels.length > 0 && filters.make && (
                    <div className="bcc-filter-group">
                      <label>Model</label>
                      <select
                        className="bcc-filter-select"
                        value={filters.model}
                        onChange={(e) => handleFilterChange('model', e.target.value)}
                      >
                        <option value="">All Models</option>
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {availableFilters.years.length > 0 && (
                    <div className="bcc-filter-group">
                      <label>Year Range</label>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <select
                          className="bcc-filter-select"
                          value={filters.minYear}
                          onChange={(e) => handleFilterChange('minYear', e.target.value)}
                        >
                          <option value="">Min Year</option>
                          {availableFilters.years.map(year => (
                            <option key={`min-${year}`} value={year}>{year}</option>
                          ))}
                        </select>
                        <select
                          className="bcc-filter-select"
                          value={filters.maxYear}
                          onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                        >
                          <option value="">Max Year</option>
                          {availableFilters.years.map(year => (
                            <option key={`max-${year}`} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bcc-filters-row">
                  <div className="bcc-filter-group">
                    <label>Price Range (P)</label>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <input
                        type="number"
                        className="bcc-filter-input"
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      />
                      <input
                        type="number"
                        className="bcc-filter-input"
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {availableFilters.categories.length > 0 && (
                    <div className="bcc-filter-group">
                      <label>Category</label>
                      <select
                        className="bcc-filter-select"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {availableFilters.categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {serviceType === 'public_transport' && availableFilters.destinations.length > 0 && (
                    <div className="bcc-filter-group">
                      <label>Destination</label>
                      <select
                        className="bcc-filter-select"
                        value={filters.destination}
                        onChange={(e) => handleFilterChange('destination', e.target.value)}
                      >
                        <option value="">All Destinations</option>
                        {availableFilters.destinations.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {Object.values(filters).some(value => value) && (
                  <div style={{marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 51, 0, 0.1)', borderRadius: '6px'}}>
                    <small style={{color: '#ff3300', fontWeight: '500'}}>
                      Showing {filteredListings.length} of {listings.length} {isDealer ? 'vehicles' : 'items'}
                    </small>
                  </div>
                )}
              </div>
            )}
            
            {listingsLoading ? (
              <div className="bcc-business-detail-loading-container">
                <div className="bcc-business-detail-spinner"></div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bcc-business-detail-no-listings">
                <p>
                  {Object.values(filters).some(value => value) 
                    ? 'No items match your current filters. Try adjusting your search criteria.'
                    : (isDealer ? 'This dealership currently has no active listings.' : 
                      serviceType === 'car_rental' ? 'This rental service currently has no available vehicles.' :
                      serviceType === 'trailer_rental' ? 'This rental service currently has no available trailers.' :
                      serviceType === 'public_transport' ? 'This transport provider currently has no available routes.' :
                      'No items available.')}
                </p>
                {Object.values(filters).some(value => value) && (
                  <button 
                    className="bcc-clear-filters-btn"
                    onClick={handleClearFilters}
                    style={{marginTop: '1rem'}}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bcc-business-detail-listings-grid">
                  {filteredListings.map(item => (
                    <div className="bcc-business-detail-vehicle-card-wrapper" key={item._id || item.id}>
                      {isDealer ? (
                        <VehicleCard 
                          car={item}
                          onShare={handleShareItem}
                          onClick={() => {
                            if (business && business._id && item && item._id) {
                              trackListingView(item._id, {
                                title: item.title,
                                make: item.make || item.specifications?.make,
                                model: item.model || item.specifications?.model,
                                price: item.price,
                                businessId: business._id,
                                businessType
                              });
                            }
                          }}
                        />
                      ) : serviceType === 'public_transport' ? (
                        <PublicTransportCard 
                          route={item}
                          onShare={(route, buttonRef) => handleShareItem(route, buttonRef)}
                          onBook={() => {
                            if (business && business._id && item && item._id) {
                              trackEvent('transport_booking_initiated', {
                                businessId: business._id,
                                routeId: item._id || item.id,
                                origin: item.origin,
                                destination: item.destination
                              });
                            }
                          }}
                        />
                      ) : (
                        <RentalCard 
                          vehicle={{
                            ...item,
                            provider: typeof item.provider === 'object' ? 
                              item.provider.businessName || item.provider.name : item.provider,
                            providerLocation: typeof item.provider === 'object' && item.provider.location ? 
                              `${item.provider.location.city || ''}${item.provider.location.country ? `, ${item.provider.location.country}` : ''}` : '',
                            providerLogo: typeof item.provider === 'object' ? item.provider.logo : null,
                            providerContact: typeof item.provider === 'object' ? item.provider.contact : null,
                            name: item.name || item.title || `${item.specifications?.make || ''} ${item.specifications?.model || ''}`,
                            year: item.specifications?.year || item.year,
                            transmission: item.specifications?.transmission || item.transmission,
                            fuelType: item.specifications?.fuelType || item.fuelType,
                            seats: item.specifications?.seats || item.seats,
                            doors: item.specifications?.doors || item.doors,
                            features: item.features || []
                          }}
                          onShare={handleShareItem}
                          onRent={() => {
                            if (business && business._id && item && item._id) {
                              trackEvent('rental_inquiry_initiated', {
                                businessId: business._id,
                                vehicleId: item._id || item.id,
                                serviceType
                              });
                            }
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                {listingsPagination.totalPages > 1 && (
                  <div className="bcc-business-detail-pagination">
                    <button 
                      className="bcc-business-detail-page-button prev" 
                      onClick={() => setListingsPage(listingsPagination.currentPage - 1)}
                      disabled={listingsPagination.currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, listingsPagination.totalPages) }).map((_, index) => {
                      let pageToShow;
                      if (listingsPagination.totalPages <= 5) {
                        pageToShow = index + 1;
                      } else if (listingsPagination.currentPage <= 3) {
                        pageToShow = index + 1;
                      } else if (listingsPagination.currentPage >= listingsPagination.totalPages - 2) {
                        pageToShow = listingsPagination.totalPages - 4 + index;
                      } else {
                        pageToShow = listingsPagination.currentPage - 2 + index;
                      }
                      
                      return (
                        <button
                          key={pageToShow}
                          className={`bcc-business-detail-page-number ${listingsPagination.currentPage === pageToShow ? 'active' : ''}`}
                          onClick={() => setListingsPage(pageToShow)}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="bcc-business-detail-page-button next" 
                      onClick={() => setListingsPage(listingsPagination.currentPage + 1)}
                      disabled={listingsPagination.currentPage === listingsPagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Keep ALL other tab content exactly as is - inventory, reviews, contact */}
        {activeTab === 'inventory' && (
          <div className="bcc-business-detail-inventory-tab">
            <h2>Shop Inventory</h2>
            
            {inventoryLoading ? (
              <div className="bcc-business-detail-loading-container">
                <div className="bcc-business-detail-spinner"></div>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="bcc-business-detail-no-inventory">
                <p>This business currently has no items in their inventory.</p>
              </div>
            ) : (
              <>
                <div className="bcc-business-detail-inventory-grid">
                  {inventoryItems.map(item => (
                    <div className="bcc-business-detail-inventory-card-wrapper" key={item._id || item.id}>
                      <InventoryCard 
                        item={item}
                        onShare={handleShareItem}
                        onAddToCart={(item) => {
                          if (business && business._id && item && item._id) {
                            trackEvent('add_to_cart', {
                              businessId: business._id,
                              itemId: item._id || item.id,
                              itemTitle: item.title,
                              price: item.price
                            });
                          }
                          alert(`Added ${item.title} to cart!`);
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {inventoryPagination.totalPages > 1 && (
                  <div className="bcc-business-detail-pagination">
                    <button 
                      className="bcc-business-detail-page-button prev" 
                      onClick={() => setInventoryPage(inventoryPagination.currentPage - 1)}
                      disabled={inventoryPagination.currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, inventoryPagination.totalPages) }).map((_, index) => {
                      let pageToShow;
                      if (inventoryPagination.totalPages <= 5) {
                        pageToShow = index + 1;
                      } else if (inventoryPagination.currentPage <= 3) {
                        pageToShow = index + 1;
                      } else if (inventoryPagination.currentPage >= inventoryPagination.totalPages - 2) {
                        pageToShow = inventoryPagination.totalPages - 4 + index;
                      } else {
                        pageToShow = inventoryPagination.currentPage - 2 + index;
                      }
                      
                      return (
                        <button
                          key={pageToShow}
                          className={`bcc-business-detail-page-number ${inventoryPagination.currentPage === pageToShow ? 'active' : ''}`}
                          onClick={() => setInventoryPage(pageToShow)}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="bcc-business-detail-page-button next" 
                      onClick={() => setInventoryPage(inventoryPagination.currentPage + 1)}
                      disabled={inventoryPagination.currentPage === inventoryPagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
           {/* ENHANCED REVIEWS TAB - Replace your existing reviews tab */}
          {activeTab === 'reviews' && (
            <div className="bcc-business-detail-reviews-tab">
              <div className="bcc-business-detail-reviews-header">
                <h2>Customer Reviews</h2>
                <button 
                  className="bcc-add-review-button"
                  onClick={handleStartReview}
                  disabled={!isAuthenticated}
                >
                  <Plus size={16} />
                  Add Review
                </button>
              </div>

              {/* Rating Summary */}
              <div className="bcc-rating-summary">
                <div className="bcc-overall-rating">
                  <div className="bcc-rating-number">
                    {reviewStats.averageRating.toFixed(1)}
                  </div>
                  <div className="bcc-rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star}
                        size={20}
                        className={`bcc-star ${star <= Math.round(reviewStats.averageRating) ? 'filled' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="bcc-total-reviews">
                    {reviewStats.totalReviews} total reviews
                  </div>
                </div>

                <div className="bcc-rating-breakdown">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="bcc-rating-bar">
                      <span className="bcc-rating-label">{rating} ⭐</span>
                      <div className="bcc-bar-container">
                        <div 
                          className="bcc-bar-fill"
                          style={{ 
                            width: `${reviewStats.totalReviews > 0 
                              ? (reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="bcc-rating-count">
                        {reviewStats.ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="bcc-reviews-list">
                {reviewsLoading ? (
                  <div className="bcc-reviews-loading">
                    <div className="bcc-business-detail-spinner"></div>
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="bcc-no-reviews">
                    <MessageSquare size={48} />
                    <h3>No reviews yet</h3>
                    <p>Be the first to review this business!</p>
                    <button 
                      className="bcc-first-review-button"
                      onClick={handleStartReview}
                      disabled={!isAuthenticated}
                    >
                      Write First Review
                    </button>
                  </div>
                ) : (
                  reviews.map(review => (
                    <ReviewCard key={review._id} review={review} business={business} />
                  ))
                )}
              </div>
            </div>
          )}
        
        {activeTab === 'contact' && (
          <div className="bcc-business-detail-contact-tab">
            <h2>Contact {business.businessName}</h2>
            
            <div className="bcc-business-detail-contact-grid">
              <div className="bcc-business-detail-contact-info">
                <h3>Contact Information</h3>
                
                <div className="bcc-business-detail-contact-details">
                  {business.contact?.phone && (
                    <div className="bcc-business-detail-contact-detail">
                      <div className="bcc-business-detail-detail-label">Phone</div>
                      <div className="bcc-business-detail-detail-value">
                        <a 
                          href={`tel:${business.contact.phone}`}
                          onClick={() => handlePhoneClick(business.contact.phone)}
                        >
                          {business.contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {business.contact?.email && (
                    <div className="bcc-business-detail-contact-detail">
                      <div className="bcc-business-detail-detail-label">Email</div>
                      <div className="bcc-business-detail-detail-value">
                        <a href={`mailto:${business.contact.email}`}>{business.contact.email}</a>
                      </div>
                    </div>
                  )}
                  
                  {business.contact?.website && (
                    <div className="bcc-business-detail-contact-detail">
                      <div className="bcc-business-detail-detail-label">Website</div>
                      <div className="bcc-business-detail-detail-value">
                        <a 
                          href={business.contact.website.startsWith('http') ? business.contact.website : `https://${business.contact.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (business && business._id) {
                              trackEvent('website_click', {
                                businessId: business._id,
                                businessType,
                                website: business.contact.website
                              });
                            }
                          }}
                        >
                          {business.contact.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {business.social && Object.keys(business.social).length > 0 && (
                  <div className="bcc-business-detail-social-section">
                    <h3>Social Media</h3>
                    <div className="bcc-business-detail-social-links">
                      {Object.entries(business.social).map(([platform, username]) => (
                        <a 
                          key={platform}
                          href={
                            platform === 'facebook' ? `https://facebook.com/${username}` :
                            platform === 'instagram' ? `https://instagram.com/${username}` :
                            platform === 'twitter' ? `https://twitter.com/${username}` :
                            platform === 'whatsapp' ? `https://wa.me/${username.replace(/\D/g, '')}` :
                            '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`bcc-business-detail-social-link bcc-business-detail-social-${platform}`}
                          aria-label={`${business.businessName} on ${platform}`}
                          onClick={() => {
                            if (business && business._id) {
                              trackEvent('social_click', {
                                businessId: business._id,
                                platform,
                                businessType
                              });
                            }
                          }}
                        >
                          {
                            platform === 'facebook' ? 'f' :
                            platform === 'instagram' ? 'i' :
                            platform === 'twitter' ? 't' :
                            platform === 'whatsapp' ? 'w' : '?'
                          }
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bcc-business-detail-contact-location">
                <h3>Location</h3>
                
                <div className="bcc-business-detail-location-details">
                  {business.location?.address && (
                    <div className="bcc-business-detail-address">
                      <p>{business.location.address}</p>
                      <p>
                        {business.location.city}{business.location.state ? `, ${business.location.state}` : ''}
                        {business.location.country ? `, ${business.location.country}` : ''}
                      </p>
                    </div>
                  )}
                  
                  <div className="bcc-business-detail-map-placeholder">
                    <p>Map view coming soon</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bcc-business-detail-contact-form-section">
              <h3>Send a Message</h3>
              
              <form className="bcc-business-detail-contact-form" onSubmit={(e) => {
                e.preventDefault();
                if (business && business._id) {
                  trackEvent('contact_form_submitted', {
                    businessId: business._id,
                    businessType
                  });
                }
                // Handle form submission
              }}>
                <div className="bcc-business-detail-form-row">
                  <div className="bcc-business-detail-form-group">
                    <label htmlFor="name">Your Name</label>
                    <input type="text" id="name" name="name" />
                  </div>
                  
                  <div className="bcc-business-detail-form-group">
                    <label htmlFor="email">Your Email</label>
                    <input type="email" id="email" name="email" />
                  </div>
                </div>
                
                <div className="bcc-business-detail-form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" />
                </div>
                
                <div className="bcc-business-detail-form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5"></textarea>
                </div>
                
                <div className="bcc-business-detail-form-submit">
                  <button type="submit" className="bcc-business-detail-send-message-button">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    
    {shareModalOpen && (
      <ShareModal 
        car={selectedItem}
        dealer={sharingBusiness ? business : null}
        onClose={() => setShareModalOpen(false)}
        buttonRef={shareButtonRef}
      />
    )}


      {/* Review Method Selection Modal */}
      {/* {showReviewModal && !reviewMethod && (
        <div className="bcc-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="bcc-review-method-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bcc-modal-header">
              <h2>How would you like to review?</h2>
              <button 
                className="bcc-close-button"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="bcc-review-methods">
              <button 
                className="bcc-method-option"
                onClick={handleQRScan}
              >
                <QrCode size={32} />
                <h3>Scan QR Code</h3>
                <p>Scan the QR code displayed at the business</p>
              </button>
              
              <button 
                className="bcc-method-option"
                onClick={() => setReviewMethod('service_code')}
              >
                <Hash size={32} />
                <h3>Service Code</h3>
                <p>Enter code from your service receipt</p>
              </button>
              
              <button 
                className="bcc-method-option"
                onClick={() => setReviewMethod('general')}
              >
                <Star size={32} />
                <h3>General Review</h3>
                <p>Leave a general review about this business</p>
              </button>
            </div>
          </div>
        </div>
      )} */}

       {/* Service Code Entry Modal */}
      {showReviewModal && reviewMethod === 'service_code' && (
        <div className="bcc-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="bcc-service-code-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bcc-modal-header">
              <h2>Enter Service Code</h2>
              <button 
                className="bcc-close-button"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="bcc-service-code-form">
              <p>Enter the service code from your receipt or service card:</p>
              <input
                type="text"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                placeholder="e.g. SVC123456"
                className="bcc-service-code-input"
              />
              <div className="bcc-service-code-actions">
                <button 
                  className="bcc-cancel-button"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="bcc-submit-button"
                  onClick={handleServiceCodeSubmit}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="bcc-modal-overlay">
          <div className="bcc-qr-scanner-modal">
            <QRCodeScanner 
              onResult={handleQRResult}
              onCancel={() => setShowQRScanner(false)}
            />
          </div>
        </div>
      )}

{/* Review Form Modal - FIXED to include all review methods */}
{showReviewModal && (reviewMethod === 'qr' || reviewMethod === 'general' || reviewMethod === 'service_code') && (
 (() => {
    console.log('=== REVIEW FORM DEBUG ===');
    console.log('Business object:', business);
    console.log('business._id:', business._id);
    console.log('business.user:', business.user);
    console.log('reviewMethod:', reviewMethod);
    console.log('========================');
    return null;
  })(),

<ReviewForm
  serviceData={{
    id: id,  // ← Use URL parameter: 6833420039f186e3a47ee1b3
    name: business.businessName,
    type: businessType,
    provider: business.businessName
  }}
    verificationMethod={reviewMethod}
    onSubmit={handleReviewSubmitted}
    onCancel={() => {
      setShowReviewModal(false);
      setReviewMethod(null);
      setServiceCode(''); // Clear service code
    }}
    serviceCode={reviewMethod === 'service_code' ? serviceCode : null}
  />
)}

  </div>
);
};

// ========================================
// 6. REVIEW CARD COMPONENT
// ========================================
const ReviewCard = ({ review, business }) => {
  const [showFullReview, setShowFullReview] = useState(false);
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bcc-review-card">
      <div className="bcc-review-header">
        <div className="bcc-reviewer-info">
          <div className="bcc-reviewer-avatar">
            {review.isAnonymous ? (
              <User size={20} />
            ) : (
              <img 
                src={review.fromUserId?.avatar?.url || '/images/default-avatar.png'} 
                alt={review.fromUserId?.name || 'Anonymous'}
              />
            )}
          </div>
          <div className="bcc-reviewer-details">
            <div className="bcc-reviewer-name">
              {review.isAnonymous ? 'Anonymous' : review.fromUserId?.name || 'Anonymous'}
            </div>
            <div className="bcc-review-date">{formatDate(review.date)}</div>
          </div>
        </div>
        
        <div className="bcc-review-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              size={16}
              className={`bcc-star ${star <= review.rating ? 'filled' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="bcc-review-content">
        <p className="bcc-review-text">
          {showFullReview ? review.review : truncateText(review.review)}
          {review.review.length > 150 && (
            <button 
              className="bcc-read-more-button"
              onClick={() => setShowFullReview(!showFullReview)}
            >
              {showFullReview ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>

        {review.verificationMethod && (
          <div className="bcc-review-verification">
            <span className="bcc-verification-badge">
              {review.verificationMethod === 'qr_code' && '📱 QR Verified'}
              {review.verificationMethod === 'service_code' && '🎫 Service Verified'}
              {review.verificationMethod === 'plate_number' && '🚗 Plate Verified'}
            </span>
          </div>
        )}

        {review.response && (
          <div className="bcc-business-response">
            <div className="bcc-response-header">
              <strong>Response from {business?.businessName}</strong>
              <span className="bcc-response-date">
                {formatDate(review.response.date)}
              </span>
            </div>
            <p className="bcc-response-text">{review.response.text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetailPage;