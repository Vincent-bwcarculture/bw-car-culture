// src/components/shared/Advertisement/Advertisement.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService.js';
import './Advertisement.css';

const Advertisement = ({ 
  autoPlay = true, 
  autoPlayInterval = 7000,
  showDots = true,
  showArrows = true,
  className = ""
}) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [slideData, setSlideData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realStats, setRealStats] = useState(null);
  const intervalRef = useRef(null);

  // Fetch real website statistics
  const fetchRealStats = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/stats/dashboard');
      let dashboardStats = {};
      
      if (statsResponse.ok) {
        dashboardStats = await statsResponse.json();
      }

      // Fetch total listings count
      const listingsResponse = await listingService.getListings({ status: 'active', limit: 1 }, 1);
      const totalListings = listingsResponse.total || 0;

      // Fetch dealerships count
      let dealerCount = 0;
      try {
        const dealersResponse = await fetch('/api/dealers?limit=1');
        if (dealersResponse.ok) {
          const dealersData = await dealersResponse.json();
          dealerCount = dealersData.total || dashboardStats.verifiedDealers || 0;
        }
      } catch (e) {
        dealerCount = dashboardStats.verifiedDealers || 25;
      }

      // Fetch service providers count
      let serviceProviders = 0;
      try {
        const providersResponse = await fetch('/api/providers?limit=1');
        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          serviceProviders = providersData.total || 0;
        }
      } catch (e) {
        serviceProviders = dashboardStats.transportProviders || 15;
      }

      // Fetch rental vehicles count
      let rentalCount = 0;
      try {
        const rentalResponse = await fetch('/api/rentals?limit=1');
        if (rentalResponse.ok) {
          const rentalData = await rentalResponse.json();
          rentalCount = rentalData.total || 0;
        }
      } catch (e) {
        rentalCount = 12; // Fallback
      }

      // Fetch transport routes count
      let transportCount = 0;
      try {
        const transportResponse = await fetch('/api/transport?limit=1');
        if (transportResponse.ok) {
          const transportData = await transportResponse.json();
          transportCount = transportData.total || 0;
        }
      } catch (e) {
        transportCount = 8; // Fallback
      }

      setRealStats({
        totalListings,
        dealerCount,
        serviceProviders,
        rentalCount,
        transportCount,
        happyCustomers: dashboardStats.happyCustomers || Math.floor(totalListings * 1.5) || 150
      });

    } catch (error) {
      console.error('Error fetching real stats:', error);
      // Set fallback stats
      setRealStats({
        totalListings: 250,
        dealerCount: 25,
        serviceProviders: 20,
        rentalCount: 12,
        transportCount: 8,
        happyCustomers: 150
      });
    }
  };

  // FIXED: Service-specific data validation
  const validateServiceData = (data, serviceType) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.filter(item => {
      switch (serviceType) {
        case 'transport':
          // Transport items should have origin/destination or route info
          return item.origin && item.destination || item.route || item.routeName;
        
        case 'rental':
          // Rental items should have rental rates or be marked as rentals
          return item.dailyRate || item.rates?.daily || item.rentalTerms || item.category?.toLowerCase().includes('rental');
        
        case 'car':
          // Car listings should have price and NOT be rentals
          return item.price && !item.dailyRate && !item.rates?.daily;
        
        default:
          return true;
      }
    });
  };

  // FIXED: Fetch slide-specific data with proper service filtering
  const fetchSlideData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching service-specific data for advertisement slides...');
      
      await fetchRealStats();
      
      // Fetch premium/luxury listings for slide 1
      const premiumListings = await listingService.getListings({
        status: 'active',
        minPrice: 300000,
        sort: '-price',
        limit: 3
      }, 1);

      // Fetch regular car listings for slide 2
      const carListings = await listingService.getListings({
        status: 'active',
        sort: '-createdAt',
        limit: 4
      }, 1);

      // FIXED: Fetch and validate transport data with detailed debugging
      let transportImages = [];
      try {
        console.log('🚌 Fetching transport data...');
        const transportResponse = await fetch('/api/transport?limit=6');
        if (transportResponse.ok) {
          const transportData = await transportResponse.json();
          console.log('🚌 Raw transport response:', transportData);
          
          const rawTransportData = transportData.routes || transportData.data || [];
          console.log(`🚌 Found ${rawTransportData.length} transport items`);
          
          // Debug first transport item structure
          if (rawTransportData.length > 0) {
            console.log('🚌 First transport item:', rawTransportData[0]);
            console.log('🚌 First transport item images:', rawTransportData[0]?.images);
          }
          
          // FIXED: Validate that data is actually transport-related
          transportImages = validateServiceData(rawTransportData, 'transport');
          console.log(`✅ Valid transport items found: ${transportImages.length}`);
          
          // FIXED: Filter for items with images and debug why they might fail
          transportImages = transportImages.filter(item => {
            const hasImages = (item.images && item.images.length > 0) || item.image;
            if (!hasImages) {
              console.log('🚌 Transport item without images:', item.title || item.id);
            }
            return hasImages;
          }).slice(0, 3);
          
          console.log(`🚌 Transport items with images: ${transportImages.length}`);
          
        } else {
          console.log('⚠️ Transport API returned error status:', transportResponse.status);
        }
      } catch (error) {
        console.log('❌ Transport API not available:', error.message);
      }

      // FIXED: Fetch and validate rental data with detailed debugging
      let rentalImages = [];
      try {
        console.log('🔑 Fetching rental data...');
        const rentalResponse = await fetch('/api/rentals?limit=6');
        if (rentalResponse.ok) {
          const rentalData = await rentalResponse.json();
          console.log('🔑 Raw rental response:', rentalData);
          
          const rawRentalData = rentalData.vehicles || rentalData.data || [];
          console.log(`🔑 Found ${rawRentalData.length} rental items`);
          
          // Debug first rental item structure
          if (rawRentalData.length > 0) {
            console.log('🔑 First rental item:', rawRentalData[0]);
            console.log('🔑 First rental item images:', rawRentalData[0]?.images);
          }
          
          // FIXED: Validate that data is actually rental-related
          rentalImages = validateServiceData(rawRentalData, 'rental');
          console.log(`✅ Valid rental items found: ${rentalImages.length}`);
          
          // FIXED: Filter for items with images and debug why they might fail
          rentalImages = rentalImages.filter(item => {
            const hasImages = (item.images && item.images.length > 0) || item.image;
            if (!hasImages) {
              console.log('🔑 Rental item without images:', item.title || item.name || item.id);
            }
            return hasImages;
          }).slice(0, 3);
          
          console.log(`🔑 Rental items with images: ${rentalImages.length}`);
          
        } else {
          console.log('⚠️ Rental API returned error status:', rentalResponse.status);
        }
      } catch (error) {
        console.log('❌ Rental API not available:', error.message);
      }

      // Fetch deal listings for slide 5
      const dealListings = await listingService.getListings({
        status: 'active',
        maxPrice: 150000,
        sort: 'price',
        limit: 3
      }, 1);

      // FIXED: Simplified fallback strategy (closer to original)
      const getSlideImages = (serviceImages, serviceType, carListings) => {
        if (serviceImages.length > 0) {
          console.log(`✅ Using ${serviceImages.length} real ${serviceType} images`);
          return serviceImages;
        }
        
        // Fallback to car listings like original, but log it
        const carFallback = carListings.listings?.slice(0, 3) || [];
        if (carFallback.length > 0) {
          console.log(`⚠️ No ${serviceType} images, using ${carFallback.length} car listings as fallback`);
          return carFallback;
        }
        
        // Final fallback to placeholder
        console.log(`❌ No images available, using placeholder for ${serviceType}`);
        const placeholders = {
          transport: [{ 
            image: '/images/placeholders/transport.jpg',
            images: [{ url: '/images/placeholders/transport.jpg', isPrimary: true }],
            title: 'Transport Service'
          }],
          rental: [{ 
            image: '/images/placeholders/rental.jpg',
            images: [{ url: '/images/placeholders/rental.jpg', isPrimary: true }],
            title: 'Rental Vehicle'
          }]
        };
        return placeholders[serviceType] || [];
      };

      const slidesData = [
        {
          id: 1,
          title: "Premium Verified Listings",
          subtitle: "Quality Automotive Solutions",
          description: "Certified dealerships and verified premium listings.",
          ctaText: "View Premium Cars",
          ctaAction: () => navigate('/marketplace?filter=verified'),
          images: premiumListings.listings || [],
          bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          textColor: "#ffffff"
        },
        {
          id: 2,
          title: "Best Car Buying Experience",
          subtitle: "Complete Journey Support",
          description: "End-to-end automotive support from browsing to ownership.",
          ctaText: "Explore Services",
          ctaAction: () => navigate('/services'),
          images: carListings.listings || [],
          bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          textColor: "#ffffff"
        },
        {
          id: 3,
          title: "Reliable Transport Services",
          subtitle: "Travel Solutions",
          description: "Dependable transport services across Botswana.",
          ctaText: "Book Transport",
          ctaAction: () => navigate('/services?type=transport'),
          // FIXED: Simplified fallback approach
          images: getSlideImages(transportImages, 'transport', carListings),
          bgGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
          textColor: "#ffffff",
          contentType: 'transport'
        },
        {
          id: 4,
          title: "Vehicle Rental Services",
          subtitle: "Flexible Mobility",
          description: "Quality rental vehicles for every occasion and journey.",
          ctaText: "Browse Rentals",
          ctaAction: () => navigate('/services?type=rental'),
          // FIXED: Simplified fallback approach
          images: getSlideImages(rentalImages, 'rental', carListings),
          bgGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          textColor: "#ffffff",
          contentType: 'rental'
        },
        {
          id: 5,
          title: "Save on Your New Car",
          subtitle: "Exclusive Deals",
          description: "Best prices and special offers from trusted dealers.",
          ctaText: "View Deals",
          ctaAction: () => navigate('/marketplace?sort=price'),
          images: dealListings.listings || [],
          stats: ["Best Price Guarantee", "Exclusive Offers"],
          bgGradient: "linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)",
          textColor: "#ffffff"
        }
      ];

      console.log('📊 Final slide data summary:', {
        slide1_premium: premiumListings.listings?.length || 0,
        slide2_cars: carListings.listings?.length || 0,
        slide3_transport_images: slidesData[2].images.length,
        slide4_rental_images: slidesData[3].images.length,
        slide5_deals: dealListings.listings?.length || 0
      });

      setSlideData(slidesData);
    } catch (error) {
      console.error('❌ Error fetching slide data:', error);
      setSlideData(getDefaultSlides());
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Get appropriate image URL with debugging
  const getContentImageUrl = (item, contentType = 'car') => {
    console.log(`🖼️ Getting image URL for ${contentType}:`, item);
    
    if (!item) {
      const placeholders = {
        transport: '/images/placeholders/transport.jpg',
        rental: '/images/placeholders/rental.jpg',
        car: '/images/placeholders/car.jpg'
      };
      const url = placeholders[contentType] || '/images/placeholders/car.jpg';
      console.log(`🖼️ No item, using placeholder: ${url}`);
      return url;
    }

    let images = [];
    
    if (item.images && Array.isArray(item.images)) {
      images = item.images;
      console.log(`🖼️ Found ${images.length} images in images array`);
    } else if (item.image) {
      images = [item.image];
      console.log(`🖼️ Using single image property:`, item.image);
    }

    if (images.length === 0) {
      const placeholders = {
        transport: '/images/placeholders/transport.jpg',
        rental: '/images/placeholders/rental.jpg',
        car: '/images/placeholders/car.jpg'
      };
      const url = placeholders[contentType] || '/images/placeholders/car.jpg';
      console.log(`🖼️ No images found, using placeholder: ${url}`);
      return url;
    }

    const primaryImage = images.find(img => img.isPrimary) || images[0];
    console.log(`🖼️ Primary image:`, primaryImage);
    
    if (typeof primaryImage === 'string') {
      const url = primaryImage.includes('/images/images/') 
        ? primaryImage.replace(/\/images\/images\//g, '/images/')
        : primaryImage;
      console.log(`🖼️ Using string URL: ${url}`);
      return url;
    } else if (primaryImage && typeof primaryImage === 'object') {
      const url = primaryImage.url || primaryImage.thumbnail || '';
      if (url) {
        const finalUrl = url.includes('/images/images/') 
          ? url.replace(/\/images\/images\//g, '/images/')
          : url;
        console.log(`🖼️ Using object URL: ${finalUrl}`);
        return finalUrl;
      }
      
      if (primaryImage.key) {
        const proxyUrl = `/api/images/s3-proxy/${primaryImage.key}`;
        console.log(`🖼️ Using S3 proxy URL: ${proxyUrl}`);
        return proxyUrl;
      }
    }
    
    const placeholders = {
      transport: '/images/placeholders/transport.jpg',
      rental: '/images/placeholders/rental.jpg',
      car: '/images/placeholders/car.jpg'
    };
    const url = placeholders[contentType] || '/images/placeholders/car.jpg';
    console.log(`🖼️ Fallback to placeholder: ${url}`);
    return url;
  };

  // Get current slide image with debugging
  const getCurrentSlideImage = () => {
    if (!slideData[currentSlide] || !slideData[currentSlide].images) {
      console.log('🖼️ No slide data or images, using car placeholder');
      return '/images/placeholders/car.jpg';
    }

    const slide = slideData[currentSlide];
    const images = slide.images;
    
    if (!images || images.length === 0) {
      console.log('🖼️ No images in slide, using car placeholder');
      return '/images/placeholders/car.jpg';
    }

    const contentType = slide.contentType || 'car';
    const randomImage = images[Math.floor(Math.random() * images.length)];
    console.log(`🖼️ Getting ${contentType} image from slide ${currentSlide}:`, randomImage);
    
    return getContentImageUrl(randomImage, contentType);
  };

  // Default slides
  const getDefaultSlides = () => [
    {
      id: 1,
      title: "Premium Verified Listings",
      subtitle: "Quality Solutions",
      description: "Certified dealerships and verified listings.",
      ctaText: "View Premium Cars",
      ctaAction: () => navigate('/marketplace'),
      images: [{ image: '/images/placeholders/car.jpg' }],
      bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      textColor: "#ffffff"
    },
    {
      id: 2,
      title: "Best Car Buying Experience", 
      subtitle: "Complete Support",
      description: "End-to-end automotive journey support.",
      ctaText: "Explore Services",
      ctaAction: () => navigate('/services'),
      images: [{ image: '/images/placeholders/dealer-banner.jpg' }], 
      bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff"
    },
    {
      id: 3,
      title: "Reliable Transport",
      subtitle: "Travel Solutions", 
      description: "Dependable transport services.",
      ctaText: "Book Transport",
      ctaAction: () => navigate('/services?type=transport'),
      images: [{ image: '/images/placeholders/transport.jpg' }],
      bgGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      textColor: "#ffffff",
      contentType: 'transport' // FIXED: Added contentType
    },
    {
      id: 4,
      title: "Vehicle Rentals",
      subtitle: "Flexible Mobility",
      description: "Quality rental vehicles available.",
      ctaText: "Browse Rentals", 
      ctaAction: () => navigate('/services?type=rental'),
      images: [{ image: '/images/placeholders/rental.jpg' }],
      bgGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      textColor: "#ffffff",
      contentType: 'rental' // FIXED: Added contentType
    },
    {
      id: 5,
      title: "Save on New Cars",
      subtitle: "Exclusive Deals",
      description: "Best prices from trusted dealers.",
      ctaText: "View Deals",
      ctaAction: () => navigate('/marketplace?sort=price'),
      images: [{ image: '/images/placeholders/car.jpg' }],
      stats: ["Best Prices", "Exclusive Offers"],
      bgGradient: "linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)", 
      textColor: "#ffffff"
    }
  ];

  // Initialize data
  useEffect(() => {
    fetchSlideData();
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPlaying && slideData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slideData.length);
      }, autoPlayInterval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, autoPlayInterval, slideData.length]);

  // Navigation functions
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(autoPlay), 2000);
  }, [autoPlay]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide(prev => prev === 0 ? slideData.length - 1 : prev - 1);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(autoPlay), 2000);
  }, [slideData.length, autoPlay]);

  const goToNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slideData.length);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(autoPlay), 2000);
  }, [slideData.length, autoPlay]);

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (loading) {
    return (
      <div className={`advertisement-container loading ${className}`}>
        <div className="advertisement-loading">
          <div className="loading-spinner"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (!slideData.length) return null;

  const currentSlideData = slideData[currentSlide];

  return (
    <div className={`advertisement-container ${className}`}>
      <span className="ad-label">Advertisement</span>
      
      <div 
        className="advertisement-slider"
        style={{ 
          background: currentSlideData?.bgGradient,
          color: currentSlideData?.textColor 
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(autoPlay)}
      >
        {/* Content */}
        <div className="advertisement-content">
          <div className="advertisement-text">
            <div className="advertisement-header">
              <span className="advertisement-subtitle">{currentSlideData?.subtitle}</span>
              <h2 className="advertisement-title">{currentSlideData?.title}</h2>
            </div>
            
            <p className="advertisement-description">
              {currentSlideData?.description}
            </p>
            
            <div className="advertisement-stats">
              {currentSlideData?.stats?.map((stat, index) => (
                <span key={index} className="stat-item">✓ {stat}</span>
              ))}
            </div>
            
            <button 
              className="advertisement-cta"
              onClick={currentSlideData?.ctaAction}
            >
              {currentSlideData?.ctaText}
              <ArrowRight size={16} />
            </button>
            
            <div className="terms-link">
              <small>Terms and conditions apply</small>
            </div>
          </div>

          <div className="advertisement-image">
            <img 
              src={getCurrentSlideImage()} 
              alt={currentSlideData?.title}
              onError={(e) => {
                console.log(`❌ Image failed to load: ${e.target.src}`);
                
                // Try S3 proxy for AWS images first
                if (e.target.src.includes('amazonaws.com')) {
                  const key = e.target.src.split('.amazonaws.com/').pop();
                  if (key && !e.target.src.includes('/api/images/s3-proxy/')) {
                    console.log(`🔄 Trying S3 proxy for: ${key}`);
                    e.target.src = `/api/images/s3-proxy/${key}`;
                    return;
                  }
                }
                
                // Simple fallback based on content type
                let placeholder = '/images/placeholders/car.jpg';
                if (currentSlideData?.contentType === 'transport') {
                  placeholder = '/images/placeholders/transport.jpg';
                } else if (currentSlideData?.contentType === 'rental') {
                  placeholder = '/images/placeholders/rental.jpg';
                }
                
                console.log(`🔄 Using placeholder: ${placeholder}`);
                e.target.src = placeholder;
              }}
            />
          </div>
        </div>

        {/* Navigation Controls - Fixed positioning */}
        {showArrows && slideData.length > 1 && (
          <>
            <button 
              className="nav-arrow nav-arrow-left"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="nav-arrow nav-arrow-right"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {showDots && slideData.length > 1 && (
          <div className="dots-container">
            {slideData.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Advertisement;