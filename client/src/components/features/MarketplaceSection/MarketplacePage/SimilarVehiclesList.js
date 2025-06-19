// DEBUG VERSION: Replace your SimilarVehiclesList.js with this temporarily
// This will help us see what's happening

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../../../services/listingService';
import './SimilarVehiclesList.css';

const SimilarVehiclesList = ({ currentCar, isPrivateSeller = false }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(true); // Force debug mode
  const [animatingItems, setAnimatingItems] = useState([]);
  const navigate = useNavigate();

  console.log('🔍 SimilarVehiclesList DEBUG:', {
    currentCar: currentCar?.title || 'No car',
    isPrivateSeller,
    debugMode,
    componentMounted: true
  });

  useEffect(() => {
    console.log('🔍 Component mounted, starting data fetch...');
    
    const fetchSimilarVehicles = async () => {
      console.log('🔍 fetchSimilarVehicles called');
      
      if (!currentCar && !debugMode) {
        console.log('❌ No currentCar and not in debug mode');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // First, let's test with mock data to verify the component renders
        const testVehicles = [
          {
            _id: 'test1',
            title: '2022 Toyota Camry SE',
            price: 250000,
            specifications: {
              year: 2022,
              make: 'Toyota',
              model: 'Camry',
              mileage: 15000,
              transmission: 'Automatic',
              fuelType: 'Petrol'
            },
            condition: 'used',
            status: 'active',
            dealerId: currentCar?.dealerId || 'same-dealer-id'
          },
          {
            _id: 'test2', 
            title: '2023 Honda Civic LX',
            price: 280000,
            specifications: {
              year: 2023,
              make: 'Honda', 
              model: 'Civic',
              mileage: 8000,
              transmission: 'CVT',
              fuelType: 'Petrol'
            },
            condition: 'used',
            status: 'active',
            dealerId: 'different-dealer-id'
          },
          {
            _id: 'test3',
            title: '2021 BMW 3 Series',
            price: 450000,
            specifications: {
              year: 2021,
              make: 'BMW',
              model: '3 Series',
              mileage: 25000,
              transmission: 'Automatic',
              fuelType: 'Petrol'
            },
            condition: 'used',
            status: 'active',
            dealerId: currentCar?.dealerId || 'same-dealer-id'
          }
        ];
        
        console.log('🔍 Setting test vehicles:', testVehicles);
        setVehicles(testVehicles);
        
        // Start fade-in animation
        setTimeout(() => {
          testVehicles.forEach((_, index) => {
            setTimeout(() => {
              setAnimatingItems(prev => [...prev, index]);
            }, index * 150);
          });
        }, 200);
        
        console.log('✅ Test data loaded successfully');
        
      } catch (error) {
        console.error('❌ Error in fetchSimilarVehicles:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarVehicles();
  }, [currentCar, debugMode]);

  // Extract dealer ID for testing
  const extractDealerId = () => {
    if (!currentCar) return 'test-dealer-id';
    
    if (typeof currentCar.dealerId === 'string') return currentCar.dealerId;
    if (currentCar.dealerId?._id) return currentCar.dealerId._id;
    if (currentCar.dealer?._id) return currentCar.dealer._id;
    
    return 'test-dealer-id';
  };

  const handleVehicleClick = (vehicle) => {
    console.log('🔍 Vehicle clicked:', vehicle.title);
    if (debugMode) {
      alert(`Debug: Would navigate to vehicle ${vehicle.title}`);
    } else {
      navigate(`/cars/${vehicle._id || vehicle.id}`);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact for Price';
    return `P${price.toLocaleString()}`;
  };

  console.log('🔍 Render state:', {
    vehicles: vehicles.length,
    loading,
    error,
    debugMode,
    shouldShow: debugMode || vehicles.length > 0
  });

  // Force show in debug mode
  if (debugMode || vehicles.length > 0) {
    const dealerId = extractDealerId();
    const dealerVehiclesCount = vehicles.filter(v => {
      const vehicleDealerId = v.dealerId;
      return vehicleDealerId === dealerId;
    }).length;

    return (
      <div className={`similar-vehicles-list ${debugMode ? 'debug' : ''}`}>
        {debugMode && (
          <div style={{ 
            background: '#ff9800', 
            color: '#000', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            🔧 DEBUG MODE: Component is visible! Current car: {currentCar?.title || 'No car'}
            <br />
            Screen width: {window.innerWidth}px (needs to be ≥968px to show normally)
            <br />
            Vehicles loaded: {vehicles.length}
          </div>
        )}
        
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
            {debugMode && <span style={{color: '#ff9800'}}> [DEBUG]</span>}
          </h3>
          <div className="vehicle-count">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="similar-vehicles-items">
          {vehicles.map((vehicle, index) => {
            const isFromSameDealer = vehicle.dealerId === dealerId;
            
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
              onClick={(e) => {
                e.stopPropagation();
                if (debugMode) {
                  alert(`Debug: Would navigate to dealer ${dealerId}`);
                } else {
                  navigate(`/dealerships/${dealerId}`);
                }
              }}
            >
              View all from {isPrivateSeller ? 'this seller' : 'this dealer'}
            </button>
          </div>
        )}
        
        {debugMode && (
          <div style={{ 
            background: '#4caf50', 
            color: '#000', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '10px',
            fontSize: '12px'
          }}>
            ✅ Component rendered successfully! 
            <br />
            Dealer ID: {dealerId}
            <br />
            Same dealer vehicles: {dealerVehiclesCount}
            <br />
            Total vehicles: {vehicles.length}
          </div>
        )}
      </div>
    );
  }

  // If not in debug mode and no vehicles, don't render
  return null;
};

export default SimilarVehiclesList;
