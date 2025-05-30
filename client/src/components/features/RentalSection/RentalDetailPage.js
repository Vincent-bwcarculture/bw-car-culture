// src/components/features/RentalsSection/RentalDetailPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Share, Phone, Mail } from 'lucide-react';
import './RentalDetailPage.css';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import ShareModal from '../../shared/ShareModal.js';
import { rentalVehicleService } from '../../../services/rentalVehicleService.js';

const RentalDetailPage = () => {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [providerRentals, setProviderRentals] = useState([]);
  const [similarRentals, setSimilarRentals] = useState([]);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const shareButtonRef = useRef(null);
  const dispatch = useDispatch();
  const [providerActiveIndex, setProviderActiveIndex] = useState(0);
  const [similarActiveIndex, setSimilarActiveIndex] = useState(0);
  const providerCarouselRef = useRef(null);
  const similarCarouselRef = useRef(null);

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
        
        if (!viewRecorded) {
          setViewRecorded(true);
        }
      } catch (error) {
        setError('Failed to load rental details');
        console.error('Error loading rental:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadRental();
  }, [rentalId, viewRecorded]);

  const loadRelatedContent = async (rentalData) => {
    try {
      if (rentalData.providerId) {
        const providerId = safeGetStringId(rentalData.providerId);
        const otherRentals = await rentalVehicleService.getProviderRentals(providerId);
        
        if (otherRentals.success && Array.isArray(otherRentals.vehicles)) {
          const filteredRentals = otherRentals.vehicles.filter(
            item => safeGetStringId(item._id || item.id) !== safeGetStringId(rentalData._id)
          ).slice(0, 3);
          setProviderRentals(filteredRentals);
        }
      }
      
      if (rentalData.category) {
        const filters = { category: rentalData.category, status: 'available' };
        const response = await rentalVehicleService.getRentalVehicles(filters, 1, 4);
        
        if (response.success && Array.isArray(response.vehicles)) {
          const filtered = response.vehicles.filter(
            item => safeGetStringId(item._id || item.id) !== safeGetStringId(rentalData._id)
          ).slice(0, 3);
          setSimilarRentals(filtered);
        }
      }
    } catch (error) {
      console.error('Error loading related content:', error);
    }
  };

  useEffect(() => {
    if (providerRentals.length > 0) {
      initializeCarousel('provider');
    }
  }, [providerRentals, providerActiveIndex]);
  
  useEffect(() => {
    if (similarRentals.length > 0) {
      initializeCarousel('similar');
    }
  }, [similarRentals, similarActiveIndex]);
  
  useEffect(() => {
    const handleResize = () => {
      if (providerRentals.length > 0) initializeCarousel('provider');
      if (similarRentals.length > 0) initializeCarousel('similar');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [providerRentals, similarRentals]);

  const navigateCarousel = (carouselType, direction) => {
    const isProvider = carouselType === 'provider';
    const rentals = isProvider ? providerRentals : similarRentals;
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
        const track = carouselRef.current.querySelector('.carousel-track');
        if (track) {
          const slideWidthPercent = 100 / itemsPerView;
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  };

  const initializeCarousel = (carouselType) => {
    const isProvider = carouselType === 'provider';
    const rentals = isProvider ? providerRentals : similarRentals;
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
    
    const track = carouselRef.current.querySelector('.carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
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
      
      dispatch(addNotification({
        id: Date.now(),
        type: 'info',
        message: 'Removed from saved rentals'
      }));
    } else {
      const newSaved = [...savedRentals, rental._id];
      localStorage.setItem('savedRentals', JSON.stringify(newSaved));
      setIsSaved(true);
      
      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: 'Added to saved rentals'
      }));
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleWhatsAppClick = () => {
    if (!rental?.providerContact?.phone && !rental?.provider?.contact?.phone) return;
    
    const phone = rental.providerContact?.phone || rental.provider?.contact?.phone;
    const message = `Hello ${rental.provider?.businessName || rental.provider}, I'm interested in renting the ${rental.name || rental.title} (${rental.category}) for P${rental.rates?.daily}/day`;
    
    const formattedPhone = phone.startsWith('+') ? 
      phone.replace(/\s+/g, '') : 
      `+267${phone.replace(/\s+/g, '')}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="rental-loading-overlay">
        <div className="rental-loader"></div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="rental-error-container">
        <h2>{error || 'Rental vehicle not found'}</h2>
        <button onClick={() => navigate('/rentals')} className="rental-back-button">
          ← Back to Rentals
        </button>
      </div>
    );
  }

  // Get image URLs - Updated for S3
  const imageUrls = rental.images && rental.images.length > 0 
    ? rental.images.map(img => getImageUrl(img))
    : ['/images/placeholders/car.jpg'];

  const getName = () => {
    return rental.name || rental.title || `${rental.specifications?.make || ''} ${rental.specifications?.model || ''}`;
  };

  return (
    <div className="rental-detail-container">
      <button 
        className="rental-back-button" 
        onClick={() => navigate('/rentals')}
      >
        <ChevronLeft size={18} /> Back to Rentals
      </button>

      <div className="rental-content">
        <div className="rental-main-content">
          <div className="rental-gallery">
            <div className="rental-main-image-container">
              <div className="rental-main-image">
                <img 
                  src={imageUrls[selectedImage]} 
                  alt={getName()}
                  className="rental-gallery-image"
                  onError={(e) => {
                    console.log(`Image failed to load: ${e.target.src}`);
                    
                    // For S3 URLs, go straight to placeholder
                    if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                      e.target.src = '/images/placeholders/car.jpg';
                      return;
                    }
                    
                    e.target.src = '/images/placeholders/car.jpg';
                  }}
                />
                <div className="rental-gallery-actions">
                  <button 
                    className={`rental-action-button ${isSaved ? 'saved' : ''}`}
                    onClick={handleSaveRental}
                    aria-label={isSaved ? 'Remove from saved' : 'Save rental'}
                  >
                    <Heart size={16} fill={isSaved ? "#fff" : "none"} />
                  </button>
                  <button 
                    ref={shareButtonRef}
                    className="rental-action-button"
                    onClick={handleShare}
                    aria-label="Share rental"
                  >
                    <Share size={16} />
                  </button>
                </div>
                
                {imageUrls.length > 1 && (
                  <>
                    <button 
                      className="rental-gallery-nav prev" 
                      onClick={() => handleNavigation('prev')}
                      aria-label="Previous image"
                    >
                      ❮
                    </button>
                    <button 
                      className="rental-gallery-nav next" 
                      onClick={() => handleNavigation('next')}
                      aria-label="Next image"
                    >
                      ❯
                    </button>
                  </>
                )}
                
                {imageUrls.length > 1 && (
                  <div className="rental-image-counter">
                    {selectedImage + 1} / {imageUrls.length}
                  </div>
                )}
              </div>
            </div>
            
            {imageUrls.length > 1 && (
              <div className="rental-thumbnail-strip">
                {imageUrls.map((image, index) => (
                  <div 
                    key={index}
                    className={`rental-thumbnail ${selectedImage === index ? 'active' : ''}`}
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

          <div className="rental-info">
            <div className="rental-header">
              <div className="rental-title-container">
                <h1 className="rental-title">{getName()}</h1>
                <div className="rental-badges-container">
                  <div className={`rental-category-badge ${getCategoryClass(rental.category)}`}>
                    {rental.category}
                  </div>
                  {rental.usageType && (
                    <div className="rental-usage-badge">
                      {rental.usageType}
                    </div>
                  )}
                </div>
              </div>
              <div className="rental-price-container">
                <div className="rental-price">
                  P {rental.rates?.daily?.toLocaleString() || 0}/day
                </div>
                {rental.rates?.weekly && (
                  <div className="rental-weekly-price">
                    P {rental.rates.weekly.toLocaleString()}/week
                  </div>
                )}
                {rental.rates?.monthly && (
                  <div className="rental-monthly-price">
                    P {rental.rates.monthly.toLocaleString()}/month
                  </div>
                )}
                {rental.rates?.security && (
                  <div className="rental-security-badge">
                    Security Deposit: P {rental.rates.security.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="rental-specs-grid">
              <div className="rental-specs-column">
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Transmission</span>
                  <span className="rental-spec-value">{rental.specifications?.transmission || 'N/A'}</span>
                </div>
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Fuel Type</span>
                  <span className="rental-spec-value">{rental.specifications?.fuelType || 'N/A'}</span>
                </div>
              </div>
              
              <div className="rental-specs-column">
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Year</span>
                  <span className="rental-spec-value">{rental.specifications?.year || 'N/A'}</span>
                </div>
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Seats</span>
                  <span className="rental-spec-value">{rental.specifications?.seats || 'N/A'}</span>
                </div>
              </div>
              
              <div className="rental-specs-column">
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Usage</span>
                  <span className="rental-spec-value">{rental.usageType || 'Standard'}</span>
                </div>
                <div className="rental-spec-item">
                  <span className="rental-spec-label">Availability</span>
                  <span className={`rental-spec-value rental-availability ${getAvailabilityClass(rental.availability)}`}>
                    {rental.availability || 'Available'}
                  </span>
                </div>
              </div>
            </div>

            {rental.description && (
              <div className="rental-description-section">
                <h2>Description</h2>
                <div className="rental-description-content">
                  {rental.description}
                </div>
              </div>
            )}

            <div className="rental-features-tabs">
              <button 
                className={`rental-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                Features
              </button>
              <button 
                className={`rental-tab-button ${activeTab === 'requirements' ? 'active' : ''}`}
                onClick={() => setActiveTab('requirements')}
              >
                Rental Requirements
              </button>
              <button 
                className={`rental-tab-button ${activeTab === 'insurance' ? 'active' : ''}`}
                onClick={() => setActiveTab('insurance')}
              >
                Insurance Options
              </button>
              <button 
                className={`rental-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            {rental.features && activeTab === 'general' && (
              <div className="rental-features-section">
                <h2>Vehicle Features</h2>
                <div className="rental-features-grid">
                  {rental.features.map((feature, index) => (
                    <div key={index} className="rental-feature-item">
                      ✓ {feature}
                    </div>
                  ))}
                </div>
                
                {rental.additionalInfo?.pickupLocations && rental.additionalInfo.pickupLocations.length > 0 && (
                  <div className="rental-pickup-section">
                    <h3>Pickup Locations</h3>
                    <ul className="rental-pickup-list">
                      {rental.additionalInfo.pickupLocations.map((location, index) => (
                        <li key={index} className="rental-pickup-item">
                          {location}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {rental.additionalInfo?.rentalRequirements && activeTab === 'requirements' && (
              <div className="rental-requirements-section">
                <h2>Rental Requirements</h2>
                <ul className="rental-requirements-list">
                  {rental.additionalInfo.rentalRequirements.map((requirement, index) => (
                    <li key={index} className="rental-requirement-item">
                      {requirement}
                    </li>
                  ))}
                </ul>
                
                {rental.additionalInfo?.restrictions && rental.additionalInfo.restrictions.length > 0 && (
                  <div className="rental-restrictions-section">
                    <h3>Restrictions & Policies</h3>
                    <ul className="rental-restrictions-list">
                      {rental.additionalInfo.restrictions.map((restriction, index) => (
                        <li key={index} className="rental-restriction-item">
                          {restriction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {rental.additionalInfo?.insuranceOptions && activeTab === 'insurance' && (
              <div className="rental-insurance-section">
                <h2>Insurance Options</h2>
                <div className="rental-insurance-options">
                  {rental.additionalInfo.insuranceOptions.map((option, index) => (
                    <div key={index} className="rental-insurance-option">
                      <div className="rental-insurance-header">
                        <h3 className="rental-insurance-name">{option.name}</h3>
                        <div className="rental-insurance-price">
                          {option.price ? `P${option.price}/day` : option.coverage}
                        </div>
                      </div>
                      <div className="rental-insurance-description">
                        {option.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rental.reviews && activeTab === 'reviews' && (
              <div className="rental-reviews-section">
                <h2>Customer Reviews</h2>
                {rental.reviews.length > 0 ? (
                  <div className="rental-reviews-list">
                    {rental.reviews.map((review, index) => (
                      <div key={index} className="rental-review">
                        <div className="rental-review-header">
                          <div className="rental-review-user">{review.user}</div>
                          <div className="rental-review-rating">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </div>
                        </div>
                        <div className="rental-review-date">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="rental-review-comment">
                          {review.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rental-no-reviews">No reviews yet for this vehicle.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rental-sidebar">
          <div className="rental-provider-section">
            <div className="rental-provider-header">
              <h2>Provider Information</h2>
            </div>
            <div className="rental-provider-card">
              <div className="rental-provider-header-compact">
                <img 
                  src={getImageUrl(rental.providerLogo || rental.provider?.logo || rental.provider?.profile?.logo)} 
                  alt={rental.provider?.businessName || rental.provider}
                  className="rental-provider-avatar"
                  onError={(e) => {
                    e.target.src = '/images/placeholders/dealer-avatar.jpg';
                  }}
                />
                <div className="rental-provider-details">
                  <h3 className="rental-provider-name">{rental.provider?.businessName || rental.provider}</h3>
                  <p className="rental-provider-location">
                    {rental.providerLocation || rental.provider?.location?.city}
                  </p>
                </div>
              </div>
              
              <div className="rental-provider-stats">
                <div className="rental-stat-item">
                  <div className="rental-stat-value">
                    {rental.reviews ? (rental.reviews.reduce((acc, review) => acc + review.rating, 0) / rental.reviews.length).toFixed(1) : 'N/A'}
                  </div>
                  <div className="rental-stat-label">Rating</div>
                </div>
                <div className="rental-stat-item">
                  <div className="rental-stat-value">
                    {rental.reviews ? rental.reviews.length : 0}
                  </div>
                  <div className="rental-stat-label">Reviews</div>
                </div>
              </div>
              
              {(rental.providerContact || rental.provider?.contact) && (
                <div className="rental-provider-contact-grid">
                  {(rental.providerContact?.email || rental.provider?.contact?.email) && (
                    <div className="rental-contact-grid-item">
                      <span className="rental-contact-icon"><Mail size={16} /></span>
                      <span className="rental-contact-info">{rental.providerContact?.email || rental.provider.contact.email}</span>
                    </div>
                  )}
                  {(rental.providerContact?.phone || rental.provider?.contact?.phone) && (
                    <div className="rental-contact-grid-item">
                      <span className="rental-contact-icon"><Phone size={16} /></span>
                      <span className="rental-contact-info">{rental.providerContact?.phone || rental.provider.contact.phone}</span>
                    </div>
                  )}
                  {(rental.providerContact?.website || rental.provider?.contact?.website) && (
                    <div className="rental-contact-grid-item">
                      <span className="rental-contact-icon">🌐</span>
                      <a 
                        href={(rental.providerContact?.website || rental.provider.contact.website).startsWith('http') ? (rental.providerContact?.website || rental.provider.contact.website) : `https://${rental.providerContact?.website || rental.provider.contact.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="rental-contact-info rental-website-link"
                      >
                        {(rental.providerContact?.website || rental.provider.contact.website).replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="rental-contact-buttons">
                <button 
                  className="rental-contact-button rental-whatsapp"
                  onClick={handleWhatsAppClick}
                >
                  Reserve via WhatsApp
                </button>
                {(rental.providerContact?.phone || rental.provider?.contact?.phone) && (
                  <button 
                    className="rental-contact-button rental-call"
                    onClick={() => window.open(`tel:${rental.providerContact?.phone || rental.provider.contact.phone}`)}
                  >
                    Call
                  </button>
                )}
                {(rental.providerContact?.email || rental.provider?.contact?.email) && (
                  <button 
                    className="rental-contact-button rental-email"
                    onClick={() => window.open(`mailto:${rental.providerContact?.email || rental.provider.contact.email}?subject=Rental Inquiry: ${getName()}`)}
                  >
                    Email
                  </button>
                )}
              </div>
              
              <div className="rental-booking-calendar">
                <h3 className="rental-calendar-title">Availability Calendar</h3>
                <div className="rental-calendar-placeholder">
                  <p>Calendar integration coming soon</p>
                  <p>Contact provider for current availability</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {providerRentals && providerRentals.length > 0 && (
          <div className="rental-related-section">
            <h2 className="rental-related-title">More from {rental.provider?.businessName || rental.provider}</h2>
            
            <div className="rental-carousel-container provider-carousel">
              {providerRentals.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'prev')}
                  className="rental-carousel-nav prev"
                  disabled={providerActiveIndex === 0}
                  aria-label="Previous provider rental"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="rental-carousel-viewport" ref={providerCarouselRef}>
                <div className="rental-carousel-track carousel-track">
                  {providerRentals.map((providerRental, index) => (
                    <div className="rental-carousel-slide" key={providerRental._id || index}>
                      <RentalCard 
                        vehicle={providerRental} 
                        compact={true}
                        onShare={() => {
                          setSelectedItem(providerRental);
                          setShowShareModal(true);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {providerRentals.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'next')}
                  className="rental-carousel-nav next"
                  disabled={providerActiveIndex >= providerRentals.length - 1}
                  aria-label="Next provider rental"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {providerRentals.length > 1 && (
                <div className="rental-carousel-dots">
                  {providerRentals.map((_, index) => (
                    <button
                      key={index}
                      className={`rental-carousel-dot ${providerActiveIndex === index ? 'active' : ''}`}
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
          </div>
        )}

        {similarRentals && similarRentals.length > 0 && (
          <div className="rental-related-section">
            <h2 className="rental-related-title">Similar Vehicles</h2>
            
            <div className="rental-carousel-container similar-carousel">
              {similarRentals.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'prev')}
                  className="rental-carousel-nav prev"
                  disabled={similarActiveIndex === 0}
                  aria-label="Previous similar rental"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="rental-carousel-viewport" ref={similarCarouselRef}>
                <div className="rental-carousel-track carousel-track">
                  {similarRentals.map((similarRental, index) => (
                    <div className="rental-carousel-slide" key={similarRental._id || index}>
                      <RentalCard 
                        vehicle={similarRental} 
                        compact={true}
                        onShare={() => {
                          setSelectedItem(similarRental);
                          setShowShareModal(true);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {similarRentals.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'next')}
                  className="rental-carousel-nav next"
                  disabled={similarActiveIndex >= similarRentals.length - 1}
                  aria-label="Next similar rental"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {similarRentals.length > 1 && (
                <div className="rental-carousel-dots">
                  {similarRentals.map((_, index) => (
                    <button
                      key={index}
                      className={`rental-carousel-dot ${similarActiveIndex === index ? 'active' : ''}`}
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
          </div>
        )}

        {showShareModal && (
          <ShareModal 
            data={rental}
            onClose={() => setShowShareModal(false)}
            type="rental"
          />
        )}
      </div>
    </div>
  );
};

const getCategoryClass = (category) => {
  if (!category) return '';
  
  switch (category.toLowerCase()) {
    case 'suv':
    case 'luxury suv':
    case 'crossover':
      return 'suv';
    case 'economy':
    case 'economy sedan':
    case 'compact':
      return 'economy';
    case 'luxury':
    case 'premium':
      return 'luxury';
    case '4x4':
    case 'off-road':
      return 'off-road';
    default:
      return '';
  }
};

const getAvailabilityClass = (availability) => {
  if (!availability) return 'available';
  
  switch (availability.toLowerCase()) {
    case 'limited':
      return 'limited';
    case 'unavailable':
    case 'booked':
      return 'unavailable';
    default:
      return 'available';
  }
};

export default RentalDetailPage;