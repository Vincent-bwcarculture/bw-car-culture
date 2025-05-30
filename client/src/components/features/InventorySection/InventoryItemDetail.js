// src/components/features/InventorySection/InventoryItemDetail.js (Part 1)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Share2, Heart, Phone, MessageCircle, Eye, ShoppingCart } from 'lucide-react';
import './InventoryItemDetail.css';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import ShareModal from '../../shared/ShareModal.js';
import { useAuth } from '../../../context/AuthContext.js';
import ErrorBoundary from '../../shared/ErrorBoundary/ErrorBoundary.js';

const InventoryItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [businessItems, setBusinessItems] = useState([]);
  const [views, setViews] = useState(0);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [retryAttempts, setRetryAttempts] = useState({});
  
  // Carousel states
  const [businessActiveIndex, setBusinessActiveIndex] = useState(0);
  const [relatedActiveIndex, setRelatedActiveIndex] = useState(0);
  
  // Refs
  const shareButtonRef = useRef(null);
  const viewRecorded = useRef(false);
  const businessCarouselRef = useRef(null);
  const relatedCarouselRef = useRef(null);
  const imageObserver = useRef(null);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  // Memoized item validation
  const isValidItem = useMemo(() => {
    return item && (item._id || item.id) && item.title;
  }, [item]);

  // Memoized business information
  const businessInfo = useMemo(() => {
    if (!item?.business && !item?.businessId) return null;

    const business = item.business || {};
    return {
      id: business._id || business.id || item.businessId,
      name: business.businessName || business.name || 'Business',
      location: {
        city: business.location?.city || 'Unknown Location',
        state: business.location?.state,
        country: business.location?.country
      },
      logo: business.logo || business.profile?.logo || '/images/placeholders/dealer-avatar.jpg',
      contact: {
        phone: business.contact?.phone,
        email: business.contact?.email,
        website: business.contact?.website
      },
      verification: {
        isVerified: business.verification?.isVerified || business.verification?.status === 'verified'
      },
      metrics: {
        totalListings: business.metrics?.totalListings || 0,
        rating: business.rating?.average || 0,
        activeSales: business.metrics?.activeSales || 0
      }
    };
  }, [item]);

  // Memoized image URLs with S3 support
  const imageUrls = useMemo(() => {
    if (!item?.images?.length) {
      return ['/images/placeholders/part.jpg'];
    }

    return item.images.map((img, index) => {
      try {
        if (typeof img === 'string') {
          // Handle S3 URLs and relative paths
          if (img.startsWith('https://') && img.includes('amazonaws.com')) {
            return img;
          }
          if (img.startsWith('/')) {
            return img;
          }
          return `/uploads/inventory/${img}`;
        }
        
        if (img && typeof img === 'object') {
          // Priority: url -> thumbnail -> key-based URL
          if (img.url) {
            return img.url;
          }
          if (img.thumbnail) {
            return img.thumbnail;
          }
          if (img.key) {
            return `${process.env.REACT_APP_S3_BASE_URL || ''}/${img.key}`;
          }
        }
        
        return '/images/placeholders/part.jpg';
      } catch (error) {
        console.warn(`Error processing image ${index}:`, error);
        return '/images/placeholders/part.jpg';
      }
    });
  }, [item]);

  // Memoized pricing information
  const pricingInfo = useMemo(() => {
    if (!item) return null;

    const price = item.price || 0;
    const originalPrice = item.originalPrice;
    const hasDiscount = originalPrice && originalPrice > price;
    const discountPercent = hasDiscount ? 
      Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    return {
      price: `P${price.toLocaleString()}`,
      originalPrice: originalPrice ? `P${originalPrice.toLocaleString()}` : null,
      hasDiscount,
      discountPercent: discountPercent > 0 ? `${discountPercent}% OFF` : null,
      currency: item.currency || 'BWP'
    };
  }, [item]);

  // Memoized stock information
  const stockInfo = useMemo(() => {
    if (!item?.stock) return null;

    const quantity = item.stock.quantity || 0;
    let status = 'in-stock';
    let label = 'In Stock';
    let color = '#2ed573';

    if (quantity <= 0) {
      status = 'out-of-stock';
      label = 'Out of Stock';
      color = '#dc3545';
    } else if (quantity <= 5) {
      status = 'low-stock';
      label = `Low Stock (${quantity} left)`;
      color = '#ff9f43';
    } else if (quantity < 20) {
      label = `${quantity} in stock`;
    }

    return {
      quantity,
      status,
      label,
      color,
      sku: item.stock.sku,
      location: item.stock.location
    };
  }, [item]);

  // Load item details
  useEffect(() => {
    const loadItemDetails = async () => {
      if (!itemId) {
        setError('Invalid item ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Item not found' : 'Failed to load item');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data) {
          throw new Error('Invalid response data');
        }
        
        const itemData = data.data;
        setItem(itemData);
        
        // Check if item is saved
        const savedItems = JSON.parse(localStorage.getItem('savedInventoryItems') || '[]');
        setIsSaved(savedItems.includes(itemData._id || itemData.id));
        
        // Set initial views
        setViews(itemData.metrics?.views || 0);
        
        // Load related content
        await loadRelatedContent(itemData);
        
        // Record view
        if (!viewRecorded.current) {
          recordView(itemData._id || itemData.id);
          viewRecorded.current = true;
        }
        
      } catch (error) {
        console.error('Error loading inventory item:', error);
        setError(error.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };
    
    loadItemDetails();
    
    // Reset state when itemId changes
    return () => {
      viewRecorded.current = false;
      setSelectedImage(0);
      setImageLoadErrors({});
      setRetryAttempts({});
    };
  }, [itemId, API_BASE_URL]);

  // Initialize carousel when items change
  useEffect(() => {
    if (businessItems.length > 0) {
      initializeCarousel('business');
    }
  }, [businessItems, businessActiveIndex]);
  
  useEffect(() => {
    if (relatedItems.length > 0) {
      initializeCarousel('related');
    }
  }, [relatedItems, relatedActiveIndex]);
  
  // Handle window resize for carousels
  useEffect(() => {
    const handleResize = () => {
      if (businessItems.length > 0) initializeCarousel('business');
      if (relatedItems.length > 0) initializeCarousel('related');
    };
    
    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [businessItems, relatedItems]);

  // Lazy loading for images
  useEffect(() => {
    if (!imageUrls.length) return;

    imageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.current.unobserve(img);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect();
      }
    };
  }, [imageUrls]);

  // Record view count
  const recordView = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setViews(prev => prev + 1);
      }
    } catch (error) {
      console.warn('Error recording view:', error);
    }
  }, [API_BASE_URL]);

  // Load related content
  const loadRelatedContent = useCallback(async (itemData) => {
    try {
      const currentItem = itemData || item;
      if (!currentItem) return;
      
      await Promise.all([
        loadBusinessItems(currentItem),
        loadSimilarItems(currentItem)
      ]);
    } catch (error) {
      console.warn('Error loading related content:', error);
    }
  }, [item]);

  // Load items from the same business
  const loadBusinessItems = useCallback(async (currentItem) => {
    if (!currentItem.businessId) {
      setBusinessItems([]);
      return;
    }
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/inventory?businessId=${currentItem.businessId}&limit=4&exclude=${currentItem._id || currentItem.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const filteredItems = data.data.filter(item => 
            (item._id || item.id) !== (currentItem._id || currentItem.id)
          );
          setBusinessItems(filteredItems.slice(0, 3));
        }
      }
    } catch (error) {
      console.warn('Error loading business items:', error);
      setBusinessItems([]);
    }
  }, [API_BASE_URL]);

  // Load similar items
  const loadSimilarItems = useCallback(async (currentItem) => {
    try {
      const params = new URLSearchParams({
        limit: '4',
        exclude: currentItem._id || currentItem.id
      });
      
      if (currentItem.category) {
        params.append('category', currentItem.category);
      }
      
      if (currentItem.price) {
        const price = parseFloat(currentItem.price);
        if (!isNaN(price)) {
          params.append('minPrice', Math.floor(price * 0.7).toString());
          params.append('maxPrice', Math.ceil(price * 1.3).toString());
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/inventory?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const filteredItems = data.data.filter(item => 
            (item._id || item.id) !== (currentItem._id || currentItem.id)
          );
          setRelatedItems(filteredItems.slice(0, 3));
        }
      }
    } catch (error) {
      console.warn('Error loading similar items:', error);
      setRelatedItems([]);
    }
  }, [API_BASE_URL]);

  // Initialize carousel
  const initializeCarousel = useCallback((carouselType) => {
    const isBusiness = carouselType === 'business';
    const items = isBusiness ? businessItems : relatedItems;
    const carouselRef = isBusiness ? businessCarouselRef : relatedCarouselRef;
    const currentIndex = isBusiness ? businessActiveIndex : relatedActiveIndex;
    
    if (!items || items.length <= 1 || !carouselRef.current) return;
    
    // Calculate items per view based on viewport width
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    const track = carouselRef.current.querySelector('.carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
    }
  }, [businessItems, relatedItems, businessActiveIndex, relatedActiveIndex]);

  // Navigate carousel
  const navigateCarousel = useCallback((carouselType, direction) => {
    const isBusiness = carouselType === 'business';
    const items = isBusiness ? businessItems : relatedItems;
    const setIndex = isBusiness ? setBusinessActiveIndex : setRelatedActiveIndex;
    const currentIndex = isBusiness ? businessActiveIndex : relatedActiveIndex;
    const carouselRef = isBusiness ? businessCarouselRef : relatedCarouselRef;
    
    if (!items || items.length <= 1) return;
    
    // Calculate items per view
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    const maxIndex = Math.max(0, items.length - itemsPerView);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = Math.min(currentIndex + 1, maxIndex);
    } else {
      nextIndex = Math.max(0, currentIndex - 1);
    }
    
    if (nextIndex !== currentIndex) {
      setIndex(nextIndex);
      
      if (carouselRef.current) {
        const track = carouselRef.current.querySelector('.carousel-track');
        if (track) {
          const slideWidthPercent = 100 / itemsPerView;
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  }, [businessItems, relatedItems, businessActiveIndex, relatedActiveIndex]);

  // Handle image navigation
  const handleNavigation = useCallback((direction) => {
    if (!imageUrls.length) return;
    
    setSelectedImage(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : imageUrls.length - 1;
      } else {
        return prev < imageUrls.length - 1 ? prev + 1 : 0;
      }
    });
  }, [imageUrls]);

  // Handle save/favorite item
  const handleSaveItem = useCallback(() => {
    if (!item) return;
    
    const itemId = item._id || item.id;
    const savedItems = JSON.parse(localStorage.getItem('savedInventoryItems') || '[]');
    
    if (isSaved) {
      const newSaved = savedItems.filter(id => id !== itemId);
      localStorage.setItem('savedInventoryItems', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      const newSaved = [...savedItems, itemId];
      localStorage.setItem('savedInventoryItems', JSON.stringify(newSaved));
      setIsSaved(true);
    }
  }, [item, isSaved]);

  // Handle contact actions
  const handleContactClick = useCallback((method) => {
    if (!businessInfo?.contact) return;
    
    if (method === 'whatsapp') {
      const phone = businessInfo.contact.phone?.replace(/\D/g, '');
      if (!phone) {
        alert('No WhatsApp number available');
        return;
      }
      
      const message = `Hi ${businessInfo.name}, I'm interested in the ${item.title} (${stockInfo?.sku || 'Item'}) listed for ${pricingInfo?.price} on I3W Car Culture.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else if (method === 'phone') {
      if (businessInfo.contact.phone) {
        window.location.href = `tel:${businessInfo.contact.phone}`;
      } else {
        alert('No phone number available');
      }
    }
  }, [businessInfo, item, stockInfo, pricingInfo]);

  // Handle image error with retry logic
  const handleImageError = useCallback((e, imageIndex) => {
    const currentAttempts = retryAttempts[imageIndex] || 0;
    const originalSrc = e.target.src;
    
    console.warn(`Image failed to load: ${originalSrc} (attempt ${currentAttempts + 1})`);
    
    // Update retry count
    setRetryAttempts(prev => ({
      ...prev,
      [imageIndex]: currentAttempts + 1
    }));
    
    // Mark as error
    setImageLoadErrors(prev => ({
      ...prev,
      [imageIndex]: true
    }));
    
    // Try different URL patterns based on attempt
    if (currentAttempts === 0 && originalSrc.includes('amazonaws.com')) {
      // Try S3 proxy
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        e.target.src = `/api/images/s3-proxy/${key}`;
        return;
      }
    } else if (currentAttempts === 1 && !originalSrc.includes('/uploads/inventory/')) {
      // Try direct upload path
      const filename = originalSrc.split('/').pop();
      e.target.src = `/uploads/inventory/${filename}`;
      return;
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/part.jpg';
  }, [retryAttempts]);

  // Utility function for debouncing
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Handle item click navigation
  const handleItemClick = useCallback((id) => {
    navigate(`/inventory/${id}`);
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="inventory-detail-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  // Error state
  if (error || !isValidItem) {
    return (
      <div className="inventory-detail-error">
        <h2>{error || 'Item not found'}</h2>
        <p>The item you're looking for could not be found or loaded.</p>
        <button 
          className="back-to-inventory-btn"
          onClick={() => navigate('/inventory')}
        >
          ← Back to Inventory
        </button>
      </div>
    );
  }

  // Continue with the render... (Part 2 will contain the JSX return)
  // src/components/features/InventorySection/InventoryItemDetail.js (Part 2 - JSX Return)
// This continues from Part 1 - replace the "return null;" with this JSX:

  return (
    <ErrorBoundary>
      <div className="inventory-detail-container">
        {/* Back button */}
        <button 
          className="back-button" 
          onClick={() => navigate('/inventory')}
          aria-label="Back to inventory"
        >
          <ChevronLeft size={20} />
          Back to Inventory
        </button>

        <div className="inventory-content">
          {/* Main content */}
          <div className="main-content">
            {/* Gallery section */}
            <div className="item-gallery">
              <div className="main-image-container">
                <div className="main-image">
                  <img 
                    src={imageUrls[selectedImage]} 
                    alt={item.title}
                    className="gallery-image"
                    loading="eager"
                    onError={(e) => handleImageError(e, selectedImage)}
                  />
                  
                  {/* Gallery actions */}
                  <div className="gallery-actions">
                    <button 
                      className={`action-button save-button ${isSaved ? 'saved' : ''}`}
                      onClick={handleSaveItem}
                      aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                    >
                      <Heart size={18} fill={isSaved ? '#ff3300' : 'none'} />
                    </button>
                    <button 
                      ref={shareButtonRef}
                      className="action-button share-button"
                      onClick={() => setShowShareModal(true)}
                      aria-label="Share item"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                  
                  {/* Image navigation */}
                  {imageUrls.length > 1 && (
                    <>
                      <button 
                        className="gallery-nav prev" 
                        onClick={() => handleNavigation('prev')}
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        className="gallery-nav next" 
                        onClick={() => handleNavigation('next')}
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Image counter */}
                  {imageUrls.length > 1 && (
                    <div className="image-counter">
                      {selectedImage + 1} / {imageUrls.length}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Thumbnails */}
              {imageUrls.length > 1 && (
                <div className="thumbnail-strip">
                  {imageUrls.map((image, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${item.title} view ${index + 1}`} 
                        loading="lazy"
                        onError={(e) => handleImageError(e, index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Item information */}
            <div className="item-info">
              {/* Header */}
              <div className="item-header">
                <div className="title-container">
                  <h1 className="title">{item.title}</h1>
                  <div className="badges-container">
                    {item.category && (
                      <span className="category-badge">
                        {item.category}
                      </span>
                    )}
                    <span className={`condition-badge ${(item.condition || 'new').toLowerCase()}`}>
                      {item.condition || 'New'}
                    </span>
                    {stockInfo && (
                      <span 
                        className={`stock-badge ${stockInfo.status}`}
                        style={{ color: stockInfo.color }}
                      >
                        {stockInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Price container */}
                <div className="price-container">
                  <div className="item-price">
                    {pricingInfo?.price}
                  </div>
                  {pricingInfo?.originalPrice && pricingInfo.hasDiscount && (
                    <div className="original-price">
                      {pricingInfo.originalPrice}
                    </div>
                  )}
                  {pricingInfo?.discountPercent && (
                    <div className="discount-badge">
                      {pricingInfo.discountPercent}
                    </div>
                  )}
                  {stockInfo?.sku && (
                    <div className="sku-info">
                      SKU: {stockInfo.sku}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="quick-actions-bar">
                <div className="views-info">
                  <Eye size={16} />
                  <span>{views.toLocaleString()} views</span>
                </div>
                
                {businessInfo?.contact?.phone && (
                  <div className="contact-actions">
                    <button 
                      className="quick-contact-btn phone-btn"
                      onClick={() => handleContactClick('phone')}
                    >
                      <Phone size={16} />
                      Call
                    </button>
                    <button 
                      className="quick-contact-btn whatsapp-btn"
                      onClick={() => handleContactClick('whatsapp')}
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Specifications grid */}
              {item.specifications && Object.keys(item.specifications).length > 0 && (
                <div className="specs-section">
                  <h2>Specifications</h2>
                  <div className="specs-grid">
                    {Object.entries(item.specifications).map(([key, value], index) => (
                      <div className="spec-item" key={index}>
                        <span className="spec-label">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span className="spec-value">
                          {value !== null && value !== undefined ? value.toString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div className="description-section">
                  <h2>Description</h2>
                  <div className="description-content">
                    {item.description}
                  </div>
                </div>
              )}

              {/* Features */}
              {item.features && item.features.length > 0 && (
                <div className="features-section">
                  <h2>Features</h2>
                  <div className="features-grid">
                    {item.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">✓</span>
                        <span className="feature-text">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible vehicles */}
              {item.compatibleVehicles && item.compatibleVehicles.length > 0 && (
                <div className="compatible-vehicles-section">
                  <h2>Compatible Vehicles</h2>
                  <div className="compatible-vehicles-grid">
                    {item.compatibleVehicles.map((vehicle, index) => (
                      <div key={index} className="compatible-vehicle-item">
                        <div className="vehicle-make">
                          {vehicle.make}
                        </div>
                        <div className="vehicle-model">
                          {vehicle.model}
                        </div>
                        {vehicle.years && (
                          <div className="vehicle-years">
                            Years: {vehicle.years}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping information */}
              {item.shipping && item.shipping.available && (
                <div className="shipping-section">
                  <h2>Shipping Information</h2>
                  <div className="shipping-info">
                    <div className="shipping-item">
                      <span className="shipping-label">Shipping Cost:</span>
                      <span className="shipping-value">
                        {item.shipping.cost > 0 
                          ? `P${item.shipping.cost.toLocaleString()}`
                          : 'Free'
                        }
                      </span>
                    </div>
                    {item.shipping.freeOver && (
                      <div className="shipping-item">
                        <span className="shipping-label">Free shipping over:</span>
                        <span className="shipping-value">
                          P{item.shipping.freeOver.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {item.shipping.estimatedDays && (
                      <div className="shipping-item">
                        <span className="shipping-label">Estimated delivery:</span>
                        <span className="shipping-value">
                          {item.shipping.estimatedDays}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business sidebar */}
          {businessInfo && (
            <div className="business-sidebar">
              <div className="business-section">
                <div className="business-header">
                  <h2>Seller Information</h2>
                </div>
                <div className="business-card">
                  {/* Business header */}
                  <div className="business-header-compact">
                    <img 
                      src={businessInfo.logo} 
                      alt={businessInfo.name}
                      className="business-avatar"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholders/dealer-avatar.jpg';
                      }}
                    />
                    <div className="business-details">
                      <h3 className="business-name">
                        {businessInfo.name}
                        {businessInfo.verification.isVerified && (
                          <span className="verified-badge" title="Verified Business">✓</span>
                        )}
                      </h3>
                      <p className="business-location">
                        {businessInfo.location.city}
                        {businessInfo.location.state && `, ${businessInfo.location.state}`}
                        {businessInfo.location.country && `, ${businessInfo.location.country}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Business stats */}
                  <div className="business-stats">
                    <div className="stat-item">
                      <div className="stat-value">{businessInfo.metrics.totalListings}</div>
                      <div className="stat-label">Listings</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {businessInfo.metrics.rating > 0 
                          ? businessInfo.metrics.rating.toFixed(1) 
                          : 'N/A'
                        }
                      </div>
                      <div className="stat-label">Rating</div>
                    </div>
                    {businessInfo.metrics.activeSales > 0 && (
                      <div className="stat-item">
                        <div className="stat-value">{businessInfo.metrics.activeSales}</div>
                        <div className="stat-label">Active</div>
                      </div>
                    )}
                    <div className="stat-item">
                      <div className="stat-value">{views}</div>
                      <div className="stat-label">Views</div>
                    </div>
                  </div>
                  
                  {/* Contact info */}
                  <div className="business-contact-grid">
                    {businessInfo.contact.email && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">✉️</span>
                        <span className="contact-info">{businessInfo.contact.email}</span>
                      </div>
                    )}
                    {businessInfo.contact.phone && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">📞</span>
                        <span className="contact-info">{businessInfo.contact.phone}</span>
                      </div>
                    )}
                    {businessInfo.contact.website && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">🌐</span>
                        <a 
                          href={businessInfo.contact.website.startsWith('http') 
                            ? businessInfo.contact.website 
                            : `https://${businessInfo.contact.website}`
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="contact-info website-link"
                        >
                          {businessInfo.contact.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Contact buttons */}
                  <div className="contact-buttons">
                    {businessInfo.contact.phone && (
                      <>
                        <button 
                          className="contact-button whatsapp"
                          onClick={() => handleContactClick('whatsapp')}
                        >
                          <MessageCircle size={16} />
                          WhatsApp
                        </button>
                        <button 
                          className="contact-button call"
                          onClick={() => handleContactClick('phone')}
                        >
                          <Phone size={16} />
                          Call Now
                        </button>
                      </>
                    )}
                    <button 
                      className="contact-button view-business"
                      onClick={() => {
                        const businessType = item.businessType === 'dealer' ? 'dealerships' : 'services';
                        navigate(`/${businessType}/${businessInfo.id}`);
                      }}
                    >
                      View Business
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* More from this business section */}
        {businessItems && businessItems.length > 0 && (
          <div className="related-items-section">
            <h2 className="related-section-title">
              More from {businessInfo?.name || 'this business'}
            </h2>
            <div className="carousel-container business-carousel">
              {businessItems.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('business', 'prev')}
                  className="carousel-nav prev"
                  disabled={businessActiveIndex === 0}
                  aria-label="Previous business item"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="carousel-viewport" ref={businessCarouselRef}>
                <div className="carousel-track">
                  {businessItems.map((businessItem, index) => (
                    <div className="carousel-slide" key={businessItem._id || businessItem.id || index}>
                      <InventoryCard 
                        item={businessItem} 
                        compact={true}
                        onShare={(itemToShare) => {
                          setItem(itemToShare);
                          setShowShareModal(true);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {businessItems.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('business', 'next')}
                  className="carousel-nav next"
                  disabled={businessActiveIndex >= Math.max(0, businessItems.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                  aria-label="Next business item"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {/* Pagination dots */}
              {businessItems.length > 1 && (
                <div className="carousel-dots">
                  {Array.from({ length: Math.ceil(businessItems.length / (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1)) }).map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${businessActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setBusinessActiveIndex(index);
                        initializeCarousel('business');
                      }}
                      aria-label={`Go to business items page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar items section */}
        {relatedItems && relatedItems.length > 0 && (
          <div className="related-items-section">
            <h2 className="related-section-title">Similar Items</h2>
            <div className="carousel-container related-carousel">
              {relatedItems.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('related', 'prev')}
                  className="carousel-nav prev"
                  disabled={relatedActiveIndex === 0}
                  aria-label="Previous related item"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="carousel-viewport" ref={relatedCarouselRef}>
                <div className="carousel-track">
                  {relatedItems.map((relatedItem, index) => (
                    <div className="carousel-slide" key={relatedItem._id || relatedItem.id || index}>
                      <InventoryCard 
                        item={relatedItem} 
                        compact={true}
                        onShare={(itemToShare) => {
                          setItem(itemToShare);
                          setShowShareModal(true);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {relatedItems.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('related', 'next')}
                  className="carousel-nav next"
                  disabled={relatedActiveIndex >= Math.max(0, relatedItems.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                  aria-label="Next related item"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {/* Pagination dots */}
              {relatedItems.length > 1 && (
                <div className="carousel-dots">
                  {Array.from({ length: Math.ceil(relatedItems.length / (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1)) }).map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${relatedActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setRelatedActiveIndex(index);
                        initializeCarousel('related');
                      }}
                      aria-label={`Go to related items page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share modal */}
        {showShareModal && (
          <ShareModal 
            item={item}
            onClose={() => setShowShareModal(false)}
            buttonRef={shareButtonRef}
            itemType="inventory"
          />
        )}
      </div>
    </ErrorBoundary>
  ); 
};

export default React.memo(InventoryItemDetail);
