// src/components/features/TransportSection/PublicTransportDetailPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Share, Phone, Mail } from 'lucide-react';
import './PublicTransportDetailPage.css';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import ShareModal from '../../shared/ShareModal.js';

// Import transport service
const transportService = {
  getRoute: async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data with S3 compatible image URLs
    return MOCK_ROUTES.find(route => route._id === id) || null;
  },
  
  getProviderRoutes: async (providerId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return MOCK_ROUTES.filter(route => route.providerId === providerId);
  },
  
  getSimilarRoutes: async (origin, destination) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find routes with matching origin or destination
    return MOCK_ROUTES.filter(route => 
      (route.origin === origin || route.destination === origin) ||
      (route.origin === destination || route.destination === destination)
    ).slice(0, 3);
  }
};

// Mock routes data with S3 compatible URLs
const MOCK_ROUTES = [
  {
    _id: 'route1',
    origin: 'Gaborone',
    destination: 'Francistown',
    routeType: 'Bus',
    image: '/images/transport/gaborone-francistown.jpg',
    fare: 120,
    frequency: 'Every 2 hours',
    schedule: {
      departure: '07:00',
      arrival: '11:30',
      duration: '4h 30m',
      daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    distance: '430 km',
    status: 'On time',
    stops: ['Palapye', 'Mahalapye', 'Serowe Junction'],
    amenities: ['Air Conditioning', 'WiFi', 'Power Outlets', 'Restroom'],
    provider: 'Botswana Express',
    providerLogo: '/images/providers/botswana-express.jpg',
    providerId: 'tprov1',
    providerContact: {
      phone: '+26773456789',
      email: 'bookings@botswanaexpress.co.bw',
      website: 'www.botswanaexpress.co.bw'
    },
    serviceType: 'Express',
    description: "Travel comfortably between Gaborone and Francistown on our premium express service. Our modern buses offer air conditioning, free WiFi, and power outlets for your convenience. With departures every 2 hours from early morning to evening, we provide flexible travel options for both business and leisure travelers.",
    routeMap: '/images/transport/gaborone-francistown-map.jpg',
    additionalInfo: {
      boardingPoints: [
        { name: 'Gaborone Main Station', address: 'Station Road, CBD', coordinates: { lat: -24.6282, lng: 25.9109 } },
        { name: 'Gaborone North Terminal', address: 'Northern Suburb Road', coordinates: { lat: -24.5932, lng: 25.9235 } }
      ],
      destinationPoints: [
        { name: 'Francistown Main Station', address: 'Blue Jacket Street', coordinates: { lat: -21.1661, lng: 27.5143 } }
      ],
      luggagePolicy: {
        allowedBags: 2,
        maxWeight: '30 kg',
        oversizeCharges: 'P50 per additional bag',
        prohibitedItems: ['Flammable materials', 'Illegal substances', 'Weapons']
      },
      specialServices: [
        { name: 'Express Service', description: 'Limited stops for faster travel', price: 'Included' },
        { name: 'Refreshments', description: 'Complimentary water and snack', price: 'Included' },
        { name: 'Extra Luggage', description: 'Additional luggage allowance', price: 'P50 per bag' }
      ]
    },
    reviews: [
      { user: 'Daniel M.', rating: 4, comment: 'Very comfortable journey with good amenities. The bus was on time and the staff were professional.', date: '2023-07-15' },
      { user: 'Rebecca T.', rating: 5, comment: 'Excellent service! Clean bus, on-time departure and arrival. WiFi worked throughout the journey.', date: '2023-06-22' },
      { user: 'James N.', rating: 3, comment: 'The bus was comfortable but the air conditioning wasn\'t working properly. Otherwise decent service.', date: '2023-05-10' }
    ]
  },
  // ... rest of MOCK_ROUTES data
];

const PublicTransportDetailPage = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [providerRoutes, setProviderRoutes] = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const shareButtonRef = useRef(null);
  const dispatch = useDispatch();
  const [providerActiveIndex, setProviderActiveIndex] = useState(0);
  const [similarActiveIndex, setSimilarActiveIndex] = useState(0);
  const providerCarouselRef = useRef(null);
  const similarCarouselRef = useRef(null);

  // Load route details
  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      setError(null);
      try {
        const routeData = await transportService.getRoute(routeId);
        
        if (!routeData) {
          setError('Route not found');
          return;
        }
  
        setRoute(routeData);
        
        // Check if route is saved
        const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
        setIsSaved(savedRoutes.includes(routeData._id));
        
        // Load related content
        await loadRelatedContent(routeData);
        
        // Record view
        if (!viewRecorded) {
          // Record view logic here
          setViewRecorded(true);
        }
      } catch (error) {
        setError('Failed to load route details');
        console.error('Error loading route:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadRoute();
  }, [routeId, viewRecorded]);

  // Load related content (other routes from same provider and similar routes)
  const loadRelatedContent = async (routeData) => {
    try {
      // Load other routes from the same provider
      if (routeData.providerId) {
        const otherRoutes = await transportService.getProviderRoutes(routeData.providerId);
        const filteredRoutes = otherRoutes.filter(
          item => item._id !== routeData._id
        ).slice(0, 3);
        setProviderRoutes(filteredRoutes);
      }
      
      // Load similar routes based on origin/destination
      if (routeData.origin && routeData.destination) {
        const similar = await transportService.getSimilarRoutes(routeData.origin, routeData.destination);
        // Exclude the current route
        const filteredSimilar = similar.filter(item => item._id !== routeData._id);
        setSimilarRoutes(filteredSimilar);
      }
    } catch (error) {
      console.error('Error loading related content:', error);
    }
  };

  // Initialize carousel when data is loaded
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
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (providerRoutes.length > 0) initializeCarousel('provider');
      if (similarRoutes.length > 0) initializeCarousel('similar');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [providerRoutes, similarRoutes]);

  // Carousel navigation
  const navigateCarousel = (carouselType, direction) => {
    const isProvider = carouselType === 'provider';
    const routes = isProvider ? providerRoutes : similarRoutes;
    const setIndex = isProvider ? setProviderActiveIndex : setSimilarActiveIndex;
    const currentIndex = isProvider ? providerActiveIndex : similarActiveIndex;
    const carouselRef = isProvider ? providerCarouselRef : similarCarouselRef;
    
    if (!routes || routes.length <= 1) return;
    
    // Calculate items per view based on viewport width
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3; // Desktop
    } else if (viewportWidth >= 768) {
      itemsPerView = 2; // Tablet
    }
    
    // Calculate max index
    const maxIndex = Math.max(0, routes.length - itemsPerView);
    
    // Calculate next index
    let nextIndex;
    if (direction === 'next') {
      nextIndex = Math.min(currentIndex + 1, maxIndex);
    } else {
      nextIndex = Math.max(0, currentIndex - 1);
    }
    
    // Only update if we're actually changing position
    if (nextIndex !== currentIndex) {
      setIndex(nextIndex);
      
      // Apply the transform to the carousel track
      if (carouselRef.current) {
        const track = carouselRef.current.querySelector('.transport-carousel-track');
        if (track) {
          // Calculate slide width as a percentage of viewport
          const slideWidthPercent = 100 / itemsPerView;
          // Apply transform to move to the current slide
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  };

  // Initialize carousel
  const initializeCarousel = (carouselType) => {
    const isProvider = carouselType === 'provider';
    const routes = isProvider ? providerRoutes : similarRoutes;
    const carouselRef = isProvider ? providerCarouselRef : similarCarouselRef;
    const currentIndex = isProvider ? providerActiveIndex : similarActiveIndex;
    
    if (!routes || routes.length <= 1 || !carouselRef.current) return;
    
    // Calculate items per view
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    // Apply initial transform
    const track = carouselRef.current.querySelector('.transport-carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
    }
  };

  // Save route to favorites
  const handleSaveRoute = () => {
    if (!route) return;
    
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    if (isSaved) {
      const newSaved = savedRoutes.filter(id => id !== route._id);
      localStorage.setItem('savedRoutes', JSON.stringify(newSaved));
      setIsSaved(false);
      
      // Notification for removal
      dispatch(addNotification({
        id: Date.now(),
        type: 'info',
        message: 'Removed from saved routes'
      }));
    } else {
      const newSaved = [...savedRoutes, route._id];
      localStorage.setItem('savedRoutes', JSON.stringify(newSaved));
      setIsSaved(true);
      
      // Notification for saving
      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: 'Added to saved routes'
      }));
    }
  };

  // Handle share
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Handle WhatsApp contact
  const handleWhatsAppClick = () => {
    if (!route?.providerContact?.phone) return;
    
    // Create a detailed message for WhatsApp
    const message = `Hello ${route.provider}, I'm interested in booking the ${route.routeType} service from ${route.origin} to ${route.destination} (P${route.fare})`;
    
    // Format phone number and open WhatsApp
    const formattedPhone = route.providerContact.phone.startsWith('+') ? 
      route.providerContact.phone.replace(/\s+/g, '') : 
      `+267${route.providerContact.phone.replace(/\s+/g, '')}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Format date from ISO string to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get image URL with S3 support
  const getImageUrl = (image) => {
    if (!image) return '/images/placeholders/transport.jpg';
    
    // If it's already an S3 URL, return it
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // If local path, server should redirect to S3
    if (!image.startsWith('/')) {
      return `/${image}`;
    }
    
    return image;
  };

  // Loading state
  if (loading) {
    return (
      <div className="transport-loading-overlay">
        <div className="transport-loader"></div>
      </div>
    );
  }

  // Error state
  if (error || !route) {
    return (
      <div className="transport-error-container">
        <h2>{error || 'Route not found'}</h2>
        <button onClick={() => navigate('/transport')} className="transport-back-button">
          <ChevronLeft size={18} /> Back to Routes
        </button>
      </div>
    );
  }

  // Get image URLs
  let imageUrls = [];
  if (route.image) {
    imageUrls.push(getImageUrl(route.image));
  }
  if (route.routeMap) {
    imageUrls.push(getImageUrl(route.routeMap));
  }
  if (imageUrls.length === 0) {
    imageUrls = ['/images/placeholders/transport.jpg'];
  }

  return (
    <div className="transport-detail-container">
      <button 
        className="transport-back-button" 
        onClick={() => navigate('/transport')}
      >
        <ChevronLeft size={18} /> Back to Routes
      </button>

      <div className="transport-content">
        <div className="transport-main-content">
          {/* Gallery - if there are images */}
          {imageUrls.length > 0 && (
            <div className="transport-gallery">
              <div className="transport-main-image-container">
                <div className="transport-main-image">
                  <img 
                    src={imageUrls[selectedImage]} 
                    alt={`${route.origin} to ${route.destination}`}
                    className="transport-gallery-image"
                    onError={(e) => {
                      // If S3 URL fails, go straight to placeholder
                      if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                        e.target.src = '/images/placeholders/transport.jpg';
                        return;
                      }
                      e.target.src = '/images/placeholders/transport.jpg';
                    }}
                  />
                  <div className="transport-gallery-actions">
                    <button 
                      className={`transport-action-button ${isSaved ? 'saved' : ''}`}
                      onClick={handleSaveRoute}
                      aria-label={isSaved ? 'Remove from saved' : 'Save route'}
                    >
                      <Heart size={16} fill={isSaved ? "#fff" : "none"} />
                    </button>
                    <button 
                      ref={shareButtonRef}
                      className="transport-action-button"
                      onClick={handleShare}
                      aria-label="Share route"
                    >
                      <Share size={16} />
                    </button>
                  </div>
                  
                  {imageUrls.length > 1 && (
                    <>
                      <button 
                        className="transport-gallery-nav prev" 
                        onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : imageUrls.length - 1)}
                        aria-label="Previous image"
                      >
                        ❮
                      </button>
                      <button 
                        className="transport-gallery-nav next" 
                        onClick={() => setSelectedImage(prev => prev < imageUrls.length - 1 ? prev + 1 : 0)}
                        aria-label="Next image"
                      >
                        ❯
                      </button>
                    </>
                  )}
                  
                  {imageUrls.length > 1 && (
                    <div className="transport-image-counter">
                      {selectedImage + 1} / {imageUrls.length}
                    </div>
                  )}
                </div>
              </div>
              
              {imageUrls.length > 1 && (
                <div className="transport-thumbnail-strip">
                  {imageUrls.map((image, index) => (
                    <div 
                      key={index}
                      className={`transport-thumbnail ${selectedImage === index ? 'active' : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${route.origin} to ${route.destination} view ${index + 1}`} 
                        loading={index === 0 ? 'eager' : 'lazy'}
                        onError={(e) => {
                          e.target.src = '/images/placeholders/transport.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="transport-info">
            <div className="transport-header">
              <div className="transport-title-container">
                <h1 className="transport-title">
                  <span className="transport-origin">{route.origin}</span>
                  <span className="transport-destination-arrow">→</span>
                  <span className="transport-destination">{route.destination}</span>
                </h1>
                <div className="transport-badges-container">
                  <div className={`transport-type-badge ${getRouteTypeClass(route.routeType)}`}>
                    {route.routeType}
                  </div>
                  <div className={`transport-service-badge ${getServiceTypeClass(route.serviceType)}`}>
                    {route.serviceType} Service
                  </div>
                  {route.status && (
                    <div className={`transport-status-badge ${getStatusClass(route.status)}`}>
                      {route.status}
                    </div>
                  )}
                </div>
              </div>
              <div className="transport-price-container">
                <div className="transport-price">
                  P {route.fare.toLocaleString()}
                </div>
                {route.frequency && (
                  <div className="transport-frequency-badge">
                    {route.frequency}
                  </div>
                )}
              </div>
            </div>

            <div className="transport-schedule-grid">
              <div className="transport-schedule-column">
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Departure</span>
                  <span className="transport-schedule-value">{route.schedule?.departure || 'N/A'}</span>
                </div>
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Arrival</span>
                  <span className="transport-schedule-value">{route.schedule?.arrival || 'N/A'}</span>
                </div>
              </div>
              
              <div className="transport-schedule-column">
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Duration</span>
                  <span className="transport-schedule-value">{route.schedule?.duration || 'N/A'}</span>
                </div>
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Distance</span>
                  <span className="transport-schedule-value">{route.distance || 'N/A'}</span>
                </div>
              </div>
              
              <div className="transport-schedule-column">
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Frequency</span>
                  <span className="transport-schedule-value">{route.frequency || 'N/A'}</span>
                </div>
                <div className="transport-schedule-item">
                  <span className="transport-schedule-label">Status</span>
                  <span className={`transport-schedule-value transport-status ${getStatusClass(route.status)}`}>
                    {route.status || 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Days */}
            {route.schedule?.daysOfOperation && route.schedule.daysOfOperation.length > 0 && (
              <div className="transport-days-section">
                <h3>Operating Days</h3>
                <div className="transport-days-container">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div 
                      key={day} 
                      className={`transport-day-item ${route.schedule.daysOfOperation.includes(day) ? 'active' : 'inactive'}`}
                    >
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {route.description && (
              <div className="transport-description-section">
                <h2>Route Description</h2>
                <div className="transport-description-content">
                  {route.description}
                </div>
              </div>
            )}

            {/* Features & Tabs */}
            <div className="transport-features-tabs">
              <button 
                className={`transport-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                Route Information
              </button>
              <button 
                className={`transport-tab-button ${activeTab === 'boarding' ? 'active' : ''}`}
                onClick={() => setActiveTab('boarding')}
              >
                Boarding Points
              </button>
              <button 
                className={`transport-tab-button ${activeTab === 'luggage' ? 'active' : ''}`}
                onClick={() => setActiveTab('luggage')}
              >
                Luggage Policy
              </button>
              <button 
                className={`transport-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            {/* Route Information Tab */}
            {activeTab === 'general' && (
              <div className="transport-features-section">
                {/* Stops */}
                {route.stops && route.stops.length > 0 && (
                  <div className="transport-stops-section">
                    <h3>Intermediate Stops</h3>
                    <div className="transport-stops-list">
                      {route.stops.map((stop, index) => (
                        <div key={index} className="transport-stop-item">
                          <div className="transport-stop-point"></div>
                          <div className="transport-stop-name">{stop}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Amenities */}
                {route.amenities && route.amenities.length > 0 && (
                  <div className="transport-amenities-section">
                    <h3>On-board Amenities</h3>
                    <div className="transport-amenities-grid">
                      {route.amenities.map((amenity, index) => (
                        <div key={index} className="transport-amenity-item">
                          ✓ {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Special Services */}
                {route.additionalInfo?.specialServices && route.additionalInfo.specialServices.length > 0 && (
                  <div className="transport-services-section">
                    <h3>Special Services</h3>
                    <div className="transport-services-list">
                      {route.additionalInfo.specialServices.map((service, index) => (
                        <div key={index} className="transport-service-item">
                          <div className="transport-service-info">
                            <h4 className="transport-service-name">{service.name}</h4>
                            <p className="transport-service-description">{service.description}</p>
                          </div>
                          <div className="transport-service-price">
                            {service.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Boarding Points Tab */}
            {activeTab === 'boarding' && route.additionalInfo && (
              <div className="transport-boarding-section">
                {/* Origin Boarding Points */}
                {route.additionalInfo.boardingPoints && route.additionalInfo.boardingPoints.length > 0 && (
                  <div className="transport-boarding-points">
                    <h3>Boarding Points in {route.origin}</h3>
                    <div className="transport-points-list">
                      {route.additionalInfo.boardingPoints.map((point, index) => (
                        <div key={index} className="transport-point-item">
                          <div className="transport-point-icon origin">A</div>
                          <div className="transport-point-details">
                            <h4 className="transport-point-name">{point.name}</h4>
                            <p className="transport-point-address">{point.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Destination Points */}
                {route.additionalInfo.destinationPoints && route.additionalInfo.destinationPoints.length > 0 && (
                  <div className="transport-boarding-points">
                    <h3>Arrival Points in {route.destination}</h3>
                    <div className="transport-points-list">
                      {route.additionalInfo.destinationPoints.map((point, index) => (
                        <div key={index} className="transport-point-item">
                          <div className="transport-point-icon destination">B</div>
                          <div className="transport-point-details">
                            <h4 className="transport-point-name">{point.name}</h4>
                            <p className="transport-point-address">{point.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Map Placeholder */}
                <div className="transport-map-placeholder">
                  <p>Interactive route map coming soon</p>
                  <p>View the image gallery for route map</p>
                </div>
              </div>
            )}

            {/* Luggage Policy Tab */}
            {activeTab === 'luggage' && route.additionalInfo?.luggagePolicy && (
              <div className="transport-luggage-section">
                <h3>Luggage Policy</h3>
                <div className="transport-luggage-details">
                  <div className="transport-luggage-row">
                    <div className="transport-luggage-label">Allowed Bags</div>
                    <div className="transport-luggage-value">{route.additionalInfo.luggagePolicy.allowedBags}</div>
                  </div>
                  <div className="transport-luggage-row">
                    <div className="transport-luggage-label">Maximum Weight</div>
                    <div className="transport-luggage-value">{route.additionalInfo.luggagePolicy.maxWeight}</div>
                  </div>
                  <div className="transport-luggage-row">
                    <div className="transport-luggage-label">Oversize Charges</div>
                    <div className="transport-luggage-value">{route.additionalInfo.luggagePolicy.oversizeCharges}</div>
                  </div>
                </div>
                
                {/* Prohibited Items */}
                {route.additionalInfo.luggagePolicy.prohibitedItems && (
                  <div className="transport-prohibited-section">
                    <h3>Prohibited Items</h3>
                    <ul className="transport-prohibited-list">
                      {route.additionalInfo.luggagePolicy.prohibitedItems.map((item, index) => (
                        <li key={index} className="transport-prohibited-item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="transport-reviews-section">
                <h2>Customer Reviews</h2>
                {route.reviews && route.reviews.length > 0 ? (
                  <div className="transport-reviews-list">
                    {route.reviews.map((review, index) => (
                      <div key={index} className="transport-review">
                        <div className="transport-review-header">
                          <div className="transport-review-user">{review.user}</div>
                          <div className="transport-review-rating">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </div>
                        </div>
                        <div className="transport-review-date">
                          {formatDate(review.date)}
                        </div>
                        <div className="transport-review-comment">
                          {review.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="transport-no-reviews">No reviews yet for this route.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="transport-sidebar">
          <div className="transport-provider-section">
            <div className="transport-provider-header">
              <h2>Provider Information</h2>
            </div>
            <div className="transport-provider-card">
              <div className="transport-provider-header-compact">
                <img 
                  src={getImageUrl(route.providerLogo) || '/images/placeholders/dealer-avatar.jpg'} 
                  alt={route.provider}
                  className="transport-provider-avatar"
                  onError={(e) => {
                    e.target.src = '/images/placeholders/dealer-avatar.jpg';
                  }}
                />
                <div className="transport-provider-details">
                  <h3 className="transport-provider-name">{route.provider}</h3>
                  {route.frequency && (
                    <p className="transport-provider-frequency">
                      Service Frequency: {route.frequency}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Provider stats */}
              <div className="transport-provider-stats">
                <div className="transport-stat-item">
                  <div className="transport-stat-value">
                    {route.reviews ? (route.reviews.reduce((acc, review) => acc + review.rating, 0) / route.reviews.length).toFixed(1) : 'N/A'}
                  </div>
                  <div className="transport-stat-label">Rating</div>
                </div>
                <div className="transport-stat-item">
                  <div className="transport-stat-value">
                    {route.reviews ? route.reviews.length : 0}
                  </div>
                  <div className="transport-stat-label">Reviews</div>
                </div>
              </div>
              
              {/* Contact info */}
              {route.providerContact && (
                <div className="transport-provider-contact-grid">
                  {route.providerContact.email && (
                    <div className="transport-contact-grid-item">
                      <span className="transport-contact-icon"><Mail size={16} /></span>
                      <span className="transport-contact-info">{route.providerContact.email}</span>
                    </div>
                  )}
                  {route.providerContact.phone && (
                    <div className="transport-contact-grid-item">
                      <span className="transport-contact-icon"><Phone size={16} /></span>
                      <span className="transport-contact-info">{route.providerContact.phone}</span>
                    </div>
                  )}
                  {route.providerContact.website && (
                    <div className="transport-contact-grid-item">
                      <span className="transport-contact-icon">🌐</span>
                      <a 
                        href={route.providerContact.website.startsWith('http') ? route.providerContact.website : `https://${route.providerContact.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="transport-contact-info transport-website-link"
                      >
                        {route.providerContact.website.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="transport-contact-buttons">
                <button 
                  className="transport-contact-button transport-whatsapp"
                  onClick={handleWhatsAppClick}
                >
                  Book via WhatsApp
                </button>
                {route.providerContact?.phone && (
                  <button 
                    className="transport-contact-button transport-call"
                    onClick={() => window.open(`tel:${route.providerContact.phone}`)}
                  >
                    Call
                  </button>
                )}
                {route.providerContact?.email && (
                  <button 
                    className="transport-contact-button transport-email"
                    onClick={() => window.open(`mailto:${route.providerContact.email}?subject=Booking Inquiry: ${route.origin} to ${route.destination}`)}
                  >
                    Email
                  </button>
                )}
              </div>
              
              {/* Fare Information Card */}
              <div className="transport-fare-card">
                <h3 className="transport-fare-title">Fare Information</h3>
                
                <div className="transport-fare-details">
                  <div className="transport-fare-row">
                    <div className="transport-fare-label">Regular Fare</div>
                    <div className="transport-fare-value">P {route.fare.toLocaleString()}</div>
                  </div>
                  
                  {/* Fictitious promo info */}
                  <div className="transport-fare-row transport-fare-promo">
                    <div className="transport-fare-label">Return Trip Discount</div>
                    <div className="transport-fare-value">Save 10%</div>
                  </div>
                  
                  <div className="transport-fare-divider"></div>
                  
                  <div className="transport-fare-extra">
                    <span className="transport-fare-extra-label">Additional Info:</span>
                    <ul className="transport-fare-extra-list">
                      <li>Children under 5 travel free</li>
                      <li>Senior citizens (60+) receive 15% discount</li>
                      <li>Student discounts available with valid ID</li>
                    </ul>
                  </div>
                </div>
                
                <button 
                  className="transport-book-button"
                  onClick={handleWhatsAppClick}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* More from this provider section */}
        {providerRoutes && providerRoutes.length > 0 && (
          <div className="transport-related-section">
            <h2 className="transport-related-title">More Routes by {route.provider}</h2>
            
            <div className="transport-carousel-container provider-carousel">
              {providerRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'prev')}
                  className="transport-carousel-nav prev"
                  disabled={providerActiveIndex === 0}
                  aria-label="Previous provider route"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="transport-carousel-viewport" ref={providerCarouselRef}>
                <div className="transport-carousel-track">
                  {providerRoutes.map((providerRoute, index) => (
                    <div className="transport-carousel-slide" key={providerRoute._id || index}>
                      <PublicTransportCard 
                        route={providerRoute} 
                        compact={true}
                        onShare={() => {
                          // Share logic will use existing ShareModal
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {providerRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('provider', 'next')}
                  className="transport-carousel-nav next"
                  disabled={providerActiveIndex >= providerRoutes.length - 1}
                  aria-label="Next provider route"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {/* Pagination dots */}
              {providerRoutes.length > 1 && (
                <div className="transport-carousel-dots">
                  {providerRoutes.map((_, index) => (
                    <button
                      key={index}
                      className={`transport-carousel-dot ${providerActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setProviderActiveIndex(index);
                        initializeCarousel('provider');
                      }}
                      aria-label={`Go to provider route ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar routes section */}
        {similarRoutes && similarRoutes.length > 0 && (
          <div className="transport-related-section">
            <h2 className="transport-related-title">Similar Routes</h2>
            
            <div className="transport-carousel-container similar-carousel">
              {similarRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'prev')}
                  className="transport-carousel-nav prev"
                  disabled={similarActiveIndex === 0}
                  aria-label="Previous similar route"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              <div className="transport-carousel-viewport" ref={similarCarouselRef}>
                <div className="transport-carousel-track">
                  {similarRoutes.map((similarRoute, index) => (
                    <div className="transport-carousel-slide" key={similarRoute._id || index}>
                      <PublicTransportCard 
                        route={similarRoute} 
                        compact={true}
                        onShare={() => {
                          // Share logic will use existing ShareModal
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {similarRoutes.length > 1 && (
                <button 
                  onClick={() => navigateCarousel('similar', 'next')}
                  className="transport-carousel-nav next"
                  disabled={similarActiveIndex >= similarRoutes.length - 1}
                  aria-label="Next similar route"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              
              {/* Pagination dots */}
              {similarRoutes.length > 1 && (
                <div className="transport-carousel-dots">
                  {similarRoutes.map((_, index) => (
                    <button
                      key={index}
                      className={`transport-carousel-dot ${similarActiveIndex === index ? 'active' : ''}`}
                      onClick={() => {
                        setSimilarActiveIndex(index);
                        initializeCarousel('similar');
                      }}
                      aria-label={`Go to similar route ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal 
            data={route} // Use your existing ShareModal component
            onClose={() => setShowShareModal(false)}
            type="transport"
          />
        )}
      </div>
    </div>
  );
};

// Helper function to get route type class
const getRouteTypeClass = (routeType) => {
  if (!routeType) return '';
  
  switch (routeType.toLowerCase()) {
    case 'bus':
      return 'bus';
    case 'taxi':
      return 'taxi';
    case 'shuttle':
      return 'shuttle';
    case 'train':
      return 'train';
    default:
      return '';
  }
};

// Helper function to get service type class
const getServiceTypeClass = (serviceType) => {
  if (!serviceType) return 'regular';
  
  switch (serviceType.toLowerCase()) {
    case 'express':
      return 'express';
    case 'premium':
      return 'premium';
    default:
      return 'regular';
  }
};

// Helper function to get status class
const getStatusClass = (status) => {
  if (!status) return '';
  
  switch (status.toLowerCase()) {
    case 'on time':
      return 'on-time';
    case 'delayed':
      return 'delayed';
    case 'cancelled':
      return 'cancelled';
    default:
      return '';
  }
};

export default PublicTransportDetailPage;