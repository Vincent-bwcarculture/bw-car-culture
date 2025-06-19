// client/src/components/features/MarketplaceSection/MarketplacePage/SimilarVehiclesList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../../../services/listingService';
import './SimilarVehiclesList.css';

const SimilarVehiclesList = ({ currentCar, isPrivateSeller = false }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatingItems, setAnimatingItems] = useState([]);
  const navigate = useNavigate();

  // Extract dealer ID from current car
  const extractDealerId = () => {
    if (!currentCar) return null;
    
    if (typeof currentCar.dealerId === 'string' && currentCar.dealerId) {
      return currentCar.dealerId;
    }
    
    if (currentCar.dealerId && typeof currentCar.dealerId === 'object') {
      if (currentCar.dealerId._id) return currentCar.dealerId._id.toString();
      if (currentCar.dealerId.id) return currentCar.dealerId.id.toString();
    }
    
    if (currentCar.dealer?._id) return currentCar.dealer._id.toString();
    if (currentCar.dealer?.id) return currentCar.dealer.id.toString();
    
    return null;
  };

  // Fetch similar vehicles
  useEffect(() => {
    const fetchSimilarVehicles = async () => {
      if (!currentCar) return;
      
      setLoading(true);
      
      try {
        const dealerId = extractDealerId();
        let dealerVehicles = [];
        let similarVehicles = [];
        
        // First priority: Get vehicles from the same dealer/seller
        if (dealerId) {
          try {
            const dealerListings = await listingService.getDealerListings(dealerId, 1, 8);
            if (dealerListings && Array.isArray(dealerListings)) {
              // Filter out current vehicle
              dealerVehicles = dealerListings.filter(vehicle => 
                vehicle._id !== currentCar._id && 
                vehicle.id !== currentCar._id &&
                vehicle.status !== 'deleted'
              ).slice(0, 5); // Limit to 5 from same dealer
            }
          } catch (error) {
            console.warn('Failed to fetch dealer vehicles:', error);
          }
        }
        
        // Second priority: Get similar vehicles if we need more
        const remainingSlots = Math.max(0, 6 - dealerVehicles.length);
        if (remainingSlots > 0) {
          try {
            // Build filters for similar vehicles
            const filters = {};
            if (currentCar.specifications?.make) {
              filters.make = currentCar.specifications.make;
            }
            if (currentCar.specifications?.model) {
              filters.model = currentCar.specifications.model;
            }
            
            const response = await listingService.getListings(filters, 1, remainingSlots + 3);
            if (response?.listings && Array.isArray(response.listings)) {
              similarVehicles = response.listings.filter(vehicle => 
                vehicle._id !== currentCar._id && 
                vehicle.id !== currentCar._id &&
                vehicle.status !== 'deleted' &&
                // Exclude vehicles already in dealer list
                !dealerVehicles.find(dv => dv._id === vehicle._id || dv.id === vehicle.id)
              ).slice(0, remainingSlots);
            }
          } catch (error) {
            console.warn('Failed to fetch similar vehicles:', error);
          }
        }
        
        // Combine and prioritize dealer vehicles first
        const combinedVehicles = [...dealerVehicles, ...similarVehicles].slice(0, 6);
        setVehicles(combinedVehicles);
        
        // Start fade-in animation
        if (combinedVehicles.length > 0) {
          setAnimatingItems([]);
          setTimeout(() => {
            combinedVehicles.forEach((_, index) => {
              setTimeout(() => {
                setAnimatingItems(prev => [...prev, index]);
              }, index * 150); // Stagger animation by 150ms
            });
          }, 100);
        }
        
      } catch (error) {
        console.error('Error fetching similar vehicles:', error);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarVehicles();
  }, [currentCar]);

  // Handle vehicle click
  const handleVehicleClick = (vehicle) => {
    navigate(`/cars/${vehicle._id || vehicle.id}`);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact for Price';
    return `P${price.toLocaleString()}`;
  };

  // Don't render if no vehicles or on mobile
  if (!vehicles.length || loading) return null;

  const dealerId = extractDealerId();
  const dealerVehiclesCount = vehicles.filter(v => {
    const vehicleDealerId = v.dealerId?._id || v.dealerId?.id || v.dealerId || v.dealer?._id || v.dealer?.id;
    return vehicleDealerId === dealerId;
  }).length;

  return (
    <div className="similar-vehicles-list">
      <div className="similar-vehicles-header">
        <h3>
          {dealerVehiclesCount > 0 ? (
            <>
              More from {isPrivateSeller ? 'this seller' : 'this dealer'}
              {vehicles.length > dealerVehiclesCount && (
                <span className="additional-similar"> • Similar vehicles</span>
              )}
            </>
          ) : (
            'Similar vehicles'
          )}
        </h3>
        <div className="vehicle-count">
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="similar-vehicles-items">
        {vehicles.map((vehicle, index) => {
          const isFromSameDealer = (() => {
            const vehicleDealerId = vehicle.dealerId?._id || vehicle.dealerId?.id || vehicle.dealerId || vehicle.dealer?._id || vehicle.dealer?.id;
            return vehicleDealerId === dealerId;
          })();
          
          return (
            <div
              key={vehicle._id || vehicle.id || index}
              className={`similar-vehicle-item ${animatingItems.includes(index) ? 'fade-in' : ''} ${isFromSameDealer ? 'same-dealer' : 'similar-make'}`}
              onClick={() => handleVehicleClick(vehicle)}
            >
              <div className="vehicle-badge">
                {isFromSameDealer ? (
                  <span className="same-dealer-badge">
                    {isPrivateSeller ? 'Same Seller' : 'Same Dealer'}
                  </span>
                ) : (
                  <span className="similar-badge">Similar</span>
                )}
              </div>
              
              <div className="vehicle-info">
                <div className="vehicle-title">
                  {vehicle.title || `${vehicle.specifications?.year || ''} ${vehicle.specifications?.make || ''} ${vehicle.specifications?.model || ''}`.trim() || 'Untitled Vehicle'}
                </div>
                
                <div className="vehicle-details">
                  <div className="vehicle-specs">
                    {vehicle.specifications?.year && (
                      <span className="spec">{vehicle.specifications.year}</span>
                    )}
                    {vehicle.specifications?.mileage && (
                      <span className="spec">{vehicle.specifications.mileage.toLocaleString()} km</span>
                    )}
                    {vehicle.specifications?.transmission && (
                      <span className="spec">{vehicle.specifications.transmission}</span>
                    )}
                    {vehicle.specifications?.fuelType && (
                      <span className="spec">{vehicle.specifications.fuelType}</span>
                    )}
                  </div>
                  
                  <div className="vehicle-price">
                    {formatPrice(vehicle.price)}
                  </div>
                </div>
                
                {vehicle.condition && (
                  <div className="vehicle-condition">
                    <span className={`condition-tag ${vehicle.condition.toLowerCase()}`}>
                      {vehicle.condition}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="view-arrow">→</div>
            </div>
          );
        })}
      </div>
      
      {dealerId && dealerVehiclesCount < vehicles.length && (
        <div className="view-all-action">
          <button 
            className="view-all-dealer"
            onClick={() => navigate(`/dealerships/${dealerId}`)}
          >
            View all from {isPrivateSeller ? 'this seller' : 'this dealer'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimilarVehiclesList;
