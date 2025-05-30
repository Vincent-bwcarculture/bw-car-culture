// Updated DealershipVehicleGallery.js with more robust error handling
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import './DealershipVehicleGallery.css';

const DealershipVehicleGallery = ({ dealerId, onCountUpdate }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const galleryRef = useRef(null);
  const isMounted = useRef(true);
  const requestAttempted = useRef(false);

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch vehicles when dealerId changes
  useEffect(() => {
    const fetchVehicles = async () => {
      // Skip if no dealerId is provided
      if (!dealerId) {
        if (isMounted.current) {
          setLoading(false);
          setError('Dealer ID is required');
        }
        return;
      }

      // Prevent duplicate requests
      if (requestAttempted.current) return;
      requestAttempted.current = true;

      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }
        
        console.log(`Fetching vehicle listings for dealer: ${dealerId}`);
        
        // Try using fetch API directly to avoid potential axios issues
        const response = await fetch(`/api/listings/dealer/${dealerId}?limit=10`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update state only if the component is still mounted
        if (isMounted.current) {
          if (data && data.success) {
            const fetchedVehicles = data.data || [];
            console.log(`Successfully fetched ${fetchedVehicles.length} listings`);
            setVehicles(fetchedVehicles);
            setError(null);
            
            // IMPORTANT: Notify parent component about the count
            if (onCountUpdate && typeof onCountUpdate === 'function') {
              console.log(`Notifying parent about vehicle count: ${fetchedVehicles.length}`);
              onCountUpdate(fetchedVehicles.length);
            }
          } else {
            console.warn('API returned success:false', data);
            setVehicles([]);
            setError(data?.message || 'Failed to fetch listings');
            
            // Set count to 0 when no vehicles are found
            if (onCountUpdate && typeof onCountUpdate === 'function') {
              onCountUpdate(0);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching dealer vehicles for ${dealerId}:`, error);
        
        // Try an alternative endpoint as fallback
        try {
          console.log('Trying alternative endpoint');
          const alternativeResponse = await fetch(`/listings/dealer/${dealerId}?limit=10`);
          
          if (alternativeResponse.ok) {
            const alternativeData = await alternativeResponse.json();
            
            if (isMounted.current) {
              if (alternativeData && alternativeData.success) {
                const fetchedVehicles = alternativeData.data || [];
                console.log(`Successfully fetched ${fetchedVehicles.length} listings with alternative endpoint`);
                setVehicles(fetchedVehicles);
                setError(null);
                
                // IMPORTANT: Notify parent component about the count with the alternative data
                if (onCountUpdate && typeof onCountUpdate === 'function') {
                  console.log(`Notifying parent about vehicle count (alternative): ${fetchedVehicles.length}`);
                  onCountUpdate(fetchedVehicles.length);
                }
                
                return;
              }
            }
          }
          
          // If we reach here, both attempts failed
          if (isMounted.current) {
            setError('Could not load vehicles');
            setVehicles([]);
            
            // Set count to 0 when no vehicles are found
            if (onCountUpdate && typeof onCountUpdate === 'function') {
              onCountUpdate(0);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
          if (isMounted.current) {
            setError('Could not load vehicles');
            setVehicles([]);
            
            // Set count to 0 when no vehicles are found
            if (onCountUpdate && typeof onCountUpdate === 'function') {
              onCountUpdate(0);
            }
          }
        }
      } finally {
        // Update state only if the component is still mounted
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();
  }, [dealerId, onCountUpdate]);

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

  // Handle click on a vehicle item
  const handleVehicleClick = (vehicle) => {
    if (!vehicle || !vehicle._id) return;
    navigate(`/marketplace/${vehicle._id}`);
  };

  // Helper function to get the image URL safely
  const getVehicleImageUrl = (vehicle) => {
    if (!vehicle) return '/images/placeholders/car.jpg';
    
    try {
      if (vehicle.images && vehicle.images.length > 0) {
        if (typeof vehicle.images[0] === 'string') {
          return vehicle.images[0];
        } else if (vehicle.images[0].url) {
          return vehicle.images[0].url;
        }
      }
      
      // If we couldn't find an image or the structure is unexpected, use placeholder
      return '/images/placeholders/car.jpg';
    } catch (e) {
      console.error('Error extracting vehicle image URL:', e);
      return '/images/placeholders/car.jpg';
    }
  };

  // Format price for display
  const formatPrice = (price, priceOptions) => {
    if (priceOptions?.showPriceAsPOA) return 'POA';
    return `P ${price?.toLocaleString() || '0'}`;
  };

  // If empty and no error/loading state, don't render at all
  if (!loading && !error && vehicles.length === 0) {
    return null;
  }

  return (
    <div className="bcc-dealership-gallery">
      <div className="bcc-gallery-header">
        <h3 className="bcc-gallery-title">Featured Vehicles</h3>
        {vehicles.length > 0 && (
          <span className="bcc-gallery-count">{vehicles.length} vehicles</span>
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
        ) : vehicles.length === 0 ? (
          <div className="bcc-gallery-empty">
            <p>No vehicles available</p>
          </div>
        ) : (
          <>
            <div className="bcc-gallery-scroll" ref={galleryRef}>
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="bcc-gallery-item"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div className="bcc-gallery-image">
                    <img
                      src={getVehicleImageUrl(vehicle)}
                      alt={vehicle.title || 'Vehicle'}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholders/car.jpg';
                      }}
                    />
                  </div>
                  <div className="bcc-gallery-overlay">
                    <p className="bcc-gallery-price">
                      {formatPrice(vehicle.price, vehicle.priceOptions)}
                    </p>
                    <p className="bcc-gallery-title">
                      {vehicle.title || 'Untitled Vehicle'}
                    </p>
                    <p className="bcc-gallery-specs">
                      {vehicle.specifications?.year || ''} {vehicle.specifications?.make || ''} {vehicle.specifications?.model || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {vehicles.length > 2 && (
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

export default DealershipVehicleGallery;