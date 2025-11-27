// src/components/shared/Advertisement/Advertisement.js - Redesigned Professional Version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronsLeft, ChevronsRight, ArrowRight, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listingService.js';
import './Advertisement.css';

const Advertisement = ({ 
  autoPlay = true, 
  autoPlayInterval = 6000,
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
  const intervalRef = useRef(null);

  // WhatsApp contact number
  const WHATSAPP_NUMBER = "+26774122453";

  // Helper function to get image URL from listing
  const getImageUrl = (listing) => {
    if (!listing || !listing.images || listing.images.length === 0) {
      return '/images/placeholders/car.jpg';
    }

    const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0];
    
    if (typeof primaryImage === 'string') {
      return primaryImage.includes('/images/images/') 
        ? primaryImage.replace(/\/images\/images\//g, '/images/')
        : primaryImage;
    }
    
    if (primaryImage && typeof primaryImage === 'object') {
      const url = primaryImage.url || primaryImage.thumbnail || '';
      if (url) {
        return url.includes('/images/images/') 
          ? url.replace(/\/images\/images\//g, '/images/')
          : url;
      }
      
      if (primaryImage.key) {
        return `/api/images/s3-proxy/${primaryImage.key}`;
      }
    }
    
    return '/images/placeholders/car.jpg';
  };

  // Fetch real car listings and create slides
  const fetchSlideData = async () => {
    try {
      setLoading(true);
      
      // Fetch ONLY featured listings
      const featuredResponse = await listingService.getListings({
        status: 'active',
        featured: true,
        limit: 20  // Fetch more to have a good pool for random selection
      }, 1);

      const featuredListings = featuredResponse.listings || [];
      
      console.log('📊 Total featured listings fetched:', featuredListings.length);

      // Shuffle array to get random selection
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Get 5 random featured vehicles
      const shuffledListings = shuffleArray(featuredListings);
      const randomFeaturedVehicles = shuffledListings.slice(0, 5);

      console.log('🎲 Selected random featured vehicles:', randomFeaturedVehicles.length);
      console.log('🚗 Vehicle details:', randomFeaturedVehicles.map(v => ({
        id: v._id,
        make: v.make,
        model: v.model,
        featured: v.featured
      })));

      // Create slides with actual car images
      const slides = [
        {
          id: 1,
          title: "The #1 Car Sales Platform in Botswana",
          subtitle: "TRUSTED MARKETPLACE",
          description: "Join thousands of satisfied buyers and sellers. Most affordable way to sell your car with no huge commission charges.",
          ctaText: "List Your Vehicle",
          ctaAction: () => navigate('/marketplace/sell'),
          bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
          textColor: "#ffffff",
          highlights: [
            "No Hidden Fees",
            "Fast Listing Process",
            "Verified Buyers"
          ],
          imageUrl: randomFeaturedVehicles[0] ? getImageUrl(randomFeaturedVehicles[0]) : '/images/placeholders/car.jpg',
          listing: randomFeaturedVehicles[0]
        },
        {
          id: 2,
          title: "Affordable Cars, Affordable Selling",
          subtitle: "BEST VALUE GUARANTEE",
          description: "Because selling through Bw Car Culture is affordable, cars sold here are affordable too. No extra expenses on your sale.",
          ctaText: "Browse Vehicles",
          ctaAction: () => navigate('/marketplace'),
          bgGradient: "linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)",
          textColor: "#ffffff",
          highlights: [
            "Lowest Commission",
            "Direct Buyer Contact", 
            "Zero Hidden Costs"
          ],
          imageUrl: randomFeaturedVehicles[1] ? getImageUrl(randomFeaturedVehicles[1]) : '/images/placeholders/car.jpg',
          listing: randomFeaturedVehicles[1]
        },
        {
          id: 3,
          title: "Botswana's Leading Automotive Community",
          subtitle: "TRUSTED & VERIFIED",
          description: "Access thousands of verified listings from trusted sellers and dealerships across Botswana.",
          ctaText: "View All Listings",
          ctaAction: () => navigate('/marketplace'),
          bgGradient: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
          textColor: "#ffffff",
          highlights: [
            "Quality Verified",
            "Secure Transactions",
            "Professional Support"
          ],
          imageUrl: randomFeaturedVehicles[2] ? getImageUrl(randomFeaturedVehicles[2]) : '/images/placeholders/car.jpg',
          listing: randomFeaturedVehicles[2]
        },
        {
          id: 4,
          title: "Join Our Growing Community",
          subtitle: "SOCIAL REACH",
          description: "Sell your vehicle today. Fast and for value.",
          ctaText: "Contact Us on WhatsApp",
          ctaAction: () => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank'),
          bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
          textColor: "#ffffff",
          socialStats: [
            { platform: "Facebook", count: "640K", icon: "facebook" },
            { platform: "TikTok", count: "33K", icon: "tiktok" },
            { platform: "Instagram", count: "14K", icon: "instagram" }
          ],
          showWhatsApp: true,
          imageUrl: randomFeaturedVehicles[3] ? getImageUrl(randomFeaturedVehicles[3]) : '/images/placeholders/car.jpg',
          listing: randomFeaturedVehicles[3]
        },
        {
          id: 5,
          title: "Fast, Secure & Value-Driven Sales",
          subtitle: "PROVEN TRACK RECORD",
          description: "List once, reach thousands. Our platform connects serious buyers with quality sellers instantly.",
          ctaText: "Start Selling",
          ctaAction: () => navigate('/marketplace/sell'),
          bgGradient: "linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)",
          textColor: "#ffffff",
          highlights: [
            "Quick Turnaround",
            "Wide Exposure",
            "Dedicated Support"
          ],
          imageUrl: randomFeaturedVehicles[4] ? getImageUrl(randomFeaturedVehicles[4]) : '/images/placeholders/car.jpg',
          listing: randomFeaturedVehicles[4]
        }
      ];

      console.log('✅ Slides created with featured vehicles');
      setSlideData(slides);
    } catch (error) {
      console.error('❌ Error fetching slide data:', error);
      // Fallback to slides without images
      setSlideData([
        {
          id: 1,
          title: "The #1 Car Sales Platform in Botswana",
          subtitle: "TRUSTED MARKETPLACE",
          description: "Join thousands of satisfied buyers and sellers. Most affordable way to sell your car with no huge commission charges.",
          ctaText: "List Your Vehicle",
          ctaAction: () => navigate('/marketplace/sell'),
          bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
          textColor: "#ffffff",
          highlights: ["No Hidden Fees", "Fast Listing Process", "Verified Buyers"],
          imageUrl: '/images/placeholders/car.jpg'
        },
        {
          id: 2,
          title: "Affordable Cars, Affordable Selling",
          subtitle: "BEST VALUE GUARANTEE",
          description: "Because selling through Bw Car Culture is affordable, cars sold here are affordable too. No extra expenses on your sale.",
          ctaText: "Browse Vehicles",
          ctaAction: () => navigate('/marketplace'),
          bgGradient: "linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)",
          textColor: "#ffffff",
          highlights: ["Lowest Commission", "Direct Buyer Contact", "Zero Hidden Costs"],
          imageUrl: '/images/placeholders/car.jpg'
        },
        {
          id: 3,
          title: "Botswana's Leading Automotive Community",
          subtitle: "TRUSTED & VERIFIED",
          description: "Access thousands of verified listings from trusted sellers and dealerships across Botswana.",
          ctaText: "View All Listings",
          ctaAction: () => navigate('/marketplace'),
          bgGradient: "linear-gradient(135deg, #0f3460 0%, #16213e 100%)",
          textColor: "#ffffff",
          highlights: ["Quality Verified", "Secure Transactions", "Professional Support"],
          imageUrl: '/images/placeholders/car.jpg'
        },
        {
          id: 4,
          title: "Join Our Growing Community",
          subtitle: "SOCIAL REACH",
          description: "Sell your vehicle today. Fast and for value.",
          ctaText: "Contact Us on WhatsApp",
          ctaAction: () => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank'),
          bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
          textColor: "#ffffff",
          socialStats: [
            { platform: "Facebook", count: "640K", icon: "facebook" },
            { platform: "TikTok", count: "33K", icon: "tiktok" },
            { platform: "Instagram", count: "14K", icon: "instagram" }
          ],
          showWhatsApp: true,
          imageUrl: '/images/placeholders/car.jpg'
        },
        {
          id: 5,
          title: "Fast, Secure & Value-Driven Sales",
          subtitle: "PROVEN TRACK RECORD",
          description: "List once, reach thousands. Our platform connects serious buyers with quality sellers instantly.",
          ctaText: "Start Selling",
          ctaAction: () => navigate('/marketplace/sell'),
          bgGradient: "linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)",
          textColor: "#ffffff",
          highlights: ["Quick Turnaround", "Wide Exposure", "Dedicated Support"],
          imageUrl: '/images/placeholders/car.jpg'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  // Touch handlers for mobile
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!slideData.length) return null;

  const currentSlideData = slideData[currentSlide];

  return (
    <div className={`advertisement-container ${className}`}>
      
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
        <div className="advertisement-content">
          <div className="advertisement-text">
            <div className="advertisement-header">
              <span className="advertisement-subtitle">
                {currentSlideData?.subtitle}
              </span>
              <h2 className="advertisement-title">
                {currentSlideData?.title}
              </h2>
            </div>

            <p className="advertisement-description">
              {currentSlideData?.description}
            </p>

            {/* Highlights or Stats */}
            {currentSlideData?.highlights && (
              <div className="advertisement-highlights">
                {currentSlideData.highlights.map((highlight, index) => (
                  <div key={index} className="highlight-item">
                    <span className="highlight-bullet">✓</span>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Social Media Stats */}
            {currentSlideData?.socialStats && (
              <div className="advertisement-social-stats">
                {currentSlideData.socialStats.map((stat, index) => (
                  <div key={index} className="social-stat-item">
                    <div className="social-icon">
                      {stat.icon === 'facebook' && <Facebook size={18} />}
                      {stat.icon === 'tiktok' && <span className="tiktok-icon">TT</span>}
                      {stat.icon === 'instagram' && <Instagram size={18} />}
                    </div>
                    <div className="social-info">
                      <span className="social-count">{stat.count}</span>
                      <span className="social-platform">{stat.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <button 
              className="advertisement-cta"
              onClick={currentSlideData?.ctaAction}
            >
              {currentSlideData?.showWhatsApp && (
                <MessageCircle size={18} />
              )}
              <span>{currentSlideData?.ctaText}</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Car Image Display */}
          <div className="advertisement-visual">
            {currentSlideData?.imageUrl ? (
              <div className="car-image-container">
                <img 
                  src={currentSlideData.imageUrl} 
                  alt={currentSlideData.listing?.make || "Featured Vehicle"}
                  className="car-image"
                  onError={(e) => {
                    console.log('Image failed to load, using placeholder');
                    e.target.src = '/images/placeholders/car.jpg';
                  }}
                />
                {currentSlideData.listing && (
                  <div className="car-image-overlay">
                    <div className="car-quick-info">
                      {currentSlideData.listing.make && (
                        <span className="car-make">{currentSlideData.listing.make}</span>
                      )}
                      {currentSlideData.listing.model && (
                        <span className="car-model">{currentSlideData.listing.model}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="visual-pattern"></div>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {showArrows && slideData.length > 1 && (
          <>
            <button 
              className="nav-arrow nav-arrow-left"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="nav-arrow nav-arrow-right"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <ChevronsRight size={16} />
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