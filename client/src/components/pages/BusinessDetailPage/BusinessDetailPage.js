// src/components/pages/BusinessDetailPage/BusinessDetailPage.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { debounce } from 'lodash';
import {
  Star, QrCode, MessageSquare, Plus, Eye, User, Hash, Car, Heart, Share,
  Camera, Edit2, X, Check, Clock, UploadCloud
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
import { buildHelmet, SITE_URL } from '../../../hooks/useSEO.js';

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
  const [activeTab, setActiveTab] = useState('listings');
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

  // ── Owner edit state ──────────────────────────────────────────────────────
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [editingHours, setEditingHours] = useState(false);
  const [hoursData, setHoursData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ── Business Updates state ─────────────────────────────────────────────────
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [mobileUpdatesOpen, setMobileUpdatesOpen] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '', type: 'update' });
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

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

  useEffect(() => {
  if (business && business._id) {
    loadBusinessReviews();
  }
}, [business, businessType]);

  useEffect(() => {
    if (business && business._id && businessType) {
      fetchUpdates();
    }
  }, [business, businessType]);

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

  // True when the logged-in user owns this dealer profile (or is admin)
  const isOwner = isAuthenticated && business && (
    user?.role === 'admin' ||
    String(business.user) === String(user?._id || user?.id)
  );

  // ── Owner: upload banner / logo ────────────────────────────────────────────
  const handleImageUpload = async (file, field) => {
    if (!file || !business?._id) return;
    const setter = field === 'banner' ? setUploadingBanner : setUploadingLogo;
    setter(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append(field, file);
      const res = await fetch(`/api/dealers/${business._id}/self`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(prev => ({
          ...prev,
          profile: { ...prev.profile, [field]: data.data.profile?.[field] || prev.profile?.[field] }
        }));
        setImageErrors(prev => ({ ...prev, [field]: false }));
      }
    } catch (e) {
      console.error(`Failed to upload ${field}:`, e);
    } finally {
      setter(false);
    }
  };

  // ── Owner: save bio ────────────────────────────────────────────────────────
  const handleSaveBio = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dealers/${business._id}/self`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: bioText })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(prev => ({ ...prev, profile: { ...prev.profile, description: bioText } }));
        setEditingBio(false);
      }
    } catch (e) {
      console.error('Failed to save bio:', e);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Owner: save hours ──────────────────────────────────────────────────────
  const handleSaveHours = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dealers/${business._id}/self`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours: hoursData })
      });
      const data = await res.json();
      if (data.success) {
        setBusiness(prev => ({ ...prev, profile: { ...prev.profile, workingHours: hoursData } }));
        setEditingHours(false);
      }
    } catch (e) {
      console.error('Failed to save hours:', e);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Business Updates handlers ──────────────────────────────────────────────
  const fetchUpdates = async () => {
    if (!business?._id || !businessType) return;
    setUpdatesLoading(true);
    try {
      const res = await fetch(`/api/updates?businessId=${business._id}&businessType=${businessType}&limit=10`);
      const data = await res.json();
      if (data.success) setUpdates(data.data);
    } catch (e) {
      console.error('Failed to fetch updates:', e);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const handleCreateUpdate = async () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) return;
    setSubmittingUpdate(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business._id, businessType, ...newUpdate })
      });
      const data = await res.json();
      if (data.success) {
        setUpdates(prev => [data.data, ...prev]);
        setNewUpdate({ title: '', content: '', type: 'update' });
        setShowUpdateForm(false);
      }
    } catch (e) {
      console.error('Failed to create update:', e);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/updates/${updateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUpdates(prev => prev.filter(u => u._id !== updateId));
    } catch (e) {
      console.error('Failed to delete update:', e);
    }
  };

  const formatUpdateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

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
        const rawItems = response.data.data ||
                      response.data.vehicles ||
                      response.data.trailers ||
                      response.data.routes ||
                      [];
        // Inject dealer reference into each listing so VehicleCard can navigate to dealer profile
        const items = rawItems.map(item => {
          if (isDealer && business && !item.dealer?._id) {
            return { ...item, dealer: { ...business, _id: business._id || id }, dealerId: business._id || id };
          }
          return item;
        });

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
  // Load business reviews
const loadBusinessReviews = async () => {
  if (!business?._id) return;
  
  try {
    setReviewsLoading(true);
    
    // Use the correct endpoint based on business type
    const endpoint = businessType === 'dealer' 
      ? `/reviews/dealer/${business._id}`
      : `/reviews/service/${business._id}`;
      
    console.log('Loading reviews from endpoint:', endpoint);
    console.log('Business ID:', business._id);
    console.log('Business type:', businessType);
        
    const response = await http.get(endpoint);
    
    if (response.data.success) {
      const reviewsData = response.data.data.reviews || [];
      const statsData = response.data.data.stats || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
      
      console.log('Reviews loaded:', reviewsData.length);
      console.log('Review stats:', statsData);
      
      setReviews(reviewsData);
      setReviewStats(statsData);
    } else {
      console.log('Failed to load reviews:', response.data.message);
      setReviews([]);
      setReviewStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    setReviews([]);
    setReviewStats({
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
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

// Handle review submission
const handleReviewSubmitted = (result) => {
  if (result.success) {
    setShowReviewModal(false);
    setReviewMethod(null);
    setShowQRScanner(false);
    setServiceCode('');
    
    // Show success message
    alert(result.message || 'Review submitted successfully!');
    
    // Reload reviews to show the new one
    loadBusinessReviews();
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

      // Condition filter
      if (filters.condition) {
        const itemCondition = item.condition || item.specifications?.condition;
        if (!itemCondition || itemCondition.toLowerCase() !== filters.condition.toLowerCase()) return false;
      }

      // Fuel type filter
      if (filters.fuelType) {
        const itemFuel = item.fuelType || item.specifications?.fuelType;
        if (!itemFuel || itemFuel.toLowerCase() !== filters.fuelType.toLowerCase()) return false;
      }

      // Transmission filter
      if (filters.transmission) {
        const itemTrans = item.transmission || item.specifications?.transmission;
        if (!itemTrans || itemTrans.toLowerCase() !== filters.transmission.toLowerCase()) return false;
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

const bizDesc = [business.description, business.profile?.city, business.providerType].filter(Boolean).join(' · ');
const bizImage = business.profile?.logo || business.profile?.banner || null;

return (
  <div className="bcc-business-detail-page">
    {buildHelmet({
      title: business.businessName,
      description: bizDesc || `View ${business.businessName} on BW Car Culture — Botswana's automotive services directory.`,
      image: bizImage,
      url: `${SITE_URL}/business/${business._id}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: business.businessName,
        description: bizDesc,
        image: bizImage,
        url: `${SITE_URL}/business/${business._id}`,
        telephone: business.contact?.phone,
        address: business.profile?.city ? { '@type': 'PostalAddress', addressLocality: business.profile.city, addressCountry: 'BW' } : undefined
      }
    })}
    {/* Banner section */}
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

      {/* Owner: edit banner button */}
      {isOwner && (
        <>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], 'banner')}
          />
          <button
            className="bdp-edit-banner-btn"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            title="Change cover photo"
          >
            {uploadingBanner ? <span className="bdp-spinner" /> : <Camera size={15} />}
            {uploadingBanner ? 'Uploading…' : 'Edit Cover'}
          </button>
        </>
      )}

      {/* Business Updates overlay — desktop, top-left of banner */}
      {updates.length > 0 && (
        <div className="bdp-updates-overlay">
          <div className="bdp-updates-overlay-header">
            <span className="bdp-updates-overlay-label">Updates</span>
            {updates.length > 1 && (
              <span className="bdp-updates-overlay-count">{updates.length}</span>
            )}
          </div>
          <div className="bdp-updates-overlay-item">
            <span className={`bdp-update-badge bdp-badge-${updates[0].type}`}>
              {updates[0].type}
            </span>
            <p className="bdp-updates-overlay-title-text">{updates[0].title}</p>
            <span className="bdp-updates-overlay-time">{formatUpdateTime(updates[0].createdAt)}</span>
          </div>
          {updates.length > 1 && (
            <p className="bdp-updates-overlay-more">+{updates.length - 1} more — see Updates tab</p>
          )}
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

    {/* Business Updates bar — mobile only */}
    {updates.length > 0 && (
      <div className="bdp-mobile-updates-bar">
        <button
          className="bdp-mobile-updates-toggle"
          onClick={() => setMobileUpdatesOpen(o => !o)}
          aria-expanded={mobileUpdatesOpen}
        >
          <span className="bdp-mobile-updates-toggle-label">
            <span className="bdp-mobile-updates-dot" />
            Updates ({updates.length})
          </span>
          <span className={`bdp-mobile-updates-chevron ${mobileUpdatesOpen ? 'open' : ''}`}>›</span>
        </button>
        {mobileUpdatesOpen && (
          <div className="bdp-mobile-updates-list">
            {updates.map(u => (
              <div key={u._id} className="bdp-mobile-update-item">
                <span className={`bdp-update-badge bdp-badge-${u.type}`}>{u.type}</span>
                <div className="bdp-mobile-update-body">
                  <p className="bdp-mobile-update-title">{u.title}</p>
                  <p className="bdp-mobile-update-content">{u.content}</p>
                  <span className="bdp-mobile-update-time">{formatUpdateTime(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* FIXED: Business info header - separate from banner */}
    <div className="bcc-business-detail-content-header">
      <div className="bcc-business-detail-header-container">
        <div className="bcc-business-detail-logo-container" style={{ position: 'relative' }}>
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
          {isOwner && (
            <>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], 'logo')}
              />
              <button
                className="bdp-edit-logo-btn"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                title="Change logo"
              >
                {uploadingLogo ? <span className="bdp-spinner" /> : <Camera size={13} />}
              </button>
            </>
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
          className={`bcc-business-detail-tab-button ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => handleTabChange('updates')}
        >
          Updates {updates.length > 0 && <span className="bdp-tab-updates-count">{updates.length}</span>}
        </button>

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
        {activeTab === 'updates' && (
          <div className="bdp-updates-tab">
            {/* Owner: post update button → opens subscription modal */}
            {isOwner && (
              <div className="bdp-updates-owner-bar">
                <button className="bdp-add-update-btn" onClick={() => setShowUpdateForm(true)}>
                  <Plus size={14} /> Post Update
                </button>
              </div>
            )}

            {/* Updates list */}
            {updatesLoading ? (
              <div className="bdp-updates-loading">Loading updates…</div>
            ) : updates.length === 0 ? (
              <div className="bdp-updates-empty">
                <p>No updates yet.</p>
                {isOwner && <p>Post your first update above to keep customers informed.</p>}
              </div>
            ) : (
              <div className="bdp-updates-list">
                {updates.map(u => (
                  <div key={u._id} className="bdp-update-card">
                    <div className="bdp-update-card-header">
                      <div className="bdp-update-card-meta">
                        <span className={`bdp-update-badge bdp-badge-${u.type}`}>{u.type}</span>
                        {u.pinned && <span className="bdp-update-pinned-badge">Pinned</span>}
                        <span className="bdp-update-card-time">{formatUpdateTime(u.createdAt)}</span>
                      </div>
                      {isOwner && (
                        <button
                          className="bdp-update-delete-btn"
                          onClick={() => handleDeleteUpdate(u._id)}
                          title="Delete update"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <h4 className="bdp-update-card-title">{u.title}</h4>
                    <p className="bdp-update-card-content">{u.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Keep all the existing tab content exactly as it is */}
        {activeTab === 'about' && (
          <div className="bcc-business-detail-about-tab">
            <div className="bcc-business-detail-description">
              <div className="bdp-section-header">
                <h2>About {business.businessName}</h2>
                {isOwner && !editingBio && (
                  <button
                    className="bdp-edit-btn"
                    onClick={() => { setBioText(business.profile?.description || ''); setEditingBio(true); }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {editingBio ? (
                <div className="bdp-inline-edit">
                  <textarea
                    className="bdp-bio-textarea"
                    value={bioText}
                    onChange={e => setBioText(e.target.value)}
                    placeholder="Describe your dealership…"
                    rows={5}
                    autoFocus
                  />
                  <div className="bdp-inline-actions">
                    <button className="bdp-cancel-btn" onClick={() => setEditingBio(false)} disabled={savingProfile}>
                      <X size={13} /> Cancel
                    </button>
                    <button className="bdp-save-btn" onClick={handleSaveBio} disabled={savingProfile}>
                      {savingProfile ? <span className="bdp-spinner" /> : <Check size={13} />}
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p>{business.profile?.description || (isOwner ? 'Click Edit to add a description.' : 'No description available.')}</p>
              )}
              
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
              <div className="bdp-section-header">
                <h3>Business Hours</h3>
                {isOwner && !editingHours && (
                  <button
                    className="bdp-edit-btn"
                    onClick={() => {
                      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
                      const init = {};
                      days.forEach(d => {
                        init[d] = {
                          open: business.profile?.workingHours?.[d]?.open || '',
                          close: business.profile?.workingHours?.[d]?.close || '',
                          closed: business.profile?.workingHours?.[d]?.closed || false
                        };
                      });
                      setHoursData(init);
                      setEditingHours(true);
                    }}
                  >
                    <Clock size={13} /> Edit Hours
                  </button>
                )}
              </div>

              {editingHours ? (
                <div className="bdp-hours-editor">
                  {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                    <div key={day} className="bdp-hours-row">
                      <span className="bdp-hours-day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      <label className="bdp-closed-label">
                        <input
                          type="checkbox"
                          checked={hoursData[day]?.closed || false}
                          onChange={e => setHoursData(prev => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                        />
                        Closed
                      </label>
                      {!hoursData[day]?.closed && (
                        <>
                          <input
                            className="bdp-time-input"
                            type="time"
                            value={hoursData[day]?.open || ''}
                            onChange={e => setHoursData(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                          />
                          <span>–</span>
                          <input
                            className="bdp-time-input"
                            type="time"
                            value={hoursData[day]?.close || ''}
                            onChange={e => setHoursData(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                          />
                        </>
                      )}
                    </div>
                  ))}
                  <div className="bdp-inline-actions">
                    <button className="bdp-cancel-btn" onClick={() => setEditingHours(false)} disabled={savingProfile}>
                      <X size={13} /> Cancel
                    </button>
                    <button className="bdp-save-btn" onClick={handleSaveHours} disabled={savingProfile}>
                      {savingProfile ? <span className="bdp-spinner" /> : <Check size={13} />}
                      {savingProfile ? 'Saving…' : 'Save Hours'}
                    </button>
                  </div>
                </div>
              ) : business.profile?.workingHours ? (
                <table className="bcc-business-detail-hours-table">
                  <tbody>
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                      <tr key={day}>
                        <td>{day.charAt(0).toUpperCase() + day.slice(1)}</td>
                        <td>{formatWorkingHours(business.profile.workingHours[day])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="bcc-business-detail-no-hours">
                  {isOwner ? 'Click "Edit Hours" to add your operating hours.' : 'Working hours not provided'}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Keep ALL the remaining tab content exactly as it is - listings, inventory, reviews, contact tabs */}
        {activeTab === 'listings' && (isDealer || isRentalService) && (
          // ... keep the entire listings tab content as-is
          <div className="bcc-business-detail-listings-tab">
            <div className="bdp-listings-header">
              <h2>{isDealer ? 'Vehicles for Sale' : getRentalsTitle()}</h2>
              {isOwner && isDealer && (
                <button
                  className="bdp-add-listing-btn"
                  onClick={() => setShowListingModal(true)}
                >
                  <Plus size={15} /> Add Listing
                </button>
              )}
            </div>
            
            <div className="bcc-listings-layout">
            {/* Sidebar Filter */}
            {listings.length > 0 && (
              <div className="bcc-listings-sidebar">
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
                  
                  {isDealer && (
                    <div className="bcc-filter-group">
                      <label>Condition</label>
                      <select className="bcc-filter-select" value={filters.condition} onChange={(e) => handleFilterChange('condition', e.target.value)}>
                        <option value="">Any</option>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="Certified">Certified</option>
                      </select>
                    </div>
                  )}

                  {isDealer && (
                    <div className="bcc-filter-group">
                      <label>Fuel Type</label>
                      <select className="bcc-filter-select" value={filters.fuelType} onChange={(e) => handleFilterChange('fuelType', e.target.value)}>
                        <option value="">Any</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  )}

                  {isDealer && (
                    <div className="bcc-filter-group">
                      <label>Transmission</label>
                      <select className="bcc-filter-select" value={filters.transmission} onChange={(e) => handleFilterChange('transmission', e.target.value)}>
                        <option value="">Any</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                  )}

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
              </div>
            )}

            <div className="bcc-listings-main">
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
            </div>
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

    {showUpdateForm && business && (
      <PostUpdateModal
        business={business}
        newUpdate={newUpdate}
        setNewUpdate={setNewUpdate}
        submittingUpdate={submittingUpdate}
        handleCreateUpdate={handleCreateUpdate}
        onClose={() => {
          setShowUpdateForm(false);
          setNewUpdate({ title: '', content: '', type: 'update' });
        }}
      />
    )}

    {showListingModal && business && (
      <OwnerListingModal
        dealer={business}
        onClose={() => setShowListingModal(false)}
        onCreated={(newListing) => {
          setListings(prev => [newListing, ...prev]);
          setFilteredListings(prev => [newListing, ...prev]);
          setListingsCount(prev => prev + 1);
          setActiveTab('listings');
        }}
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
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get reviewer name safely
  const getReviewerName = () => {
    if (review.isAnonymous) return 'Anonymous';
    if (review.fromUserId?.name) return review.fromUserId.name;
    if (review.reviewer?.name) return review.reviewer.name;
    return 'Anonymous';
  };

  // Get reviewer avatar safely
  const getReviewerAvatar = () => {
    if (review.isAnonymous) return null;
    return review.fromUserId?.avatar?.url || review.reviewer?.avatar?.url || null;
  };

  // Format service experience labels for compact display
  const formatExperienceLabel = (key, value) => {
    const labelMap = {
      serviceQuality: 'Quality',
      timeliness: 'Timeliness', 
      communication: 'Communication',
      valueForMoney: 'Value',
      wouldRecommend: 'Recommend'
    };

    const valueMap = {
      excellent: 'Excellent',
      very_good: 'Very Good',
      good: 'Good',
      average: 'Average',
      poor: 'Poor',
      very_prompt: 'Very Fast',
      prompt: 'Fast',
      on_time: 'On Time',
      slightly_delayed: 'Delayed',
      very_delayed: 'Very Late',
      true: 'Yes',
      false: 'No'
    };

    const label = labelMap[key] || key;
    const displayValue = valueMap[value] || value;
    
    return `${label}: ${displayValue}`;
  };

  return (
    <div className="bcc-review-card">
      <div className="bcc-review-header">
        <div className="bcc-reviewer-info">
          <div className="bcc-reviewer-avatar">
            {getReviewerAvatar() ? (
              <img 
                src={getReviewerAvatar()} 
                alt={getReviewerName()}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="bcc-reviewer-avatar-placeholder"
              style={{ display: getReviewerAvatar() ? 'none' : 'flex' }}
            >
              {getReviewerName().charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="bcc-reviewer-details">
            <div className="bcc-reviewer-name">
              {getReviewerName()}
            </div>
            <div className="bcc-review-date">
              {formatDate(review.date)}
            </div>
          </div>
        </div>
        
        <div className="bcc-review-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <span 
              key={star}
              className={`bcc-star ${star <= review.rating ? 'filled' : ''}`}
            >
              ⭐
            </span>
          ))}
          <span className="bcc-rating-number">({review.rating})</span>
        </div>
      </div>

      <div className="bcc-review-content">
        {/* REMOVED: Verification Badge Section */}
        {/* 
        {review.verificationMethod === 'qr_code' && (
          <div className="bcc-review-verification">
            <div className="bcc-verification-badge">
              ✅ Verified Customer
            </div>
          </div>
        )}
        */}

        <p className="bcc-review-text">
          {showFullReview ? review.review : truncateText(review.review)}
          {review.review && review.review.length > 150 && (
            <button 
              className="bcc-read-more-button"
              onClick={() => setShowFullReview(!showFullReview)}
            >
              {showFullReview ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>

        {/* OPTIMIZED: Compact Service Experience */}
        {review.serviceExperience && Object.keys(review.serviceExperience).length > 0 && (
          <div className="bcc-service-experience">
            <h4>Service Experience:</h4>
            <div className="bcc-experience-details">
              {Object.entries(review.serviceExperience).map(([key, value]) => {
                // Skip empty values and wouldRecommend if false (to save space)
                if (!value || (key === 'wouldRecommend' && !value)) return null;
                
                return (
                  <div key={key} className="bcc-experience-item">
                    {formatExperienceLabel(key, value)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Business Response (if exists) */}
        {review.response && review.response.text && (
          <div className="bcc-business-response">
            <div className="bcc-response-header">
              <strong>Response from {business?.businessName || 'Business'}:</strong>
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

// ─── Subscription tier data ──────────────────────────────────────────────────
const SUB_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'P0',
    sub: 'Free forever',
    accent: '#6b7280',
    features: [
      'Listed on BW Car Culture',
      'Public dealer profile page',
      'Text-only business updates',
      'Customer reviews & ratings',
      'Standard search visibility',
    ],
    locked: [
      'Listing performance stats',
      'Profile image / banner editing',
      'Image uploads in updates',
      'Video & 3D media',
      'AI integration',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'P300',
    sub: '/month',
    accent: '#3b82f6',
    popular: true,
    features: [
      'Everything in Basic',
      'Listing performance stats',
      'Profile & banner image editing',
      'Image uploads in updates',
      'Contact & view analytics',
      'Up to 20 active listings',
    ],
    locked: [
      'Video uploads',
      '3D visual support',
      'AI integration',
      'Platform content features',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'P1,000',
    sub: '/month',
    accent: '#ff3300',
    features: [
      'Everything in Standard',
      'Priority placement in search',
      'Full AI integration',
      'Video media uploads',
      '3D visuals support',
      'Unlimited image uploads',
      'Featured in platform video content',
      'Up to 40 active listings',
    ],
    locked: [],
  },
];

const SUB_ADDONS = [
  {
    name: 'Premium Listing Photography',
    price: 'P1,500',
    detail: '1–5 listings',
    media: true,
  },
  {
    name: 'Car Reviews — Automotive Video',
    price: 'P2,500',
    detail: '1–3 selected vehicle reviews',
    media: true,
  },
  {
    name: 'Dedicated Dealership Video',
    price: 'P2,000',
    detail: '1 video · 3–10 min',
    media: true,
  },
  {
    name: 'Social Media Coverage — 1 post',
    price: 'P400',
    detail: 'Single dedicated post',
    media: true,
  },
  {
    name: 'Social Media Coverage — 2 posts',
    price: 'P700',
    detail: 'Two dedicated posts',
    media: true,
  },
  {
    name: 'Verified Dealership Badge',
    price: 'P950',
    detail: 'Includes on-site dealership visit · once-off',
    media: false,
    oneOff: true,
  },
];

// ─── Post Update Modal ────────────────────────────────────────────────────────
const PostUpdateModal = ({ business, newUpdate, setNewUpdate, submittingUpdate, handleCreateUpdate, onClose }) => {
  const tier = business?.subscription?.tier || 'basic';
  const tierInfo = SUB_TIERS.find(t => t.id === tier) || SUB_TIERS[0];
  const canUpload = tier === 'standard' || tier === 'premium';

  const UPGRADE_EMAIL = 'subscribe@bwcarculture.com';

  const handleUpgradeClick = (targetTier) => {
    const subject = encodeURIComponent(`Subscription Upgrade Request — ${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)} Plan`);
    const body = encodeURIComponent(
      `Hi BW Car Culture,\n\nI'd like to upgrade my dealership "${business.businessName}" to the ${targetTier} plan.\n\nDealer ID: ${business._id}\n\nPlease get in touch to process the upgrade.\n\nThank you.`
    );
    window.open(`mailto:${UPGRADE_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="bdp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bdp-sub-modal">

        {/* Header */}
        <div className="bdp-sub-modal-header">
          <div className="bdp-sub-modal-title-row">
            <h3>Post an Update</h3>
            <span className={`bdp-sub-current-badge bdp-sub-badge-${tier}`}>{tierInfo.name} Plan</span>
          </div>
          <button className="bdp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="bdp-sub-modal-body">

          {/* Tier notice */}
          <div className={`bdp-sub-notice bdp-sub-notice-${tier}`}>
            <span className="bdp-sub-notice-icon">{tier === 'basic' ? '📋' : tier === 'standard' ? '📊' : '⭐'}</span>
            <div className="bdp-sub-notice-text">
              {tier === 'basic' && (
                <>
                  <strong>Basic tier</strong> — text-only updates available. Upgrade to <strong>Standard</strong> or <strong>Premium</strong> to attach images, videos, and more.
                </>
              )}
              {tier === 'standard' && (
                <>
                  <strong>Standard tier</strong> — you can post updates with images. Upgrade to <strong>Premium</strong> for video uploads, 3D visuals, AI integration, and featured content placement.
                </>
              )}
              {tier === 'premium' && (
                <>
                  <strong>Premium tier</strong> — full media and AI features unlocked. Post text, images, videos and 3D visuals.
                </>
              )}
            </div>
          </div>

          {/* Post form */}
          <div className="bdp-update-form bdp-update-form-modal">
            <div className="bdp-update-form-row">
              <select
                value={newUpdate.type}
                onChange={e => setNewUpdate(p => ({ ...p, type: e.target.value }))}
                className="bdp-update-type-select"
              >
                <option value="update">Update</option>
                <option value="deal">Deal</option>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
              </select>
              <input
                className="bdp-update-title-input"
                placeholder="Title (max 120 chars)"
                maxLength={120}
                value={newUpdate.title}
                onChange={e => setNewUpdate(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <textarea
              className="bdp-update-content-input"
              placeholder="Share your update, deal or announcement…"
              maxLength={1000}
              rows={3}
              value={newUpdate.content}
              onChange={e => setNewUpdate(p => ({ ...p, content: e.target.value }))}
            />
            {!canUpload && (
              <p className="bdp-update-media-locked">
                🔒 Image &amp; video uploads require Standard or Premium — <button className="bdp-inline-upgrade-link" onClick={() => handleUpgradeClick('standard')}>upgrade now</button>
              </p>
            )}
            <div className="bdp-update-form-actions">
              <button className="bdp-cancel-btn" onClick={onClose} disabled={submittingUpdate}>Cancel</button>
              <button
                className="bdp-save-btn"
                onClick={handleCreateUpdate}
                disabled={submittingUpdate || !newUpdate.title.trim() || !newUpdate.content.trim()}
              >
                {submittingUpdate ? 'Posting…' : <><Check size={13} /> Post Update</>}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="bdp-sub-divider">
            <span>Subscription Plans</span>
          </div>

          {/* Tiers grid */}
          <div className="bdp-sub-tiers-grid">
            {SUB_TIERS.map(t => {
              const isCurrent = t.id === tier;
              const isUpgrade = (
                (tier === 'basic' && (t.id === 'standard' || t.id === 'premium')) ||
                (tier === 'standard' && t.id === 'premium')
              );
              return (
                <div
                  key={t.id}
                  className={`bdp-sub-tier-card ${isCurrent ? 'bdp-sub-tier-current' : ''} ${t.popular ? 'bdp-sub-tier-popular' : ''}`}
                  style={{ '--tier-accent': t.accent }}
                >
                  {t.popular && <div className="bdp-sub-popular-badge">Most Popular</div>}
                  {isCurrent && <div className="bdp-sub-current-ribbon">Your Plan</div>}
                  <div className="bdp-sub-tier-header">
                    <span className="bdp-sub-tier-name">{t.name}</span>
                    <span className="bdp-sub-tier-price">{t.price}<small>{t.sub}</small></span>
                  </div>
                  <ul className="bdp-sub-tier-features">
                    {t.features.map(f => <li key={f} className="bdp-sub-feature-yes">✓ {f}</li>)}
                    {t.locked.map(f => <li key={f} className="bdp-sub-feature-no">✗ {f}</li>)}
                  </ul>
                  {isUpgrade && (
                    <button
                      className="bdp-sub-upgrade-btn"
                      style={{ background: t.accent }}
                      onClick={() => handleUpgradeClick(t.id)}
                    >
                      Upgrade to {t.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add-ons */}
          <div className="bdp-sub-divider">
            <span>Media Coverage Add-ons</span>
          </div>
          <p className="bdp-sub-addons-intro">Available for subscribed dealers (Standard &amp; Premium). Contact us to book.</p>
          <table className="bdp-addons-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Price</th>
                <th>Includes</th>
              </tr>
            </thead>
            <tbody>
              {SUB_ADDONS.map(a => (
                <tr key={a.name} className={a.oneOff ? 'bdp-addon-row-onceoff' : ''}>
                  <td>
                    {a.name}
                    {a.oneOff && <span className="bdp-addon-oneoff-tag">once-off</span>}
                  </td>
                  <td className="bdp-addon-price">{a.price}</td>
                  <td className="bdp-addon-detail">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bdp-addons-distance-note">
            📍 <strong>Distance surcharge:</strong> Dealers operating more than 40 km outside Gaborone will incur an additional charge of <strong>P3.50 per km</strong> on all add-ons that involve an on-site visit — this includes photography, video production, and the Verified Dealership Badge inspection.
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Owner Listing Modal ─────────────────────────────────────────────────────
const OwnerListingModal = ({ dealer, onClose, onCreated }) => {
  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const [form, setForm] = useState({
    title: '', make: '', model: '', year: new Date().getFullYear(),
    price: '', condition: 'used', category: 'Sedan',
    fuelType: 'petrol', transmission: 'automatic',
    city: dealer?.location?.city || '', country: dealer?.location?.country || 'Botswana',
    description: '', status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.make || !form.model || !form.price) {
      setError('Title, Make, Model and Price are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        status: form.status,
        price: Number(form.price),
        specifications: {
          make: form.make, model: form.model,
          year: String(form.year), transmission: form.transmission,
          fuelType: form.fuelType
        },
        location: { city: form.city, country: form.country },
        dealerId: dealer._id,
        dealer: {
          businessName: dealer.businessName,
          contact: dealer.contact || {},
          location: dealer.location || {}
        }
      };
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && (data.success !== false)) {
        onCreated(data.data || data.listing);
        onClose();
      } else {
        setError(data.message || 'Failed to create listing.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bdp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bdp-modal">
        <div className="bdp-modal-header">
          <h3><Plus size={16} /> New Listing</h3>
          <button className="bdp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="bdp-modal-body">
          {error && <div className="bdp-modal-error">{error}</div>}
          <div className="bdp-form-grid">
            <div className="bdp-field bdp-field-full">
              <label>Listing Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 2020 Toyota Corolla" />
            </div>
            <div className="bdp-field">
              <label>Make *</label>
              <input value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" />
            </div>
            <div className="bdp-field">
              <label>Model *</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Corolla" />
            </div>
            <div className="bdp-field">
              <label>Year</label>
              <input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1960" max={new Date().getFullYear() + 1} />
            </div>
            <div className="bdp-field">
              <label>Price (BWP) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="bdp-field">
              <label>Condition</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="certified">Certified Pre-Owned</option>
              </select>
            </div>
            <div className="bdp-field">
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {['Sedan','SUV','Sports Car','Hatchback','Pickup / Bakkie','Family Car','Luxury','Electric','Hybrid','4x4 / Off-road','Van','Minibus'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="bdp-field">
              <label>Fuel Type</label>
              <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)}>
                {[['petrol','Petrol'],['diesel','Diesel'],['electric','Electric'],['hybrid','Hybrid'],['plugin_hybrid','Plug-in Hybrid']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="bdp-field">
              <label>Transmission</label>
              <select value={form.transmission} onChange={e => set('transmission', e.target.value)}>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div className="bdp-field">
              <label>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Gaborone" />
            </div>
            <div className="bdp-field bdp-field-full">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details about the vehicle…" />
            </div>
          </div>
        </div>
        <div className="bdp-modal-footer">
          <button className="bdp-cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="bdp-save-btn" onClick={handleSubmit} disabled={submitting || !form.title || !form.make || !form.model || !form.price}>
            {submitting ? 'Creating…' : <><UploadCloud size={14} /> Create Listing</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailPage;