// src/components/features/PublicTransportSection/PublicTransportPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
import ShareModal from '../../shared/ShareModal.js';
import './PublicTransportPage.css';

// Mock transport routes data - now focusing on individual routes rather than providers
const MOCK_TRANSPORT_ROUTES = [
  // Gaborone Express Routes
  {
    id: 'tr1',
    origin: 'Main Mall',
    destination: 'Airport',
    image: '/images/transport/bus-route1.jpg',
    routeType: 'Bus',
    provider: 'Gaborone Express',
    providerLogo: '/images/services/transport-logo1.jpg',
    fare: 5.50,
    schedule: {
      departure: '06:00',
      arrival: '06:45'
    },
    frequency: 'Every 30 minutes',
    stops: ['Main Mall', 'Fairgrounds', 'Village', 'Airport'],
    status: 'On time',
    amenities: ['Air Conditioning', 'Wi-Fi', 'Comfortable Seating'],
    city: 'Gaborone'
  },
  {
    id: 'tr2',
    origin: 'Main Mall',
    destination: 'Game City',
    image: '/images/transport/bus-route2.jpg',
    routeType: 'Bus',
    provider: 'Gaborone Express',
    providerLogo: '/images/services/transport-logo1.jpg',
    fare: 4.00,
    schedule: {
      departure: '07:00',
      arrival: '07:40'
    },
    frequency: 'Every 15 minutes (Peak), Every 30 minutes (Off-peak)',
    stops: ['Main Mall', 'UB Campus', 'Ext 9', 'Game City'],
    status: 'On time',
    amenities: ['Air Conditioning', 'Wi-Fi'],
    city: 'Gaborone'
  },
  {
    id: 'tr3',
    origin: 'Main Mall',
    destination: 'Riverwalk',
    image: '/images/transport/bus-route3.jpg',
    routeType: 'Bus',
    provider: 'Gaborone Express',
    providerLogo: '/images/services/transport-logo1.jpg',
    fare: 3.50,
    schedule: {
      departure: '07:15',
      arrival: '07:45'
    },
    frequency: 'Every 20 minutes',
    stops: ['Main Mall', 'Government Enclave', 'Riverwalk'],
    status: 'On time',
    amenities: ['Air Conditioning'],
    city: 'Gaborone'
  },
  // Safe Ride Taxi Routes
  {
    id: 'tr4',
    origin: 'Airport',
    destination: 'City Center Hotels',
    image: '/images/transport/taxi-route1.jpg',
    routeType: 'Taxi',
    provider: 'SafeRide Taxis',
    providerLogo: '/images/services/transport-logo2.jpg',
    fare: 25.00,
    schedule: {
      departure: 'On Demand',
      arrival: 'Approximately 30 minutes'
    },
    frequency: '24/7 Service',
    stops: ['Airport', 'Grand Palm', 'Avani Hotel', 'Masa Centre'],
    status: 'Available',
    amenities: ['Air Conditioning', 'Free Wi-Fi', 'Bottled Water', 'Phone Charging'],
    city: 'Gaborone'
  },
  {
    id: 'tr5',
    origin: 'Masa Centre',
    destination: 'Game City',
    image: '/images/transport/taxi-route2.jpg',
    routeType: 'Taxi',
    provider: 'SafeRide Taxis',
    providerLogo: '/images/services/transport-logo2.jpg',
    fare: 15.00,
    schedule: {
      departure: 'On Demand',
      arrival: 'Approximately 15 minutes'
    },
    frequency: '24/7 Service',
    stops: ['Custom route'],
    status: 'Available',
    amenities: ['Air Conditioning', 'Free Wi-Fi', 'Phone Charging'],
    city: 'Gaborone'
  },
  // Francistown Transit Routes
  {
    id: 'tr6',
    origin: 'Francistown CBD',
    destination: 'Tati Siding',
    image: '/images/transport/bus-route4.jpg',
    routeType: 'Bus',
    provider: 'Francistown Transit',
    providerLogo: '/images/services/transport-logo3.jpg',
    fare: 4.50,
    schedule: {
      departure: '06:30',
      arrival: '07:15'
    },
    frequency: 'Every 45 minutes',
    stops: ['Francistown CBD', 'Donga', 'Somerset', 'Tati Siding'],
    status: 'Delayed',
    amenities: ['Air Conditioning'],
    city: 'Francistown'
  },
  {
    id: 'tr7',
    origin: 'Francistown CBD',
    destination: 'Tonota',
    image: '/images/transport/bus-route5.jpg',
    routeType: 'Bus',
    provider: 'Francistown Transit',
    providerLogo: '/images/services/transport-logo3.jpg',
    fare: 6.00,
    schedule: {
      departure: '07:00',
      arrival: '07:50'
    },
    frequency: 'Every 60 minutes',
    stops: ['Francistown CBD', 'Tati Town', 'Tonota'],
    status: 'On time',
    amenities: ['Air Conditioning', 'Wi-Fi'],
    city: 'Francistown'
  },
  // Maun Shuttle Routes
  {
    id: 'tr8',
    origin: 'Maun Airport',
    destination: 'Delta Lodges',
    image: '/images/transport/shuttle-route1.jpg',
    routeType: 'Shuttle',
    provider: 'Maun Shuttle Services',
    providerLogo: '/images/services/transport-logo4.jpg',
    fare: 120.00,
    schedule: {
      departure: 'Based on flight arrivals',
      arrival: '1-2 hours depending on lodge'
    },
    frequency: 'Schedule based on bookings',
    stops: ['Maun Airport', 'Maun Town (on request)', 'Various Delta Lodges'],
    status: 'On time',
    amenities: ['Air Conditioning', 'Wi-Fi', 'Bottled Water', 'Safari Guide'],
    city: 'Maun'
  },
  {
    id: 'tr9',
    origin: 'Maun Town',
    destination: 'Moremi Game Reserve',
    image: '/images/transport/shuttle-route2.jpg',
    routeType: 'Shuttle',
    provider: 'Maun Shuttle Services',
    providerLogo: '/images/services/transport-logo4.jpg',
    fare: 150.00,
    schedule: {
      departure: '07:00',
      arrival: '10:00'
    },
    frequency: 'Daily service (bookings required)',
    stops: ['Maun Town', 'Shorobe', 'Moremi Gate'],
    status: 'On time',
    amenities: ['Air Conditioning', 'Safari Guide', 'Refreshments', 'Wildlife Spotting'],
    city: 'Maun'
  }
];

const ROUTES_PER_PAGE = 9; // Set to display exactly 9 routes per page

const PublicTransportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  // Add fetch controller ref and cooldown
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds between fetches
  
  // State for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const shareButtonRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    transportType: '',
    origin: '',
    destination: '',
    provider: '',
    maxFare: ''
  });

  // Initialize with mock data (replace with API call)
  useEffect(() => {
    const fetchRoutes = async () => {
      // Prevent multiple concurrent fetches
      if (fetchInProgress.current) {
        return;
      }
      
      // Add cooldown to prevent rapid successive fetches
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;
      if (timeSinceLastFetch < FETCH_COOLDOWN) {
        setTimeout(fetchRoutes, FETCH_COOLDOWN - timeSinceLastFetch);
        return;
      }
      
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      
      try {
        // Parse parameters from URL
        const searchParams = new URLSearchParams(location.search);
        const page = parseInt(searchParams.get('page')) || 1;
        
        // Update filter states from URL parameters
        const urlFilters = {
          search: searchParams.get('search') || '',
          city: searchParams.get('city') || '',
          transportType: searchParams.get('transportType') || '',
          origin: searchParams.get('origin') || '',
          destination: searchParams.get('destination') || '',
          provider: searchParams.get('provider') || '',
          maxFare: searchParams.get('maxFare') || ''
        };
        
        setFilters(urlFilters);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real app, this would be an API call with the filters
        // For now, use mock data
        setRoutes(MOCK_TRANSPORT_ROUTES);
        
        lastFetchTime.current = Date.now();
        
      } catch (error) {
        console.error('Error loading transport routes:', error);
        setError('Failed to load transport routes. Please try again later.');
        setRoutes([]);
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    };

    fetchRoutes();
  }, [location.search]);

  // Filter routes based on selected filters
  useEffect(() => {
    if (routes.length > 0) {
      let results = [...routes];
      
      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        results = results.filter(route => 
          route.origin.toLowerCase().includes(searchTerm) ||
          route.destination.toLowerCase().includes(searchTerm) ||
          route.routeType.toLowerCase().includes(searchTerm) ||
          route.provider.toLowerCase().includes(searchTerm) ||
          route.stops.some(stop => stop.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply city filter
      if (filters.city) {
        results = results.filter(route => 
          route.city?.toLowerCase() === filters.city.toLowerCase()
        );
      }
      
      // Apply transport type filter
      if (filters.transportType) {
        results = results.filter(route => 
          route.routeType?.toLowerCase() === filters.transportType.toLowerCase()
        );
      }
      
      // Apply origin filter
      if (filters.origin) {
        results = results.filter(route => 
          route.origin?.toLowerCase() === filters.origin.toLowerCase()
        );
      }
      
      // Apply destination filter
      if (filters.destination) {
        results = results.filter(route => 
          route.destination?.toLowerCase() === filters.destination.toLowerCase()
        );
      }
      
      // Apply provider filter
      if (filters.provider) {
        results = results.filter(route => 
          route.provider?.toLowerCase() === filters.provider.toLowerCase()
        );
      }
      
      // Apply maximum fare filter
      if (filters.maxFare) {
        const maxFare = parseFloat(filters.maxFare);
        results = results.filter(route => 
          route.fare <= maxFare
        );
      }
      
      // Set filtered results
      setFilteredRoutes(results);
      
      // Calculate total pages
      const totalPages = Math.ceil(results.length / ROUTES_PER_PAGE);
      setPagination({
        currentPage: parseInt(new URLSearchParams(location.search).get('page')) || 1,
        totalPages: totalPages,
        total: results.length
      });
    }
  }, [routes, filters, location.search]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    const searchParams = new URLSearchParams();
    
    // Only add parameters that have values
    if (filters.search) searchParams.set('search', filters.search);
    if (filters.city) searchParams.set('city', filters.city);
    if (filters.transportType) searchParams.set('transportType', filters.transportType);
    if (filters.origin) searchParams.set('origin', filters.origin);
    if (filters.destination) searchParams.set('destination', filters.destination);
    if (filters.provider) searchParams.set('provider', filters.provider);
    if (filters.maxFare) searchParams.set('maxFare', filters.maxFare);
    
    // Reset to page 1 when filters change
    searchParams.set('page', '1');
    
    // Update URL
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      city: '',
      transportType: '',
      origin: '',
      destination: '',
      provider: '',
      maxFare: ''
    });
    
    // Clear URL parameters except for page
    navigate({
      pathname: location.pathname,
      search: '?page=1'
    });
  };

  // Handle share modal
  const handleShare = (route, buttonRef) => {
    setSelectedRoute(route);
    shareButtonRef.current = buttonRef;
    setShareModalOpen(true);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get current page routes
  const getCurrentPageRoutes = () => {
    const startIndex = (pagination.currentPage - 1) * ROUTES_PER_PAGE;
    const endIndex = startIndex + ROUTES_PER_PAGE;
    return filteredRoutes.slice(startIndex, endIndex);
  };

  // Handle route booking
  const handleBookRoute = (route) => {
    console.log('Booking route:', route);
    // In a real app, this would navigate to a booking page or open a booking modal
    navigate(`/transport-routes/${route.id}`);
  };

  // Generate array of page numbers to display in pagination
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const MAX_VISIBLE_PAGES = 5;
    
    if (totalPages <= MAX_VISIBLE_PAGES) {
      // Show all pages if we have fewer than MAX_VISIBLE_PAGES
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Show a window of pages around the current page
    let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let endPage = startPage + MAX_VISIBLE_PAGES - 1;
    
    // Adjust if we're close to the end
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // Get unique values for filter dropdowns
  const getUniqueOrigins = () => {
    const origins = new Set(routes.map(route => route.origin));
    return Array.from(origins).sort();
  };

  const getUniqueDestinations = () => {
    const destinations = new Set(routes.map(route => route.destination));
    return Array.from(destinations).sort();
  };

  const getUniqueProviders = () => {
    const providers = new Set(routes.map(route => route.provider));
    return Array.from(providers).sort();
  };

  const getUniqueCities = () => {
    const cities = new Set(routes.map(route => route.city));
    return Array.from(cities).sort();
  };

  return (
    <div className="bcc-transport-container">
      {/* Filter Section */}
      <div className="bcc-transport-filters">
        <div className="filters-header">
          <h2>Find Public Transport Routes</h2>
        </div>
        
        <div className="filters-quick-row">
          <div className="filter-control search-filter">
            <input
              type="text"
              name="search"
              placeholder="Search for routes, destinations, services..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-control">
            <select
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
            >
              <option value="">All Cities</option>
              {getUniqueCities().map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-control">
            <select
              name="transportType"
              value={filters.transportType}
              onChange={handleFilterChange}
            >
              <option value="">All Transport Types</option>
              <option value="Bus">Bus</option>
              <option value="Taxi">Taxi</option>
              <option value="Shuttle">Shuttle</option>
              <option value="Train">Train</option>
            </select>
          </div>
        </div>
        
        <div className="filters-advanced-row">
          <div className="filter-control">
            <label>Origin</label>
            <select
              name="origin"
              value={filters.origin}
              onChange={handleFilterChange}
            >
              <option value="">All Origins</option>
              {getUniqueOrigins().map((origin, index) => (
                <option key={index} value={origin}>{origin}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-control">
            <label>Destination</label>
            <select
              name="destination"
              value={filters.destination}
              onChange={handleFilterChange}
            >
              <option value="">All Destinations</option>
              {getUniqueDestinations().map((destination, index) => (
                <option key={index} value={destination}>{destination}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Max Fare (P)</label>
            <input
              type="number"
              name="maxFare"
              placeholder="Maximum fare"
              value={filters.maxFare}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-control">
            <label>Provider</label>
            <select
              name="provider"
              value={filters.provider}
              onChange={handleFilterChange}
            >
              <option value="">All Providers</option>
              {getUniqueProviders().map((provider, index) => (
                <option key={index} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-actions">
            <button className="reset-filters-btn" onClick={resetFilters}>
              Reset
            </button>
            <button className="apply-filters-btn" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bcc-transport-header">
        <h1>Public Transport</h1>
        <div className="transport-stats">
          {loading ? 
            'Loading...' : 
            `${pagination.total} ${pagination.total === 1 ? 'route' : 'routes'} found • Page ${pagination.currentPage} of ${pagination.totalPages}`
          }
        </div>
      </div>

      {loading && filteredRoutes.length === 0 ? (
        <div className="loading-overlay">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <div className="error-message">
          <h3>{error}</h3>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : !filteredRoutes || !filteredRoutes.length ? (
        <div className="empty-state">
          <h2>No transport routes available matching your filters</h2>
          <p>Please try different search criteria or check back later.</p>
          <button 
            className="reset-filters-btn" 
            onClick={resetFilters}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="bcc-transport-grid">
            {getCurrentPageRoutes().map((route) => (
              <PublicTransportCard 
                key={route.id}
                route={route}
                onBook={handleBookRoute}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              {/* First page button */}
              {pagination.currentPage > 2 && (
                <button 
                  className="page-button first" 
                  onClick={() => handlePageChange(1)}
                  aria-label="First page"
                >
                  &laquo;
                </button>
              )}
              
              {/* Previous button */}
              <button 
                className="page-button prev" 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                &lsaquo;
              </button>
              
              {/* Page numbers */}
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  className={`page-number ${pagination.currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              
              {/* Next button */}
              <button 
                className="page-button next" 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &rsaquo;
              </button>
              
              {/* Last page button */}
              {pagination.currentPage < pagination.totalPages - 1 && (
                <button 
                  className="page-button last" 
                  onClick={() => handlePageChange(pagination.totalPages)}
                  aria-label="Last page"
                >
                  &raquo;
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Share Modal Component */}
      {shareModalOpen && selectedRoute && (
        <ShareModal 
          car={selectedRoute}
          onClose={() => setShareModalOpen(false)}
          buttonRef={shareButtonRef}
        />
      )}
    </div>
  );
};

export default PublicTransportPage;