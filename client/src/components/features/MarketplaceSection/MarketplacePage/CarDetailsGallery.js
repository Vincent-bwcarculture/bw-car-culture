// src/components/features/CarDetailsGallery/CarDetailsGallery.js
// COMPLETE UNIFIED: Detail Gallery + Similar Vehicles + TRUE ZOOM
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingService } from '../../../services/listingService';
import './CarDetailsGallery.css';

const CarDetailsGallery = ({ car, onSave, onShare, showDealerLink = true }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  
  // TRUE ZOOM: Enhanced zoom functionality state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  
  // TRUE ZOOM: Image dimension tracking
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isImageFullyLoaded, setIsImageFullyLoaded] = useState(false);
  
  // Similar vehicles state
  const [similarVehicles, setSimilarVehicles] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [animatingItems, setAnimatingItems] = useState([]);
  
  // Refs for zoom functionality
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragTimeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);
  
  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsImageFullyLoaded(false);
  };

  const navigateToDealerProfile = () => {
    if (car?.dealer?._id) {
      navigate(`/dealerships/${car.dealer._id}`);
    }
  };
  
  const formatPrice = (price) => {
    if (!price && !car.priceOptions?.showPriceAsPOA) return 'Price not available';
    if (car.priceOptions?.showPriceAsPOA) return 'POA';
    return `P${parseInt(price).toLocaleString()}`;
  };

  // Fetch similar vehicles
  useEffect(() => {
    const fetchSimilarVehicles = async () => {
      if (!car) return;
      
      setLoadingSimilar(true);
      
      try {
        const filters = {
          make: car.specifications?.make,
          minPrice: car.price ? car.price * 0.7 : undefined,
          maxPrice: car.price ? car.price * 1.3 : undefined,
          excludeId: car._id
        };
        
        const response = await listingService.getListings({ ...filters, limit: 10 });
        
        if (response.success && response.data) {
          const filteredVehicles = response.data.filter(v => v._id !== car._id).slice(0, 6);
          setSimilarVehicles(filteredVehicles);
          
          // Animate items
          setTimeout(() => {
            filteredVehicles.forEach((_, index) => {
              setTimeout(() => {
                setAnimatingItems(prev => [...prev, index]);
              }, index * 150);
            });
          }, 200);
        }
      } catch (error) {
        console.error('Error fetching similar vehicles:', error);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilarVehicles();
  }, [car]);

  // Calculate savings
  const calculateSavings = () => {
    if (!car.priceOptions?.showSavings || !car.priceOptions?.originalPrice) return null;
    
    const originalPrice = car.priceOptions.originalPrice;
    const currentPrice = car.price;
    const savingsAmount = originalPrice - currentPrice;
    
    if (savingsAmount > 0) {
      return { originalPrice, currentPrice, amount: savingsAmount };
    }
    return null;
  };

  const savings = calculateSavings();
  
  // Extract image URLs
  const getImageUrls = () => {
    if (!car) return ['/images/placeholders/car.jpg'];
    
    if (!car.images || car.images.length === 0) {
      return ['/images/placeholders/car.jpg'];
    }
    
    return car.images.map(img => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object' && img.url) return img.url;
      return '/images/placeholders/car.jpg';
    });
  };
  
  const imageUrls = getImageUrls();

  // Extract dealer ID
  const extractDealerId = () => {
    if (!car) return null;
    if (typeof car.dealerId === 'string') return car.dealerId;
    if (car.dealerId?._id) return car.dealerId._id;
    if (car.dealer?._id) return car.dealer._id;
    return null;
  };

  const isPrivateSeller = car?.dealer?.sellerType === 'private';

  // TRUE ZOOM: Track container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerDimensions = () => {
      const rect = container.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    };

    updateContainerDimensions();

    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateContainerDimensions);
      resizeObserverRef.current.observe(container);
    } else {
      window.addEventListener('resize', updateContainerDimensions);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', updateContainerDimensions);
      }
    };
  }, []);

  // TRUE ZOOM: Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setShowZoomControls(false);
    setIsDragging(false);
    setIsImageFullyLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
  }, [selectedImage]);

  // TRUE ZOOM: Calculate image display properties
  const imageDisplayProps = useMemo(() => {
    if (!isImageFullyLoaded || !imageDimensions.width || !containerDimensions.width) {
      return {
        objectFit: 'contain',
        width: '100%',
        height: '100%',
        transform: 'none',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }

    if (zoomLevel === 1) {
      return {
        objectFit: 'contain',
        width: '100%',
        height: '100%',
        transform: 'none',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }

    const containerAspect = containerDimensions.width / containerDimensions.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    
    let baseWidth, baseHeight;
    
    if (imageAspect > containerAspect) {
      baseWidth = containerDimensions.width;
      baseHeight = containerDimensions.width / imageAspect;
    } else {
      baseHeight = containerDimensions.height;
      baseWidth = containerDimensions.height * imageAspect;
    }

    const displayWidth = baseWidth * zoomLevel;
    const displayHeight = baseHeight * zoomLevel;
    
    const transformX = panPosition.x / zoomLevel;
    const transformY = panPosition.y / zoomLevel;

    return {
      objectFit: 'contain',
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: `translate(${transformX}px, ${transformY}px)`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: `${-displayHeight / 2}px`,
      marginLeft: `${-displayWidth / 2}px`
    };
  }, [zoomLevel, panPosition, imageDimensions, containerDimensions, isImageFullyLoaded]);

  // TRUE ZOOM: Zoom handlers
  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.05, 4));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    const newZoom = Math.max(zoomLevel - 0.05, 0.5);
    setZoomLevel(newZoom);
    if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
  }, [zoomLevel]);

  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // TRUE ZOOM: Mouse drag handlers
  const handleMouseDown = useCallback((e) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPosition(panPosition);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoomLevel <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (!imageDimensions.width || !containerDimensions.width) return;
    
    const containerAspect = containerDimensions.width / containerDimensions.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    
    let baseWidth, baseHeight;
    if (imageAspect > containerAspect) {
      baseWidth = containerDimensions.width;
      baseHeight = containerDimensions.width / imageAspect;
    } else {
      baseHeight = containerDimensions.height;
      baseWidth = containerDimensions.height * imageAspect;
    }
    
    const displayWidth = baseWidth * zoomLevel;
    const displayHeight = baseHeight * zoomLevel;
    
    const maxPanX = Math.max(0, (displayWidth - containerDimensions.width) / 2);
    const maxPanY = Math.max(0, (displayHeight - containerDimensions.height) / 2);
    
    const newX = Math.max(-maxPanX, Math.min(maxPanX, lastPanPosition.x + deltaX));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, lastPanPosition.y + deltaY));
    
    setPanPosition({ x: newX, y: newY });
  }, [isDragging, zoomLevel, dragStart, lastPanPosition, imageDimensions, containerDimensions]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragTimeoutRef.current = setTimeout(() => {
      dragTimeoutRef.current = null;
    }, 100);
  }, [isDragging]);

  // TRUE ZOOM: Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setDragStart({ distance, zoom: zoomLevel });
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setLastPanPosition(panPosition);
    }
  }, [zoomLevel, panPosition]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (dragStart.distance) {
        const scale = distance / dragStart.distance;
        const newZoom = Math.max(0.5, Math.min(4, dragStart.zoom * scale));
        setZoomLevel(newZoom);
        if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      
      if (!imageDimensions.width || !containerDimensions.width) return;
      
      const containerAspect = containerDimensions.width / containerDimensions.height;
      const imageAspect = imageDimensions.width / imageDimensions.height;
      
      let baseWidth, baseHeight;
      if (imageAspect > containerAspect) {
        baseWidth = containerDimensions.width;
        baseHeight = containerDimensions.width / imageAspect;
      } else {
        baseHeight = containerDimensions.height;
        baseWidth = containerDimensions.height * imageAspect;
      }
      
      const displayWidth = baseWidth * zoomLevel;
      const displayHeight = baseHeight * zoomLevel;
      
      const maxPanX = Math.max(0, (displayWidth - containerDimensions.width) / 2);
      const maxPanY = Math.max(0, (displayHeight - containerDimensions.height) / 2);
      
      const newX = Math.max(-maxPanX, Math.min(maxPanX, lastPanPosition.x + deltaX));
      const newY = Math.max(-maxPanY, Math.min(maxPanY, lastPanPosition.y + deltaY));
      
      setPanPosition({ x: newX, y: newY });
    }
  }, [isDragging, zoomLevel, dragStart, lastPanPosition, imageDimensions, containerDimensions]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragTimeoutRef.current = setTimeout(() => {
      dragTimeoutRef.current = null;
    }, 150);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // TRUE ZOOM: Handle image load
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setIsImageFullyLoaded(true);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  // Handle similar vehicle click
  const handleSimilarVehicleClick = (vehicle) => {
    navigate(`/marketplace/${vehicle._id || vehicle.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!car) {
    return <div className="cdg-loading-state">Loading vehicle details...</div>;
  }

  const dealerId = extractDealerId();
  const dealerVehicles = similarVehicles.filter(v => {
    const vDealerId = typeof v.dealerId === 'string' ? v.dealerId : v.dealerId?._id;
    return vDealerId === dealerId;
  });

  return (
    <div className="cdg-container">
      <div className="cdg-gallery-main" 
           ref={containerRef}
           onMouseEnter={() => setShowZoomControls(true)}
           onMouseLeave={() => zoomLevel === 1 && setShowZoomControls(false)}>
        
        <img 
          ref={imageRef}
          src={imageUrls[selectedImage]} 
          alt={car.title || 'Vehicle'} 
          className="cdg-main-image"
          style={imageDisplayProps}
          onError={(e) => {
            e.target.src = '/images/placeholders/car.jpg';
          }}
          onLoad={handleImageLoad}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={false}
        />
        
        {/* Zoom Controls */}
        {(showZoomControls || zoomLevel !== 1) && (
          <div className={`cdg-zoom-controls ${zoomLevel !== 1 ? 'zoomed' : ''}`}>
            <button 
              className="cdg-zoom-btn zoom-in" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              aria-label="Zoom in"
            >
              +
            </button>
            <span className="cdg-zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button 
              className="cdg-zoom-btn zoom-out" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              aria-label="Zoom out"
            >
              -
            </button>
            {zoomLevel !== 1 && (
              <button 
                className="cdg-zoom-btn zoom-reset" 
                onClick={handleZoomReset}
                aria-label="Reset zoom"
              >
                ↻
              </button>
            )}
          </div>
        )}
        
        {/* Navigation arrows */}
        {imageUrls.length > 1 && (
          <>
            <button 
              className="cdg-gallery-nav cdg-prev" 
              onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : imageUrls.length - 1)}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="cdg-gallery-nav cdg-next" 
              onClick={() => setSelectedImage(prev => prev < imageUrls.length - 1 ? prev + 1 : 0)}
              aria-label="Next image"
            >
              ❯
            </button>
            <div className="cdg-image-counter">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          </>
        )}
        
        {/* Action buttons */}
        <div className="cdg-gallery-actions">
          {onSave && (
            <button 
              className="cdg-action-button cdg-save-button"
              onClick={onSave}
              aria-label="Save to favorites"
            >
              ♡
            </button>
          )}
          {onShare && (
            <button 
              className="cdg-action-button cdg-share-button"
              onClick={onShare}
              aria-label="Share listing"
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="cdg-gallery-thumbnails">
          {imageUrls.map((image, index) => (
            <div
              key={index}
              className={`cdg-thumbnail ${selectedImage === index ? 'cdg-active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={image} 
                alt={`${car.title || 'Vehicle'} view ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={(e) => e.target.src = '/images/placeholders/car.jpg'}
              />
            </div>
          ))}
        </div>
      )}

      <div className="cdg-details">
        {/* Header */}
        <div className="cdg-header">
          <div className="cdg-title-section">
            <h1 className="cdg-title">{car.title || 'Untitled Vehicle'}</h1>
            <div className="cdg-title-badges">
              {car.priceOptions?.financeAvailable && (
                <div className="cdg-finance-badge">Finance Available</div>
              )}
              {car.priceOptions?.leaseAvailable && (
                <div className="cdg-finance-badge cdg-lease-badge">Lease Available</div>
              )}
            </div>
          </div>
          
          <div className="cdg-price-container">
            {savings && (
              <div className="cdg-original-price">P{savings.originalPrice.toLocaleString()}</div>
            )}
            <div className="cdg-price">{formatPrice(car.price)}</div>
            {savings && (
              <div className="cdg-savings-highlight">
                Save P{savings.amount.toLocaleString()}
              </div>
            )}
            {car.priceOptions?.monthlyPayment && !car.priceOptions?.showPriceAsPOA && (
              <div className="cdg-monthly-payment">
                P{car.priceOptions.monthlyPayment.toLocaleString()} p/m
              </div>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="cdg-status-badges">
          {car.condition && (
            <span className={`cdg-condition-tag cdg-${car.condition.toLowerCase()}`}>
              {car.condition === 'new' ? 'New' : 
               car.condition === 'used' ? 'Used' : 
               car.condition === 'certified' ? 'Certified Pre-Owned' : 
               car.condition}
            </span>
          )}
          {car.featured && <span className="cdg-featured-tag">Featured</span>}
          {car.priceOptions?.includesVAT && <span className="cdg-vat-tag">Price Includes VAT</span>}
          {car.bodyStyle && <span className="cdg-body-style-tag">{car.bodyStyle}</span>}
        </div>

        {/* Specs grid */}
        <div className="cdg-specs-grid">
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Year</span>
            <span className="cdg-spec-value">{car.specifications?.year || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Make</span>
            <span className="cdg-spec-value">{car.specifications?.make || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Model</span>
            <span className="cdg-spec-value">{car.specifications?.model || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Mileage</span>
            <span className="cdg-spec-value">
              {car.specifications?.mileage 
                ? `${car.specifications.mileage.toLocaleString()} km` 
                : 'N/A'}
            </span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Engine</span>
            <span className="cdg-spec-value">{car.specifications?.engineSize || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Transmission</span>
            <span className="cdg-spec-value">{car.specifications?.transmission || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Fuel Type</span>
            <span className="cdg-spec-value">{car.specifications?.fuelType || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Drivetrain</span>
            <span className="cdg-spec-value">{car.specifications?.drivetrain || 'N/A'}</span>
          </div>
          {car.specifications?.power && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Power</span>
              <span className="cdg-spec-value">{car.specifications.power}</span>
            </div>
          )}
          {car.specifications?.exteriorColor && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Exterior Color</span>
              <span className="cdg-spec-value">{car.specifications.exteriorColor}</span>
            </div>
          )}
          {car.specifications?.interiorColor && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Interior Color</span>
              <span className="cdg-spec-value">{car.specifications.interiorColor}</span>
            </div>
          )}
        </div>

        {/* Dealer Info */}
        {car.dealer && (
          <div className="cdg-dealer-info">
            <img 
              src={car.dealer.profile?.logo || car.dealer.logo || '/images/placeholders/dealer-avatar.jpg'} 
              alt={car.dealer.businessName || car.dealer.name || 'Dealer'}
              className="cdg-dealer-avatar"
              onError={(e) => e.target.src = '/images/placeholders/dealer-avatar.jpg'}
            />
            <div className="cdg-dealer-details">
              <div className="cdg-dealer-name">
                {showDealerLink ? (
                  <Link to={`/dealerships/${car.dealer._id}`} className="cdg-dealer-link">
                    {car.dealer.businessName || car.dealer.name || 'Dealer'}
                  </Link>
                ) : (
                  car.dealer.businessName || car.dealer.name || 'Dealer'
                )}
              </div>
              <div className="cdg-dealer-meta">
                <span className="cdg-dealer-location">
                  {car.dealer.location?.city || car.dealer.city || 'Location not specified'}
                </span>
                <span className="cdg-dealer-contact">
                  {car.dealer.phone || car.dealer.contactPhone || 'Contact available'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {(() => {
          const allFeatures = [
            ...(car.features || []),
            ...(car.safetyFeatures || []),
            ...(car.comfortFeatures || []),
            ...(car.performanceFeatures || []),
            ...(car.entertainmentFeatures || [])
          ];
          
          if (allFeatures.length > 0) {
            return (
              <div className="cdg-features-section">
                <h2 className="cdg-section-title">Features & Equipment</h2>
                <div className="cdg-features-grid">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="cdg-feature-item">
                      ✓ {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Description */}
        {car.description && (
          <div className="cdg-description-section">
            <h2 className="cdg-section-title">Description</h2>
            <div className="cdg-description-content">{car.description}</div>
          </div>
        )}

        {/* Location */}
        {car.location && Object.values(car.location).some(value => value) && (
          <div className="cdg-location-section">
            <h2 className="cdg-section-title">Location</h2>
            <div className="cdg-location-details">
              {car.location.city && (
                <div className="cdg-location-item">
                  <span className="cdg-location-label">City:</span>
                  <span className="cdg-location-value">{car.location.city}</span>
                </div>
              )}
              {car.location.state && (
                <div className="cdg-location-item">
                  <span className="cdg-location-label">State:</span>
                  <span className="cdg-location-value">{car.location.state}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {car.dealer && (
          <div className="cdg-contact-section">
            <h2 className="cdg-section-title">Contact Dealer</h2>
            <div className="cdg-contact-actions">
              <button 
                className="cdg-contact-button cdg-whatsapp"
                onClick={() => {
                  const phone = car.dealer.phone || car.dealer.contactPhone || '';
                  const message = `Hi, I'm interested in the ${car.title || 'vehicle'} listed for ${formatPrice(car.price)}.`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                📱 WhatsApp
              </button>
              <button 
                className="cdg-contact-button cdg-call"
                onClick={() => {
                  const phone = car.dealer.phone || car.dealer.contactPhone || '';
                  window.open(`tel:${phone}`, '_self');
                }}
              >
                📞 Call
              </button>
              <button 
                className="cdg-contact-button cdg-email"
                onClick={() => {
                  const email = car.dealer.email || car.dealer.contactEmail || '';
                  const subject = `Inquiry about ${car.title || 'vehicle'}`;
                  const body = `Hi, I'm interested in the ${car.title || 'vehicle'} listed for ${formatPrice(car.price)}. Please provide more details.`;
                  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
                }}
              >
                ✉️ Email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SIMILAR VEHICLES SECTION - INTEGRATED */}
      {similarVehicles.length > 0 && (
        <div className="cdg-similar-vehicles">
          <div className="cdg-similar-header">
            <h3>
              {dealerVehicles.length > 0 ? (
                <>
                  More from {isPrivateSeller ? 'this seller' : 'this dealer'}
                  {similarVehicles.length > dealerVehicles.length && (
                    <span className="cdg-additional-similar"> • Similar vehicles</span>
                  )}
                </>
              ) : (
                'Similar Vehicles'
              )}
            </h3>
            <div className="cdg-vehicle-count">
              {similarVehicles.length} vehicle{similarVehicles.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="cdg-similar-items">
            {similarVehicles.map((vehicle, index) => {
              const vDealerId = typeof vehicle.dealerId === 'string' ? vehicle.dealerId : vehicle.dealerId?._id;
              const isFromSameDealer = vDealerId === dealerId;
              
              return (
                <div
                  key={vehicle._id || vehicle.id || index}
                  className={`cdg-similar-item ${animatingItems.includes(index) ? 'fade-in' : ''} ${isFromSameDealer ? 'same-dealer' : 'similar-make'}`}
                  onClick={() => handleSimilarVehicleClick(vehicle)}
                >
                  <div className="cdg-vehicle-badge">
                    {isFromSameDealer ? (
                      <span className="cdg-same-dealer-badge">
                        {isPrivateSeller ? 'Same Seller' : 'Same Dealer'}
                      </span>
                    ) : (
                      <span className="cdg-similar-badge">Similar</span>
                    )}
                  </div>
                  
                  <div className="cdg-vehicle-info">
                    <div className="cdg-vehicle-title">
                      {vehicle.title || `${vehicle.specifications?.year || ''} ${vehicle.specifications?.make || ''} ${vehicle.specifications?.model || ''}`.trim() || 'Untitled Vehicle'}
                    </div>
                    
                    <div className="cdg-vehicle-details">
                      <div className="cdg-vehicle-specs">
                        {vehicle.specifications?.year && (
                          <span className="cdg-spec">{vehicle.specifications.year}</span>
                        )}
                        {vehicle.specifications?.mileage && (
                          <span className="cdg-spec">{vehicle.specifications.mileage.toLocaleString()} km</span>
                        )}
                        {vehicle.specifications?.transmission && (
                          <span className="cdg-spec">{vehicle.specifications.transmission}</span>
                        )}
                      </div>
                      
                      <div className="cdg-vehicle-price">
                        {vehicle.price ? `P${vehicle.price.toLocaleString()}` : 'Contact for Price'}
                      </div>
                    </div>
                    
                    {vehicle.condition && (
                      <div className="cdg-vehicle-condition">
                        <span className={`cdg-condition-badge ${vehicle.condition.toLowerCase()}`}>
                          {vehicle.condition}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="cdg-view-arrow">→</div>
                </div>
              );
            })}
          </div>
          
          {dealerId && dealerVehicles.length < similarVehicles.length && (
            <div className="cdg-view-all-action">
              <button 
                className="cdg-view-all-dealer"
                onClick={() => navigate(`/dealerships/${dealerId}`)}
              >
                View all from {isPrivateSeller ? 'this seller' : 'this dealer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CarDetailsGallery;