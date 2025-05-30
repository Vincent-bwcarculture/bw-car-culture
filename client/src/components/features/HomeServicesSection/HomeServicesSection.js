// src/components/features/HomeServicesSection/HomeServicesSection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import BusinessCard from '../../shared/BusinessCard/BusinessCard.js';
import './HomeServicesSection.css';

// Service categories for filtering
const SERVICE_CATEGORIES = [
  {
    id: 'all',
    name: 'All Service Providers',
    icon: '',
    providerType: null
  },
  {
    id: 'workshops',
    name: 'Workshops',
    icon: '',
    providerType: 'workshop'
  },
  {
    id: 'car-rentals',
    name: 'Car Rentals',
    icon: '',
    providerType: 'car_rental'
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '',
    providerType: 'public_transport'
  }
];

const HomeServicesSection = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  // Number of services to show per page
  const SERVICES_PER_PAGE = 10;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build filters based on selected category
        const filters = {
          status: 'active',
          limit: SERVICES_PER_PAGE,
          page: currentPage
        };

        // Add provider type filter if not 'all'
        const categoryData = SERVICE_CATEGORIES.find(cat => cat.id === selectedCategory);
        if (categoryData && categoryData.providerType) {
          filters.providerType = categoryData.providerType;
        }

        console.log('Fetching services with filters:', filters);

        // Try multiple endpoints to ensure compatibility
        const endpointsToTry = ['/providers', '/api/providers'];
        let success = false;

        for (const endpoint of endpointsToTry) {
          try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                queryParams.append(key, value.toString());
              }
            });

            const response = await http.get(`${endpoint}?${queryParams.toString()}`);
            
            if (response.data && response.data.success) {
              const providers = response.data.data || [];
              console.log(`Successfully fetched ${providers.length} service providers from ${endpoint}`);
              
              setServices(providers);
              
              // Calculate total pages
              const pagination = response.data.pagination || {
                currentPage: currentPage,
                totalPages: Math.ceil(providers.length / SERVICES_PER_PAGE),
                total: providers.length
              };
              
              setTotalPages(pagination.totalPages || 1);
              success = true;
              break;
            }
          } catch (error) {
            console.log(`Failed to fetch from ${endpoint}:`, error.message);
            continue;
          }
        }

        if (!success) {
          console.warn('All service provider endpoints failed, setting empty results');
          setServices([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setError('Unable to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [currentPage, selectedCategory]);

  const handleViewAllServices = () => {
    // Navigate to services page with current category filter
    if (selectedCategory === 'all') {
      navigate('/services');
    } else {
      navigate(`/services?category=${selectedCategory}`);
    }
  };

  const handleServiceAction = (service) => {
    if (!service || !service._id) {
      console.error('Cannot navigate: service has no ID', service);
      return;
    }
    
    const serviceType = service.providerType || 'service';
    const typeParam = `?type=${serviceType}`;
    navigate(`/services/${service._id}${typeParam}`);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
    setActiveSlide(0); // Reset active slide
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setActiveSlide(0); // Reset active slide when changing page
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setActiveSlide(0); // Reset active slide when changing page
    }
  };

  // Handle carousel navigation
  const scrollToNext = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.bcc-business-card')?.offsetWidth;
      const gap = 20; // Approximate gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide + 1;
        if (newActiveSlide < services.length) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: cardWidth + gap,
            behavior: 'smooth'
          });
        } else if (currentPage < totalPages) {
          // If we're at the end of the current page of services, load the next page
          handleNextPage();
        }
      }
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.bcc-business-card')?.offsetWidth;
      const gap = 20; // Approximate gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide - 1;
        if (newActiveSlide >= 0) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: -(cardWidth + gap),
            behavior: 'smooth'
          });
        } else if (currentPage > 1) {
          // If we're at the beginning of the current page, go to previous page
          handlePrevPage();
        }
      }
    }
  };

  // Always show the section structure, handle empty states within
  const showLoadingState = loading && services.length === 0;
  const showErrorState = error && services.length === 0 && !loading;
  const showEmptyState = services.length === 0 && !loading && !error;
  const selectedCategoryData = SERVICE_CATEGORIES.find(cat => cat.id === selectedCategory) || SERVICE_CATEGORIES[0];

  return (
    <section className="home-services-section">
      <div className="home-services-header">
        <h2>Professional Service Providers</h2>
        <button 
          className="home-services-view-all"
          onClick={handleViewAllServices}
        >
          View All
        </button>
      </div>

      {/* Service Categories - Always show */}
      <div className="home-services-categories">
        {SERVICE_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`home-services-category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            <span className="home-services-category-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Conditional Content */}
      {showLoadingState ? (
        <div className="home-services-loading">
          <div className="home-services-spinner"></div>
        </div>
      ) : showErrorState ? (
        <div className="home-services-empty">
          <h3>Unable to load service providers</h3>
          <p>Please try again later or check your connection.</p>
        </div>
      ) : showEmptyState ? (
        <div className="home-services-empty">
          <h3>No {selectedCategoryData.name.toLowerCase()} available</h3>
          <p>
            {selectedCategory === 'all' 
              ? 'No service providers are currently available.' 
              : `No ${selectedCategoryData.name.toLowerCase()} providers found. Try selecting a different category.`}
          </p>
        </div>
      ) : (
        <>
          <div className="home-services-carousel-container">
            {/* Carousel navigation buttons */}
            <button 
              className={`carousel-nav carousel-prev ${activeSlide === 0 && currentPage === 1 ? 'disabled' : ''}`}
              onClick={scrollToPrev}
              disabled={activeSlide === 0 && currentPage === 1}
              aria-label="Previous service"
            >
              &#10094;
            </button>

            <div className="home-services-carousel" ref={carouselRef}>
              {services.map((service, index) => (
                <div 
                  key={service._id} 
                  className={`carousel-item ${activeSlide === index ? 'active' : ''}`}
                >
                  <BusinessCard 
                    business={service}
                    onAction={handleServiceAction}
                    compact={false}
                  />
                </div>
              ))}
              
              {loading && (
                <div className="carousel-item carousel-loader">
                  <div className="home-services-spinner"></div>
                </div>
              )}
            </div>

            <button 
              className={`carousel-nav carousel-next ${activeSlide === services.length - 1 && currentPage === totalPages ? 'disabled' : ''}`}
              onClick={scrollToNext}
              disabled={activeSlide === services.length - 1 && currentPage === totalPages}
              aria-label="Next service"
            >
              &#10095;
            </button>
          </div>

          {/* Pagination indicators */}
          <div className="carousel-pagination">
            <span className="pagination-info">
              {selectedCategoryData.name} - Page {currentPage} of {totalPages}
            </span>
            <div className="pagination-dots">
              {services.map((_, index) => (
                <span 
                  key={index} 
                  className={`pagination-dot ${activeSlide === index ? 'active' : ''}`}
                  onClick={() => {
                    if (carouselRef.current) {
                      const cardWidth = carouselRef.current.querySelector('.bcc-business-card')?.offsetWidth;
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
        </>
      )}
    </section>
  );
};

export default HomeServicesSection;
