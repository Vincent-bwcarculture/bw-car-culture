// src/components/shared/InventoryCard/InventoryCard.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAnalytics from '../../../hooks/useAnalytics.js';
import './InventoryCard.css';

// Human-readable spec key labels
const SPEC_LABELS = {
  brand: 'Brand',
  partNumber: 'Part No.',
  compatibleMake: 'Make',
  compatibleModel: 'Model',
  size: 'Size',
  color: 'Color',
  year: 'Year',
  edition: 'Edition',
  material: 'Material',
};

// Category → which spec keys to show (in order)
const CATEGORY_SPEC_KEYS = {
  Apparel:      ['brand', 'size', 'color'],
  Collectibles: ['brand', 'year', 'edition'],
  Parts:        ['brand', 'partNumber', 'compatibleMake', 'compatibleModel'],
  Accessories:  ['brand', 'partNumber', 'compatibleMake', 'compatibleModel'],
  Electronics:  ['brand', 'partNumber', 'compatibleMake', 'compatibleModel'],
  Tools:        ['brand', 'partNumber'],
  Fluids:       ['brand', 'partNumber'],
  Other:        ['brand'],
};

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

  useEffect(() => {
    setImageLoadError(false);
    setIsImageLoading(true);
    setActiveImageIndex(0);
    setRetryCount(0);
  }, [item]);

  const isValidItem = useMemo(() => item && (item._id || item.id) && item.title, [item]);

  const itemId = useMemo(() => {
    if (!item) return null;
    return item._id?.toString() || item.id?.toString() || null;
  }, [item]);

  const imageUrls = useMemo(() => {
    if (!item?.images?.length) return ['/images/placeholders/part.jpg'];
    return item.images.map(img => {
      try {
        if (typeof img === 'string') {
          if (img.startsWith('https://')) return img;
          if (img.startsWith('/')) return img;
          return `/uploads/inventory/${img}`;
        }
        if (img && typeof img === 'object') {
          if (img.url) return img.url;
          if (img.thumbnail) return img.thumbnail;
          if (img.key) return `${process.env.REACT_APP_S3_BASE_URL || ''}/${img.key}`;
        }
        return '/images/placeholders/part.jpg';
      } catch {
        return '/images/placeholders/part.jpg';
      }
    });
  }, [item]);

  const currentImageUrl = useMemo(
    () => imageUrls[activeImageIndex] || imageUrls[0] || '/images/placeholders/part.jpg',
    [imageUrls, activeImageIndex]
  );

  const businessInfo = useMemo(() => {
    if (!item?.business && !item?.businessId) return null;
    const business = item.business || {};
    return {
      id: business._id || business.id || item.businessId,
      name: business.businessName || business.name || 'Business',
      location: business.location?.city || 'Unknown Location',
      logo: business.logo || business.profile?.logo || '/images/placeholders/dealer-avatar.jpg',
      verified: business.verification?.isVerified || false
    };
  }, [item]);

  // Contact: prefer item.contact for private sellers, fall back to business phone
  const contactInfo = useMemo(() => {
    const c = item?.contact;
    const phone    = c?.phone    || c?.whatsapp || businessInfo?.phone || null;
    const whatsapp = c?.whatsapp || c?.phone    || businessInfo?.phone || null;
    return { phone, whatsapp };
  }, [item, businessInfo]);

  const pricingInfo = useMemo(() => {
    const price = item?.price || 0;
    const originalPrice = item?.originalPrice;
    const hasDiscount = originalPrice && originalPrice > price;
    const discountPercent = hasDiscount
      ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    return {
      price: `P${price.toLocaleString()}`,
      originalPrice: originalPrice ? `P${originalPrice.toLocaleString()}` : null,
      hasDiscount,
      discountPercent: discountPercent > 0 ? `${discountPercent}% OFF` : null
    };
  }, [item]);

  const stockStatus = useMemo(() => {
    const quantity = item?.stock?.quantity;
    if (quantity === undefined || quantity === null) return null;
    if (quantity <= 0)  return { status: 'out-of-stock', label: 'Out of Stock' };
    if (quantity <= 3)  return { status: 'low-stock',    label: 'Limited Stock' };
    if (quantity <= 10) return { status: 'low-stock',    label: 'Low Stock' };
    return { status: 'in-stock', label: 'In Stock' };
  }, [item]);

  // Category-adaptive specs: only show keys relevant to the category, skip empty values
  const visibleSpecs = useMemo(() => {
    if (!item?.specifications) return [];
    const specs = item.specifications;
    const category = item.category || 'Other';
    const keys = CATEGORY_SPEC_KEYS[category] || Object.keys(specs);
    return keys
      .map(k => ({ key: k, label: SPEC_LABELS[k] || k, value: specs[k] }))
      .filter(s => s.value && s.value !== 'N/A' && s.value !== '');
  }, [item]);

  const handleCardClick = useCallback(() => {
    if (!itemId) return;
    if (analytics) analytics.inventoryView(itemId, item.title || 'Unknown Item');
    navigate(`/inventory/${itemId}`);
  }, [itemId, item?.title, analytics, navigate]);

  const handleImageNavigation = useCallback((e, direction) => {
    e.stopPropagation();
    if (imageUrls.length <= 1) return;
    const newIndex = direction === 'next'
      ? (activeImageIndex + 1) % imageUrls.length
      : (activeImageIndex - 1 + imageUrls.length) % imageUrls.length;
    setActiveImageIndex(newIndex);
    setIsImageLoading(true);
    const preloadImg = new Image();
    preloadImg.src = imageUrls[(newIndex + (direction === 'next' ? 1 : -1) + imageUrls.length) % imageUrls.length];
  }, [imageUrls, activeImageIndex]);

  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    if (analytics) analytics.inventoryShare(itemId, item.title || 'Unknown Item');
    if (onShare) {
      onShare(item, e.currentTarget);
    } else {
      const url = `${window.location.origin}/inventory/${itemId}`;
      if (navigator.share) {
        navigator.share({ title: item.title, url }).catch(console.warn);
      } else {
        navigator.clipboard.writeText(url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(() => {});
      }
    }
  }, [item, itemId, onShare, analytics]);

  const handleWhatsAppClick = useCallback((e) => {
    e.stopPropagation();
    if (!contactInfo.whatsapp) { alert('No WhatsApp contact available'); return; }
    if (analytics) analytics.inventoryContact(itemId, item.title || 'Unknown Item', 'whatsapp');
    const phone = contactInfo.whatsapp.replace(/\D/g, '');
    const message = `Hello, I'm interested in "${item.title}" listed on BW Car Culture. Is it still available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }, [contactInfo, item, itemId, analytics]);

  const handleViewDetails = useCallback((e) => {
    e.stopPropagation();
    if (!itemId) return;
    navigate(`/inventory/${itemId}`);
  }, [itemId, navigate]);

  const handleBusinessClick = useCallback((e) => {
    e.stopPropagation();
    if (!businessInfo?.id) return;
    if (analytics) analytics.businessView(businessInfo.id, businessInfo.name);
    const businessType = item?.businessType === 'dealer' ? 'dealerships' : 'services';
    navigate(`/${businessType}/${businessInfo.id}`);
  }, [businessInfo, item?.businessType, analytics, navigate]);

  const handleImageLoad  = useCallback(() => { setIsImageLoading(false); setImageLoadError(false); setRetryCount(0); }, []);
  const handleImageError = useCallback((e) => {
    if (retryCount < 2) {
      if (retryCount === 0 && e.target.src.includes('amazonaws.com')) {
        const key = e.target.src.split('.amazonaws.com/').pop();
        if (key) { e.target.src = `/api/images/s3-proxy/${key}`; setRetryCount(1); return; }
      }
    }
    e.target.src = '/images/placeholders/part.jpg';
    setIsImageLoading(false);
    setImageLoadError(true);
  }, [retryCount]);

  if (!isValidItem) return null;

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

        {imageUrls.length > 1 && !isImageLoading && (
          <div className="inventory-card-image-navigation">
            <button className="inventory-card-image-nav prev" onClick={(e) => handleImageNavigation(e, 'prev')} aria-label="Previous image">❮</button>
            <button className="inventory-card-image-nav next" onClick={(e) => handleImageNavigation(e, 'next')} aria-label="Next image">❯</button>
          </div>
        )}
        {imageUrls.length > 1 && (
          <div className="inventory-card-image-counter">{activeImageIndex + 1}/{imageUrls.length}</div>
        )}

        {item.category && <div className="inventory-card-category">{item.category}</div>}

        {stockStatus && (
          <div className={`inventory-card-stock-badge ${stockStatus.status}`}>{stockStatus.label}</div>
        )}
      </div>

      <div className="inventory-card-content">
        <div className="inventory-card-header">
          <h4 className="inventory-card-title">{item.title}</h4>
          <div className="inventory-card-price-container">
            <span className="inventory-card-price">{pricingInfo.price}</span>
            {pricingInfo.originalPrice && (
              <span className="inventory-card-original-price">{pricingInfo.originalPrice}</span>
            )}
            {pricingInfo.discountPercent && (
              <div className="inventory-card-discount-badge">{pricingInfo.discountPercent}</div>
            )}
          </div>
        </div>

        {/* Category-adaptive specs — only non-empty values */}
        {visibleSpecs.length > 0 && (
          <div className="inventory-card-specs">
            {visibleSpecs.slice(0, 4).map(({ key, label, value }) => (
              <div className="inventory-card-spec-item" key={key}>
                <span className="inventory-card-spec-label">{label}:</span>
                <span className="inventory-card-spec-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Feature badges */}
        {item.features && item.features.length > 0 && (
          <div className="inventory-card-badges">
            {item.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="inventory-card-feature-badge">{feature}</div>
            ))}
            {item.features.length > 3 && (
              <div className="inventory-card-feature-badge">+{item.features.length - 3} more</div>
            )}
          </div>
        )}

        {/* Business info (for business sellers) */}
        {businessInfo && (
          <div className="inventory-card-business-info" onClick={handleBusinessClick}>
            <img
              src={businessInfo.logo}
              alt={businessInfo.name}
              className="inventory-card-business-avatar"
              loading="lazy"
              onError={(e) => { e.target.src = '/images/placeholders/dealer-avatar.jpg'; }}
            />
            <div className="inventory-card-business-details">
              <span className="inventory-card-business-name">
                {businessInfo.name}
                {businessInfo.verified && <span className="verified-badge">✓</span>}
              </span>
              <span className="inventory-card-business-location">{businessInfo.location}</span>
            </div>
          </div>
        )}

        {/* Footer: condition + action buttons */}
        <div className="inventory-card-footer">
          <span className={`inventory-card-condition-tag ${(item.condition || 'new').toLowerCase()}`}>
            {item.condition || 'New'}
          </span>
          <div className="inventory-card-actions">
            <button className="inventory-card-share-btn" onClick={handleShareClick} aria-label="Share item">
              Share
            </button>
            {contactInfo.whatsapp && (
              <button className="inventory-card-whatsapp-btn" onClick={handleWhatsAppClick} aria-label="WhatsApp seller">
                WhatsApp
              </button>
            )}
            <button className="inventory-card-details-btn" onClick={handleViewDetails} aria-label="View details">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InventoryCard);
