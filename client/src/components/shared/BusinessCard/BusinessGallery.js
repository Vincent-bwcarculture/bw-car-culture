// src/components/shared/BusinessCard/BusinessGallery.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import { getVehicleInfo, getVehicleImageUrl } from '../../../utils/vehicleHelpers.js';
import './BusinessGallery.css';

const BusinessGallery = ({ businessId, businessType, onCountUpdate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const galleryRef = useRef(null);
  const isMounted = useRef(true);

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch items when businessId changes
  useEffect(() => {
    const fetchItems = async () => {
      if (!businessId) {
        if (isMounted.current) {
          setLoading(false);
          setError('Business ID is required');
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }
        
        console.log(`Fetching items for ${businessType}: ${businessId}`);
        
        // UPDATED: Proper endpoint determination based on business type
        let endpoint = '';
        if (businessType === 'dealer') {
          endpoint = `/listings/dealer/${businessId}?limit=10`;
        } else if (businessType === 'car_rental') {
          // This is the critical change - using a query parameter instead of path parameter
          endpoint = `/rentals?providerId=${businessId}&limit=10`;
        } else if (businessType === 'trailer_rental') {
          endpoint = `/trailers?providerId=${businessId}&limit=10`;
        } else if (businessType === 'public_transport') {
          endpoint = `/transport?providerId=${businessId}&limit=10`;
        } else if (businessType === 'service') {
          endpoint = `/services/${businessId}/items?limit=10`;
        }
        
        console.log(`Fetching items using endpoint: ${endpoint}`);
        
        try {
          const response = await http.get(endpoint);
          
          if (isMounted.current) {
            // UPDATED: Handle different response formats based on business type
            if (response.data && response.data.success) {
              let fetchedItems = [];
              if (endpoint.includes('/rentals')) {
                fetchedItems = response.data.vehicles || response.data.data || [];
              } else if (endpoint.includes('/trailers')) {
                fetchedItems = response.data.trailers || response.data.data || [];
              } else if (endpoint.includes('/transport')) {
                fetchedItems = response.data.routes || response.data.data || [];
              } else {
                fetchedItems = response.data.data || [];
              }
              
              console.log(`Successfully fetched ${fetchedItems.length} items for ${businessType}`);
              setItems(fetchedItems);
              
              // Notify parent component about the count
              if (onCountUpdate && typeof onCountUpdate === 'function') {
                onCountUpdate(fetchedItems.length);
              }
            } else {
              console.warn('API returned success:false', response.data);
              setItems([]);
              if (onCountUpdate) onCountUpdate(0);
            }
          }
        } catch (error) {
          console.error(`Error fetching from primary endpoint: ${error.message}`);
          
          // Try fallback with /api prefix
          try {
            console.log(`Trying fallback endpoint with /api prefix`);
            const fallbackEndpoint = `/api${endpoint}`;
            
            const fallbackResponse = await fetch(fallbackEndpoint);
            const fallbackData = await fallbackResponse.json();
            
            if (isMounted.current) {
              if (fallbackData && fallbackData.success) {
                let fetchedItems = [];
                if (endpoint.includes('/rentals')) {
                  fetchedItems = fallbackData.vehicles || fallbackData.data || [];
                } else if (endpoint.includes('/trailers')) {
                  fetchedItems = fallbackData.trailers || fallbackData.data || [];
                } else if (endpoint.includes('/transport')) {
                  fetchedItems = fallbackData.routes || fallbackData.data || [];
                } else {
                  fetchedItems = fallbackData.data || [];
                }
                
                console.log(`Successfully fetched ${fetchedItems.length} items from fallback endpoint`);
                setItems(fetchedItems);
                
                if (onCountUpdate) onCountUpdate(fetchedItems.length);
              } else {
                setItems([]);
                if (onCountUpdate) onCountUpdate(0);
              }
            }
          } catch (fallbackError) {
            console.error(`Fallback also failed: ${fallbackError.message}`);
            
            if (isMounted.current) {
              setError('Could not load items');
              setItems([]);
              if (onCountUpdate) onCountUpdate(0);
            }
          }
        }
      } catch (error) {
        console.error(`Error in fetchItems for ${businessType} ${businessId}:`, error);
        if (isMounted.current) {
          setError('Could not load items');
          setItems([]);
          if (onCountUpdate) onCountUpdate(0);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchItems();
  }, [businessId, businessType, onCountUpdate]);

  // Scroll gallery left
  const scrollLeft = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  // Scroll gallery right
  const scrollRight = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  // Handle click on an item
  const handleItemClick = (item) => {
    if (!item || !item._id) return;
    
    if (businessType === 'dealer') {
      navigate(`/marketplace/${item._id}`);
    } else if (businessType === 'car_rental') {
      navigate(`/rentals/${item._id}`);
    } else if (businessType === 'trailer_rental') {
      navigate(`/trailers/${item._id}`);
    } else if (businessType === 'public_transport') {
      navigate(`/transport/${item._id}`);
    } else {
      navigate(`/services/${businessId}/items/${item._id}`);
    }
  };

  // Helper function to get item's vehicle name
  const getItemName = (item) => {
    if (!item) return '';
    
    // Try to get name from different possible locations
    if (item.name) return item.name;
    if (item.title) return item.title;
    
    let result = '';
    
    // Try to build name from specifications
    if (businessType === 'dealer' || businessType === 'car_rental') {
      const make = getVehicleInfo(item, 'make', '');
      const model = getVehicleInfo(item, 'model', '');
      
      if (make || model) {
        result = `${make} ${model}`.trim();
      }
    } else if (businessType === 'trailer_rental') {
      if (item.trailerType) {
        result = `${item.trailerType} Trailer`;
      }
    } else if (businessType === 'public_transport') {
      if (item.origin && item.destination) {
        result = `${item.origin} to ${item.destination}`;
      }
    }
    
    return result || 'Item';
  };

  // Format price for display
  const formatPrice = (item) => {
    if (!item) return '';
    
    // For dealer listings
    if (businessType === 'dealer') {
      if (item.priceOptions?.showPriceAsPOA) return 'POA';
      return `P ${item.price?.toLocaleString() || '0'}`;
    }
    
    // For rental items
    if (businessType === 'car_rental' || businessType === 'trailer_rental') {
      // Try to find daily rate in different places
      const rate = item.rates?.daily || item.dailyRate || item.price || 0;
      return `P ${rate.toLocaleString() || '0'}/day`;
    }
    
    // For transport routes
    if (businessType === 'public_transport') {
      const fare = item.fare || 0;
      return `P ${fare.toLocaleString() || '0'}`;
    }
    
    return '';
  };

  // If empty and no error/loading state, don't render at all
  if (!loading && !error && items.length === 0) {
    return null;
  }

  return (
    <div className="bcc-business-gallery">
      <div className="bcc-gallery-header">
        <h3 className="bcc-gallery-title">Featured Items</h3>
        {items.length > 0 && (
          <span className="bcc-gallery-count">
            {items.length} {businessType === 'dealer' ? 'vehicles' : 
              businessType === 'car_rental' ? 'rentals' :
              businessType === 'trailer_rental' ? 'trailers' :
              businessType === 'public_transport' ? 'routes' : 'items'}
          </span>
        )}
      </div>

      <div className="bcc-gallery-container">
        {loading ? (
          <div className="bcc-gallery-loading">
            <div className="bcc-gallery-loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : error ? (
          <div className="bcc-gallery-empty">
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bcc-gallery-empty">
            <p>No items available</p>
          </div>
        ) : (
          <>
            <div className="bcc-gallery-scroll" ref={galleryRef}>
              {items.map((item) => (
                <div
                  key={item._id || item.id || Math.random().toString()}
                  className="bcc-gallery-item"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="bcc-gallery-image">
                    <img
                      src={getVehicleImageUrl(item)}
                      alt={getItemName(item)}
                      loading="lazy"
                      onError={(e) => {
                        console.log(`Gallery image failed to load: ${e.target.src}`);
                        e.target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                  </div>
                  <div className="bcc-gallery-overlay">
                    <p className="bcc-gallery-price">
                      {formatPrice(item)}
                    </p>
                    <p className="bcc-gallery-title">
                      {getItemName(item)}
                    </p>
                    <p className="bcc-gallery-specs">
                      {businessType === 'dealer' && 
                        `${getVehicleInfo(item, 'year', '')} ${getVehicleInfo(item, 'make', '')} ${getVehicleInfo(item, 'model', '')}`}
                      {businessType === 'car_rental' && 
                        `${getVehicleInfo(item, 'year', '')} ${getVehicleInfo(item, 'make', '')} ${getVehicleInfo(item, 'model', '')}`}
                      {businessType === 'trailer_rental' && 
                        `${item.trailerType || ''} ${item.specifications?.length ? item.specifications.length + 'm' : ''}`}
                      {businessType === 'public_transport' && 
                        `${item.routeType || ''} ${item.serviceType || ''}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 2 && (
              <>
                <button
                  className="bcc-gallery-nav bcc-gallery-nav-left"
                  onClick={scrollLeft}
                  aria-label="Scroll left"
                >
                  ❮
                </button>
                <button
                  className="bcc-gallery-nav bcc-gallery-nav-right"
                  onClick={scrollRight}
                  aria-label="Scroll right"
                >
                  ❯
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessGallery;