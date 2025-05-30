// src/components/features/RentalSection/RentalVehicleDetail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './RentalVehicleDetail.css';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import ShareModal from '../../shared/ShareModal.js';
import { rentalVehicleService } from '../../../services/rentalVehicleService.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import { useAuth } from '../../../context/AuthContext.js';

const RentalVehicleDetail = () => {
  // Utility function to safely get string ID from MongoDB ObjectId or any object
  const safeGetStringId = (id) => {
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
    console.error("Failed to extract valid ID from:", id);
    return null;
  };

  const { rentalId } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [providerRoutes, setProviderRoutes] = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [views, setViews] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const shareButtonRef = useRef(null);
  const viewRecorded = useRef(false);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [providerActiveIndex, setProviderActiveIndex] = useState(0);
  const [similarActiveIndex, setSimilarActiveIndex] = useState(0);
  const providerCarouselRef = useRef(null);
  const similarCarouselRef = useRef(null);

  useEffect(() => {
    const loadRental = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await rentalVehicleService.getRentalVehicle(rentalId);
        
        if (!response || !response.success || !response.vehicle) {
          setError('Rental vehicle not found');
          return;
        }
  
        setRental(response.vehicle);
        
        const savedRentals = JSON.parse(localStorage.getItem('savedRentals') || '[]');
        setIsSaved(savedRentals.includes(response.vehicle._id));
        
        await loadRelatedContent(response.vehicle);
        
        if (!viewRecorded.current) {
          viewRecorded.current = true;
        }
      } catch (error) {
        setError('Failed to load rental vehicle details');
        console.error('Error loading rental:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadRental();
  }, [rentalId]);

  useEffect(() => {
    if (providerRoutes.length > 0) {
      initializeCarousel('provider');
    }
  }, [providerRoutes, providerActiveIndex]);
  
  useEffect(() => {
    if (similarRoutes.length > 0) {
      initializeCarousel('similar');
    }
  }, [similarRoutes, similarActiveIndex]);
  
  useEffect(() => {
    const handleResize = () => {
      if (providerRoutes.length > 0) initializeCarousel('provider');
      if (similarRoutes.length > 0) initializeCarousel('similar');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [providerRoutes, similarRoutes]);

  const loadRelatedContent = async (rentalData) => {
    try {
      if (!rentalData) {
        console.warn('No rental data available to load related content');
        return;
      }
  
      await loadProviderRentals(rentalData);
      await loadSimilarRentals(rentalData);
    } catch (error) {
      console.error('Error loading related content:', error);
    }
  };

  const loadProviderRentals = async (currentRental) => {
    try {
      const providerId = extractProviderId(currentRental);
      
      if (!providerId) {
        console.warn('No valid provider ID found for fetching provider rentals');
        setProviderRoutes([]);
        return;
      }
      
      const response = await rentalVehicleService.getProviderRentals(providerId, 1, 6);
      
      if (!response || !response.success || !response.vehicles || !Array.isArray(response.vehicles)) {
        console.warn('No valid rentals returned from provider rentals API');
        setProviderRoutes([]);
        return;
      }
      
      const filteredRentals = response.vehicles.filter(item => {
        if (!item || (!item._id && !item.id)) return false;
        const itemId = item._id || item.id;
        const currentRentalId = currentRental._id || currentRental.id;
        return itemId.toString() !== currentRentalId.toString();
      });
      
      setProviderRoutes(filteredRentals.slice(0, 3));
    } catch (error) {
      console.error('Error loading provider rentals:', error);
      setProviderRoutes([]);
    }
  };

  const loadSimilarRentals = async (currentRental) => {
    try {
      console.log('Starting similar rentals search for:', currentRental?.name || currentRental?.title);
      
      let filters = {};
      
      if (currentRental.category) {
        filters.category = currentRental.category;
      }
      
      if (currentRental.specifications?.make) {
        filters.make = currentRental.specifications.make;
      }
      
      if (Object.keys(filters).length === 0) {
        if (currentRental.specifications?.transmission) {
          filters.transmission = currentRental.specifications.transmission;
        } else if (currentRental.rentalType) {
          filters.rentalType = currentRental.rentalType;
        } else {
          if (currentRental.rates && currentRental.rates.daily) {
            const dailyRate = parseInt(currentRental.rates.daily);
            if (!isNaN(dailyRate)) {
              filters.minPrice = Math.floor(dailyRate * 0.6);
              filters.maxPrice = Math.ceil(dailyRate * 1.4);
            }
          }
        }
      }
      
      filters.status = 'available';
      
      const response = await rentalVehicleService.getRentalVehicles(filters, 1, 6);
      
      if (!response || !response.success || !response.vehicles || !Array.isArray(response.vehicles)) {
        console.warn('No valid rentals returned from similar rentals API');
        setSimilarRoutes([]);
        return;
      }
      
      const filteredRentals = response.vehicles.filter(item => {
        if (!item || (!item._id && !item.id)) return false;
        const itemId = item._id || item.id;
        const currentRentalId = currentRental._id || currentRental.id;
        return itemId.toString() !== currentRentalId.toString();
      });
      
      if (filteredRentals.length === 0) {
        const fallbackResponse = await rentalVehicleService.getRentalVehicles({ status: 'available' }, 1, 5);
        
        if (fallbackResponse && fallbackResponse.success && fallbackResponse.vehicles && Array.isArray(fallbackResponse.vehicles)) {
          const fallbackFiltered = fallbackResponse.vehicles.filter(item => {
            if (!item || (!item._id && !item.id)) return false;
            const itemId = item._id || item.id;
            const currentRentalId = currentRental._id || currentRental.id;
            return itemId.toString() !== currentRentalId.toString();
          });
          
          setSimilarRoutes(fallbackFiltered.slice(0, 3));
        } else {
          setSimilarRoutes([]);
        }
      } else {
        setSimilarRoutes(filteredRentals.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading similar rentals:', error);
      setSimilarRoutes([]);
    }
  };

  // Helper function to get image URL - Updated for S3
  const getImageUrl = (image) => {
    if (!image) {
      return '/images/placeholders/car.jpg';
    }

    let imageUrl = '';
    
    if (typeof image === 'string') {
      imageUrl = image;
    } else if (image && typeof image === 'object') {
      imageUrl = image.url || image.thumbnail || '';
      
      if (image.key && !imageUrl) {
        console.warn('Image has S3 key but no URL:', image);
      }
    }
    
    if (!imageUrl) {
      return '/images/placeholders/car.jpg';
    }
    
    // S3 URLs will be full URLs with https://
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Handle relative paths (legacy local storage)
    // Server should redirect these to S3
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    return imageUrl;
  };

  const extractProviderId = (rental) => {
    if (!rental) return null;
    
    if (rental.providerId) {
      return safeGetStringId(rental.providerId);
    }
    
    if (rental.provider && typeof rental.provider === 'object') {
      if (rental.provider._id) {
        return safeGetStringId(rental.provider._id);
      }
      if (rental.provider.id) {
        return safeGetStringId(rental.provider.id);
      }
    }
    
    console.warn('Could not extract provider ID from rental data');
    return null;
  };

  const handleNavigation = (direction) => {
    if (!rental?.images?.length) return;
    
    setSelectedImage(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : rental.images.length - 1;
      } else {
        return prev < rental.images.length - 1 ? prev + 1 : 0;
      }
    });
  };

  const handleSaveRental = () => {
    if (!rental) return;
    
    const savedRentals = JSON.parse(localStorage.getItem('savedRentals') || '[]');
    if (isSaved) {
      const newSaved = savedRentals.filter(id => id !== rental._id);
      localStorage.setItem('savedRentals', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      const newSaved = [...savedRentals, rental._id];
      localStorage.setItem('savedRentals', JSON.stringify(newSaved));
      setIsSaved(true);
    }
  };

  const handleWhatsAppClick = () => {
    if (!rental) return;
    
    const phone = rental.provider?.contact?.phone || 
                  (typeof rental.provider === 'object' ? rental.provider.phone : null);
    
    if (!phone) {
      dispatch(addNotification({
        type: 'error',
        message: 'Provider contact information is not available'
      }));
      return;
    }
    
    const vehicleName = rental.name || rental.title || `${rental.specifications?.make || ''} ${rental.specifications?.model || ''}`;
    const rentalType = rental.category || rental.trailerType || 'Vehicle';
    
    const message = `
*RENTAL INQUIRY*

Hello, I would like to rent this ${rentalType}:
*${vehicleName}*

Please provide information about availability and the rental process.
`;
    
    const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const navigateCarousel = (carouselType, direction) => {
    const isProvider = carouselType === 'provider';
    const rentals = isProvider ? providerRoutes : similarRoutes;
    const setIndex = isProvider ? setProviderActiveIndex : setSimilarActiveIndex;
    const currentIndex = isProvider ? providerActiveIndex : similarActiveIndex;
    const carouselRef = isProvider ? providerCarouselRef : similarCarouselRef;
    
    if (!rentals || rentals.length <= 1) return;
    
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    const maxIndex = Math.max(0, rentals.length - itemsPerView);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = Math.min(currentIndex + 1, maxIndex);
    } else {
      nextIndex = Math.max(0, currentIndex - 1);
    }
    
    if (nextIndex !== currentIndex) {
      setIndex(nextIndex);
      
      if (carouselRef.current) {
        const track = carouselRef.current.querySelector('.rv-detail-carousel-track');
        if (track) {
          const slideWidthPercent = 100 / itemsPerView;
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  };

  const initializeCarousel = (carouselType) => {
    const isProvider = carouselType === 'provider';
    const rentals = isProvider ? providerRoutes : similarRoutes;
    const carouselRef = isProvider ? providerCarouselRef : similarCarouselRef;
    const currentIndex = isProvider ? providerActiveIndex : similarActiveIndex;
    
    if (!rentals || rentals.length <= 1 || !carouselRef.current) return;
    
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    const track = carouselRef.current.querySelector('.rv-detail-carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
    }
  };

  if (loading) {
    return (
      <div className="rv-detail-loading-overlay">
        <div className="rv-detail-loader"></div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="rv-detail-error-container">
        <h2>{error || 'Rental vehicle not found'}</h2>
        <button onClick={() => navigate('/rentals')}>
          ← Back to Rentals
        </button>
      </div>
    );
  }

  // Extract image URLs from rental.images array - Updated for S3
  const imageUrls = rental.images && rental.images.length > 0 
    ? rental.images.map(img => getImageUrl(img))
    : ['/images/placeholders/car.jpg'];

  const getName = () => {
    return rental.name || rental.title || `${rental.specifications?.make || ''} ${rental.specifications?.model || ''}`;
  };
  
  const getCategory = () => {
    return rental.category || rental.trailerType || 'Vehicle';
  };
  
  const getFeatures = () => {
    return rental.features || [];
  };

  return (
    <div className="rv-detail-container">
      <button 
        className="rv-detail-back-button" 
        onClick={() => navigate('/rentals')}
      >
        ← Back to Rentals
      </button>

      <div className="rv-detail-content">
        <div className="rv-detail-main-content">
          <div className="rv-detail-gallery">
            <div className="rv-detail-main-image-container">
              <div className="rv-detail-main-image">
                <img 
                  src={imageUrls[selectedImage]} 
                  alt={getName()}
                  className="rv-detail-gallery-image"
                  onError={(e) => {
                    console.log(`Gallery image failed to load: ${e.target.src}`);
                    
                    // For S3 URLs, go straight to placeholder
                    if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                      e.target.src = '/images/placeholders/car.jpg';
                      return;
                    }
                    
                    // For local paths, just use placeholder
                    e.target.src = '/images/placeholders/car.jpg';
                  }}
                />
                <div className="rv-detail-gallery-actions">
                  <button 
                    className={`rv-detail-action-button ${isSaved ? 'saved' : ''}`}
                    onClick={handleSaveRental}
                    aria-label={isSaved ? 'Remove from saved' : 'Save rental'}
                  >
                    {isSaved ? '♥' : '♡'}
                  </button>
                  <button 
                    ref={shareButtonRef}
                    className="rv-detail-action-button"
                    onClick={() => setShowShareModal(true)}
                    aria-label="Share rental"
                  >
                    ↗
                  </button>
                </div>
                
                {imageUrls.length > 1 && (
                  <>
                    <button 
                      className="rv-detail-gallery-nav prev" 
                      onClick={() => handleNavigation('prev')}
                      aria-label="Previous image"
                    >
                      ❮
                    </button>
                    <button 
                      className="rv-detail-gallery-nav next" 
                      onClick={() => handleNavigation('next')}
                      aria-label="Next image"
                    >
                      ❯
                    </button>
                  </>
                )}
                
                {imageUrls.length > 1 && (
                  <div className="rv-detail-image-counter">
                    {selectedImage + 1} / {imageUrls.length}
                  </div>
                )}
              </div>
            </div>
            
            {imageUrls.length > 1 && (
              <div className="rv-detail-thumbnail-strip">
                {imageUrls.map((image, index) => (
                  <div 
                    key={index}
                    className={`rv-detail-thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${getName()} view ${index + 1}`} 
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        // For S3 URLs, go straight to placeholder
                        if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                          e.target.src = '/images/placeholders/car.jpg';
                          return;
                        }
                        
                        e.target.src = '/images/placeholders/car.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rv-detail-info">
            <div className="rv-detail-header">
              <div className="rv-detail-title-container">
                <h1 className="rv-detail-title">{getName()}</h1>
                <div className="rv-detail-badges-container">
                  <div className="rv-detail-category-badge">
                    {getCategory()}
                  </div>
                  {rental.availability && (
                    <div className={`rv-detail-availability-badge ${rental.availability.toLowerCase()}`}>
                      {rental.availability}
                    </div>
                  )}
                </div>
              </div>
              <div className="rv-detail-price-container">
                <div className="rv-detail-rental-price rv-detail-pula-price">
                  P {(rental.rates?.daily || 0).toLocaleString()} / day
                </div>
                {rental.rates?.weekly && (
                  <div className="rv-detail-weekly-rate">
                    P {rental.rates.weekly.toLocaleString()} / week
                  </div>
                )}
                {rental.rates?.monthly && (
                  <div className="rv-detail-monthly-rate">
                    P {rental.rates.monthly.toLocaleString()} / month
                  </div>
                )}
                {rental.rates?.security && (
                  <div className="rv-detail-security-deposit">
                    + P {rental.rates.security.toLocaleString()} security deposit
                  </div>
                )}
              </div>
            </div>

            <div className="rv-detail-specs-grid">
              <div className="rv-detail-specs-column">
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Make</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.make || 'N/A'}</span>
                </div>
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Model</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.model || 'N/A'}</span>
                </div>
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Year</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.year || 'N/A'}</span>
                </div>
              </div>
              
              <div className="rv-detail-specs-column">
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Transmission</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.transmission ? 
                    (rental.specifications.transmission.charAt(0).toUpperCase() + rental.specifications.transmission.slice(1)) : 'N/A'}</span>
                </div>
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Fuel Type</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.fuelType ? 
                    (rental.specifications.fuelType.charAt(0).toUpperCase() + rental.specifications.fuelType.slice(1)) : 'N/A'}</span>
                </div>
                <div className="rv-detail-spec-item">
                  <span className="rv-detail-spec-label">Seats</span>
                  <span className="rv-detail-spec-value">{rental.specifications?.seats || 'N/A'}</span>
                </div>
              </div>
              
              <div className="rv-detail-specs-column">
                {rental.specifications?.doors && (
                  <div className="rv-detail-spec-item">
                    <span className="rv-detail-spec-label">Doors</span>
                    <span className="rv-detail-spec-value">{rental.specifications.doors}</span>
                  </div>
                )}
                {rental.specifications?.engineSize && (
                  <div className="rv-detail-spec-item">
                    <span className="rv-detail-spec-label">Engine Size</span>
                    <span className="rv-detail-spec-value">{rental.specifications.engineSize}</span>
                  </div>
                )}
                {rental.usageType && (
                  <div className="rv-detail-spec-item">
                    <span className="rv-detail-spec-label">Usage Type</span>
                    <span className="rv-detail-spec-value">{rental.usageType}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rv-detail-tabs">
              <button 
                className={`rv-detail-tab-button ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`rv-detail-tab-button ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                Features
              </button>
              <button 
                className={`rv-detail-tab-button ${activeTab === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('terms')}
              >
                Rental Terms
              </button>
              {rental.location && (
                <button 
                  className={`rv-detail-tab-button ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveTab('location')}
                >
                  Location
                </button>
              )}
            </div>

            {activeTab === 'details' && (
              <div className="rv-detail-description-section">
                <h2>Description</h2>
                <div className="rv-detail-description-content">
                  {rental.description || 'No detailed description provided for this rental vehicle.'}
                </div>
                
                {rental.shortDescription && rental.shortDescription !== rental.description && (
                  <div className="rv-detail-short-description">
                    <h3>Summary</h3>
                    <p>{rental.shortDescription}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="rv-detail-features-section">
                <h2>Features & Equipment</h2>
                <div className="rv-detail-features-grid">
                  {getFeatures().length > 0 ? (
                    getFeatures().map((feature, index) => (
                      <div key={index} className="rv-detail-feature-item">
                        ✓ {feature}
                      </div>
                    ))
                  ) : (
                    <p className="rv-detail-no-features">No specific features listed for this rental.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="rv-detail-terms-section">
                <h2>Rental Terms & Conditions</h2>
                
                <div className="rv-detail-terms-grid">
                  {rental.rentalTerms?.minimumAge && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Minimum Age:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.minimumAge} years</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.minimumRentalPeriod && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Minimum Rental Period:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.minimumRentalPeriod} day(s)</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.depositRequired !== undefined && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Deposit Required:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.depositRequired ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.licenseRequired !== undefined && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">License Required:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.licenseRequired ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.fuelPolicy && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Fuel Policy:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.fuelPolicy.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.mileageLimit !== undefined && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Mileage Limit:</span>
                      <span className="rv-detail-term-value">{rental.rentalTerms.mileageLimit > 0 ? `${rental.rentalTerms.mileageLimit} km per day` : 'Unlimited'}</span>
                    </div>
                  )}
                  
                  {rental.rentalTerms?.lateFeeRate && (
                    <div className="rv-detail-term-item">
                      <span className="rv-detail-term-label">Late Fee:</span>
                      <span className="rv-detail-term-value">P {rental.rentalTerms.lateFeeRate.toLocaleString()} per day</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'location' && rental.location && (
              <div className="rv-detail-location-section">
                <h2>Pick-up Location</h2>
                
                <div className="rv-detail-location-details">
                  {rental.location.address && (
                    <div className="rv-detail-location-address">
                      <h3>Address</h3>
                      <p>{rental.location.address}</p>
                      <p>
                        {rental.location.city}
                        {rental.location.state ? `, ${rental.location.state}` : ''}
                        {rental.location.country ? `, ${rental.location.country}` : ''}
                        {rental.location.postalCode ? ` ${rental.location.postalCode}` : ''}
                      </p>
                    </div>
                  )}
                  
                  <div className="rv-detail-location-map-placeholder">
                    <p>Map view coming soon</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rv-detail-provider-sidebar">
          <div className="rv-detail-provider-section">
            <div className="rv-detail-provider-header">
              <h2>Provider Information</h2>
            </div>
            <div className="rv-detail-provider-card">
              <div className="rv-detail-provider-header-compact">
                <img 
                  src={getImageUrl(
                    (typeof rental.provider === 'object' && rental.provider.logo) 
                      ? rental.provider.logo 
                      : rental.provider?.profile?.logo
                  )} 
                  alt={typeof rental.provider === 'object' ? rental.provider.businessName || rental.provider.name : rental.provider}
                  className="rv-detail-provider-avatar"
                  onError={(e) => {
                    e.target.src = '/images/placeholders/dealer-avatar.jpg';
                  }}
                />
                <div className="rv-detail-provider-details">
                  <h3 className="rv-detail-provider-name">
                    {typeof rental.provider === 'object' 
                      ? rental.provider.businessName || rental.provider.name 
                      : rental.provider || 'Rental Provider'}
                  </h3>
                  <p className="rv-detail-provider-location">
                    {typeof rental.provider === 'object' && rental.provider.location
                      ? `${rental.provider.location.city || ''}${rental.provider.location.country ? `, ${rental.provider.location.country}` : ''}`
                      : rental.location?.city || 'Location not specified'}
                  </p>
                  {typeof rental.provider === 'object' && rental.provider.verification?.status === 'verified' && (
                    <span className="rv-detail-provider-verified-tag">✓ Verified</span>
                  )}
                </div>
              </div>
              
              <div className="rv-detail-provider-stats">
                <div className="rv-detail-stat-item">
                  <div className="rv-detail-stat-value">
                    {typeof rental.provider === 'object' && rental.provider.metrics
                      ? rental.provider.metrics.totalListings || 0
                      : '?'}
                  </div>
                  <div className="rv-detail-stat-label">Rentals</div>
                </div>
                <div className="rv-detail-stat-item">
                  <div className="rv-detail-stat-value">
                    {typeof rental.provider === 'object' && rental.provider.rating
                      ? rental.provider.rating.average.toFixed(1)
                      : rental.averageRating || 'N/A'}
                  </div>
                  <div className="rv-detail-stat-label">Rating</div>
                </div>
                {rental.reviews && (
                  <div className="rv-detail-stat-item">
                    <div className="rv-detail-stat-value">{rental.reviews.length}</div>
                    <div className="rv-detail-stat-label">Reviews</div>
                  </div>
                )}
              </div>
              
              {typeof rental.provider === 'object' && rental.provider.contact && (
                <div className="rv-detail-provider-contact-grid">
                  {rental.provider.contact.email && (
                    <div className="rv-detail-contact-grid-item">
                      <span className="rv-detail-contact-icon">✉️</span>
                      <span className="rv-detail-contact-info">{rental.provider.contact.email}</span>
                    </div>
                  )}
                  {rental.provider.contact.phone && (
                    <div className="rv-detail-contact-grid-item">
                      <span className="rv-detail-contact-icon">📞</span>
                      <span className="rv-detail-contact-info">{rental.provider.contact.phone}</span>
                    </div>
                  )}
                  {rental.provider.contact.website && (
                    <div className="rv-detail-contact-grid-item">
                      <span className="rv-detail-contact-icon">🌐</span>
                      <a 
                        href={rental.provider.contact.website.startsWith('http') ? rental.provider.contact.website : `https://${rental.provider.contact.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="rv-detail-contact-info rv-detail-website-link"
                      >
                        {rental.provider.contact.website.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="rv-detail-contact-buttons">
                <button 
                  className="rv-detail-contact-button whatsapp"
                  onClick={handleWhatsAppClick}
                >
                  Inquire via WhatsApp
                </button>
                
                {typeof rental.provider === 'object' && rental.provider.contact?.phone && (
                  <button 
                    className="rv-detail-contact-button contact-provider"
                    onClick={() => window.open(`tel:${rental.provider.contact.phone}`)}
                  >
                    Call
                  </button>
                )}
                
                <button 
                  className="rv-detail-contact-button view-provider"
                  onClick={() => {
                    const providerId = extractProviderId(rental);
                    
                    if (providerId) {
                      navigate(`/services/${providerId}`);
                    } else {
                      dispatch(addNotification({
                        type: 'error',
                        message: 'Provider details not available'
                      }));
                    }
                  }}
                >
                  View Provider
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rv-detail-related-listings-section">
          <h2 className="rv-detail-related-section-title">
            More from {typeof rental.provider === 'object' 
              ? rental.provider.businessName || rental.provider.name 
              : rental.provider || 'this provider'}
          </h2>
          
          {providerRoutes && providerRoutes.length > 0 ? (
            <div className="rv-detail-carousel-container provider-carousel">
              {providerRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'prev')}
                  className="rv-detail-carousel-nav prev"
                  disabled={providerActiveIndex === 0}
                  aria-label="Previous provider rental"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="rv-detail-carousel-viewport" ref={providerCarouselRef}>
                <div className="rv-detail-carousel-track">
                  {providerRoutes.map((item, index) => (
                    <div className="rv-detail-carousel-slide" key={item._id || item.id || index}>
                      <RentalCard 
                        vehicle={item} 
                        compact={true}
                        onShare={(itemToShare) => {
                          setSelectedItem(itemToShare);
                          setShowShareModal(true);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {providerRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'next')}
                  className="rv-detail-carousel-nav next"
                  disabled={providerActiveIndex >= providerRoutes.length - 1}
                  aria-label="Next provider rental"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {providerRoutes.length > 1 && (
                <div className="rv-detail-carousel-dots">
                  {providerRoutes.map((_, index) => (
                    <button
                      key={index}
                      className={`rv-detail-carousel-dot ${providerActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setProviderActiveIndex(index);
                        initializeCarousel('provider');
                      }}
                      aria-label={`Go to provider rental ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rv-detail-no-listings">
              <p>No other rentals available from this provider.</p>
            </div>
          )}
        </div>

        <div className="rv-detail-related-listings-section">
          <h2 className="rv-detail-related-section-title">Similar Rentals</h2>
          
          {similarRoutes && similarRoutes.length > 0 ? (
            <div className="rv-detail-carousel-container similar-carousel">
              {similarRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'prev')}
                  className="rv-detail-carousel-nav prev"
                  disabled={similarActiveIndex === 0}
                  aria-label="Previous similar rental"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="rv-detail-carousel-viewport" ref={similarCarouselRef}>
                <div className="rv-detail-carousel-track">
                  {similarRoutes.map((item, index) => (
                    <div className="rv-detail-carousel-slide" key={item._id || item.id || index}>
                      <RentalCard 
                        vehicle={item} 
                        compact={true}
                        onShare={(itemToShare) => {
                          setSelectedItem(itemToShare);
                          setShowShareModal(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {similarRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'next')}
                  className="rv-detail-carousel-nav next"
                  disabled={similarActiveIndex >= similarRoutes.length - 1}
                  aria-label="Next similar rental"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {similarRoutes.length > 1 && (
                <div className="rv-detail-carousel-dots">
                  {similarRoutes.map((_, index) => (
                    <button
                      key={index}
                      className={`rv-detail-carousel-dot ${similarActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setSimilarActiveIndex(index);
                        initializeCarousel('similar');
                      }}
                      aria-label={`Go to similar rental ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rv-detail-no-listings">
              <p>No similar rentals found.</p>
            </div>
          )}
        </div>

        {showShareModal && (
          <ShareModal 
            rental={rental}
            onClose={() => setShowShareModal(false)}
            buttonRef={shareButtonRef}
          />
        )}
      </div>
    </div>
  );
};

export default RentalVehicleDetail;