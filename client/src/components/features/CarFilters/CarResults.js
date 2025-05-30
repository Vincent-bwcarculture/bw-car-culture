// src/components/features/CarFilters/CarResults.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../../services/listingService.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import './CarResults.css';

const CarResults = ({ filters = {}, hasSearched = false, onExpandFilter, onSearchPerformed }) => {
  const [results, setResults] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  
  // Carousel state - simplified
  const [activeSlide, setActiveSlide] = useState(0);
  const [featuredActiveSlide, setFeaturedActiveSlide] = useState(0);
  
  const navigate = useNavigate();
  const searchCarouselRef = useRef(null);
  const featuredCarouselRef = useRef(null);
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify({}));
  const prevPageRef = useRef(1);

  // Random shuffle function
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Load featured listings on component mount
  useEffect(() => {
    const loadFeaturedListings = async () => {
      try {
        setFeaturedLoading(true);
        
        const featuredResponse = await listingService.getFeaturedListings(12);
        
        if (featuredResponse && featuredResponse.length > 0) {
          const shuffledFeatured = shuffleArray(featuredResponse);
          console.log(`Loaded ${shuffledFeatured.length} featured listings (randomized)`);
          setFeaturedListings(shuffledFeatured);
        } else {
          console.log('No featured listings found, trying popular listings');
          
          try {
            const popularResponse = await listingService.getPopularListings(12);
            
            if (popularResponse && popularResponse.length > 0) {
              const shuffledPopular = shuffleArray(popularResponse);
              console.log(`Loaded ${shuffledPopular.length} popular listings as fallback (randomized)`);
              setFeaturedListings(shuffledPopular);
            } else {
              const anyListings = await listingService.getListings({}, 1, 12);
              
              if (anyListings && anyListings.listings && anyListings.listings.length > 0) {
                const shuffledAny = shuffleArray(anyListings.listings);
                console.log(`Loaded ${shuffledAny.length} regular listings as fallback (randomized)`);
                setFeaturedListings(shuffledAny);
              } else {
                console.warn('No listings could be loaded at all');
                setFeaturedListings([]);
              }
            }
          } catch (popularError) {
            console.error('Error fetching popular listings:', popularError);
            setFeaturedListings([]);
          }
        }
      } catch (error) {
        console.error('Error loading featured listings:', error);
        setFeaturedListings([]);
      } finally {
        setFeaturedLoading(false);
      }
    };
    
    loadFeaturedListings();
  }, [shuffleArray]);

  // Filter parser
  const parseApiFilters = useCallback((uiFilters) => {
    console.log("Processing UI filters:", uiFilters);
    
    const apiFilters = {};
    
    if (uiFilters.searchKeyword) {
      apiFilters.search = uiFilters.searchKeyword;
    }
    
    if (uiFilters.make && uiFilters.make !== 'All Makes' && uiFilters.make !== '') {
      apiFilters.make = uiFilters.make;
    }
    
    if (uiFilters.model && uiFilters.model !== 'All Models' && uiFilters.model !== '') {
      apiFilters.model = uiFilters.model;
    }
    
    if (uiFilters.yearRange && uiFilters.yearRange !== 'All Years' && uiFilters.yearRange !== '') {
      if (uiFilters.yearRange === 'Pre-2020') {
        apiFilters.maxYear = 2019;
      } else if (!isNaN(parseInt(uiFilters.yearRange))) {
        const year = parseInt(uiFilters.yearRange);
        apiFilters.year = year;
      }
    }
    
    if (uiFilters.priceRange && uiFilters.priceRange !== 'All Prices' && uiFilters.priceRange !== '') {
      const priceRange = uiFilters.priceRange;
      
      if (priceRange.includes('Under')) {
        const maxPriceStr = priceRange.match(/[\d,]+/)[0].replace(/,/g, '');
        const maxPrice = parseInt(maxPriceStr);
        apiFilters.maxPrice = maxPrice;
      } else if (priceRange.includes('Over')) {
        const minPriceStr = priceRange.match(/[\d,]+/)[0].replace(/,/g, '');
        const minPrice = parseInt(minPriceStr);
        apiFilters.minPrice = minPrice;
      } else if (priceRange.includes('-')) {
        const prices = priceRange.match(/[\d,]+/g).map(p => parseInt(p.replace(/,/g, '')));
        if (prices.length >= 2) {
          apiFilters.minPrice = prices[0];
          apiFilters.maxPrice = prices[1];
        }
      }
    }
    
    if (uiFilters.fuelType && uiFilters.fuelType !== 'All Fuel Types' && uiFilters.fuelType !== '') {
      apiFilters.fuelType = uiFilters.fuelType.toLowerCase();
    }
    
    if (uiFilters.transmission && uiFilters.transmission !== 'All Transmissions' && uiFilters.transmission !== '') {
      apiFilters.transmission = uiFilters.transmission.toLowerCase();
    }
    
    if (uiFilters.vehicleType && uiFilters.vehicleType !== 'All Types' && uiFilters.vehicleType !== '') {
      apiFilters.bodyStyle = uiFilters.vehicleType;
    }
    
    if (uiFilters.conditionType && uiFilters.conditionType !== 'All Conditions' && uiFilters.conditionType !== '') {
      apiFilters.condition = uiFilters.conditionType.toLowerCase();
    }
    
    console.log("Final API filters:", apiFilters);
    return apiFilters;
  }, []);

  // Fetch listings when filters or page changes
  useEffect(() => {
    if (!hasSearched) {
      console.log('No search performed yet, showing featured listings');
      setResults([]);
      setTotalVehicles(0);
      return;
    }
    
    const currentFiltersString = JSON.stringify(filters);
    
    if (
      prevFiltersRef.current === currentFiltersString && 
      prevPageRef.current === currentPage && 
      results.length > 0
    ) {
      console.log('Skipping fetch - filters and page unchanged');
      return;
    }
    
    prevFiltersRef.current = currentFiltersString;
    prevPageRef.current = currentPage;
 
    const fetchCarListings = async () => {
      if (isFetchingRef.current) {
        console.log('Fetch already in progress, skipping');
        return;
      }
      
      isFetchingRef.current = true;
      console.log('Fetching car listings with filters:', filters);
      
      try {
        setLoading(true);
        setError(null);
        setActiveSlide(0); // Reset carousel position
        
        const apiFilters = parseApiFilters(filters);
        const hasActiveFilters = Object.keys(apiFilters).length > 0;
        
        if (!hasActiveFilters) {
          console.log('No active filters, showing all vehicles');
        }
        
        try {
          const response = await listingService.getListings(apiFilters, currentPage, 20);
          
          if (response && response.listings && response.listings.length > 0) {
            console.log(`Found ${response.listings.length} vehicles from API`);
            
            const shuffledResults = shuffleArray(response.listings);
            console.log('Results randomized for carousel display');
            
            setResults(shuffledResults);
            setTotalPages(response.totalPages || 1);
            setTotalVehicles(response.total || response.listings.length);
          } else {
            console.log('No results from API, trying fallback approach');
            
            const allResponse = await listingService.getListings({}, 1, 50);
            
            if (allResponse && allResponse.listings && allResponse.listings.length > 0) {
              const allListings = allResponse.listings;
              console.log(`Got ${allListings.length} total listings for client-side filtering`);
              
              let filteredResults = allListings;
              
              if (filters.searchKeyword) {
                const searchTerm = filters.searchKeyword.toLowerCase();
                filteredResults = allListings.filter(car => {
                  const searchableProps = [
                    car.title,
                    car.make,
                    car.model,
                    car.description,
                    car.specifications?.make,
                    car.specifications?.model
                  ];
                  
                  return searchableProps.some(prop => 
                    prop && String(prop).toLowerCase().includes(searchTerm)
                  );
                });
              }
              
              if (filters.make) {
                const make = filters.make.toLowerCase();
                filteredResults = filteredResults.filter(car => {
                  const carMake = (car.make || car.specifications?.make || '').toLowerCase();
                  return carMake.includes(make);
                });
              }
              
              if (filters.model) {
                const model = filters.model.toLowerCase();
                filteredResults = filteredResults.filter(car => {
                  const carModel = (car.model || car.specifications?.model || '').toLowerCase();
                  return carModel.includes(model);
                });
              }
              
              const shuffledFiltered = shuffleArray(filteredResults);
              console.log(`After client-side filtering and randomization, found ${shuffledFiltered.length} vehicles`);
              
              setResults(shuffledFiltered);
              setTotalPages(1);
              setTotalVehicles(shuffledFiltered.length);
            } else {
              console.log('No vehicles found at all, showing empty results');
              setResults([]);
              setTotalVehicles(0);
            }
          }
        } catch (error) {
          console.error("Error fetching listings:", error);
          setResults([]);
          setTotalVehicles(0);
          setError('Failed to load vehicle listings. Please try again.');
        }
      } catch (error) {
        console.error('Error in fetch process:', error);
        setResults([]);
        setTotalVehicles(0);
        setError('Failed to load vehicle listings. Please try again.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchCarListings();
  }, [filters, currentPage, parseApiFilters, hasSearched, shuffleArray]);

  // Carousel navigation functions - simplified like HomeDealershipsSection
  const scrollToNext = useCallback((carouselRef, items, activeSlideState, setActiveSlideState) => {
    if (carouselRef.current && items.length > 0) {
      const cardWidth = carouselRef.current.querySelector('.vehicle-card-wrapper, .featured-card')?.offsetWidth || 300;
      const gap = 20;
      
      const newActiveSlide = activeSlideState + 1;
      if (newActiveSlide < items.length) {
        setActiveSlideState(newActiveSlide);
        carouselRef.current.scrollBy({
          left: cardWidth + gap,
          behavior: 'smooth'
        });
      } else {
        // Loop back to beginning
        setActiveSlideState(0);
        carouselRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  const scrollToPrev = useCallback((carouselRef, items, activeSlideState, setActiveSlideState) => {
    if (carouselRef.current && items.length > 0) {
      const cardWidth = carouselRef.current.querySelector('.vehicle-card-wrapper, .featured-card')?.offsetWidth || 300;
      const gap = 20;
      
      const newActiveSlide = activeSlideState - 1;
      if (newActiveSlide >= 0) {
        setActiveSlideState(newActiveSlide);
        carouselRef.current.scrollBy({
          left: -(cardWidth + gap),
          behavior: 'smooth'
        });
      } else {
        // Loop to end
        const lastSlide = items.length - 1;
        setActiveSlideState(lastSlide);
        carouselRef.current.scrollTo({
          left: lastSlide * (cardWidth + gap),
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Auto-play for featured listings
  useEffect(() => {
    if (!hasSearched && featuredListings.length > 1) {
      const interval = setInterval(() => {
        scrollToNext(featuredCarouselRef, featuredListings, featuredActiveSlide, setFeaturedActiveSlide);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [featuredListings.length, featuredActiveSlide, scrollToNext, hasSearched]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle expand filter button click
  const handleExpandFilter = () => {
    console.log('Expand filter button clicked');
    if (onExpandFilter) {
      onExpandFilter();
    }
  };

  // Get the search description text
  const getSearchDescription = () => {
    const parts = [];
    
    if (filters.make) parts.push(filters.make);
    if (filters.model) parts.push(filters.model);
    if (filters.yearRange) parts.push(filters.yearRange);
    if (filters.vehicleType) parts.push(filters.vehicleType);
    
    return parts.length > 0 ? parts.join(' ') : 'your search criteria';
  };

  // Render carousel - simplified version based on HomeDealershipsSection
  const renderCarousel = (items, carouselRef, activeSlideState, setActiveSlideState, title = "", isSearchResults = true) => {
    if (items.length === 0) return null;

    return (
      <div className="carousel-section">
        {title && <h3 className="carousel-title">{title}</h3>}
        
        <div className="carousel-container">
          {/* Previous Button */}
          <button 
            className={`carousel-nav carousel-prev ${activeSlideState === 0 ? 'disabled' : ''}`}
            onClick={() => scrollToPrev(carouselRef, items, activeSlideState, setActiveSlideState)}
            disabled={items.length <= 1}
            aria-label="Previous vehicles"
          >
            &#10094;
          </button>

          {/* Carousel Content */}
          <div className="carousel-track" ref={carouselRef}>
            {items.map((car, index) => (
              <div 
                key={car._id || car.id || `${isSearchResults ? 'search' : 'featured'}-${index}`} 
                className={`carousel-item ${activeSlideState === index ? 'active' : ''} ${isSearchResults ? 'vehicle-card-wrapper' : 'featured-card'}`}
              >
                <VehicleCard car={car} isFeatured={!isSearchResults} />
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button 
            className={`carousel-nav carousel-next ${activeSlideState === items.length - 1 ? 'disabled' : ''}`}
            onClick={() => scrollToNext(carouselRef, items, activeSlideState, setActiveSlideState)}
            disabled={items.length <= 1}
            aria-label="Next vehicles"
          >
            &#10095;
          </button>
        </div>

        {/* Simple counter instead of large pagination */}
        <div className="carousel-info">
          <span className="carousel-counter">
            {activeSlideState + 1} of {items.length} vehicles
          </span>
        </div>
      </div>
    );
  };

  // Render featured content when no search is performed
  const renderFeaturedContent = () => {
    if (featuredLoading) {
      return (
        <div className="featured-loading">
          <div className="loader"></div>
          <p>Loading featured vehicles...</p>
        </div>
      );
    }
    
    if (featuredListings.length === 0) {
      return (
        <div className="no-featured">
          <p>No featured listings available at this time.</p>
          <p>Tell us more about the vehicle you're looking for using the search filters above.</p>
          <button 
            className="customize-search-btn"
            onClick={handleExpandFilter}
          >
            Customize Your Search
          </button>
        </div>
      );
    }
    
    return (
      <div className="featured-content">
        <div className="featured-message">
          <h3>Featured Vehicles</h3>
          <p>Tell us more about the vehicle you're looking for. Use the search filters above to find your perfect match.</p>
        </div>
        
        {renderCarousel(featuredListings, featuredCarouselRef, featuredActiveSlide, setFeaturedActiveSlide, "", false)}
        
        <div className="featured-cta">
          <button 
            className="customize-search-btn"
            onClick={handleExpandFilter}
          >
            Customize Your Search
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="car-results-container">
      {/* Available Vehicles Header */}
      <div className="results-count-header">
        <h2>Available Vehicles</h2>
        {hasSearched ? (
          <span className="results-count">
            {loading ? 'Loading...' : `${totalVehicles} vehicles found • Page ${currentPage} of ${totalPages}`}
          </span>
        ) : (
          <span className="results-count">Find your perfect vehicle</span>
        )}
      </div>

      {/* Main Content Area */}
      {hasSearched ? (
        // Search Results
        loading ? (
          <div className="results-loading">
            <div className="loader"></div>
            <p>Searching for vehicles that match your criteria...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : results.length > 0 ? (
          <div className="search-results-section">
            {renderCarousel(results, searchCarouselRef, activeSlide, setActiveSlide, `Search Results - ${getSearchDescription()}`, true)}
            
            {/* Simplified Pagination - only show if multiple pages */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-button prev"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous Page
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  className="page-button next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next Page
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-results">
            <h3>No vehicles match {getSearchDescription()}</h3>
            <p>Try adjusting your search filters or explore our featured listings.</p>
            <div className="no-results-actions">
              <button 
                className="view-featured-btn"
                onClick={() => {
                  console.log('Switching to featured listings view');
                  if (onSearchPerformed) {
                    onSearchPerformed(false);
                  }
                }}
              >
                View Featured Listings
              </button>
                           
              <button 
                className="adjust-filters-btn"
                onClick={handleExpandFilter}
              >
                Adjust Filters
              </button>
            </div>
          </div>
        )
      ) : (
        // Featured Content (when no search is performed)
        renderFeaturedContent()
      )}
    </div>
  );
};

export default CarResults;