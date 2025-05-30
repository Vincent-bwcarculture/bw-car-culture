// src/components/shared/InventoryCard/InventoryCard.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAnalytics from '../../../hooks/useAnalytics.js';
import './InventoryCard.css';

const InventoryCard = ({ 
  item, 
  onShare, 
  compact = false,
  loading = false 
}) => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when item changes
  useEffect(() => {
    setImageLoadError(false);
    setIsImageLoading(true);
    setActiveImageIndex(0);
    setRetryCount(0);
  }, [item]);

  // Memoized item validation
  const isValidItem = useMemo(() => {
    return item && (item._id || item.id) && item.title;
  }, [item]);

  // Memoized item ID extraction
  const itemId = useMemo(() => {
    if (!item) return null;
    return item._id?.toString() || item.id?.toString() || null;
  }, [item]);

  // Memoized image URL extraction with S3 support
  const imageUrls = useMemo(() => {
    if (!item?.images?.length) {
      return ['/images/placeholders/part.jpg'];
    }

    return item.images.map(img => {
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
        console.warn('Error processing image URL:', error);
        return '/images/placeholders/part.jpg';
      }
    });
  }, [item]);

  // Memoized current image URL
  const currentImageUrl = useMemo(() => {
    return imageUrls[activeImageIndex] || imageUrls[0] || '/images/placeholders/part.jpg';
  }, [imageUrls, activeImageIndex]);

  // Memoized business information
  const businessInfo = useMemo(() => {
    if (!item?.business && !item?.businessId) return null;

    const business = item.business || {};
    return {
      id: business._id || business.id || item.businessId,
      name: business.businessName || business.name || 'Business',
      location: business.location?.city || 'Unknown Location',
      logo: business.logo || business.profile?.logo || '/images/placeholders/dealer-avatar.jpg',
      phone: business.contact?.phone,
      verified: business.verification?.isVerified || false
    };
  }, [item]);

  // Memoized pricing information
  const pricingInfo = useMemo(() => {
    const price = item?.price || 0;
    const originalPrice = item?.originalPrice;
    const hasDiscount = originalPrice && originalPrice > price;
    const discountPercent = hasDiscount ? 
      Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    return {
      price: `P${price.toLocaleString()}`,
      originalPrice: originalPrice ? `P${originalPrice.toLocaleString()}` : null,
      hasDiscount,
      discountPercent: discountPercent > 0 ? `${discountPercent}% OFF` : null
    };
  }, [item]);

  // Memoized stock status
  const stockStatus = useMemo(() => {
    const quantity = item?.stock?.quantity;
    if (quantity === undefined || quantity === null) return null;
    
    if (quantity <= 0) return { status: 'out-of-stock', label: 'Out of Stock' };
    if (quantity <= 5) return { status: 'low-stock', label: 'Low Stock' };
    return { status: 'in-stock', label: 'In Stock' };
  }, [item]);

  // Handle card click navigation
  const handleCardClick = useCallback(() => {
    if (!itemId) {
      console.error('Cannot navigate: Missing item ID');
      return;
    }
    
    if (analytics) {
      analytics.inventoryView(itemId, item.title || 'Unknown Item');
    }
    navigate(`/inventory/${itemId}`);
  }, [itemId, item?.title, analytics, navigate]);

  // Handle image navigation with preloading
  const handleImageNavigation = useCallback((e, direction) => {
    e.stopPropagation();
    
    if (imageUrls.length <= 1) return;
    
    const newIndex = direction === 'next' 
      ? (activeImageIndex + 1) % imageUrls.length
      : (activeImageIndex - 1 + imageUrls.length) % imageUrls.length;
    
    setActiveImageIndex(newIndex);
    setIsImageLoading(true);
    
    // Preload adjacent images
    const preloadIndex = direction === 'next'
      ? (newIndex + 1) % imageUrls.length
      : (newIndex - 1 + imageUrls.length) % imageUrls.length;
    
    const preloadImg = new Image();
    preloadImg.src = imageUrls[preloadIndex];
    
    if (analytics) {
      analytics.event('Inventory', `Image_${direction}`, `${itemId} - ${item.title || 'Unknown Item'}`);
    }
  }, [imageUrls, activeImageIndex, analytics, itemId, item?.title]);

  // Handle share functionality
  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    
    if (analytics) {
      analytics.inventoryShare(itemId, item.title || 'Unknown Item');
    }
    
    if (onShare) {
      onShare(item, e.currentTarget);
    } else {
      // Fallback share functionality
      const shareData = {
        title: item.title || 'Inventory Item',
        text: `Check out this ${item.title || 'item'} from ${businessInfo?.name || 'I3W Car Culture'}`,
        url: `${window.location.origin}/inventory/${itemId}`
      };

      if (navigator.share) {
        navigator.share(shareData).catch(console.warn);
      } else {
        navigator.clipboard.writeText(shareData.url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(() => console.error('Could not copy link'));
      }
    }
  }, [item, itemId, businessInfo, onShare, analytics]);

  // Handle contact actions
  const handleContactClick = useCallback((e, method) => {
    e.stopPropagation();
    
    if (!businessInfo?.phone) {
      alert('No contact information available');
      return;
    }
    
    if (analytics) {
      analytics.inventoryContact(itemId, item.title || 'Unknown Item', method);
    }
    
    if (method === 'whatsapp') {
      const phone = businessInfo.phone.replace(/\D/g, '');
      const message = `Hello, I'm interested in ${item.title} from your inventory on I3W Car Culture. Is it still available?`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      window.location.href = `tel:${businessInfo.phone}`;
    }
  }, [businessInfo, item, itemId, analytics]);

  // Handle business click
  const handleBusinessClick = useCallback((e) => {
    e.stopPropagation();
    
    if (!businessInfo?.id) return;
    
    if (analytics) {
      analytics.businessView(businessInfo.id, businessInfo.name);
    }
    
    // Determine business type and navigate accordingly
    const businessType = item?.businessType === 'dealer' ? 'dealerships' : 'services';
    navigate(`/${businessType}/${businessInfo.id}`);
  }, [businessInfo, item?.businessType, analytics, navigate]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
    setImageLoadError(false);
    setRetryCount(0);
  }, []);

  // Handle image load error with retry logic
  const handleImageError = useCallback((e) => {
    console.warn(`Image failed to load: ${e.target.src}`);
    
    if (retryCount < 2) {
      // Retry with different URL patterns
      if (retryCount === 0 && e.target.src.includes('amazonaws.com')) {
        // Try proxy for S3 URLs
        const key = e.target.src.split('.amazonaws.com/').pop();
        if (key) {
          e.target.src = `/api/images/s3-proxy/${key}`;
          setRetryCount(1);
          return;
        }
      } else if (retryCount === 1 && !e.target.src.includes('/uploads/inventory/')) {
        // Try direct upload path
        const filename = e.target.src.split('/').pop();
        e.target.src = `/uploads/inventory/${filename}`;
        setRetryCount(2);
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/part.jpg';
    setIsImageLoading(false);
    setImageLoadError(true);
  }, [retryCount]);

  // Don't render if item is invalid
  if (!isValidItem) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className={`inventory-card loading ${compact ? 'compact' : ''}`}>
        <div className="inventory-card-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-price"></div>
            <div className="skeleton-specs"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inventory-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div className="inventory-card-image-container">
        {isImageLoading && (
          <div className="inventory-card-image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        <img 
          src={currentImageUrl}
          alt={item.title || 'Inventory Item'}
          className={`inventory-card-image ${isImageLoading ? 'loading' : ''}`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Image navigation for multiple images */}
        {imageUrls.length > 1 && !isImageLoading && (
          <div className="inventory-card-image-navigation">
            <button 
              className="inventory-card-image-nav prev" 
              onClick={(e) => handleImageNavigation(e, 'prev')}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="inventory-card-image-nav next" 
              onClick={(e) => handleImageNavigation(e, 'next')}
              aria-label="Next image"
            >
              ❯
            </button>
          </div>
        )}
        
        {/* Image counter */}
        {imageUrls.length > 1 && (
          <div className="inventory-card-image-counter">
            {activeImageIndex + 1}/{imageUrls.length}
          </div>
        )}
        
        {/* Category badge */}
        {item.category && (
          <div className="inventory-card-category">
            {item.category}
          </div>
        )}
        
        {/* Stock status badge */}
        {stockStatus && (
          <div className={`inventory-card-stock-badge ${stockStatus.status}`}>
            {stockStatus.label}
          </div>
        )}
      </div>
      
      <div className="inventory-card-content">
        {/* Header with title and price */}
        <div className="inventory-card-header">
          <h4 className="inventory-card-title">{item.title}</h4>
          <div className="inventory-card-price-container">
            <span className="inventory-card-price">
              {pricingInfo.price}
            </span>
            {pricingInfo.originalPrice && (
              <span className="inventory-card-original-price">
                {pricingInfo.originalPrice}
              </span>
            )}
            {pricingInfo.discountPercent && (
              <div className="inventory-card-discount-badge">
                {pricingInfo.discountPercent}
              </div>
            )}
          </div>
        </div>
        
        {/* Specifications */}
        {item.specifications && Object.keys(item.specifications).length > 0 && (
          <div className="inventory-card-specs">
            {Object.entries(item.specifications).slice(0, 4).map(([key, value]) => (
              <div className="inventory-card-spec-item" key={key}>
                <span className="inventory-card-spec-label">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </span>
                <span className="inventory-card-spec-value">
                  {value || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Feature badges */}
        {item.features && item.features.length > 0 && (
          <div className="inventory-card-badges">
            {item.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="inventory-card-feature-badge">
                {feature}
              </div>
            ))}
            {item.features.length > 3 && (
              <div className="inventory-card-feature-badge">
                +{item.features.length - 3} more
              </div>
            )}
          </div>
        )}
        
        {/* Business information */}
        {businessInfo && (
          <div className="inventory-card-business-info" onClick={handleBusinessClick}>
            <img 
              src={businessInfo.logo}
              alt={businessInfo.name}
              className="inventory-card-business-avatar"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/placeholders/dealer-avatar.jpg';
              }}
            />
            <div className="inventory-card-business-details">
              <span className="inventory-card-business-name">
                {businessInfo.name}
                {businessInfo.verified && <span className="verified-badge">✓</span>}
              </span>
              <span className="inventory-card-business-location">
                {businessInfo.location}
              </span>
              <span className="inventory-card-business-link">View Business</span>
            </div>
          </div>
        )}
        
        {/* Footer with condition and actions */}
        <div className="inventory-card-footer">
          <span className={`inventory-card-condition-tag ${(item.condition || 'new').toLowerCase()}`}>
            {item.condition || 'New'}
          </span>
          <div className="inventory-card-actions">
            <button 
              className="inventory-card-share-btn"
              onClick={handleShareClick}
              aria-label="Share item"
            >
              Share
            </button>
            <button 
              className="inventory-card-call-btn"
              onClick={(e) => handleContactClick(e, 'phone')}
              aria-label="Call business"
              disabled={!businessInfo?.phone}
            >
              Call
            </button>
            <button 
              className="inventory-card-whatsapp-btn"
              onClick={(e) => handleContactClick(e, 'whatsapp')}
              aria-label="WhatsApp business"
              disabled={!businessInfo?.phone}
            >
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InventoryCard);