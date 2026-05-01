// src/components/pages/ServicesPage/ServicesPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BusinessCard from '../../shared/BusinessCard/BusinessCard.js';
import RentalCard from '../../shared/RentalCard/RentalCard.js';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
// import CarpoolCard from '../../shared/CarpoolCard/CarpoolCard.js'; // hidden until launch
// import CreateRideModal from '../../modals/CreateRideModal/CreateRideModal.js'; // hidden until launch
import { http } from '../../../config/axios.js';
import './ServicesPage.css';
import { buildHelmet } from '../../../hooks/useSEO.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getNextDeparture = (departureTimes) => {
  if (!departureTimes || departureTimes.length === 0) return null;
  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();
  const parsed = (Array.isArray(departureTimes) ? departureTimes : [departureTimes])
    .map(t => {
      if (typeof t !== 'string') return null;
      const [h, m] = t.trim().split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return { str: t.trim(), minutes: h * 60 + m };
    })
    .filter(Boolean)
    .sort((a, b) => a.minutes - b.minutes);
  if (!parsed.length) return null;
  return parsed.find(t => t.minutes > curMin) || parsed[0];
};

const routeTypeColor = { bus: '#3b82f6', taxi: '#f59e0b', shuttle: '#10b981', train: '#8b5cf6', ferry: '#06b6d4' };

// ── Departure Board ───────────────────────────────────────────────────────────
const DepartureBoard = () => {
  const [rows, setRows]         = useState([]);
  const [clock, setClock]       = useState('');
  const [hovered, setHovered]   = useState(null);
  const [fareSearch, setFareSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-BW', { hour: '2-digit', minute: '2-digit', hour12: false });
    setClock(fmt());
    const tick = setInterval(() => setClock(fmt()), 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();

    Promise.all([
      fetch(`${API}/transport-routes?status=active&limit=20`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/transit-fares?active=true&limit=20`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([routeRes, fareRes]) => {
      const routeRows = (routeRes.data || []).map(r => ({
        _id:         r._id,
        origin:      typeof r.origin === 'object' ? r.origin.name : r.origin,
        destination: typeof r.destination === 'object' ? r.destination.name : r.destination,
        fare:        r.pricing?.baseFare || r.fare || null,
        routeType:   r.routeType || r.vehicleType || 'Bus',
        nextDep:     getNextDeparture(r.schedule?.departureTimes),
        duration:    r.estimatedDuration || r.schedule?.duration || null,
        vehicleCount: r.vehicleCount || null,
        notes:       r.shortDescription || null,
        _minsAway:   null,
        _source:     'route',
      }));
      routeRows.forEach(r => {
        r._minsAway = r.nextDep ? (r.nextDep.minutes - curMin + 1440) % 1440 : 9999;
      });

      const routeKeys = new Set(routeRows.map(r => `${r.origin}|${r.destination}`));

      const fareRows = (fareRes.data || [])
        .filter(f => f.active !== false)
        .filter(f => !routeKeys.has(`${f.origin}|${f.destination}`))
        .map(f => ({
          _id:          f._id,
          origin:       f.origin,
          destination:  f.destination,
          fare:         f.standardFare,
          routeType:    f.routeType || 'Bus',
          nextDep:      null,
          duration:     f.estimatedDuration || null,
          vehicleCount: f.vehicleCount || null,
          notes:        f.notes || null,
          _minsAway:    9998,
          _source:      'fare',
        }));

      setRows(
        [...routeRows, ...fareRows]
          .sort((a, b) => a._minsAway - b._minsAway)
          .slice(0, 20)
      );
    });
  }, []);

  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();

  const handleRowClick = (row) => {
    const p = new URLSearchParams({ category: 'transport', from: row.origin || '', to: row.destination || '' });
    navigate(`/services?${p.toString()}`);
  };

  const q = fareSearch.trim().toLowerCase();
  const visibleRows = q
    ? rows.filter(r =>
        (r.origin || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q)
      )
    : rows;

  // Auto-scroll ticker: only when not searching and there are enough rows to scroll
  const shouldTicker = !q && visibleRows.length > 5;
  const tickerRows = shouldTicker ? [...visibleRows, ...visibleRows] : visibleRows;
  // ~2.5s per row, minimum 10s
  const scrollDuration = Math.max(10, visibleRows.length * 2.5);

  const renderRow = (row, i) => {
    const minsAway = row.nextDep ? (row.nextDep.minutes - curMin + 1440) % 1440 : null;
    const soon = minsAway !== null && minsAway <= 30;
    const typeKey = (row.routeType || 'bus').toLowerCase();
    const isHovered = hovered === `${row._id || i}-${i}`;
    return (
      <div
        key={`${row._id || i}-${i}`}
        className={`dep-board-row dep-board-row--clickable${soon ? ' dep-board-row--soon' : ''}`}
        onClick={() => handleRowClick(row)}
        onMouseEnter={() => setHovered(`${row._id || i}-${i}`)}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="dep-board-time">
          {row.nextDep
            ? <>{row.nextDep.str}{soon && <span className="dep-board-soon-dot" />}</>
            : <span className="dep-board-fixed-tag">GOV'T</span>
          }
        </div>

        <div className="dep-board-route">
          <span className="dep-board-route-inner">
            {(row.origin || '—').split(',')[0]}
            <span className="dep-board-arrow"> › </span>
            {(row.destination || '—').split(',')[0]}
          </span>
        </div>

        <div className="dep-board-fare">
          {row.fare != null ? `P${Number(row.fare).toLocaleString()}` : '—'}
        </div>

        <div className={`dep-board-type dep-board-type--${typeKey}`}>
          {row.routeType || 'Bus'}
        </div>

        {isHovered && (row.duration || row.vehicleCount || row.notes) && (
          <div className="dep-board-tooltip">
            <div className="dep-board-tooltip-route">
              {row.origin} → {row.destination}
            </div>
            {row.duration     && <div className="dep-board-tooltip-row">⏱ {row.duration}</div>}
            {row.vehicleCount && <div className="dep-board-tooltip-row">🚌 {row.vehicleCount} vehicles on route</div>}
            {row.notes        && <div className="dep-board-tooltip-note">{row.notes}</div>}
            <div className="dep-board-tooltip-cta">Click to find transport →</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dep-board">
      <div className="dep-board-header">
        <span className="dep-board-label">ROUTES &amp; FARES</span>
        <span className="dep-board-clock">{clock}</span>
      </div>

      <div className="dep-board-search-wrap">
        <input
          className="dep-board-search"
          placeholder="Search destination…"
          value={fareSearch}
          onChange={e => setFareSearch(e.target.value)}
        />
      </div>

      <div className="dep-board-cols">
        <span>TIME</span><span>ROUTE</span><span>FARE</span><span>TYPE</span>
      </div>

      <div className={`dep-board-rows${shouldTicker ? ' dep-board-rows--ticker' : ''}`}>
        {visibleRows.length === 0 ? (
          <div className="dep-board-empty">No active routes — check back soon</div>
        ) : shouldTicker ? (
          <div
            className="dep-board-ticker"
            style={{ animationDuration: `${scrollDuration}s` }}
          >
            {tickerRows.map((row, i) => renderRow(row, i))}
          </div>
        ) : (
          visibleRows.map((row, i) => renderRow(row, i))
        )}
      </div>

      <div className="dep-board-footer">
        Gov't fares · live schedule by operators
      </div>
    </div>
  );
};

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
  },
  /* hidden until launch — uncomment to activate
  {
    id: 'carpooling',
    name: 'Shared Rides',
    description: 'Find drivers heading your way and split the cost. A community-powered transport alternative.',
    shortDescription: 'Share rides with drivers heading the same direction',
    heroTitle: 'Community Shared Rides',
    heroSubtitle: 'Connect with drivers going your way and share the journey',
    image: '/images/categories/carpooling-banner.jpg',
    icon: '🤝',
    gradient: 'linear-gradient(135deg,rgb(0,0,0) 0%,rgb(36,36,36) 100%)',
    filterOptions: {
      placeholder: 'Search by origin or destination city…',
      locationLabel: 'Destination city…',
      filters: [
        { name: 'recurrence', label: 'Trip type', options: ['All', 'Once', 'Daily', 'Weekdays', 'Weekly'] },
        { name: 'seats',      label: 'Seats needed', options: ['All', '1', '2', '3', '4+'] }
      ]
    }
  },
  */
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
  // Hero form pre-fill state
  const [tripFrom, setTripFrom] = useState('');
  const [tripTo, setTripTo] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const categoriesTabsRef = useRef(null);
  const servicesPerPage = 9;
  const listingsPerPage = 8;
  const [listingsError, setListingsError] = useState(null);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Carpooling state
  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [showCreateRide, setShowCreateRide] = useState(false);

  // Enhanced search suggestions for transport stops
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Initialize data with API calls
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const categoryParam = searchParams.get('category') || 'all';
    const pageParam = parseInt(searchParams.get('page'), 10) || 1;

    // Hero pre-fill params
    const fromParam   = searchParams.get('from')      || '';
    const toParam     = searchParams.get('to')        || '';
    const dateParam   = searchParams.get('date')      || '';
    const timeParam   = searchParams.get('time')      || '';
    const budgetParam = searchParams.get('maxBudget') || '';

    // For transport: from→search, to→location. For rentals: location param used directly.
    const searchParam   = categoryParam === 'transport'
      ? (fromParam || searchParams.get('search') || '')
      : (searchParams.get('search') || '');
    const locationParam = categoryParam === 'transport'
      ? (toParam || searchParams.get('location') || '')
      : (searchParams.get('location') || '');

    // Exclude hero pre-fill keys and structural params from activeFilters chips
    const excludedKeys = ['category', 'search', 'location', 'page', 'from', 'to', 'date', 'time', 'maxBudget'];
    const newFilters = {};
    searchParams.forEach((value, key) => {
      if (!excludedKeys.includes(key)) newFilters[key] = value;
    });

    setSelectedCategory(categoryParam);
    setSearchQuery(searchParam);
    setLocationFilter(locationParam);
    setCurrentPage(pageParam);
    setActiveFilters(newFilters);
    setTripFrom(fromParam);
    setTripTo(toParam);
    setBookingDate(dateParam);
    setBookingTime(timeParam);
    setMaxBudget(budgetParam);

    fetchData(categoryParam, searchParam, locationParam, pageParam, newFilters, dateParam, timeParam, budgetParam);
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
                          locationFilter = locationFilter, page = currentPage, filters = activeFilters,
                          date = bookingDate, time = bookingTime, budget = maxBudget) => {
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
      
      if (category === 'carpooling') {
        await fetchRides(search, locationFilter, filters);
        setServices([]); setFilteredServices([]);
        setListings([]); setFilteredListings([]);
      } else {
        await fetchServiceProviders(serviceFilters, page);
        if (['car-rentals', 'trailer-rentals', 'transport'].includes(category)) {
          await fetchListings(category, search, locationFilter, page, filters, date, time, budget);
        } else {
          setListings([]);
          setFilteredListings([]);
        }
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

  const fetchRides = async (search, destination, filters) => {
    setRidesLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';
      const params = new URLSearchParams({ limit: '20' });
      if (search)      params.set('origin', search);
      if (destination) params.set('destination', destination);
      if (filters.seats && filters.seats !== 'All') params.set('seats', filters.seats.replace('+',''));
      const res = await fetch(`${API_BASE}/rides?${params}`);
      const data = await res.json();
      if (data.success) setRides(data.data || []);
      else setRides([]);
    } catch { setRides([]); }
    finally { setRidesLoading(false); }
  };

  // Enhanced fetchListings with stops search functionality
  const fetchListings = async (category, search, locationFilter, page, filters, date = '', time = '', budget = '') => {
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

      // Pass hero pre-fill params to the API
      if (date)   queryParams.append('date',      date);
      if (time)   queryParams.append('time',      time);
      if (budget) queryParams.append('maxBudget', budget);
      
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
      
      // Budget filter for car rentals
      if (maxBudget && selectedCategory === 'car-rentals') {
        const budget = parseInt(maxBudget);
        filteredResults = filteredResults.filter(item => {
          const rate = item.rates?.daily || item.dailyRate || item.price || 0;
          return rate <= budget;
        });
      }

      setFilteredListings(filteredResults);
      setTotalListingPages(Math.ceil(filteredResults.length / listingsPerPage));
    }
  }, [listings, searchQuery, locationFilter, activeFilters, listingsPerPage, selectedCategory, maxBudget]);

  // Push current text inputs into the URL (replace so history stays clean)
  const applyTextFiltersToUrl = (search, loc) => {
    const searchParams = new URLSearchParams(location.search);
    if (search) searchParams.set('search', search); else searchParams.delete('search');
    if (loc)    searchParams.set('location', loc);  else searchParams.delete('location');
    searchParams.set('page', '1');
    navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    handleSearchInput(value); // update state + suggestions immediately

    // Debounce the API fetch — fires 400 ms after the user stops typing
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyTextFiltersToUrl(value, locationFilter);
    }, 400);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounceRef.current);
      setShowSuggestions(false);
      applyTextFiltersToUrl(searchQuery, locationFilter);
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationFilter(value);

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyTextFiltersToUrl(searchQuery, value);
    }, 400);
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
    clearTimeout(searchDebounceRef.current);
    applyTextFiltersToUrl(searchQuery, locationFilter);
  };

  // Helpers for hero pre-fill inputs
  const updateUrl = (key, value) => {
    const sp = new URLSearchParams(location.search);
    if (value) sp.set(key, value); else sp.delete(key);
    sp.set('page', '1');
    navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
  };

  const handleTripFromChange = (value) => {
    setTripFrom(value);
    setSearchQuery(value);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams(location.search);
      if (value) { sp.set('from', value); sp.set('search', value); } else { sp.delete('from'); sp.delete('search'); }
      sp.set('page', '1');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }, 400);
  };

  const handleTripToChange = (value) => {
    setTripTo(value);
    setLocationFilter(value);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams(location.search);
      if (value) { sp.set('to', value); sp.set('location', value); } else { sp.delete('to'); sp.delete('location'); }
      sp.set('page', '1');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
    }, 400);
  };

  const handleDateChange = (value) => {
    setBookingDate(value);
    updateUrl('date', value);
  };

  const handleTimeChange = (value) => {
    setBookingTime(value);
    updateUrl('time', value);
  };

  const handleBudgetChange = (value) => {
    setMaxBudget(value);
    updateUrl('maxBudget', value);
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
          <div className="bcc-service-carousel-wrap">
            <div className="bcc-service-rental-grid bcc-service-carousel">
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
          </div>
        );
      case 'transport':
        return (
          <div className="bcc-service-carousel-wrap">
            <div className="bcc-service-transport-grid bcc-service-carousel">
              {currentListings.map(route => (
                <PublicTransportCard
                  key={route._id || route.id}
                  route={route}
                  onBook={() => handleRentalItemClick(route)}
                />
              ))}
            </div>
          </div>
        );
      case 'carpooling':
        return (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
              <button
                onClick={() => setShowCreateRide(true)}
                style={{ background:'#e53e3e', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 20px', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}
              >
                + Post Your Ride
              </button>
            </div>
            {ridesLoading ? (
              <div className="bcc-services-loading-page"><div className="bcc-services-spinner" /></div>
            ) : rides.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'#666' }}>
                <div style={{ fontSize:'3rem', marginBottom:'12px' }}>🚗</div>
                <p style={{ color:'#ccc', marginBottom:'8px', fontWeight:600 }}>No rides available right now</p>
                <p style={{ fontSize:'0.85rem', marginBottom:'20px' }}>Be the first to post a shared ride</p>
                <button onClick={() => setShowCreateRide(true)} style={{ background:'#e53e3e', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 20px', fontWeight:600, cursor:'pointer' }}>
                  Post a Ride
                </button>
              </div>
            ) : (
              <div className="bcc-service-transport-grid">
                {rides.map(ride => (
                  <div key={ride._id} />
                ))}
              </div>
            )}
            {/* CreateRideModal hidden until launch */}
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
      {buildHelmet({
        title: 'Automotive Services',
        description: 'Find trusted workshops, car rentals, and transport services across Botswana. Browse verified service providers in Gaborone, Francistown, Maun and more.'
      })}
      {/* Professional Hero Section */}
      <div
        className={`bcc-services-hero${selectedCategory === 'transport' ? ' bcc-services-hero--transport' : ''}`}
        style={{ background: selectedCategoryObject.gradient }}
      >
        <div className="bcc-services-hero-overlay">
          <div className={`bcc-services-hero-content${selectedCategory === 'transport' ? ' bcc-services-hero-content--split' : ''}`}>

            <div className="bcc-services-hero-text">
              <h1 className="bcc-services-hero-title">
                {selectedCategoryObject.heroTitle || selectedCategoryObject.name}
              </h1>
              <p className="bcc-services-hero-subtitle">
                {selectedCategoryObject.heroSubtitle || selectedCategoryObject.shortDescription}
              </p>

              {selectedCategory === 'transport' && (
                <div className="transport-hero-visual">
                  <div className="transport-bus-img-wrap">
                    <img
                      src="/G801.png"
                      alt="Public transport bus"
                      className="transport-bus-img"
                    />
                  </div>
                  <button
                    className="transport-find-btn"
                    onClick={() => searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  >
                    Find Transport <span className="transport-find-btn-arrow">→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Departure board — right side, desktop; compact strip on mobile */}
            {selectedCategory === 'transport' && (
              <div className="dep-board-wrap">
                <DepartureBoard />
              </div>
            )}

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
        {/* Filter Controls */}
        <div className="bcc-service-filter-container">

          {/* Transport: From / To / Date / Time */}
          {selectedCategory === 'transport' && (
            <div className="bcc-service-trip-row">
              <div className="bcc-service-trip-field" ref={searchInputRef}>
                <label className="bcc-service-trip-label">From</label>
                <input
                  type="text"
                  placeholder="e.g. Gaborone CBD"
                  value={tripFrom}
                  onChange={e => handleTripFromChange(e.target.value)}
                  onFocus={() => { if (tripFrom.length > 1) setShowSuggestions(true); }}
                  onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
                  className="bcc-service-search-input"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions-dropdown">
                    <div className="suggestions-header"><span>Popular stops:</span></div>
                    {searchSuggestions.map((s, i) => (
                      <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                        <span className="suggestion-icon">📍</span>
                        <span className="suggestion-text">{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bcc-service-trip-arrow">→</div>
              <div className="bcc-service-trip-field">
                <label className="bcc-service-trip-label">To</label>
                <input
                  type="text"
                  placeholder="e.g. Francistown"
                  value={tripTo}
                  onChange={e => handleTripToChange(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
                  className="bcc-service-search-input"
                />
              </div>
              <div className="bcc-service-trip-field bcc-service-trip-field--narrow">
                <label className="bcc-service-trip-label">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="bcc-service-search-input"
                />
              </div>
              <div className="bcc-service-trip-field bcc-service-trip-field--narrow">
                <label className="bcc-service-trip-label">Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={e => handleTimeChange(e.target.value)}
                  className="bcc-service-search-input"
                />
              </div>
              <button className="bcc-service-search-button" onClick={handleSearchSubmit}>
                Find Routes
              </button>
            </div>
          )}

          {/* Rentals: name search + location + date + time + budget */}
          {selectedCategory === 'car-rentals' && (
            <>
              <div className="bcc-service-filter-row">
                <div className="bcc-service-search-container">
                  <input
                    type="text"
                    placeholder="Search vehicles, companies…"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleSearchKeyPress}
                    className="bcc-service-search-input"
                  />
                </div>
                <div className="bcc-service-filter-selects">
                  <input
                    type="text"
                    placeholder="Pickup location…"
                    value={locationFilter}
                    onChange={handleLocationChange}
                    onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
                    className="bcc-service-location-input"
                  />
                </div>
              </div>
              <div className="bcc-service-filter-row bcc-service-filter-row--secondary">
                <div className="bcc-service-trip-field bcc-service-trip-field--narrow">
                  <label className="bcc-service-trip-label">Date needed</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="bcc-service-search-input"
                  />
                </div>
                <div className="bcc-service-trip-field bcc-service-trip-field--narrow">
                  <label className="bcc-service-trip-label">Time</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={e => handleTimeChange(e.target.value)}
                    className="bcc-service-search-input"
                  />
                </div>
                <div className="bcc-service-trip-field bcc-service-trip-field--narrow">
                  <label className="bcc-service-trip-label">Budget (BWP / day)</label>
                  <select
                    value={maxBudget}
                    onChange={e => handleBudgetChange(e.target.value)}
                    className="bcc-service-filter-select"
                  >
                    <option value="">Any budget</option>
                    <option value="300">Up to P300</option>
                    <option value="500">Up to P500</option>
                    <option value="800">Up to P800</option>
                    <option value="1200">Up to P1,200</option>
                    <option value="2000">Up to P2,000</option>
                    <option value="9999">P2,000+</option>
                  </select>
                </div>
                {selectedCategoryObject.filterOptions?.filters?.map((filter, i) => (
                  <select
                    key={i}
                    className="bcc-service-filter-select"
                    value={activeFilters[filter.name] || 'All'}
                    onChange={e => handleFilterChange(filter.name, e.target.value)}
                  >
                    {filter.options.map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                  </select>
                ))}
                <button className="bcc-service-search-button" onClick={handleSearchSubmit}>Search</button>
              </div>
            </>
          )}

          {/* All other categories: generic search + location + standard dropdowns */}
          {selectedCategory !== 'transport' && selectedCategory !== 'car-rentals' && (
            <div className="bcc-service-filter-row">
              <div className="bcc-service-search-container">
                <input
                  type="text"
                  placeholder={selectedCategoryObject.filterOptions?.placeholder || "Search services..."}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleSearchKeyPress}
                  className="bcc-service-search-input"
                />
              </div>
              <div className="bcc-service-filter-selects">
                <input
                  type="text"
                  placeholder={selectedCategoryObject.filterOptions?.locationLabel || "Filter by location..."}
                  value={locationFilter}
                  onChange={handleLocationChange}
                  onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
                  className="bcc-service-location-input"
                />
                {selectedCategory !== 'all' && selectedCategoryObject.filterOptions?.filters && (
                  <div className="bcc-service-additional-filters">
                    {selectedCategoryObject.filterOptions.filters.map((filter, index) => (
                      <select
                        key={index}
                        className="bcc-service-filter-select"
                        value={activeFilters[filter.name] || 'All'}
                        onChange={e => handleFilterChange(filter.name, e.target.value)}
                      >
                        {filter.options.map((option, oi) => <option key={oi} value={option}>{option}</option>)}
                      </select>
                    ))}
                  </div>
                )}
                <button className="bcc-service-search-button" onClick={handleSearchSubmit}>Search</button>
              </div>
            </div>
          )}

          {/* Standard dropdowns for transport (below trip row) */}
          {selectedCategory === 'transport' && selectedCategoryObject.filterOptions?.filters && (
            <div className="bcc-service-filter-row bcc-service-filter-row--secondary">
              {selectedCategoryObject.filterOptions.filters.map((filter, i) => (
                <select
                  key={i}
                  className="bcc-service-filter-select"
                  value={activeFilters[filter.name] || 'All'}
                  onChange={e => handleFilterChange(filter.name, e.target.value)}
                >
                  {filter.options.map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                </select>
              ))}
            </div>
          )}

          
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
            
            <div className="bcc-service-carousel-wrap">
              <div className="bcc-services-grid bcc-service-carousel">
                {getCurrentPageServices().map(service => (
                  <BusinessCard
                    key={service._id}
                    business={service}
                    onAction={() => handleServiceClick(service)}
                  />
                ))}
              </div>
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