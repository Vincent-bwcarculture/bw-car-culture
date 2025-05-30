// src/components/features/HomeRentalsSection/HomeRentalsSection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalVehicleService } from '../../../services/rentalVehicleService.js';
import { serviceProviderService } from '../../../services/serviceProviderService.js';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import './HomeRentalsSection.css';

// Mock data for initial development/fallback
const MOCK_RENTAL_VEHICLES = [
  {
    id: 'rv1',
    name: 'Mercedes-Benz E-Class',
    category: 'Luxury Sedan',
    image: '/images/rentals/mercedes-e.jpg',
    provider: 'Luxury Wheels Rentals',
    providerLogo: '/images/services/car-rental-logo1.jpg',
    rates: {
      daily: 850,
      weekly: 5500,
      monthly: 19500
    },
    features: ['Leather Interior', 'GPS Navigation', 'Automatic', 'Bluetooth'],
    availability: 'Available',
    location: 'Gaborone'
  },
  {
    id: 'rv2',
    name: 'BMW X5',
    category: 'Luxury SUV',
    image: '/images/rentals/bmw-x5.jpg',
    provider: 'Luxury Wheels Rentals',
    providerLogo: '/images/services/car-rental-logo1.jpg',
    rates: {
      daily: 950,
      weekly: 6200,
      monthly: 22000
    },
    features: ['Leather Interior', 'Panoramic Roof', 'All-Wheel Drive', '7 Seater'],
    availability: 'Limited',
    location: 'Gaborone'
  },
  {
    id: 'rv8',
    name: 'Toyota Land Cruiser',
    category: 'Off-Road 4x4',
    image: '/images/rentals/land-cruiser.jpg',
    provider: 'Safari Vehicle Rentals',
    providerLogo: '/images/services/car-rental-logo3.jpg',
    rates: {
      daily: 1100,
      weekly: 7000,
      monthly: 25000
    },
    features: ['4x4 Drive', 'Roof Tent', 'Camping Equipment', 'Satellite Phone'],
    availability: 'Available',
    location: 'Maun'
  },
  {
    id: 'rv4',
    name: 'Toyota Corolla',
    category: 'Economy Sedan',
    image: '/images/rentals/toyota-corolla.jpg',
    provider: 'EcoDrive Rentals',
    providerLogo: '/images/services/car-rental-logo2.jpg',
    rates: {
      daily: 350,
      weekly: 2200,
      monthly: 8500
    },
    features: ['Fuel Efficient', 'Bluetooth', 'Air Conditioning', 'USB Ports'],
    availability: 'Available',
    location: 'Gaborone'
  },
  {
    id: 'rv9',
    name: 'Ford Ranger 4x4',
    category: 'Double Cab Pickup',
    image: '/images/rentals/ford-ranger.jpg',
    provider: 'Safari Vehicle Rentals',
    providerLogo: '/images/services/car-rental-logo3.jpg',
    rates: {
      daily: 900,
      weekly: 5800,
      monthly: 20000
    },
    features: ['4x4 Capability', 'Roof Rack', 'Extended Range Fuel Tank', 'Bull Bar'],
    availability: 'Limited',
    location: 'Maun'
  }
];

const HomeRentalsSection = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  
  // Prevent concurrent fetches
  const fetchInProgress = useRef(false);
  
  // Number of rentals to display
  const RENTALS_TO_DISPLAY = 8;

  // Fetch car rentals
  useEffect(() => {
    const fetchRentals = async () => {
      // Prevent multiple concurrent fetches
      if (fetchInProgress.current) {
        return;
      }
      
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      setRentals([]); // Clear previous rentals
      
      try {
        console.log('Fetching car rentals');
        
        try {
          // Find car rental providers first
          const providersResponse = await serviceProviderService.getServiceProviders({
            providerType: 'car_rental',
            status: 'active',
            limit: 5
          });
          
          if (providersResponse.success && providersResponse.providers && providersResponse.providers.length > 0) {
            console.log(`Found ${providersResponse.providers.length} car rental providers`);
            
            // Gather rentals from all providers
            let allRentals = [];
            
            // For each provider, get their rentals
            for (const provider of providersResponse.providers) {
              try {
                console.log(`Fetching rentals for provider: ${provider.businessName}`);
                const providerRentals = await rentalVehicleService.getProviderRentals(provider._id, 1, 5);
                
                if (providerRentals.success && providerRentals.vehicles && providerRentals.vehicles.length > 0) {
                  console.log(`Found ${providerRentals.vehicles.length} rentals for provider ${provider.businessName}`);
                  allRentals = [...allRentals, ...providerRentals.vehicles];
                }
              } catch (providerError) {
                console.warn(`Failed to fetch rentals for provider ${provider.businessName}:`, providerError);
              }
            }
            
            // If we found any rentals
            if (allRentals.length > 0) {
              // Sort by createdAt or featuredStatus and take the most recent/featured ones
              allRentals.sort((a, b) => {
                // Featured items first
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                
                // Then by date (most recent first)
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
              });
              
              // Limit to display count
              allRentals = allRentals.slice(0, RENTALS_TO_DISPLAY);
              
              console.log(`Successfully collected ${allRentals.length} car rentals`);
              setRentals(allRentals);
            } else {
              console.log('No rentals found across providers, using featured API');
              throw new Error('No rentals found');
            }
          } else {
            console.log('No active car rental providers found, using featured API');
            throw new Error('No providers found');
          }
        } catch (carError) {
          console.warn('Failed to fetch car rentals from providers, trying featured API:', carError);
          
          // Try featured API as fallback
          try {
            const featuredRentals = await rentalVehicleService.getFeaturedRentals(RENTALS_TO_DISPLAY);
            
            if (featuredRentals && featuredRentals.success && featuredRentals.vehicles && featuredRentals.vehicles.length > 0) {
              console.log(`Successfully loaded ${featuredRentals.vehicles.length} featured rental vehicles`);
              setRentals(featuredRentals.vehicles);
            } else {
              throw new Error('No featured rentals found');
            }
          } catch (featuredError) {
            console.warn('Featured API also failed:', featuredError);
            setRentals([]);
            setError('No car rentals are currently available');
          }
        }
      } catch (error) {
        console.error('Error fetching car rentals:', error);
        setError('Failed to load car rentals. Please try again later.');
        setRentals([]);
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    };

    fetchRentals();
  }, []);

  const handleViewAllRentals = () => {
    navigate('/rentals');
  };

  const handleRentVehicle = (vehicle) => {
    navigate(`/rentals/${vehicle._id || vehicle.id}`);
  };

  // Handle carousel navigation
  const scrollToNext = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.rental-carousel-item')?.offsetWidth;
      const gap = 20; // Gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide + 1;
        if (newActiveSlide < rentals.length) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: cardWidth + gap,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.rental-carousel-item')?.offsetWidth;
      const gap = 20; // Gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide - 1;
        if (newActiveSlide >= 0) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: -(cardWidth + gap),
            behavior: 'smooth'
          });
        }
      }
    }
  };

  if (loading && rentals.length === 0) {
    return (
      <section className="home-rentals-section">
        <div className="home-rentals-header">
          <h2>Vehicle Rentals</h2>
        </div>
        <div className="home-rentals-loading">
          <div className="home-rentals-spinner"></div>
        </div>
      </section>
    );
  }

  if (error && rentals.length === 0) {
    return null; // Don't show section on error to avoid breaking the homepage flow
  }

  // If no rentals found, don't display the section
  if (rentals.length === 0 && !loading) {
    return null;
  }

  return (
    <section className="home-rentals-section">
      <div className="home-rentals-header">
        <h2>Vehicle Rentals</h2>
        <button 
          className="home-rentals-view-all"
          onClick={handleViewAllRentals}
        >
          View All
        </button>
      </div>

      <div className="home-rentals-carousel-container">
        {/* Carousel navigation buttons - only show if we have rentals */}
        {rentals.length > 0 && (
          <button 
            className={`rental-carousel-nav rental-carousel-prev ${activeSlide === 0 ? 'disabled' : ''}`}
            onClick={scrollToPrev}
            disabled={activeSlide === 0}
            aria-label="Previous rental"
          >
            &#10094;
          </button>
        )}

        <div className="home-rentals-carousel" ref={carouselRef}>
          {loading ? (
            <div className="rental-carousel-item rental-carousel-loader">
              <div className="home-rentals-spinner"></div>
            </div>
          ) : rentals.length > 0 ? (
            // Map through rentals if we have any
            rentals.map((vehicle, index) => {
              // Ensure provider data is properly formatted as strings for RentalCard
              const formattedVehicle = {
                ...vehicle,
                // Format provider data correctly 
                provider: typeof vehicle.provider === 'object' 
                  ? (vehicle.provider.businessName || vehicle.provider.name || 'Unknown Provider') 
                  : (vehicle.provider || 'Unknown Provider'),
                providerLocation: typeof vehicle.provider === 'object' && vehicle.provider.location 
                  ? `${vehicle.provider.location.city || ''}${vehicle.provider.location.country ? `, ${vehicle.provider.location.country}` : ''}` 
                  : '',
                providerLogo: typeof vehicle.provider === 'object' 
                  ? (vehicle.provider.logo || vehicle.provider.profile?.logo || '/images/placeholders/provider-logo.jpg') 
                  : null,
                // Ensure other properties are properly formatted
                id: vehicle._id || vehicle.id,
                rates: vehicle.rates || { daily: vehicle.dailyRate || 0 }
              };
              
              return (
                <div 
                  key={formattedVehicle.id || `rental-${index}`} 
                  className={`rental-carousel-item ${activeSlide === index ? 'active' : ''}`}
                >
                  <RentalCard 
                    vehicle={formattedVehicle}
                    onRent={() => handleRentVehicle(vehicle)}
                  />
                </div>
              );
            })
          ) : (
            // Empty state when no rentals are found
            <div className="rental-empty-state">
              <div className="rental-empty-state-icon">
                🚗
              </div>
              <div className="rental-empty-state-message">
                No car rentals are currently available
              </div>
              <div className="rental-empty-state-submessage">
                Check back later or contact us to inquire about upcoming rentals
              </div>
            </div>
          )}
        </div>

        {/* Only show next button if we have rentals */}
        {rentals.length > 0 && (
          <button 
            className={`rental-carousel-nav rental-carousel-next ${activeSlide === rentals.length - 1 ? 'disabled' : ''}`}
            onClick={scrollToNext}
            disabled={activeSlide === rentals.length - 1}
            aria-label="Next rental"
          >
            &#10095;
          </button>
        )}
      </div>

      {/* Pagination indicators - only show if we have rentals */}
      {rentals.length > 0 && (
        <div className="rental-carousel-pagination">
          <span className="rental-pagination-info">
            {activeSlide + 1} of {rentals.length}
          </span>
          <div className="rental-pagination-dots">
            {rentals.map((_, index) => (
              <span 
                key={index} 
                className={`rental-pagination-dot ${activeSlide === index ? 'active' : ''}`}
                onClick={() => {
                  if (carouselRef.current) {
                    const cardWidth = carouselRef.current.querySelector('.rental-carousel-item')?.offsetWidth;
                    const gap = 20;
                    setActiveSlide(index);
                    carouselRef.current.scrollTo({
                      left: index * (cardWidth + gap),
                      behavior: 'smooth'
                    });
                  }
                }}
              >
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeRentalsSection;