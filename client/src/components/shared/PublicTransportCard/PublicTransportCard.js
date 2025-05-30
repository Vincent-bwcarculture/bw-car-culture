import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { transportRouteService } from '../../../services/transportRouteService.js';
import './PublicTransportCard.css';

const PublicTransportCard = ({ route: initialRoute, routeId, onBook, onShare, compact = false }) => {
  const navigate = useNavigate();
  const [route, setRoute] = useState(initialRoute || null);
  const [loading, setLoading] = useState(!initialRoute && !!routeId);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Use localStorage to remember failed image URLs to avoid repeat attempts
  const checkFailedImage = useCallback((url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedTransportImages') || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  }, []);

  const markFailedImage = useCallback((url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedTransportImages') || '{}');
      failedImages[url] = Date.now();
      // Limit cache size to prevent localStorage bloat
      const keys = Object.keys(failedImages);
      if (keys.length > 50) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedTransportImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore errors
    }
  }, []);
  
  useEffect(() => {
    if (!initialRoute && routeId) {
      const fetchRouteDetails = async () => {
        try {
          setLoading(true);
          const response = await transportRouteService.getTransportRoute(routeId);
          
          // Fix: Check for response.route instead of response.data (matching the service structure)
          if (response.success && response.route) {
            setRoute(response.route);
          } else {
            setError(response.error || 'Failed to load transport route');
          }
        } catch (err) {
          console.error('Error fetching route details:', err);
          setError('Could not load route information');
        } finally {
          setLoading(false);
        }
      };
      
      fetchRouteDetails();
    }
  }, [initialRoute, routeId]);

  useEffect(() => {
    setImageLoadError(false);
  }, [route, activeImageIndex]);
  
  const safeGetStringId = useCallback((id) => {
    if (!id) return null;
    
    if (typeof id === 'string' && id !== '[object Object]') {
      return id;
    }
    
    if (typeof id === 'object') {
      if (id._id) {
        if (typeof id._id === 'string') {
          return id._id;
        } else if (id._id.toString) {
          return id._id.toString();
        }
      }
      
      if (id.id) {
        if (typeof id.id === 'string') {
          return id.id;
        } else if (id.id.toString) {
          return id.id.toString();
        }
      }
      
      if (id.toString && id.toString() !== '[object Object]') {
        return id.toString();
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to extract valid ID from:", id);
    }
    return null;
  }, []);
  
  const getRouteProperty = useCallback((path, defaultValue = 'N/A') => {
    if (!route) return defaultValue;
    
    const parts = path.split('.');
    let value = route;
    
    for (const part of parts) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[part];
    }
    
    return value !== null && value !== undefined ? value : defaultValue;
  }, [route]);

  // Enhanced provider image URL handling (moved before getProviderData)
  const getProviderImageUrl = useCallback((provider) => {
    if (!provider) return '/images/placeholders/provider-avatar.jpg';
    
    // Try multiple possible image sources
    let imageUrl = provider.logo || 
                   provider.profile?.logo || 
                   provider.avatar || 
                   provider.image || 
                   provider.profileImage;
    
    if (!imageUrl) {
      return '/images/placeholders/provider-avatar.jpg';
    }
    
    // Handle S3 URLs
    if (typeof imageUrl === 'object' && imageUrl.url) {
      imageUrl = imageUrl.url;
    }
    
    // Clean up problematic paths
    if (imageUrl.includes('/images/images/')) {
      imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    // Handle full URLs (S3)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Handle relative paths
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    return imageUrl;
  }, []);

  // Enhanced image URL extraction with S3 support
  const getImageUrl = useCallback(() => {
    const images = route?.images || [];
    
    if (!Array.isArray(images) || images.length === 0) {
      return route?.image || '/images/placeholders/transport.jpg';
    }
    
    try {
      const image = images[activeImageIndex] || images[0];
      let imageUrl = '';
      
      if (typeof image === 'string') {
        imageUrl = image;
      } else if (image && typeof image === 'object') {
        imageUrl = image.url || image.thumbnail || '';
        
        // For S3 keys without URLs
        if (!imageUrl && image.key) {
          return `/api/images/s3-proxy/${image.key}`;
        }
      }
      
      if (!imageUrl) {
        return route?.image || '/images/placeholders/transport.jpg';
      }
      
      // Check if this image previously failed
      if (checkFailedImage(imageUrl)) {
        return '/images/placeholders/transport.jpg';
      }
      
      // Clean up problematic S3 URLs with duplicated image paths
      if (imageUrl.includes('/images/images/')) {
        imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
      }
      
      // S3 URLs will be full URLs
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // Legacy local paths
      if (!imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`;
      }
      
      return imageUrl;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error getting image URL for transport route:`, error);
      }
      return '/images/placeholders/transport.jpg';
    }
  }, [route, activeImageIndex, checkFailedImage]);

  // Enhanced provider data extraction
  const getProviderData = useMemo(() => {
    if (!route) return null;

    let providerData = {
      id: null,
      name: 'Transport Provider',
      businessName: 'Transport Provider',
      logo: '/images/placeholders/provider-avatar.jpg',
      location: {
        city: 'Unknown Location',
        country: ''
      },
      contact: {
        phone: null,
        email: null
      }
    };

    // Try multiple possible provider data sources
    if (route.provider && typeof route.provider === 'object') {
      // Direct provider object
      providerData = {
        id: safeGetStringId(route.providerId || route.provider._id || route.provider.id),
        name: route.provider.name || route.provider.businessName || 'Transport Provider',
        businessName: route.provider.businessName || route.provider.name || 'Transport Provider',
        logo: getProviderImageUrl(route.provider),
        location: {
          city: route.provider.location?.city || route.location?.city || 'Unknown Location',
          country: route.provider.location?.country || route.location?.country || ''
        },
        contact: {
          phone: route.provider.contact?.phone || route.contact?.phone || null,
          email: route.provider.contact?.email || route.contact?.email || null
        }
      };
    } else if (route.providerId) {
      // Provider ID reference - try to get provider info from route-level data
      providerData.id = safeGetStringId(route.providerId);
      
      // Check for provider info scattered in route data
      if (route.providerName || route.provider) {
        providerData.name = route.providerName || route.provider || 'Transport Provider';
        providerData.businessName = route.providerName || route.provider || 'Transport Provider';
      }
      
      if (route.providerLogo || route.logo) {
        providerData.logo = getProviderImageUrl({ logo: route.providerLogo || route.logo });
      }
      
      if (route.contact?.phone) {
        providerData.contact.phone = route.contact.phone;
      }
      
      if (route.location?.city) {
        providerData.location.city = route.location.city;
        providerData.location.country = route.location.country || '';
      }
    }

    return providerData;
  }, [route, safeGetStringId, getProviderImageUrl]);

  const handleCardClick = useCallback(() => {
    const routeId = safeGetStringId(route?.id || route?._id);
    if (!routeId) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Cannot navigate: Missing valid route ID", route);
      }
      return;
    }
    
    navigate(`/transport-routes/${routeId}`);
  }, [route, navigate, safeGetStringId]);

  const handleImageNavigation = useCallback((e, direction) => {
    e.stopPropagation();
    
    const images = route?.images || [];
    if (!Array.isArray(images) || images.length <= 1) return;
    
    setActiveImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % images.length;
      } else {
        return (prev - 1 + images.length) % images.length;
      }
    });
    
    setImageLoadError(false);
  }, [route]);

  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(route, e.currentTarget);
    } else {
      try {
        const routeId = safeGetStringId(route?.id || route?._id);
        if (navigator.share) {
          const shareData = {
            title: `${getRouteProperty('origin')} to ${getRouteProperty('destination')}`,
            text: `Check out this transport route from ${getRouteProperty('origin')} to ${getRouteProperty('destination')}`,
            url: `${window.location.origin}/transport-routes/${routeId}`
          };
          navigator.share(shareData)
            .catch(err => console.warn('Error sharing:', err));
        } else {
          const url = `${window.location.origin}/transport-routes/${routeId}`;
          navigator.clipboard.writeText(url)
            .then(() => alert('Link copied to clipboard!'))
            .catch(err => console.error('Could not copy link:', err));
        }
      } catch (err) {
        console.error('Share functionality error:', err);
      }
    }
  }, [route, onShare, safeGetStringId, getRouteProperty]);

  // Utility functions (moved before event handlers that use them)
  const formatTime = useCallback((time) => {
    if (!time) return 'N/A';
    
    if (typeof time === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
      return time;
    }
    
    try {
      if (time instanceof Date || (typeof time === 'string' && !isNaN(Date.parse(time)))) {
        const date = time instanceof Date ? time : new Date(time);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (err) {
      console.warn(`Error formatting time: ${time}`, err);
    }
    
    return String(time);
  }, []);

  const getRouteTypeClass = useCallback((type) => {
    if (!type) return '';
    
    switch (type.toLowerCase()) {
      case 'bus': return 'bus';
      case 'taxi': return 'taxi';
      case 'shuttle': return 'shuttle';
      case 'train': return 'train';
      case 'ferry': return 'ferry';
      default: return 'other';
    }
  }, []);

  const getStatusClass = useCallback(() => {
    const status = getRouteProperty('status');
    if (status === 'N/A') return '';
    
    switch (status.toLowerCase()) {
      case 'on time': 
      case 'active':
      case 'operational': return 'on-time';
      case 'delayed': return 'delayed';
      case 'cancelled': 
      case 'suspended': return 'cancelled';
      default: return '';
    }
  }, [getRouteProperty]);

  const getServiceClass = useCallback(() => {
    const serviceType = getRouteProperty('serviceType');
    if (serviceType === 'N/A') return 'regular';
    
    switch (serviceType.toLowerCase()) {
      case 'express': return 'express';
      case 'premium': return 'premium';
      default: return 'regular';
    }
  }, [getRouteProperty]);
  
  const handleBookClick = useCallback((e) => {
    e.stopPropagation();
    
    if (onBook) {
      onBook(route);
      return;
    }
    
    const origin = getRouteProperty('origin', 'Unknown');
    const destination = getRouteProperty('destination', 'Unknown');
    const routeType = getRouteProperty('routeType', 'Transport');
    const fare = getRouteProperty('fare') !== 'N/A' ? `P${Number(getRouteProperty('fare')).toFixed(2)}` : 'Not specified';
    
    const departure = formatTime(getRouteProperty('schedule.departureTimes.0'));
    const duration = getRouteProperty('schedule.duration', 'Not specified');
    
    const routeDetails = [
      `*${origin} to ${destination}*`,
      `Type: ${routeType} Service`,
      `Fare: ${fare}`,
      `Departure: ${departure}`,
      `Duration: ${duration}`,
      getRouteProperty('frequency') !== 'N/A' ? `Frequency: ${getRouteProperty('frequency')}` : '',
    ].filter(Boolean).join('\n');

    let routeLink = '';
    try {
      const routeId = safeGetStringId(route?.id || route?._id);
      if (routeId) {
        const baseUrl = window.location.origin;
        routeLink = `\n\nRoute Link: ${baseUrl}/transport-routes/${routeId}`;
      }
    } catch (err) {
      console.warn('Could not generate route link:', err);
    }
    
    const message = `*TRANSPORT BOOKING REQUEST*\n\nHello, I would like to book this route:\n\n${routeDetails}${routeLink}\n\nPlease confirm availability and booking process.`;
    
    const phone = getProviderData?.contact?.phone;
    
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = phone.startsWith('+') ? cleanPhone : 
                            phone.startsWith('267') ? `+${cleanPhone}` : 
                            `+267${cleanPhone}`;
      
      const encodedMessage = encodeURIComponent(message);
      
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
    } else {
      alert('Provider contact information is not available. Please view details to contact the provider.');
    }
  }, [route, onBook, getRouteProperty, formatTime, getProviderData, safeGetStringId]);

  const handleProviderClick = useCallback((e) => {
    e.stopPropagation();
    
    if (getProviderData?.id) {
      navigate(`/services/${getProviderData.id}?type=transport`);
    } else {
      const providerName = getProviderData?.businessName || getProviderData?.name;
      if (providerName && providerName !== 'Transport Provider') {
        navigate(`/services?search=${encodeURIComponent(providerName)}&type=transport`);
      } else {
        navigate('/services?type=transport');
      }
    }
  }, [getProviderData, navigate]);

  // Enhanced image error handler
  const handleImageError = useCallback((e) => {
    const originalSrc = e.target.src;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Transport image failed to load: ${originalSrc}`);
    }
    markFailedImage(originalSrc);
    
    // If URL already contains certain patterns, go straight to placeholder
    if (originalSrc.includes('/api/images/s3-proxy/') || 
        originalSrc.includes('/uploads/transport/') ||
        originalSrc.includes('images/images/') ||
        originalSrc.includes('/images/placeholders/transport.jpg')) {
      e.target.src = '/images/placeholders/transport.jpg';
      return;
    }
    
    // For S3 URLs, try the proxy once
    if (originalSrc.includes('amazonaws.com')) {
      try {
        const urlParts = originalSrc.split('/');
        const key = urlParts.slice(3).join('/');
        if (key && !key.includes('s3-proxy')) {
          const normalizedKey = key.replace(/images\/images\//g, 'images/');
          e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
          return;
        }
      } catch (err) {
        console.warn('Could not create S3 proxy URL:', err);
      }
    }
    // For relative paths, try direct transport path once
    else if (originalSrc.includes('/uploads/') && !originalSrc.includes('/transport/')) {
      const filename = originalSrc.split('/').pop();
      if (filename) {
        e.target.src = `/uploads/transport/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/transport.jpg';
  }, [markFailedImage]);

  if (loading) {
    return (
      <div className="transport-card loading">
        <div className="transport-card-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-details"></div>
            <div className="skeleton-details"></div>
            <div className="skeleton-footer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="transport-card error">
        <div className="transport-card-error-content">
          <p>{error || 'Transport route not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transport-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div className="transport-card-image-container">
        <img 
          src={getImageUrl()} 
          alt={`${getRouteProperty('origin')} to ${getRouteProperty('destination')}`} 
          className="transport-card-image"
          loading="lazy"
          onError={handleImageError}
        />
        
        {route.images && Array.isArray(route.images) && route.images.length > 1 && (
          <div className="transport-card-image-navigation">
            <button 
              className="transport-card-image-nav prev" 
              onClick={(e) => handleImageNavigation(e, 'prev')}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="transport-card-image-nav next" 
              onClick={(e) => handleImageNavigation(e, 'next')}
              aria-label="Next image"
            >
              ❯
            </button>
            <div className="transport-card-image-counter">
              {activeImageIndex + 1}/{route.images.length}
            </div>
          </div>
        )}
        
        {getRouteProperty('routeType') !== 'N/A' && (
          <div className={`transport-card-type-badge ${getRouteTypeClass(getRouteProperty('routeType'))}`}>
            {getRouteProperty('routeType')}
          </div>
        )}
        
        {(getRouteProperty('status') === 'active' || getRouteProperty('operationalStatus') === 'active') && (
          <div className="transport-card-active-badge">
            Active
          </div>
        )}
      </div>
      
      <div className="transport-card-content">
        <div className="transport-card-header">
          <h4 className="transport-card-title">
            <span>{getRouteProperty('origin')}</span>
            <span className="transport-card-route-arrow">→</span>
            <span>{getRouteProperty('destination')}</span>
          </h4>
          <div className="transport-card-price-container">
            <span className="transport-card-price">
              {getRouteProperty('fare') !== 'N/A' ? 
                `P ${Number(getRouteProperty('fare')).toFixed(2)}` : 
                'Contact for pricing'}
            </span>
            {getRouteProperty('frequency') !== 'N/A' && (
              <div className="transport-card-frequency-badge">
                {getRouteProperty('frequency')}
              </div>
            )}
          </div>
        </div>
        
        <div className="transport-card-schedule">
          <div className="transport-card-schedule-item">
            <span className="transport-card-schedule-label">Departure:</span>
            <span className="transport-card-schedule-value">
              {formatTime(getRouteProperty('schedule.departureTimes.0'))}
            </span>
          </div>
          <div className="transport-card-schedule-item">
            <span className="transport-card-schedule-label">Duration:</span>
            <span className="transport-card-schedule-value">
              {getRouteProperty('schedule.duration')}
            </span>
          </div>
          <div className="transport-card-schedule-item">
            <span className="transport-card-schedule-label">Days:</span>
            <span className="transport-card-schedule-value">
              {Array.isArray(getRouteProperty('schedule.operatingDays', [])) ? 
                getRouteProperty('schedule.operatingDays', []).join(', ') :
                typeof getRouteProperty('schedule.operatingDays') === 'object' ?
                  Object.entries(getRouteProperty('schedule.operatingDays', {}))
                    .filter(([_, value]) => value)
                    .map(([day]) => day.substr(0, 3))
                    .join(', ') :
                  'All Days'}
            </span>
          </div>
          <div className="transport-card-schedule-item">
            <span className="transport-card-schedule-label">Distance:</span>
            <span className="transport-card-schedule-value">
              {getRouteProperty('distance')}
            </span>
          </div>
        </div>
        
        {getRouteProperty('status') !== 'N/A' && (
          <div className="transport-card-status">
            <span className={`transport-card-status-indicator ${getStatusClass()}`}></span>
            <span className={`transport-card-status-text ${getStatusClass()}`}>
              {getRouteProperty('status')}
            </span>
          </div>
        )}
        
        {Array.isArray(getRouteProperty('stops')) && getRouteProperty('stops').length > 0 && (
          <div className="transport-card-badges">
            {getRouteProperty('stops').slice(0, 4).map((stop, index) => (
              <div key={index} className="transport-card-stop-badge">
                {typeof stop === 'string' ? stop : stop.name || 'Stop'}
              </div>
            ))}
            {getRouteProperty('stops').length > 4 && (
              <div className="transport-card-stop-badge">
                +{getRouteProperty('stops').length - 4} more
              </div>
            )}
          </div>
        )}
        
        {Array.isArray(getRouteProperty('amenities')) && getRouteProperty('amenities').length > 0 && (
          <div className="transport-card-badges">
            {getRouteProperty('amenities').slice(0, 3).map((amenity, index) => (
              <div key={index} className="transport-card-amenity-badge">
                {amenity}
              </div>
            ))}
            {getRouteProperty('amenities').length > 3 && (
              <div className="transport-card-amenity-badge">
                +{getRouteProperty('amenities').length - 3} more
              </div>
            )}
          </div>
        )}
        
        {getProviderData && (
          <div className="transport-card-provider-info" onClick={handleProviderClick}>
            <img 
              src={getProviderData.logo}
              alt={getProviderData.businessName} 
              className="transport-card-provider-avatar"
              loading="lazy"
              onError={(e) => {
                if (e.target.src.includes('/images/placeholders/provider-avatar.jpg')) {
                  return;
                }
                
                e.target.onerror = null;
                
                // Try S3 proxy for S3 URLs
                if (e.target.src.includes('amazonaws.com')) {
                  try {
                    const urlParts = e.target.src.split('/');
                    const key = urlParts.slice(3).join('/');
                    if (key && !key.includes('s3-proxy')) {
                      e.target.src = `/api/images/s3-proxy/${key}`;
                      return;
                    }
                  } catch (err) {
                    console.warn('Could not create S3 proxy URL:', err);
                  }
                }
                // Try provider-specific path
                else if (e.target.src.includes('/uploads/') && !e.target.src.includes('/providers/')) {
                  const filename = e.target.src.split('/').pop();
                  if (filename) {
                    e.target.src = `/uploads/providers/${filename}`;
                    return;
                  }
                }
                
                // Final fallback
                e.target.src = '/images/placeholders/provider-avatar.jpg';
              }}
            />
            <div className="transport-card-provider-details">
              <span className="transport-card-provider-name">
                {getProviderData.businessName}
              </span>
              <span className="transport-card-provider-frequency">
                {getProviderData.location.city}
                {getProviderData.location.country ? `, ${getProviderData.location.country}` : ''}
              </span>
              <span className="transport-card-provider-link">View Provider</span>
            </div>
          </div>
        )}
        
        <div className="transport-card-footer">
          <span className={`transport-card-service-type ${getServiceClass()}`}>
            {getRouteProperty('serviceType', 'Regular Service')}
          </span>
          <div className="transport-card-actions">
            <button 
              className="transport-card-share-btn"
              onClick={handleShareClick}
              aria-label="Share"
            >
              Share
            </button>
            <button 
              className="transport-card-reserve-btn"
              onClick={handleBookClick}
              aria-label="Book Now"
            >
              Book Now
            </button>
            <button 
              className="transport-card-details-btn"
              onClick={handleCardClick}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PublicTransportCard);