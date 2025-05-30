// src/components/features/TransportSection/TransportRouteDetail.js - Part 1
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './TransportRouteDetail.css';
import PublicTransportCard from '../../shared/PublicTransportCard/PublicTransportCard.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js'; // For cars for sale
import RentalCard from '../../shared/RentalCard/RentalCard.js'; // For rental cars
import ShareModal from '../../shared/ShareModal.js';
import { transportRouteService } from '../../../services/transportRouteService.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import { useAuth } from '../../../context/AuthContext.js';
import ErrorBoundary from '../../shared/ErrorBoundary/ErrorBoundary.js';

const TransportRouteDetail = () => {
  // Utility function to safely get string ID from MongoDB ObjectId or any object
  const safeGetStringId = useCallback((id) => {
    // If it's falsy (null, undefined, etc.), return null
    if (!id) return null;
    
    // If it's already a string and not "[object Object]", just return it
    if (typeof id === 'string' && id !== '[object Object]') {
      return id;
    }
    
    // If it's an object
    if (typeof id === 'object') {
      // Try to get the string representation of its _id or id property
      if (id._id) {
        // If it has _id property, try to use that
        if (typeof id._id === 'string') {
          return id._id;
        } else if (id._id.toString) {
          // MongoDB ObjectId has a toString method
          return id._id.toString();
        }
      }
      
      // Try id property as fallback
      if (id.id) {
        if (typeof id.id === 'string') {
          return id.id;
        } else if (id.id.toString) {
          return id.id.toString();
        }
      }
      
      // If it has a toString method that doesn't return "[object Object]"
      if (id.toString && id.toString() !== '[object Object]') {
        return id.toString();
      }
    }
    
    // Couldn't get a valid string ID
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to extract valid ID from:", id);
    }
    return null;
  }, []);

  const { routeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Enhanced state management
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [providerRoutes, setProviderRoutes] = useState([]);
  const [similarRoutes, setSimilarRoutes] = useState([]);
  const [views, setViews] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [providerActiveIndex, setProviderActiveIndex] = useState(0);
  const [similarActiveIndex, setSimilarActiveIndex] = useState(0);
  const [travelDate, setTravelDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [imageLoadAttempts, setImageLoadAttempts] = useState({});

  // NEW: Enhanced state for destination-based car listings
  const [destinationRentals, setDestinationRentals] = useState([]);
  const [destinationSales, setDestinationSales] = useState([]);
  const [rentalsActiveIndex, setRentalsActiveIndex] = useState(0);
  const [salesActiveIndex, setSalesActiveIndex] = useState(0);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  // Refs
  const shareButtonRef = useRef(null);
  const viewRecorded = useRef(false);
  const providerCarouselRef = useRef(null);
  const similarCarouselRef = useRef(null);
  const rentalsCarouselRef = useRef(null); // NEW
  const salesCarouselRef = useRef(null); // NEW

  // Use localStorage to remember failed image URLs to avoid repeat attempts
  const checkFailedImage = useCallback((url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedTransportImages') || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  }, []);

  const markFailedImage = useCallback((url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedTransportImages') || '{}');
      failedImages[url] = Date.now();
      // Limit cache size to prevent localStorage bloat
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedTransportImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Enhanced image URL extraction with robust S3 support
  const getImageUrl = useCallback((image) => {
    if (typeof image === 'string') {
      // Check if this image previously failed
      if (checkFailedImage(image)) {
        return '/images/placeholders/transport.jpg';
      }
      
      // If it's already an S3 URL, return it
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      
      // Clean up problematic local paths
      let cleanUrl = image;
      if (cleanUrl.includes('/images/images/')) {
        cleanUrl = cleanUrl.replace(/\/images\/images\//g, '/images/');
      }
      
      // If local path, server should redirect to S3
      return cleanUrl.includes('/') ? cleanUrl : `/uploads/transport/${cleanUrl}`;
    } else if (image && typeof image === 'object' && image.url) {
      // Check if this image previously failed
      if (checkFailedImage(image.url)) {
        return '/images/placeholders/transport.jpg';
      }
      
      return image.url;
    }
    return '/images/placeholders/transport.jpg';
  }, [checkFailedImage]);

  // Enhanced provider ID extraction
  const extractProviderId = useCallback((route) => {
    if (!route) return null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracting provider ID from route data structure:', {
        hasProviderId: !!route.providerId,
        hasProvider: !!route.provider,
        providerIdType: route.providerId ? typeof route.providerId : 'N/A',
        providerType: route.provider ? typeof route.provider : 'N/A'
      });
    }
    
    // Try different paths to find a valid provider ID
    if (route.providerId) {
      return safeGetStringId(route.providerId);
    }
    
    if (route.provider && typeof route.provider === 'object') {
      if (route.provider._id) {
        return safeGetStringId(route.provider._id);
      }
      if (route.provider.id) {
        return safeGetStringId(route.provider.id);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not extract provider ID from route data');
    }
    return null;
  }, [safeGetStringId]);

  // Analytics tracking with error prevention
  const trackRouteView = useCallback((routeId) => {
    try {
      // Only track if window.gtag is available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'transport_route_view', {
          route_id: routeId,
          page_path: window.location.pathname
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics tracking failed:', error);
      }
      // Don't let analytics errors break the page
    }
  }, []);

  // Initialize selected day based on route's schedule
  const initializeSelectedDay = useCallback((operatingDays) => {
    // Find the next operating day from today
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check if today is an operating day
    if (operatingDays[dayNames[dayIndex]]) {
      setSelectedDay(dayNames[dayIndex]);
      return;
    }
    
    // If not, find the next operating day
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (dayIndex + i) % 7;
      const nextDay = dayNames[nextDayIndex];
      
      if (operatingDays[nextDay]) {
        setSelectedDay(nextDay);
        
        // Set travel date to this next operating day
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        setTravelDate(nextDate);
        
        return;
      }
    }
    
    // If no operating days found (shouldn't happen), default to first available
    for (const day in operatingDays) {
      if (operatingDays[day]) {
        setSelectedDay(day);
        break;
      }
    }
  }, []);

  // NEW: Extract destination city for car searches
  const extractDestinationCity = useCallback((route) => {
    if (!route || !route.destination) return null;
    
    // The destination might be in format like "Gaborone, Botswana" or just "Gaborone"
    // We want to extract the city name for searching
    let destination = route.destination.trim();
    
    // If destination contains comma, take the first part (city)
    if (destination.includes(',')) {
      destination = destination.split(',')[0].trim();
    }
    
    // Remove common prefixes like "to ", "near ", etc.
    destination = destination.replace(/^(to\s+|near\s+|in\s+)/i, '');
    
    return destination;
  }, []);

  // NEW: API functions for loading cars at destination
  const loadDestinationRentals = useCallback(async (destination) => {
    if (!destination) {
      setDestinationRentals([]);
      return;
    }

    setRentalsLoading(true);
    try {
      console.log(`Loading rental cars at destination: ${destination}`);
      
      // Make API call to get rental cars
      const response = await fetch(`/api/rentals?location=${encodeURIComponent(destination)}&limit=6`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rentals: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} rental cars at ${destination}`);
        setDestinationRentals(data.data.slice(0, 6)); // Limit to 6 items
      } else {
        console.warn('No rental cars found or invalid response format');
        setDestinationRentals([]);
      }
    } catch (error) {
      console.error('Error loading destination rentals:', error);
      setDestinationRentals([]);
    } finally {
      setRentalsLoading(false);
    }
  }, []);

  const loadDestinationSales = useCallback(async (destination) => {
    if (!destination) {
      setDestinationSales([]);
      return;
    }

    setSalesLoading(true);
    try {
      console.log(`Loading cars for sale at destination: ${destination}`);
      
      // Make API call to get cars for sale
      const response = await fetch(`/api/listings?location=${encodeURIComponent(destination)}&status=active&limit=6`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch car listings: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log(`Found ${data.data.length} cars for sale at ${destination}`);
        setDestinationSales(data.data.slice(0, 6)); // Limit to 6 items
      } else {
        console.warn('No cars for sale found or invalid response format');
        setDestinationSales([]);
      }
    } catch (error) {
      console.error('Error loading destination sales:', error);
      setDestinationSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  // Navigation handlers
  const handleNavigation = useCallback((direction) => {
    if (!route?.images?.length) return;
    
    setSelectedImage(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : route.images.length - 1;
      } else {
        return prev < route.images.length - 1 ? prev + 1 : 0;
      }
    });
    
    // Reset image load attempts for the new image
    setImageLoadAttempts(prev => ({...prev, [selectedImage]: 0}));
  }, [route, selectedImage]);

  const handleSaveRoute = useCallback(() => {
    if (!route) return;
    
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    if (isSaved) {
      const newSaved = savedRoutes.filter(id => id !== route._id);
      localStorage.setItem('savedRoutes', JSON.stringify(newSaved));
      setIsSaved(false);
      
      dispatch(addNotification({
        type: 'info',
        message: 'Route removed from saved items'
      }));
    } else {
      const newSaved = [...savedRoutes, route._id];
      localStorage.setItem('savedRoutes', JSON.stringify(newSaved));
      setIsSaved(true);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Route saved successfully'
      }));
    }
  }, [route, isSaved, dispatch]);

  // src/components/features/TransportSection/TransportRouteDetail.js - Part 2
// Continue from Part 1...

  // Enhanced WhatsApp booking handler
  const handleWhatsAppClick = useCallback(() => {
    if (!route) return;
    
    // Get provider phone from provider object
    const phone = route.provider?.contact?.phone || 
                  (typeof route.provider === 'object' ? route.provider.phone : null);
    
    if (!phone) {
      dispatch(addNotification({
        type: 'error',
        message: 'Provider contact information is not available'
      }));
      return;
    }
    
    // Format date for the message
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    // Create a message with route details
    const departureTime = getDepartureTimeForSelectedDay();
    const message = `
*TRANSPORT BOOKING INQUIRY*

Hello, I would like to book transport on the following route:

*${route.origin} to ${route.destination}*
Service Type: ${route.serviceType || 'Regular'} ${route.routeType || 'Transport'}
Date: ${formatDate(travelDate)}
Number of passengers: ${passengers}

${departureTime ? `Preferred Departure Time: ${departureTime}` : ''}
${route.fare ? `Fare: P${route.fare.toFixed(2)}` : 'Please provide fare information.'}

Please confirm availability and booking process.

Route Link: ${window.location.href}
`;
    
    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
    
    // Open WhatsApp
    try {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      
      // Track booking attempt
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'transport_booking_attempt', {
          route_id: route._id,
          route_origin: route.origin,
          route_destination: route.destination
        });
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Could not open WhatsApp. Please try again.'
      }));
    }
  }, [route, travelDate, passengers, selectedDay, dispatch]);

  // Enhanced carousel navigation with responsive layout detection
  const navigateCarousel = useCallback((carouselType, direction) => {
    const isProvider = carouselType === 'provider';
    const isRentals = carouselType === 'rentals';
    const isSales = carouselType === 'sales';
    
    let routes, setIndex, currentIndex, carouselRef;
    
    if (isProvider) {
      routes = providerRoutes;
      setIndex = setProviderActiveIndex;
      currentIndex = providerActiveIndex;
      carouselRef = providerCarouselRef;
    } else if (isRentals) {
      routes = destinationRentals;
      setIndex = setRentalsActiveIndex;
      currentIndex = rentalsActiveIndex;
      carouselRef = rentalsCarouselRef;
    } else if (isSales) {
      routes = destinationSales;
      setIndex = setSalesActiveIndex;
      currentIndex = salesActiveIndex;
      carouselRef = salesCarouselRef;
    } else {
      routes = similarRoutes;
      setIndex = setSimilarActiveIndex;
      currentIndex = similarActiveIndex;
      carouselRef = similarCarouselRef;
    }
    
    if (!routes || routes.length <= 1) return;
    
    // Calculate how many items to show per view based on viewport width
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
      
      // Apply the transform
      if (carouselRef.current) {
        const track = carouselRef.current.querySelector('.carousel-track');
        if (track) {
          const slideWidthPercent = 100 / itemsPerView;
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  }, [providerRoutes, similarRoutes, destinationRentals, destinationSales, 
      providerActiveIndex, similarActiveIndex, rentalsActiveIndex, salesActiveIndex]);

  // Initialize carousel with responsive layouts
  const initializeCarousel = useCallback((carouselType) => {
    const isProvider = carouselType === 'provider';
    const isRentals = carouselType === 'rentals';
    const isSales = carouselType === 'sales';
    
    let routes, carouselRef, currentIndex;
    
    if (isProvider) {
      routes = providerRoutes;
      carouselRef = providerCarouselRef;
      currentIndex = providerActiveIndex;
    } else if (isRentals) {
      routes = destinationRentals;
      carouselRef = rentalsCarouselRef;
      currentIndex = rentalsActiveIndex;
    } else if (isSales) {
      routes = destinationSales;
      carouselRef = salesCarouselRef;
      currentIndex = salesActiveIndex;
    } else {
      routes = similarRoutes;
      carouselRef = similarCarouselRef;
      currentIndex = similarActiveIndex;
    }
    
    if (!routes || routes.length <= 1 || !carouselRef.current) return;
    
    // Calculate items per view
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth >= 1200) {
      itemsPerView = 3;
    } else if (viewportWidth >= 768) {
      itemsPerView = 2;
    }
    
    // Apply transform
    const track = carouselRef.current.querySelector('.carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
    }
  }, [providerRoutes, similarRoutes, destinationRentals, destinationSales, 
      providerActiveIndex, similarActiveIndex, rentalsActiveIndex, salesActiveIndex]);

  // Enhanced day selection handlers
  const handleDayClick = useCallback((day) => {
    if (!route?.schedule?.operatingDays?.[day]) return;
    
    setSelectedDay(day);
    
    // Update travel date to the next occurrence of this day
    const today = new Date();
    const todayDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
    
    // Calculate days to add to get to the selected day
    let daysToAdd = dayIndex - todayDay;
    if (daysToAdd <= 0) daysToAdd += 7; // If it's today or earlier in the week, go to next week
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    setTravelDate(nextDate);
  }, [route]);

  // Enhanced data loading functions
  const loadRelatedContent = useCallback(async (routeData) => {
    try {
      if (!routeData) {
        console.warn('No route data available to load related content');
        return;
      }
  
      // 1. Load other routes from the same provider
      await loadProviderRoutes(routeData);
      
      // 2. Load similar routes (enhanced)
      await loadSimilarRoutes(routeData);
      
      // 3. NEW: Load destination-based car listings
      const destination = extractDestinationCity(routeData);
      if (destination) {
        console.log(`Loading cars at destination: ${destination}`);
        await Promise.all([
          loadDestinationRentals(destination),
          loadDestinationSales(destination)
        ]);
      } else {
        console.warn('Could not extract destination city for car searches');
      }
    } catch (error) {
      console.error('Error loading related content:', error);
    }
  }, [loadDestinationRentals, loadDestinationSales, extractDestinationCity]);

  const loadProviderRoutes = useCallback(async (currentRoute) => {
    try {
      const providerId = extractProviderId(currentRoute);
      
      if (!providerId) {
        console.warn('No valid provider ID found for fetching provider routes');
        setProviderRoutes([]);
        return;
      }
      
      console.log(`Fetching other routes from provider: ${providerId}`);
      
      // Fetch routes from this provider
      const response = await transportRouteService.getProviderRoutes(providerId, 1, 6);
      
      if (!response || !response.success || !response.routes || !Array.isArray(response.routes)) {
        console.warn('No valid routes returned from provider routes API');
        setProviderRoutes([]);
        return;
      }
      
      console.log(`Found ${response.routes.length} other routes from the same provider`);
      
      // Filter out the current route from the results
      const filteredRoutes = response.routes.filter(item => {
        // Ensure the item has an ID
        if (!item || (!item._id && !item.id)) return false;
        
        const itemId = item._id || item.id;
        const currentRouteId = currentRoute._id || currentRoute.id;
        
        // Exclude the current route
        return itemId.toString() !== currentRouteId.toString();
      });
      
      console.log(`After filtering, ${filteredRoutes.length} provider routes remain`);
      
      // Set a maximum of 6 routes to display
      setProviderRoutes(filteredRoutes.slice(0, 6));
    } catch (error) {
      console.error('Error loading provider routes:', error);
      setProviderRoutes([]);
    }
  }, [extractProviderId]);

  // ENHANCED: Better similar routes logic
  const loadSimilarRoutes = useCallback(async (currentRoute) => {
    try {
      console.log('Starting enhanced similar routes search for:', `${currentRoute?.origin || ''} to ${currentRoute?.destination || ''}`);
      
      const destination = currentRoute.destination;
      const origin = currentRoute.origin;
      const routeType = currentRoute.routeType;
      const serviceType = currentRoute.serviceType;
      const departureTime = currentRoute.schedule?.departureTimes?.[0];
      
      // First priority: Routes to the same destination
      let filters = {
        destination: destination,
        status: 'active'
      };
      
      console.log('Fetching routes to same destination with filters:', filters);
      
      const response = await transportRouteService.getTransportRoutes(filters, 1, 20);
      
      if (!response || !response.success || !response.routes || !Array.isArray(response.routes)) {
        console.warn('No valid routes returned from similar routes API');
        setSimilarRoutes([]);
        return;
      }
      
      console.log(`Found ${response.routes.length} routes to same destination`);
      
      // Filter out the current route
      let candidateRoutes = response.routes.filter(item => {
        if (!item || (!item._id && !item.id)) return false;
        const itemId = item._id || item.id;
        const currentRouteId = currentRoute._id || currentRoute.id;
        return itemId.toString() !== currentRouteId.toString();
      });
      
      // Enhanced similarity scoring
      const scoredRoutes = candidateRoutes.map(route => {
        let score = 0;
        
        // Base score for same destination (highest priority)
        if (route.destination === destination) score += 100;
        
        // Bonus for same route type
        if (route.routeType === routeType) score += 50;
        
        // Bonus for same service type
        if (route.serviceType === serviceType) score += 30;
        
        // Time similarity bonus
        if (departureTime && route.schedule?.departureTimes?.length > 0) {
          const currentHour = parseInt(departureTime.split(':')[0]);
          const routeHours = route.schedule.departureTimes.map(time => parseInt(time.split(':')[0]));
          const closestHour = routeHours.reduce((prev, curr) => 
            Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev
          );
          const timeDiff = Math.abs(closestHour - currentHour);
          score += Math.max(0, 20 - timeDiff); // Up to 20 points for time similarity
        }
        
        // Same origin bonus (for connecting routes)
        if (route.origin === origin) score += 15;
        
        // Operating days similarity
        if (route.schedule?.operatingDays && currentRoute.schedule?.operatingDays) {
          const currentDays = Object.keys(currentRoute.schedule.operatingDays).filter(
            day => currentRoute.schedule.operatingDays[day]
          );
          const routeDays = Object.keys(route.schedule.operatingDays).filter(
            day => route.schedule.operatingDays[day]
          );
          const commonDays = currentDays.filter(day => routeDays.includes(day));
          score += (commonDays.length / Math.max(currentDays.length, routeDays.length)) * 10;
        }
        
        // Fare similarity (within reasonable range)
        if (route.fare && currentRoute.fare) {
          const fareDiff = Math.abs(route.fare - currentRoute.fare);
          const avgFare = (route.fare + currentRoute.fare) / 2;
          const fareRatio = fareDiff / avgFare;
          if (fareRatio < 0.5) score += 10; // Similar fare range
        }
        
        return { ...route, similarityScore: score };
      });
      
      // Sort by similarity score (highest first)
      scoredRoutes.sort((a, b) => b.similarityScore - a.similarityScore);
      
      console.log(`After similarity scoring, top routes:`, 
        scoredRoutes.slice(0, 3).map(r => ({
          destination: r.destination,
          origin: r.origin,
          score: r.similarityScore
        }))
      );
      
      // If we don't have enough routes to the same destination, add more from same origin
      if (scoredRoutes.length < 6) {
        console.log('Adding routes from same origin to fill the list');
        const originFilters = {
          origin: origin,
          status: 'active'
        };
        
        const originResponse = await transportRouteService.getTransportRoutes(originFilters, 1, 10);
        
        if (originResponse && originResponse.success && originResponse.routes) {
          const additionalRoutes = originResponse.routes.filter(item => {
            if (!item || (!item._id && !item.id)) return false;
            const itemId = item._id || item.id;
            const currentRouteId = currentRoute._id || currentRoute.id;
            // Exclude current route and already included routes
            return itemId.toString() !== currentRouteId.toString() &&
                   !scoredRoutes.find(existing => (existing._id || existing.id).toString() === itemId.toString());
          }).map(route => ({
            ...route,
            similarityScore: 25 // Lower base score for origin-only matches
          }));
          
          scoredRoutes.push(...additionalRoutes);
        }
      }
      
      // Final sorting and limiting
      const finalRoutes = scoredRoutes
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 6);
      
      console.log(`Final similar routes selection: ${finalRoutes.length} routes`);
      setSimilarRoutes(finalRoutes);
      
    } catch (error) {
      console.error('Error loading similar routes:', error);
      setSimilarRoutes([]);
    }
  }, []);

  // Record view with error prevention
  const recordView = useCallback(async (id) => {
    try {
      // Implement view recording if service supports it
      // await transportRouteService.incrementViewCount(id);
      setViews(prev => prev + 1);
      
      // Safe analytics tracking
      trackRouteView(id);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error recording view:', error);
      }
    }
  }, [trackRouteView]);

  // src/components/features/TransportSection/TransportRouteDetail.js - Part 3
// Continue from Part 2...

  const handleDateChange = useCallback((dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return; // Invalid date
    
    setTravelDate(date);
    
    // Update selected day based on the new date
    const dayIndex = date.getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex];
    
    // Only set if it's an operating day
    if (route?.schedule?.operatingDays?.[dayName]) {
      setSelectedDay(dayName);
    } else {
      setSelectedDay(null); // Not an operating day
    }
  }, [route]);

  const handlePassengersChange = useCallback((value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;
    setPassengers(Math.min(numValue, 50)); // Set reasonable maximum
  }, []);

  // Enhanced image error handler with sophisticated fallback logic
  const handleGalleryImageError = useCallback((e) => {
    // Get current attempt count
    const currentAttempts = imageLoadAttempts[selectedImage] || 0;
    
    // Update attempt counter
    setImageLoadAttempts(prev => ({
      ...prev, 
      [selectedImage]: currentAttempts + 1
    }));
    
    // Original source for logging
    const originalSrc = e.target.src;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Gallery image failed to load: ${originalSrc}`);
    }
    
    // Mark as failed to prevent future attempts
    markFailedImage(originalSrc);
    
    // Prevent redirect loops by checking attempts
    if (currentAttempts > 0 || 
        originalSrc.includes('/api/images/s3-proxy/') || 
        originalSrc.includes('/uploads/transport/') ||
        originalSrc.includes('images/images/') ||
        originalSrc.includes('/images/placeholders/')) {
      // We've already tried alternative paths, go straight to placeholder
      if (process.env.NODE_ENV === 'development') {
        console.log('Using placeholder as final fallback after multiple attempts');
      }
      e.target.src = '/images/placeholders/transport.jpg';
      return;
    }
    
    // First try: Direct S3 proxy if it's an S3 URL
    if (originalSrc.includes('amazonaws.com')) {
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Trying S3 proxy for: ${key}`);
        }
        // Normalize the key to prevent duplicate segments
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // Second try: If it's a local path but not found, try extracting just the filename
    const filename = originalSrc.split('/').pop();
    if (filename && !originalSrc.includes('/images/placeholders/')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Trying direct transport path for: ${filename}`);
      }
      e.target.src = `/uploads/transport/${filename}`;
      return;
    }
    
    // Final fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('Using placeholder image as final fallback');
    }
    e.target.src = '/images/placeholders/transport.jpg';
  }, [imageLoadAttempts, selectedImage, markFailedImage]);

  // Utility functions for route data
  const getDepartureTimeForSelectedDay = useCallback(() => {
    if (!selectedDay || !route || !route.schedule) return null;
    
    // Check for day-specific departure times
    if (route.schedule.departuresByDay && route.schedule.departuresByDay[selectedDay]) {
      return route.schedule.departuresByDay[selectedDay][0]; // Return the first departure time
    }
    
    // Fallback to general departure times
    if (route.schedule.departureTimes && route.schedule.departureTimes.length > 0) {
      return route.schedule.departureTimes[0];
    }
    
    return null;
  }, [selectedDay, route]);

  const formatDayName = useCallback((day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }, []);

  // Get operating days from the route.schedule.operatingDays object
  const getOperatingDays = useCallback(() => {
    if (!route.schedule || !route.schedule.operatingDays) return [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.filter(day => route.schedule.operatingDays[day]);
  }, [route]);

  // Get all departure times for display
  const getAllDepartureTimes = useCallback(() => {
    if (!route.schedule) return [];
    
    // If we have departures by day
    if (route.schedule.departuresByDay) {
      const allTimes = [];
      Object.keys(route.schedule.departuresByDay).forEach(day => {
        if (route.schedule.operatingDays[day]) {
          const times = route.schedule.departuresByDay[day];
          if (Array.isArray(times)) {
            allTimes.push({
              day: formatDayName(day),
              times: times
            });
          }
        }
      });
      return allTimes;
    }
    
    // Fallback to general departure times
    if (route.schedule.departureTimes && route.schedule.departureTimes.length > 0) {
      // Group by operating days
      return [{
        day: 'All Operating Days',
        times: route.schedule.departureTimes
      }];
    }
    
    return [];
  }, [route, formatDayName]);

  // Main data loading effect
  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch transport route details
        const response = await transportRouteService.getTransportRoute(routeId);
        
        if (!response || !response.success || !response.route) {
          setError('Transport route not found');
          return;
        }
  
        setRoute(response.route);
        
        // Check if route is saved
        const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
        setIsSaved(savedRoutes.includes(response.route._id));
        
        // Initialize selected day based on route's schedule
        if (response.route.schedule && response.route.schedule.operatingDays) {
          initializeSelectedDay(response.route.schedule.operatingDays);
        }
        
        // Load related content (including destination cars)
        await loadRelatedContent(response.route);
        
        // Record view
        if (!viewRecorded.current) {
          recordView(response.route._id);
          viewRecorded.current = true;
        }
      } catch (error) {
        setError('Failed to load transport route details');
        console.error('Error loading route:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadRoute();
    
    // Reset state when routeId changes
    return () => {
      viewRecorded.current = false;
      setSelectedImage(0);
      setImageLoadAttempts({});
    };
  }, [routeId, initializeSelectedDay, loadRelatedContent, recordView]);

  // Initialize and update carousels when data is loaded
  useEffect(() => {
    if (providerRoutes.length > 0) {
      initializeCarousel('provider');
    }
  }, [providerRoutes, providerActiveIndex, initializeCarousel]);
  
  useEffect(() => {
    if (similarRoutes.length > 0) {
      initializeCarousel('similar');
    }
  }, [similarRoutes, similarActiveIndex, initializeCarousel]);

  // NEW: Initialize carousels for destination cars
  useEffect(() => {
    if (destinationRentals.length > 0) {
      initializeCarousel('rentals');
    }
  }, [destinationRentals, rentalsActiveIndex, initializeCarousel]);

  useEffect(() => {
    if (destinationSales.length > 0) {
      initializeCarousel('sales');
    }
  }, [destinationSales, salesActiveIndex, initializeCarousel]);
  
  // Handle window resize for responsive carousels
  useEffect(() => {
    const handleResize = () => {
      if (providerRoutes.length > 0) initializeCarousel('provider');
      if (similarRoutes.length > 0) initializeCarousel('similar');
      if (destinationRentals.length > 0) initializeCarousel('rentals');
      if (destinationSales.length > 0) initializeCarousel('sales');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [providerRoutes, similarRoutes, destinationRentals, destinationSales, initializeCarousel]);

  // Prefetch adjacent images to improve user experience
  useEffect(() => {
    if (route && route.images && route.images.length > 1) {
      const nextIndex = (selectedImage + 1) % route.images.length;
      const prevIndex = (selectedImage - 1 + route.images.length) % route.images.length;
      
      // Extract image URLs
      const imageUrls = route.images && route.images.length > 0 
        ? route.images.map(img => getImageUrl(img)) 
        : ['/images/placeholders/transport.jpg'];
      
      // Create Image objects to trigger preloading
      const nextImg = new Image();
      nextImg.src = imageUrls[nextIndex];
      
      const prevImg = new Image();
      prevImg.src = imageUrls[prevIndex];
    }
  }, [route, selectedImage, getImageUrl]);

  // Cleanup localStorage periodically
  useEffect(() => {
    const cleanupFailedImages = () => {
      try {
        const failedImages = JSON.parse(localStorage.getItem('failedTransportImages') || '{}');
        const now = Date.now();
        let cleaned = false;
        
        // Remove entries older than 24 hours
        Object.keys(failedImages).forEach(key => {
          if (now - failedImages[key] > 24 * 60 * 60 * 1000) {
            delete failedImages[key];
            cleaned = true;
          }
        });
        
        if (cleaned) {
          localStorage.setItem('failedTransportImages', JSON.stringify(failedImages));
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    // Run cleanup on mount
    cleanupFailedImages();
    
    // Set interval for periodic cleanup (once an hour)
    const cleanupInterval = setInterval(cleanupFailedImages, 60 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Show loading spinner when loading data
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  // Show error message if route not found
  if (error || !route) {
    return (
      <div className="error-container">
        <h2>{error || 'Transport route not found'}</h2>
        <button onClick={() => navigate('/public-transport')}>
          ← Back to Transport Routes
        </button>
      </div>
    );
  }

  // Extract image URLs with improved handling
  const imageUrls = route.images && route.images.length > 0 
    ? route.images.map(img => getImageUrl(img)) 
    : ['/images/placeholders/transport.jpg'];

    // src/components/features/TransportSection/TransportRouteDetail.js - Part 4 (Final)
// Continue from Part 3...

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV !== 'production'}>
      <div className="transport-detail-container">
        <button 
          className="back-button" 
          onClick={() => navigate('/public-transport')}
          aria-label="Back to transport routes"
        >
          ← Back to Transport Routes
        </button>

        <div className="transport-content">
          <div className="main-content">
            {/* Gallery Section */}
            <div className="transport-gallery">
              <div className="main-image-container">
                <div className="main-image">
                  <img 
                    src={imageUrls[selectedImage]} 
                    alt={`${route.origin} to ${route.destination}`}
                    className="gallery-image"
                    onError={handleGalleryImageError}
                  />
                  <div className="gallery-actions">
                    <button 
                      className={`action-button ${isSaved ? 'saved' : ''}`}
                      onClick={handleSaveRoute}
                      aria-label={isSaved ? 'Remove from saved' : 'Save route'}
                    >
                      {isSaved ? '♥' : '♡'}
                    </button>
                    <button 
                      ref={shareButtonRef}
                      className="action-button"
                      onClick={() => setShowShareModal(true)}
                      aria-label="Share route"
                    >
                      ↗
                    </button>
                  </div>
                  
                  {imageUrls.length > 1 && (
                    <>
                      <button 
                        className="gallery-nav prev" 
                        onClick={() => handleNavigation('prev')}
                        aria-label="Previous image"
                      >
                        ❮
                      </button>
                      <button 
                        className="gallery-nav next" 
                        onClick={() => handleNavigation('next')}
                        aria-label="Next image"
                      >
                        ❯
                      </button>
                    </>
                  )}
                  
                  {imageUrls.length > 1 && (
                    <div className="image-counter">
                      {selectedImage + 1} / {imageUrls.length}
                    </div>
                  )}

                  {route.routeType && (
                    <div className="route-type-badge">
                      {route.routeType}
                    </div>
                  )}
                </div>
              </div>
              
              {imageUrls.length > 1 && (
                <div className="thumbnail-strip">
                  {imageUrls.map((image, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
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

            {/* Transport Info Section */}
            <div className="transport-info">
              <div className="transport-header">
                <div className="title-container">
                  <h1 className="title">
                    <span className="origin">{route.origin}</span>
                    <span className="route-arrow">→</span>
                    <span className="destination">{route.destination}</span>
                  </h1>
                  <div className="badges-container">
                    <div className="route-number-badge">
                      {route.routeNumber || 'Direct Route'}
                    </div>
                    {route.serviceType && (
                      <div className={`service-type-badge ${route.serviceType.toLowerCase()}`}>
                        {route.serviceType}
                      </div>
                    )}
                    {route.status && (
                      <div className={`status-badge ${route.status.toLowerCase().replace(' ', '-')}`}>
                        {route.status}
                      </div>
                    )}
                  </div>
                </div>
                <div className="price-container">
                  <div className="transport-price pula-price">
                    {route.fare ? `P ${route.fare.toFixed(2)}` : 'Contact for fare'}
                  </div>
                  {route.fareOptions?.childFare && (
                    <div className="fare-option">
                      Child Fare: P {route.fareOptions.childFare.toFixed(2)}
                    </div>
                  )}
                  {route.fareOptions?.seniorFare && (
                    <div className="fare-option">
                      Senior Fare: P {route.fareOptions.seniorFare.toFixed(2)}
                    </div>
                  )}
                  {route.fareOptions?.studentFare && (
                    <div className="fare-option">
                      Student Fare: P {route.fareOptions.studentFare.toFixed(2)}
                    </div>
                  )}
                  {route.fareOptions?.roundTripDiscount && (
                    <div className="discount-badge">
                      {route.fareOptions.roundTripDiscount}% Round Trip Discount
                    </div>
                  )}
                </div>
              </div>

              {/* Booking section */}
              <div className="booking-section">
                <h2>Book This Route</h2>
                
                {/* Operating days pills */}
                <div className="operating-days-container">
                  <h3>Operating Days</h3>
                  <div className="days-pills">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        className={`day-pill ${route.schedule?.operatingDays?.[day] ? 'available' : 'unavailable'} ${selectedDay === day ? 'selected' : ''}`}
                        onClick={() => route.schedule?.operatingDays?.[day] && handleDayClick(day)}
                        disabled={!route.schedule?.operatingDays?.[day]}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Booking form */}
                <div className="booking-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="travelDate">Travel Date</label>
                      <input 
                        type="date" 
                        id="travelDate"
                        value={travelDate.toISOString().split('T')[0]}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="passengers">Passengers</label>
                      <div className="passenger-input">
                        <button 
                          className="passenger-btn"
                          onClick={() => handlePassengersChange(passengers - 1)}
                          disabled={passengers <= 1}
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          id="passengers"
                          value={passengers}
                          min="1"
                          max="50"
                          onChange={(e) => handlePassengersChange(e.target.value)}
                        />
                        <button 
                          className="passenger-btn"
                          onClick={() => handlePassengersChange(passengers + 1)}
                          disabled={passengers >= 50}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected departure display */}
                  {selectedDay && getDepartureTimeForSelectedDay() && (
                    <div className="selected-departure">
                      <div className="departure-label">Selected Departure:</div>
                      <div className="departure-info">
                        <div className="departure-day">{formatDayName(selectedDay)}</div>
                        <div className="departure-time">{getDepartureTimeForSelectedDay()}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Booking button */}
                  <button 
                    className="book-now-button"
                    onClick={handleWhatsAppClick}
                    disabled={!selectedDay}
                  >
                    {selectedDay ? 'Book via WhatsApp' : 'Select a travel day'}
                  </button>
                  
                  {/* Note about booking */}
                  <div className="booking-note">
                    {route.bookingOptions?.advanceBookingRequired ? (
                      <p>Advance booking required. {route.bookingOptions.advanceBookingPeriod 
                        ? `Please book at least ${route.bookingOptions.advanceBookingPeriod} hours in advance.` 
                        : ''}</p>
                    ) : (
                      <p>You can also purchase tickets directly from the transport provider.</p>
                    )}
                  </div>
                  
                  {/* Payment methods */}
                  {route.paymentMethods && route.paymentMethods.length > 0 && (
                    <div className="payment-methods">
                      <span>Accepted payment methods:</span>
                      <div className="payment-pills">
                        {route.paymentMethods.map((method, index) => (
                          <span key={index} className="payment-pill">{method}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Route specs grid */}
              <div className="route-specs-grid">
                <div className="specs-column">
                  <div className="spec-item">
                    <span className="spec-label">Route Type</span>
                    <span className="spec-value">{route.routeType || 'Standard'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Frequency</span>
                    <span className="spec-value">{route.schedule?.frequency || 'Contact for details'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Duration</span>
                    <span className="spec-value">{route.schedule?.duration || route.route?.estimatedDuration || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="specs-column">
                  <div className="spec-item">
                    <span className="spec-label">Distance</span>
                    <span className="spec-value">{route.route?.distance || 'N/A'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Service Type</span>
                    <span className="spec-value">{route.serviceType || 'Regular'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Operating Days</span>
                    <span className="spec-value">{getOperatingDays().map(day => day.slice(0, 3)).join(', ') || 'Daily'}</span>
                  </div>
                </div>
              </div>

              {/* Transport Details Tabs */}
              <div className="transport-tabs">
                <button 
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Route Details
                </button>
                <button 
                  className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule
                </button>
                <button 
                  className={`tab-button ${activeTab === 'stops' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stops')}
                >
                  Stops
                </button>
                <button 
                  className={`tab-button ${activeTab === 'amenities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('amenities')}
                >
                  Amenities
                </button>
              </div>

              {/* Tab Content - Details Tab */}
              {activeTab === 'details' && (
                <div className="route-description-section">
                  <h2>Route Description</h2>
                  <div className="description-content">
                    {route.description || 'No detailed description provided for this route.'}
                  </div>
                  
                  {/* Vehicle information if available */}
                  {route.vehicles && route.vehicles.length > 0 && (
                    <div className="vehicles-info">
                      <h3>Vehicle Information</h3>
                      <div className="vehicles-grid">
                        {route.vehicles.map((vehicle, index) => (
                          <div key={index} className="vehicle-card">
                            <div className="vehicle-type">{vehicle.vehicleType}</div>
                            {vehicle.capacity && (
                              <div className="vehicle-capacity">Capacity: {vehicle.capacity} passengers</div>
                            )}
                            {vehicle.features && vehicle.features.length > 0 && (
                              <div className="vehicle-features">
                                {vehicle.features.slice(0, 3).map((feature, idx) => (
                                  <span key={idx} className="vehicle-feature">{feature}</span>
                                ))}
                                {vehicle.features.length > 3 && (
                                  <span className="more-features">+{vehicle.features.length - 3} more</span>
                                )}
                              </div>
                            )}
                            {vehicle.accessibility && (
                              <div className="vehicle-accessibility">
                                {vehicle.accessibility.wheelchairAccessible && (
                                  <span className="accessibility-badge">♿ Wheelchair Accessible</span>
                                )}
                                {vehicle.accessibility.lowFloor && (
                                  <span className="accessibility-badge">Low Floor</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content - Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="schedule-section">
                  <h2>Schedule Information</h2>
                  
                  <div className="schedule-frequency">
                    <h3>Service Frequency</h3>
                    <p>{route.schedule?.frequency || 'Please contact the provider for detailed schedule information.'}</p>
                  </div>
                  
                  <div className="schedule-days">
                    <h3>Operating Days</h3>
                    <div className="days-grid">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                        const dayLower = day.toLowerCase();
                        const isOperating = route.schedule?.operatingDays?.[dayLower];
                        
                        return (
                          <div key={index} className={`day-item ${isOperating ? 'operating' : 'non-operating'}`}>
                            <div className="day-name">{day}</div>
                            <div className="day-status">{isOperating ? 'Operating' : 'Not Operating'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {getAllDepartureTimes().length > 0 && (
                    <div className="departure-times">
                      <h3>Departure Times</h3>
                      <div className="times-grid">
                        {getAllDepartureTimes().map((dayTimes, index) => (
                          <div key={index} className="day-times">
                            <div className="day-name">{dayTimes.day}</div>
                            <div className="times-list">
                              {dayTimes.times.map((time, idx) => (
                                <div key={idx} className="time-chip">{time}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content - Stops Tab */}
              {activeTab === 'stops' && (
                <div className="stops-section">
                  <h2>Route Stops</h2>
                  
                  {route.stops && route.stops.length > 0 ? (
                    <div className="stops-list">
                      <div className="stops-header">
                        <div className="stop-location-header">Location</div>
                        <div className="stop-time-header">Arrival</div>
                        <div className="stop-time-header">Departure</div>
                        <div className="stop-fare-header">Fare from Origin</div>
                      </div>
                      
                      {/* Origin stop */}
                      <div className="stop-item origin">
                        <div className="stop-marker">
                          <div className="stop-dot"></div>
                          <div className="stop-line"></div>
                        </div>
                        <div className="stop-details">
                          <div className="stop-location">{route.origin}</div>
                          <div className="stop-time">-</div>
                          <div className="stop-time">
                            {route.schedule?.departureTimes?.[0] || 'Scheduled departure'}
                          </div>
                          <div className="stop-fare">-</div>
                        </div>
                      </div>
                      
                      {/* Intermediate stops */}
                      {route.stops.map((stop, index) => (
                        <div key={index} className="stop-item">
                          <div className="stop-marker">
                            <div className="stop-dot"></div>
                            <div className="stop-line"></div>
                          </div>
                          <div className="stop-details">
                            <div className="stop-location">{stop.name}</div>
                            <div className="stop-time">{stop.arrivalTime || '-'}</div>
                            <div className="stop-time">{stop.departureTime || '-'}</div>
                            <div className="stop-fare">
                              {stop.fareFromOrigin 
                                ? `P ${stop.fareFromOrigin.toFixed(2)}`
                                : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Destination stop */}
                      <div className="stop-item destination">
                        <div className="stop-marker">
                          <div className="stop-dot"></div>
                        </div>
                        <div className="stop-details">
                          <div className="stop-location">{route.destination}</div>
                          <div className="stop-time">
                            {route.schedule?.arrivalTime || 'Scheduled arrival'}
                          </div>
                          <div className="stop-time">-</div>
                          <div className="stop-fare">
                            {route.fare ? `P ${route.fare.toFixed(2)}` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-stops-message">
                      <p>This is a direct route from {route.origin} to {route.destination} with no intermediate stops.</p>
                    </div>
                  )}
                  
                  <div className="route-map-placeholder">
                    <p>Route map coming soon</p>
                  </div>
                </div>
              )}

              {/* Tab Content - Amenities Tab */}
              {activeTab === 'amenities' && (
                <div className="amenities-section">
                  <h2>Amenities & Features</h2>
                  
                  {route.amenities && route.amenities.length > 0 ? (
                    <div className="amenities-grid">
                      {route.amenities.map((amenity, index) => (
                        <div key={index} className="amenity-item">
                          <div className="amenity-icon">✓</div>
                          <div className="amenity-name">{amenity}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-amenities-message">
                      <p>No specific amenities listed for this transport route.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Provider Sidebar */}
          <div className="provider-sidebar">
            <div className="provider-section">
              <div className="provider-header">
                <h2>Provider Information</h2>
              </div>
              <div className="provider-card">
                <div className="provider-header-compact">
                  <img 
                    src={
                      (typeof route.provider === 'object' && route.provider.logo) 
                        ? getImageUrl(route.provider.logo)
                        : '/images/placeholders/provider-avatar.jpg'
                    } 
                    alt={typeof route.provider === 'object' ? route.provider.businessName || route.provider.name : route.provider}
                    className="provider-avatar"
                    onError={(e) => {
                      e.target.src = '/images/placeholders/provider-avatar.jpg';
                    }}
                  />
                  <div className="provider-details">
                    <h3 className="provider-name">
                      {typeof route.provider === 'object' 
                        ? route.provider.businessName || route.provider.name 
                        : route.provider || 'Transport Provider'}
                    </h3>
                    <p className="provider-location">
                      {typeof route.provider === 'object' && route.provider.location
                        ? `${route.provider.location.city || ''}${route.provider.location.country ? `, ${route.provider.location.country}` : ''}`
                        : 'Location not specified'}
                    </p>
                    {typeof route.provider === 'object' && route.provider.verification?.status === 'verified' && (
                      <span className="provider-verified-tag">✓ Verified</span>
                    )}
                  </div>
                </div>
                
                <div className="provider-type">
                  {route.routeType || 'Public Transport'} Service
                </div>
                
                <div className="provider-stats">
                  <div className="stat-item">
                    <div className="stat-value">
                      {typeof route.provider === 'object' && route.provider.metrics
                        ? route.provider.metrics.totalListings || 0
                        : '?'}
                    </div>
                    <div className="stat-label">Routes</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {typeof route.provider === 'object' && route.provider.rating
                        ? route.provider.rating.average.toFixed(1)
                        : route.averageRating || 'N/A'}
                    </div>
                    <div className="stat-label">Rating</div>
                  </div>
                  {route.reviews && (
                    <div className="stat-item">
                      <div className="stat-value">{route.reviews.length}</div>
                      <div className="stat-label">Reviews</div>
                    </div>
                  )}
                </div>
                
                {typeof route.provider === 'object' && route.provider.contact && (
                  <div className="provider-contact-grid">
                    {route.provider.contact.email && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">✉️</span>
                        <span className="contact-info">{route.provider.contact.email}</span>
                      </div>
                    )}
                    {route.provider.contact.phone && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">📞</span>
                        <span className="contact-info">{route.provider.contact.phone}</span>
                      </div>
                    )}
                    {route.provider.contact.website && (
                      <div className="contact-grid-item">
                        <span className="contact-icon">🌐</span>
                        <a 
                          href={route.provider.contact.website.startsWith('http') ? route.provider.contact.website : `https://${route.provider.contact.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="contact-info website-link"
                        >
                          {route.provider.contact.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="contact-buttons">
                  <button 
                    className="contact-button whatsapp"
                    onClick={handleWhatsAppClick}
                    disabled={!selectedDay}
                  >
                    {selectedDay ? 'Book via WhatsApp' : 'Select a travel day'}
                  </button>
                  
                  {typeof route.provider === 'object' && route.provider.contact?.phone && (
                    <button 
                      className="contact-button contact-provider"
                      onClick={() => window.open(`tel:${route.provider.contact.phone}`)}
                    >
                      Call
                    </button>
                  )}
                  
                  <button 
                    className="contact-button view-provider"
                    onClick={() => {
                      const providerId = extractProviderId(route);
                      
                      if (providerId) {
                        navigate(`/services/${providerId}?type=transport`);
                      } else {
                        dispatch(addNotification({
                          type: 'error',
                          message: 'Provider details not available'
                        }));
                      }
                    }}
                  >
                    View Provider
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* More from this provider section */}
          <div className="related-listings-section">
            <h2 className="related-section-title">
              More routes from {typeof route.provider === 'object' 
                ? route.provider.businessName || route.provider.name 
                : route.provider || 'this provider'}
            </h2>
            
            {providerRoutes && providerRoutes.length > 0 ? (
              <div className="carousel-container provider-carousel">
                {providerRoutes.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('provider', 'prev')}
                    className="carousel-nav prev"
                    disabled={providerActiveIndex === 0}
                    aria-label="Previous provider route"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                
                <div className="carousel-viewport" ref={providerCarouselRef}>
                  <div className="carousel-track">
                    {providerRoutes.map((item, index) => (
                      <div className="carousel-slide" key={item._id || item.id || index}>
                        <PublicTransportCard 
                          route={item} 
                          compact={true}
                          onShare={(itemToShare) => {
                            setSelectedItem(itemToShare);
                            setShowShareModal(true);
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {providerRoutes.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('provider', 'next')}
                    className="carousel-nav next"
                    disabled={providerActiveIndex >= Math.max(0, providerRoutes.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                    aria-label="Next provider route"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            ) : (
              <div className="no-listings">
                <p>No other routes available from this provider.</p>
              </div>
            )}
          </div>

          {/* ENHANCED: Similar routes section with better logic */}
          <div className="related-listings-section">
            <h2 className="related-section-title">
              Routes to {route.destination}
            </h2>
            
            {similarRoutes && similarRoutes.length > 0 ? (
              <div className="carousel-container similar-carousel">
                {similarRoutes.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('similar', 'prev')}
                    className="carousel-nav prev"
                    disabled={similarActiveIndex === 0}
                    aria-label="Previous similar route"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                
                <div className="carousel-viewport" ref={similarCarouselRef}>
                  <div className="carousel-track">
                    {similarRoutes.map((item, index) => (
                      <div className="carousel-slide" key={item._id || item.id || index}>
                        <PublicTransportCard 
                          route={item} 
                          compact={true}
                          onShare={(itemToShare) => {
                            setSelectedItem(itemToShare);
                            setShowShareModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {similarRoutes.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('similar', 'next')}
                    className="carousel-nav next"
                    disabled={similarActiveIndex >= Math.max(0, similarRoutes.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                    aria-label="Next similar route"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            ) : (
              <div className="no-listings">
                <p>No similar routes found.</p>
              </div>
            )}
          </div>

          {/* NEW: Car rentals at destination section */}
          <div className="related-listings-section">
            <h2 className="related-section-title">
              🚗 Car Rentals in {extractDestinationCity(route) || route.destination}
            </h2>
            
            {rentalsLoading ? (
              <div className="loading-spinner">
                <div className="loader"></div>
                <p>Loading car rentals...</p>
              </div>
            ) : destinationRentals && destinationRentals.length > 0 ? (
              <div className="carousel-container rentals-carousel">
                {destinationRentals.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('rentals', 'prev')}
                    className="carousel-nav prev"
                    disabled={rentalsActiveIndex === 0}
                    aria-label="Previous rental car"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                
                <div className="carousel-viewport" ref={rentalsCarouselRef}>
                  <div className="carousel-track">
                    {destinationRentals.map((rental, index) => (
                      <div className="carousel-slide" key={rental._id || rental.id || index}>
                        <RentalCard 
                          vehicle={rental} 
                          compact={true}
                          onShare={(itemToShare) => {
                            setSelectedItem(itemToShare);
                            setShowShareModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {destinationRentals.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('rentals', 'next')}
                    className="carousel-nav next"
                    disabled={rentalsActiveIndex >= Math.max(0, destinationRentals.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                    aria-label="Next rental car"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            ) : (
              <div className="no-listings">
                <p>No car rentals found in {extractDestinationCity(route) || route.destination}.</p>
                <button 
                  onClick={() => navigate('/rentals')}
                  className="view-all-btn"
                >
                  Browse All Car Rentals
                </button>
              </div>
            )}
          </div>

          {/* NEW: Cars for sale at destination section */}
          <div className="related-listings-section">
            <h2 className="related-section-title">
              🏪 Cars for Sale in {extractDestinationCity(route) || route.destination}
            </h2>
            
            {salesLoading ? (
              <div className="loading-spinner">
                <div className="loader"></div>
                <p>Loading cars for sale...</p>
              </div>
            ) : destinationSales && destinationSales.length > 0 ? (
              <div className="carousel-container sales-carousel">
                {destinationSales.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('sales', 'prev')}
                    className="carousel-nav prev"
                    disabled={salesActiveIndex === 0}
                    aria-label="Previous car for sale"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                
                <div className="carousel-viewport" ref={salesCarouselRef}>
                  <div className="carousel-track">
                    {destinationSales.map((car, index) => (
                      <div className="carousel-slide" key={car._id || car.id || index}>
                        <VehicleCard 
                          car={car} 
                          compact={true}
                          onShare={(itemToShare) => {
                            setSelectedItem(itemToShare);
                            setShowShareModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {destinationSales.length > 1 && (
                  <button 
                    onClick={() => navigateCarousel('sales', 'next')}
                    className="carousel-nav next"
                    disabled={salesActiveIndex >= Math.max(0, destinationSales.length - (window.innerWidth >= 1200 ? 3 : window.innerWidth >= 768 ? 2 : 1))}
                    aria-label="Next car for sale"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            ) : (
              <div className="no-listings">
                <p>No cars for sale found in {extractDestinationCity(route) || route.destination}.</p>
                <button 
                  onClick={() => navigate(`/marketplace?location=${encodeURIComponent(extractDestinationCity(route) || route.destination)}`)}
                  className="view-all-btn"
                >
                  Browse Cars for Sale
                </button>
              </div>
            )}
          </div>

          {showShareModal && (
            <ShareModal 
              route={selectedItem || route}
              onClose={() => {
                setShowShareModal(false);
                setSelectedItem(null);
              }}
              buttonRef={shareButtonRef}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(TransportRouteDetail);