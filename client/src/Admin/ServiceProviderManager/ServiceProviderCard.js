// src/components/admin/ServiceProviderManager/ServiceProviderCard.js
import React from 'react';
import './ServiceProviderCard.css';

const ServiceProviderCard = ({ 
  provider, 
  onEdit, 
  onView, 
  onViewListings, 
  onVerify, 
  onManageSubscription, 
  onDelete,
  getProviderTypeName,
  getFormattedBusinessType,
  multipleProviders,
  providerCount
}) => {
  if (!provider) return null;

// Add at the beginning of the ServiceProviderCard component
const checkFailedImage = (url, type = 'logo') => {
  try {
    const failedImages = JSON.parse(localStorage.getItem(`failedProvider${type.charAt(0).toUpperCase() + type.slice(1)}s`) || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url, type = 'logo') => {
  try {
    const storageKey = `failedProvider${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const failedImages = JSON.parse(localStorage.getItem(storageKey) || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem(storageKey, JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

// Enhanced function to get image URL with S3 support
const getProviderImageUrl = (imageData, type = 'logo') => {
  try {
    if (!imageData) return `/images/placeholders/${type}-placeholder.jpg`;
    
    // If imageData is a string, use it directly
    if (typeof imageData === 'string') {
      // Fix problematic S3 URLs with duplicate paths
      if (imageData.includes('/images/images/')) {
        return imageData.replace(/\/images\/images\//g, '/images/');
      }
      return imageData;
    }
    
    // If imageData is an object with url property
    if (imageData && typeof imageData === 'object') {
      const imageUrl = imageData.url || '';
      
      // If we have an S3 key but no URL, create proxy URL
      if (!imageUrl && imageData.key) {
        return `/api/images/s3-proxy/${imageData.key}`;
      }
      
      if (imageUrl) {
        // Fix problematic S3 URLs with duplicate paths
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
    }
    
    // Fallback to placeholder
    return `/images/placeholders/${type}-placeholder.jpg`;
  } catch (error) {
    console.error(`Error getting provider ${type} URL:`, error);
    return `/images/placeholders/${type}-placeholder.jpg`;
  }
};


  const renderSubscriptionBadge = (subscription) => {
    if (!subscription) {
      return <span className="spm-badge spm-badge-inactive">No Plan</span>;
    }

    const { status, tier } = subscription;
    
    if (status === 'active') {
      return <span className="spm-badge spm-badge-active">{tier}</span>;
    } else if (status === 'expired') {
      return <span className="spm-badge spm-badge-expired">{tier} (Expired)</span>;
    } else if (status === 'pending') {
      return <span className="spm-badge spm-badge-pending">{tier} (Pending)</span>;
    } else if (status === 'cancelled') {
      return <span className="spm-badge spm-badge-cancelled">{tier} (Cancelled)</span>;
    }
    
    return <span className="spm-badge spm-badge-inactive">{tier || 'Unknown'}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleListingsClick = (e) => {
    e.stopPropagation();
    onViewListings();
  };

  const handleVerifyClick = (e) => {
    e.stopPropagation();
    onVerify();
  };

  const handleSubscriptionClick = (e) => {
    e.stopPropagation();
    onManageSubscription();
  };

  return (
    <div className="spm-service-provider-card">
    <div className="spm-provider-card-banner">
  {provider.profile?.banner ? (
    <img 
      src={getProviderImageUrl(provider.profile.banner, 'banner')} 
      alt={provider.businessName} 
      className="spm-provider-banner-img"
      onError={(e) => {
        const originalSrc = e.target.src;
        console.error(`Banner image failed to load: ${originalSrc}`);
        
        // Mark this image as failed
        markFailedImage(originalSrc, 'banner');
        
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
        
        // Try providers directory if not already a placeholder
        if (!originalSrc.includes('/images/placeholders/')) {
          const filename = originalSrc.split('/').pop();
          if (filename) {
            e.target.src = `/uploads/providers/${filename}`;
            return;
          }
        }
        
        // Final fallback - show banner placeholder or gradient
        e.target.src = '/images/placeholders/banner-placeholder.jpg';
      }}
    />
  ) : (
    <div className="spm-provider-banner-placeholder">
      <div className="spm-provider-banner-gradient"></div>
    </div>
  )}
  
  <div className="spm-provider-type-badge">
    {getProviderTypeName(provider.providerType)}
  </div>
  
  {provider.verification?.status === 'verified' && (
    <div className="spm-provider-verified-badge">✓ Verified</div>
  )}

  {/* New badge for multiple providers */}
  {multipleProviders && (
    <div className="spm-multiple-providers-badge">
      {providerCount} providers
    </div>
  )}
</div>

      <div className="spm-provider-card-content">
        <div className="spm-provider-header">
       <div className="spm-provider-logo">
  {provider.profile?.logo ? (
    <img 
      src={getProviderImageUrl(provider.profile.logo, 'logo')} 
      alt={provider.businessName} 
      onError={(e) => {
        const originalSrc = e.target.src;
        console.error(`Logo image failed to load: ${originalSrc}`);
        
        // Mark this image as failed
        markFailedImage(originalSrc, 'logo');
        
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
        
        // Try providers directory if not already a placeholder
        if (!originalSrc.includes('/images/placeholders/')) {
          const filename = originalSrc.split('/').pop();
          if (filename) {
            e.target.src = `/uploads/providers/${filename}`;
            return;
          }
        }
        
        // Final fallback
        e.target.onerror = null;
        e.target.style.display = 'none';
        
        // Replace with provider initial (parent element should show initial as fallback)
        const logoPlaceholder = document.createElement('div');
        logoPlaceholder.className = 'spm-provider-logo-placeholder';
        logoPlaceholder.textContent = provider.businessName?.charAt(0) || 'P';
        e.target.parentNode.appendChild(logoPlaceholder);
      }}
    />
  ) : (
    <div className="spm-provider-logo-placeholder">
      {provider.businessName?.charAt(0) || 'P'}
    </div>
  )}
</div>
          
          <div className="spm-provider-details">
            <h3 className="spm-provider-name">{provider.businessName}</h3>
            <div className="spm-provider-business-type">
              {getFormattedBusinessType(provider.businessType, provider.providerType)}
            </div>
            <div className="spm-provider-location">
              {provider.location?.city || 'Unknown Location'}
              {provider.location?.country ? `, ${provider.location.country}` : ''}
            </div>
          </div>
        </div>

        <div className="spm-provider-info-section">
          <div className="spm-provider-info-row">
            <div className="spm-provider-info-label">Status:</div>
            <div className={`spm-provider-status-value ${provider.status}`}>
              {provider.status?.charAt(0).toUpperCase() + provider.status?.slice(1)}
            </div>
          </div>
          
          <div className="spm-provider-info-row">
            <div className="spm-provider-info-label">Subscription:</div>
            <div className="spm-provider-subscription-value">
              {renderSubscriptionBadge(provider.subscription)}
            </div>
          </div>
          
          {provider.subscription?.expiresAt && (
            <div className="spm-provider-info-row">
              <div className="spm-provider-info-label">Expires:</div>
              <div className="spm-provider-expiry-value">
                {formatDate(provider.subscription.expiresAt)}
              </div>
            </div>
          )}
          
          <div className="spm-provider-info-row">
            <div className="spm-provider-info-label">Listings:</div>
            <div className="spm-provider-listings-value">
              {provider.metrics?.totalListings || 0}
            </div>
          </div>

          {/* Add row to show associated user */}
          {provider.user && (
            <div className="spm-provider-info-row">
              <div className="spm-provider-info-label">User:</div>
              <div className="spm-provider-user-value">
                {provider.user.name || 'Unknown user'}
              </div>
            </div>
          )}
        </div>

        <div className="spm-provider-card-actions">
          <button 
            className="spm-provider-action-btn spm-view"
            onClick={onView}
            title="View provider details"
          >
            View
          </button>
          <button 
            className="spm-provider-action-btn spm-edit"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit provider"
          >
            Edit
          </button>
          <button 
            className="spm-provider-action-btn spm-listings"
            onClick={handleListingsClick}
            title="View provider listings"
          >
            Listings
          </button>
          {provider.verification?.status !== 'verified' && (
            <button 
              className="spm-provider-action-btn spm-verify"
              onClick={handleVerifyClick}
              title="Verify provider"
            >
              Verify
            </button>
          )}
          <button 
            className="spm-provider-action-btn spm-subscription"
            onClick={handleSubscriptionClick}
            title="Manage subscription"
          >
            Subscription
          </button>
          <button 
            className="spm-provider-action-btn spm-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete provider"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderCard;