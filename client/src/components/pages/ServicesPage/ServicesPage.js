// src/components/pages/ServicesPage/ServicesPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BusinessCard from '../../shared/BusinessCard/BusinessCard.js';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
import { http } from '../../../config/axios.js';
import './ServicesPage.css';

// Enhanced service categories with better transport search options
const SERVICE_CATEGORIES = [
  {
    id: 'workshops',
    name: 'Car Workshops',
    description: 'Find professional mechanics and service centers for all your vehicle maintenance and repair needs.',
    shortDescription: 'Expert mechanics for all your vehicle repair and maintenance needs',
    heroTitle: 'Professional Car Workshops',
    heroSubtitle: 'Expert mechanics and service centers at your fingertips',
    image: '/images/categories/workshops-banner.jpg',
    icon: '🔧',
    gradient: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(36, 36, 36) 100%)',
    filterOptions: {
      placeholder: 'Search for mechanics, repairs, services...',
      locationLabel: 'Workshop location...',
      filters: [
        { name: 'businessType', label: 'Workshop Type', options: ['All', 'Authorized', 'Independent'] },
        { name: 'specialties', label: 'Specialties', options: ['All', 'Engine Repair', 'Brakes', 'Electrical', 'Suspension', 'Air Conditioning'] }
      ]
    },
    services: [
      { name: 'Regular Maintenance', description: 'Oil changes, filter replacements, and routine inspections' },
      { name: 'Engine Repair', description: 'Diagnostics and repair of engine issues' },
      { name: 'Brake Services', description: 'Brake pad replacement, rotor resurfacing, and hydraulic system repairs' },
      { name: 'Electrical Systems', description: 'Troubleshooting and repair of electrical components' },
      { name: 'Air Conditioning', description: 'AC system recharge, repair, and maintenance' },
      { name: 'Suspension Work', description: 'Shock absorber and strut replacement' }
    ]
  },
  {
    id: 'car-rentals',
    name: 'Car Rentals',
    description: 'Browse our selection of rental vehicles from trusted providers across the country.',
    shortDescription: 'Rent vehicles for any occasion from trusted providers',
    heroTitle: 'Premium Car Rentals',
    heroSubtitle: 'Your perfect ride awaits - from economy to luxury',
    image: '/images/categories/rentals-banner.jpg',
    icon: '🚗',
    gradient: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(36, 36, 36) 100%)',
    filterOptions: {
      placeholder: 'Search for car rentals, companies, locations...',
      locationLabel: 'Rental location...',
      filters: [
        { name: 'vehicleType', label: 'Vehicle Type', options: ['All', 'Sedan', 'SUV', 'Pickup', 'Van', 'Luxury'] },
        { name: 'transmission', label: 'Transmission', options: ['All', 'Automatic', 'Manual'] },
        { name: 'priceRange', label: 'Price Range', options: ['All', 'Economy', 'Mid-range', 'Premium'] }
      ]
    }
  },
  {
    id: 'transport',
    name: 'Public Transport',
    description: 'Find information about bus services, routes, and schedules for intercity travel.',
    shortDescription: 'Find bus services and schedules for intercity travel',
    heroTitle: 'Public Transport Routes',
    heroSubtitle: 'Connect to your destination with reliable transport services',
    image: '/images/categories/transport-banner.jpg',
    icon: '🚌',
    gradient: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(36, 36, 36) 100%)',
    filterOptions: {
      placeholder: 'Search routes, destinations, stops (e.g., Mahalapye, Palapye)...',
      locationLabel: 'Location or stop name...',
      filters: [
        { name: 'destination', label: 'Destination', options: ['All', 'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye', 'Mahalapye', 'Serowe', 'Molepolole'] },
        { name: 'transportType', label: 'Transport Type', options: ['All', 'Express', 'Standard', 'Executive'] },
        { name: 'routeType', label: 'Route Type', options: ['All', 'Bus', 'Taxi', 'Shuttle'] }
      ]
    }
  }
  // {
  //   id: 'trailer-rentals',
  //   name: 'Trailer Rentals',
  //   description: 'Rent trailers and hauling equipment for moving, construction, and more.',
  //   shortDescription: 'Rent trailers for moving, construction, and special projects',
  //   heroTitle: 'Trailer & Equipment Rentals',
  //   heroSubtitle: 'Heavy-duty solutions for your hauling needs',
  //   image: '/images/categories/trailer-banner.jpg',
  //   icon: '🚚',
  //   gradient: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(36, 36, 36) 100%)',
  //   filterOptions: {
  //     placeholder: 'Search for trailer rentals, types, sizes...',
  //     locationLabel: 'Rental location...',
  //     filters: [
  //       { name: 'trailerType', label: 'Trailer Type', options: ['All', 'Utility', 'Car Carrier', 'Enclosed', 'Flatbed'] },
  //       { name: 'capacity', label: 'Capacity', options: ['All', 'Light', 'Medium', 'Heavy'] }
  //     ]
  //   }
  // }
];

// Common bus stops in Botswana for better search functionality
const COMMON_BUS_STOPS = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye', 'Mahalapye', 
  'Serowe', 'Molepolole', 'Kanye', 'Lobatse', 'Jwaneng', 'Orapa',
  'Selebi-Phikwe', 'Tutume', 'Nata', 'Gweta', 'Rakops', 'Letlhakane',
  'Bobonong', 'Thamaga', 'Mochudi', 'Ramotswa', 'Kopong', 'Artesia',
  'Tlokweng', 'Mogoditshane', 'Gabane', 'Mmopane', 'Bokaa', 'Odi'
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListingPages, setTotalListingPages] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const categoriesTabsRef = useRef(null);
  const servicesPerPage = 9;
  const listingsPerPage = 8;
  const [listingsError, setListingsError] = useState(null);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Enhanced search suggestions for transport stops
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Initialize data with API calls
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const categoryParam = searchParams.get('category') || 'all';
    const searchParam = searchParams.get('search') || '';
    const locationParam = searchParams.get('location') || '';
    const pageParam = parseInt(searchParams.get('page'), 10) || 1;
    
    const newFilters = {};
    searchParams.forEach((value, key) => {
      if (!['category', 'search', 'location', 'page'].includes(key)) {
        newFilters[key] = value;
      }
    });
    
    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
    setLocationFilter(locationParam);
    setCurrentPage(pageParam);
    setActiveFilters(newFilters);
    
    fetchData(categoryParam, searchParam, locationParam, pageParam, newFilters);
  }, [location.search]);

  // Enhanced search suggestions handler
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    
    if (selectedCategory === 'transport' && value.length > 1) {
      const suggestions = COMMON_BUS_STOPS.filter(stop => 
        stop.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Trigger search immediately
    setTimeout(() => {
      handleSearchSubmit();
    }, 100);
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async (category = selectedCategory, search = searchQuery, 
                          locationFilter = locationFilter, page = currentPage, filters = activeFilters) => {
    try {
      setLoading(true);
      setError(null);
      setListingsLoading(true);
      setListingsError(null);
      
      let providerType = '';
      if (category === 'workshops') {
        providerType = 'workshop';
      } else if (category === 'car-rentals') {
        providerType = 'car_rental';
      } else if (category === 'trailer-rentals') {
        providerType = 'trailer_rental';
      } else if (category === 'transport') {
        providerType = 'public_transport';
      }
      
      const serviceFilters = {
        ...filters,
        search: search,
        city: locationFilter
      };
      
      if (providerType) {
        serviceFilters.providerType = providerType;
      }
      
      await fetchServiceProviders(serviceFilters, page);
      
      if (['car-rentals', 'trailer-rentals', 'transport'].includes(category)) {
        await fetchListings(category, search, locationFilter, page, filters);
      } else {
        setListings([]);
        setFilteredListings([]);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load services. Please try again.');
      setListings([]);
      setFilteredListings([]);
    } finally {
      setLoading(false);
      setListingsLoading(false);
    }
  };

  const fetchServiceProviders = async (serviceFilters, page) => {
    try {
      console.log('Fetching service providers with filters:', serviceFilters);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', servicesPerPage.toString());
      
      Object.entries(serviceFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== 'All') {
          queryParams.append(key, value);
        }
      });
      
      const endpointsToTry = ['/providers', '/api/providers'];
      let success = false;
      
      for (const endpoint of endpointsToTry) {
        try {
          const response = await http.get(`${endpoint}?${queryParams.toString()}`);
          
          if (response.data && response.data.success) {
            const providers = response.data.data || [];
            console.log(`Successfully fetched ${providers.length} service providers from ${endpoint}`);
            
            setServices(providers);
            setFilteredServices(providers);
            
            const pagination = response.data.pagination || {
              currentPage: page,
              totalPages: Math.ceil(providers.length / servicesPerPage),
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
        setServices([]);
        setFilteredServices([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setServices([]);
      setFilteredServices([]);
      setTotalPages(1);
    }
  };

  // Enhanced fetchListings with stops search functionality
  const fetchListings = async (category, search, locationFilter, page, filters) => {
    try {
      let endpoint = '';
      let responseKey = 'data';
      
      if (category === 'car-rentals') {
        endpoint = '/rentals';
      } else if (category === 'trailer-rentals') {
        endpoint = '/trailers';
      } else if (category === 'transport') {
        endpoint = '/transport-routes';
      }
      
      console.log(`Fetching ${category} items from endpoint: ${endpoint}`);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', listingsPerPage.toString());
      
      // Enhanced search for transport routes - include stops search
      if (search) {
        queryParams.append('search', search);
        
        // For transport, also search by stops
        if (category === 'transport') {
          // Add specific stop search parameter
          queryParams.append('stop', search);
          
          // Check if search term matches common bus stops
          const matchingStops = COMMON_BUS_STOPS.filter(stop => 
            stop.toLowerCase().includes(search.toLowerCase())
          );
          
          if (matchingStops.length > 0) {
            // Add each matching stop as a potential search term
            matchingStops.forEach(stop => {
              queryParams.append('stops', stop);
            });
          }
        }
      }
      
      if (locationFilter) {
        queryParams.append('city', locationFilter);
        
        // For transport, also search in stops
        if (category === 'transport') {
          queryParams.append('stop', locationFilter);
        }
      }
      
      if (category !== 'transport') {
        queryParams.append('status', 'available');
      } else {
        queryParams.append('status', 'active');
        queryParams.append('operationalStatus', 'active');
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== 'All') {
          queryParams.append(key, value);
        }
      });
      
      const endpointsToTry = [
        endpoint,
        `/api${endpoint}`,
        endpoint.replace('-routes', ''),
        `/api${endpoint.replace('-routes', '')}`,
        '/transport',
        '/api/transport'
      ];
      
      let success = false;
      let items = [];
      
      for (const tryEndpoint of endpointsToTry) {
        try {
          console.log(`Trying endpoint: ${tryEndpoint}`);
          const response = await http.get(`${tryEndpoint}?${queryParams.toString()}`);
          
          if (response.data && response.data.success) {
            items = response.data[responseKey] || 
                   response.data.data || 
                   response.data.routes || 
                   response.data.vehicles || 
                   response.data.trailers || 
                   [];
            
            console.log(`Successfully fetched ${items.length} ${category} items from ${tryEndpoint}`);
            
            // For transport routes, perform additional client-side filtering by stops if needed
            if (category === 'transport' && (search || locationFilter)) {
              items = filterTransportByStops(items, search || locationFilter);
            }
            
            setListings(items);
            setFilteredListings(items);
            
            const pagination = response.data.pagination || {
              currentPage: page,
              totalPages: Math.ceil(items.length / listingsPerPage),
              total: items.length
            };
            
            setTotalListingPages(pagination.totalPages || 1);
            success = true;
            break;
          }
        } catch (endpointError) {
          console.log(`Failed to fetch from ${tryEndpoint}:`, endpointError.message);
          continue;
        }
      }
      
      if (!success) {
        throw new Error(`Failed to fetch ${category} items from all endpoints`);
      }
      
    } catch (error) {
      console.error(`Error fetching ${category} items:`, error);
      setListings([]);
      setFilteredListings([]);
      setTotalListingPages(1);
      setListingsError(`Failed to load ${category} items. Please try again.`);
    }
  };

  // Enhanced function to filter transport routes by stops
  const filterTransportByStops = (routes, searchTerm) => {
    if (!searchTerm || !routes || routes.length === 0) {
      return routes;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return routes.filter(route => {
      // Check origin and destination
      if (route.origin && route.origin.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      if (route.destination && route.destination.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Check intermediate stops
      if (route.stops && Array.isArray(route.stops)) {
        const hasMatchingStop = route.stops.some(stop => {
          if (typeof stop === 'string') {
            return stop.toLowerCase().includes(searchLower);
          } else if (stop && stop.name) {
            return stop.name.toLowerCase().includes(searchLower);
          }
          return false;
        });
        
        if (hasMatchingStop) {
          return true;
        }
      }
      
      // Check route description or title for stop mentions
      if (route.description && route.description.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      if (route.title && route.title.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  };

  useEffect(() => {
    if (services.length > 0) {
      let results = [...services];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        results = results.filter(
          service => 
            service.businessName?.toLowerCase().includes(query) ||
            service.profile?.description?.toLowerCase().includes(query) ||
            service.profile?.specialties?.some(specialty => 
              specialty.toLowerCase().includes(query)
            )
        );
      }
      
      if (locationFilter) {
        const location = locationFilter.toLowerCase();
        results = results.filter(
          service => 
            service.location?.city?.toLowerCase().includes(location) ||
            service.location?.country?.toLowerCase().includes(location)
        );
      }
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (key === 'businessType' && value !== 'All') {
          results = results.filter(service => service.businessType?.toLowerCase() === value.toLowerCase());
        }
      });
      
      setFilteredServices(results);
      setTotalPages(Math.ceil(results.length / servicesPerPage));
    }
  }, [services, searchQuery, locationFilter, activeFilters, servicesPerPage]);

  useEffect(() => {
    if (listings.length > 0) {
      let filteredResults = [...listings];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          item.name?.toLowerCase().includes(query) ||
          item.provider?.businessName?.toLowerCase().includes(query) ||
          (typeof item.provider === 'string' && item.provider.toLowerCase().includes(query)) ||
          item.specifications?.make?.toLowerCase().includes(query) ||
          item.specifications?.model?.toLowerCase().includes(query) ||
          item.origin?.toLowerCase().includes(query) ||
          item.destination?.toLowerCase().includes(query) ||
          // Enhanced: Search in stops for transport routes
          (selectedCategory === 'transport' && item.stops && Array.isArray(item.stops) && 
           item.stops.some(stop => {
             if (typeof stop === 'string') {
               return stop.toLowerCase().includes(query);
             } else if (stop && stop.name) {
               return stop.name.toLowerCase().includes(query);
             }
             return false;
           }))
        );
      }
      
      if (locationFilter) {
        const location = locationFilter.toLowerCase();
        filteredResults = filteredResults.filter(item => 
          item.location?.city?.toLowerCase().includes(location) ||
          (item.provider?.location?.city && item.provider.location.city.toLowerCase().includes(location)) ||
          // Enhanced: Search in stops for transport routes
          (selectedCategory === 'transport' && item.stops && Array.isArray(item.stops) && 
           item.stops.some(stop => {
             if (typeof stop === 'string') {
               return stop.toLowerCase().includes(location);
             } else if (stop && stop.name) {
               return stop.name.toLowerCase().includes(location);
             }
             return false;
           }))
        );
      }
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value === 'All' || value === 'all') return;
        
        switch(key) {
          case 'vehicleType':
            filteredResults = filteredResults.filter(item => 
              item.category === value || 
              item.specifications?.category === value ||
              item.type === value);
            break;
          case 'transmission':
            filteredResults = filteredResults.filter(item => 
              (item.specifications?.transmission || item.transmission || '').toLowerCase() === value.toLowerCase());
            break;
          case 'trailerType':
            filteredResults = filteredResults.filter(item => 
              item.trailerType === value);
            break;
          case 'routeType':
            filteredResults = filteredResults.filter(item => 
              item.routeType === value);
            break;
          case 'transportType':
            filteredResults = filteredResults.filter(item => 
              item.serviceType === value);
            break;
          case 'destination':
            if (value !== 'All') {
              filteredResults = filteredResults.filter(item => 
                item.destination?.toLowerCase().includes(value.toLowerCase()) ||
                // Also check if destination is in stops
                (item.stops && Array.isArray(item.stops) && 
                 item.stops.some(stop => {
                   if (typeof stop === 'string') {
                     return stop.toLowerCase().includes(value.toLowerCase());
                   } else if (stop && stop.name) {
                     return stop.name.toLowerCase().includes(value.toLowerCase());
                   }
                   return false;
                 }))
              );
            }
            break;
          case 'priceRange':
            let minPrice = 0;
            let maxPrice = Infinity;
            
            if (value === 'Economy') {
              maxPrice = 500;
            } else if (value === 'Mid-range') {
              minPrice = 500;
              maxPrice = 1000;
            } else if (value === 'Premium') {
              minPrice = 1000;
            }
            
            filteredResults = filteredResults.filter(item => {
              const rate = item.rates?.daily || item.dailyRate || item.price || item.fare || 0;
              return rate >= minPrice && rate <= maxPrice;
            });
            break;
        }
      });
      
      setFilteredListings(filteredResults);
      setTotalListingPages(Math.ceil(filteredResults.length / listingsPerPage));
    }
  }, [listings, searchQuery, locationFilter, activeFilters, listingsPerPage, selectedCategory]);

  const handleSearchChange = (e) => {
    handleSearchInput(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      handleSearchSubmit();
    }
  };

  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
  };

  const handleFilterChange = (name, value) => {
    const searchParams = new URLSearchParams(location.search);
    
    if (value === 'All') {
      searchParams.delete(name);
      setActiveFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[name];
        return newFilters;
      });
    } else {
      searchParams.set(name, value);
      setActiveFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    searchParams.set('page', '1');
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  const handleSearchSubmit = () => {
    const searchParams = new URLSearchParams(location.search);
    
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    
    if (locationFilter) {
      searchParams.set('location', locationFilter);
    } else {
      searchParams.delete('location');
    }
    
    searchParams.set('page', '1');
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  const handleCategorySelect = (categoryId) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('category', categoryId);
    searchParams.set('page', '1');
    
    Object.keys(activeFilters).forEach(key => {
      searchParams.delete(key);
    });
    setActiveFilters({});
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  const handlePageChange = (page) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceClick = (service) => {
    if (!service || !service._id) {
      console.error('Cannot navigate: service has no ID', service);
      return;
    }
    
    const serviceType = service.providerType || 'service';
    const typeParam = `?type=${serviceType}`;
    navigate(`/services/${service._id}${typeParam}`);
  };

  const handleRentalItemClick = (item) => {
    if (!item || (!item._id && !item.id)) {
      console.error('Cannot navigate: item has no ID', item);
      return;
    }
    
    const itemId = item._id || item.id;
    
    if (selectedCategory === 'car-rentals') {
      navigate(`/rentals/${itemId}`);
    } else if (selectedCategory === 'trailer-rentals') {
      navigate(`/trailers/${itemId}`);
    } else if (selectedCategory === 'transport') {
      navigate(`/transport-routes/${itemId}`);
    }
  };

  const getCurrentPageServices = () => {
    const startIndex = (currentPage - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    return filteredServices.slice(startIndex, endIndex);
  };

  const renderListings = () => {
    if (listingsLoading) {
      return (
        <div className="bcc-service-loading-container">
          <div className="bcc-services-spinner"></div>
        </div>
      );
    }
    
    if (listingsError) {
      return (
        <div className="bcc-service-error-message">
          {listingsError}
        </div>
      );
    }
    
    if (!filteredListings || filteredListings.length === 0) {
      return (
        <div className="bcc-service-no-results">
          <h3>No listings found</h3>
          <p>
            {selectedCategory === 'transport' 
              ? 'Try searching by different stops, destinations, or route names'
              : 'Try adjusting your filters or searching for a different service type'
            }
          </p>
          {selectedCategory === 'transport' && searchQuery && (
            <div className="search-suggestions-help">
              <p><strong>Search tips for transport routes:</strong></p>
              <ul>
                <li>Try searching by bus stops (e.g., "Mahalapye", "Palapye")</li>
                <li>Search by destination cities (e.g., "Gaborone", "Francistown")</li>
                <li>Use partial names (e.g., "Maha" for Mahalapye)</li>
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    const startIndex = (currentPage - 1) * listingsPerPage;
    const endIndex = startIndex + listingsPerPage;
    const currentListings = filteredListings.slice(startIndex, endIndex);
    
    switch (selectedCategory) {
      case 'car-rentals':
        return (
          <div className="bcc-service-rental-grid">
            {currentListings.map(rental => (
              <div className="bcc-service-rental-card-wrapper" key={rental._id || rental.id}>
                <RentalCard
                  vehicle={{
                    ...rental,
                    provider: typeof rental.provider === 'object' ? 
                      rental.provider.businessName || rental.provider.name : rental.provider,
                    providerLocation: typeof rental.provider === 'object' && rental.provider.location ? 
                      `${rental.provider.location.city || ''}${rental.provider.location.country ? `, ${rental.provider.location.country}` : ''}` : '',
                    providerLogo: typeof rental.provider === 'object' ? rental.provider.logo : null,
                    providerContact: typeof rental.provider === 'object' ? rental.provider.contact : null,
                    name: rental.name || rental.title || `${rental.specifications?.make || ''} ${rental.specifications?.model || ''}`,
                    year: rental.specifications?.year || rental.year,
                    transmission: rental.specifications?.transmission || rental.transmission,
                    fuelType: rental.specifications?.fuelType || rental.fuelType,
                    seats: rental.specifications?.seats || rental.seats,
                    doors: rental.specifications?.doors || rental.doors,
                    features: rental.features || []
                  }}
                  onRent={() => handleRentalItemClick(rental)}
                />
              </div>
            ))}
          </div>
        );
      case 'transport':
        return (
          <div className="bcc-service-transport-grid">
            {currentListings.map(route => (
              <PublicTransportCard
                key={route._id || route.id}
                route={route}
                onBook={() => handleRentalItemClick(route)}
              />
            ))}
          </div>
        );
      case 'trailer-rentals':
        return (
          <div className="bcc-service-rental-grid">
            {currentListings.map(trailer => (
              <div className="bcc-service-rental-card-wrapper" key={trailer._id || trailer.id}>
                <RentalCard
                  vehicle={{
                    ...trailer,
                    provider: typeof trailer.provider === 'object' ? 
                      trailer.provider.businessName || trailer.provider.name : trailer.provider,
                    providerLocation: typeof trailer.provider === 'object' && trailer.provider.location ? 
                      `${trailer.provider.location.city || ''}${trailer.provider.location.country ? `, ${trailer.provider.location.country}` : ''}` : '',
                    providerLogo: typeof trailer.provider === 'object' ? trailer.provider.logo : null,
                    providerContact: typeof trailer.provider === 'object' ? trailer.provider.contact : null,
                    name: trailer.name || trailer.title || `${trailer.trailerType || ''} Trailer`,
                    year: trailer.specifications?.year || trailer.year,
                    transmission: 'N/A',
                    fuelType: 'N/A',
                    seats: 'N/A',
                    doors: 'N/A',
                    features: trailer.features || []
                  }}
                  onRent={() => handleRentalItemClick(trailer)}
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const selectedCategoryObject = SERVICE_CATEGORIES.find(cat => cat.id === selectedCategory) || 
    { 
      name: 'All Services', 
      description: 'Explore our range of services for all your transportation and vehicle needs.',
      heroTitle: 'Complete Service Solutions',
      heroSubtitle: 'Everything you need for your transportation and vehicle requirements',
      gradient: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(36, 36, 36) 100%)'
    };

  if (loading && services.length === 0) {
    return (
      <div className="bcc-services-loading-page">
        <div className="bcc-services-spinner"></div>
      </div>
    );
  }

  if (error && services.length === 0) {
    return (
      <div className="bcc-services-error-page">
        <div className="bcc-services-error-container">
          <h2>Error Loading Services</h2>
          <p>{error}</p>
          <button 
            className="bcc-services-back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bcc-services-page">
      {/* Professional Hero Section */}
      <div 
        className="bcc-services-hero"
        style={{ background: selectedCategoryObject.gradient }}
      >
        <div className="bcc-services-hero-overlay">
          <div className="bcc-services-hero-content">
            <div className="bcc-services-hero-text">
              <h1 className="bcc-services-hero-title">
                {selectedCategoryObject.heroTitle || selectedCategoryObject.name}
              </h1>
              <p className="bcc-services-hero-subtitle">
                {selectedCategoryObject.heroSubtitle || selectedCategoryObject.shortDescription}
              </p>
              <div className="bcc-services-hero-stats">
                <div className="bcc-services-stat">
                  <span className="bcc-services-stat-number">{filteredListings.length}</span>
                  <span className="bcc-services-stat-label">Available Services</span>
                </div>
                <div className="bcc-services-stat">
                  <span className="bcc-services-stat-number">{filteredServices.length}</span>
                  <span className="bcc-services-stat-label">Trusted Providers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tabs - Now Below Hero */}
      <div className="bcc-services-tabs-container">
        <div className="bcc-services-tabs" ref={categoriesTabsRef}>
          <button 
            className={`bcc-services-tab-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('all')}
          >
            All Services
          </button>
          
          {SERVICE_CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`bcc-services-tab-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Services Container */}
      <div className="bcc-services-container">
        {/* Enhanced Filter Controls with Search Suggestions */}
        <div className="bcc-service-filter-container">
          <div className="bcc-service-filter-row">
            <div className="bcc-service-search-container" ref={searchInputRef}>
              <input
                type="text"
                placeholder={selectedCategoryObject.filterOptions?.placeholder || "Search services..."}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onFocus={() => {
                  if (selectedCategory === 'transport' && searchQuery.length > 1) {
                    setShowSuggestions(true);
                  }
                }}
                className="bcc-service-search-input"
              />
              
              {/* Enhanced Search Suggestions for Transport */}
              {showSuggestions && selectedCategory === 'transport' && searchSuggestions.length > 0 && (
                <div className="search-suggestions-dropdown">
                  <div className="suggestions-header">
                    <span>Popular bus stops and destinations:</span>
                  </div>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bcc-service-filter-selects">
              <input
                type="text"
                placeholder={selectedCategoryObject.filterOptions?.locationLabel || "Filter by location..."}
                value={locationFilter}
                onChange={handleLocationChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="bcc-service-location-input"
              />
              
              {selectedCategory !== 'all' && selectedCategoryObject.filterOptions && selectedCategoryObject.filterOptions.filters && (
                <div className="bcc-service-additional-filters">
                  {selectedCategoryObject.filterOptions.filters.map((filter, index) => (
                    <select 
                      key={index}
                      className="bcc-service-filter-select"
                      value={activeFilters[filter.name] || 'All'}
                      onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    >
                      {filter.options.map((option, optIndex) => (
                        <option key={optIndex} value={option}>{option}</option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
              
              <button 
                className="bcc-service-search-button"
                onClick={handleSearchSubmit}
              >
                Search
              </button>
            </div>
          </div>
          
          {Object.keys(activeFilters).length > 0 && (
            <div className="bcc-active-filters">
              <span className="bcc-active-filters-label">Active Filters:</span>
              {Object.entries(activeFilters).map(([key, value]) => (
                <div key={key} className="bcc-active-filter-tag">
                  {key}: {value}
                  <button 
                    className="bcc-remove-filter" 
                    onClick={() => handleFilterChange(key, 'All')}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                className="bcc-clear-filters"
                onClick={() => {
                  const searchParams = new URLSearchParams(location.search);
                  Object.keys(activeFilters).forEach(key => {
                    searchParams.delete(key);
                  });
                  setActiveFilters({});
                  navigate({
                    pathname: location.pathname,
                    search: searchParams.toString()
                  });
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Listings Section */}
        {['car-rentals', 'transport', 'trailer-rentals'].includes(selectedCategory) && (
          <>
            <h2 className="bcc-service-providers-heading">
              Available {selectedCategoryObject.name}
            </h2>

            {listingsError && (
              <div className="bcc-service-error-message">
                {listingsError}
              </div>
            )}

            {listingsLoading ? (
              <div className="bcc-service-loading-container">
                <div className="bcc-services-spinner"></div>
              </div>
            ) : (
              <>
                {filteredListings.length > 0 && (
                  <div className="bcc-service-results-count">
                    Found {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
                    {selectedCategory === 'transport' && (searchQuery || locationFilter) && (
                      <span className="search-info">
                        {searchQuery && ` matching "${searchQuery}"`}
                        {locationFilter && ` in ${locationFilter}`}
                      </span>
                    )}
                  </div>
                )}
                
                {renderListings()}
                
                {totalListingPages > 1 && (
                  <div className="bcc-service-pagination">
                    <button 
                      className="bcc-service-page-button prev" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalListingPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalListingPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`bcc-service-page-number ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber}>...</span>;
                      }
                      return null;
                    })}
                    
                    <button 
                      className="bcc-service-page-button next" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalListingPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Service Providers section */}
        <h2 className="bcc-service-providers-heading" style={{marginTop: '3rem'}}>
          {selectedCategory !== 'all' 
            ? `${selectedCategoryObject.name} Providers` 
            : "Service Providers"}
        </h2>

        {error && (
          <div className="bcc-service-error-message">
            {error}
          </div>
        )}

        {loading && services.length > 0 ? (
          <div className="bcc-service-loading-container">
            <div className="bcc-services-spinner"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bcc-service-no-results">
            <h3>No service providers found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="bcc-service-results-count">
              Found {filteredServices.length} service provider{filteredServices.length !== 1 ? 's' : ''}
            </div>
            
            <div className="bcc-services-grid">
              {getCurrentPageServices().map(service => (
                <BusinessCard 
                  key={service._id}
                  business={service}
                  onAction={() => handleServiceClick(service)}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="bcc-service-pagination">
                <button 
                  className="bcc-service-page-button prev" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`bcc-service-page-number ${currentPage === pageNumber ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber}>...</span>;
                  }
                  return null;
                })}
                
                <button 
                  className="bcc-service-page-button next" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;