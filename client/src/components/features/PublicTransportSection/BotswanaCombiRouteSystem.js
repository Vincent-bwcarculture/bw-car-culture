// client/src/components/features/PublicTransportSection/BotswanaCombiRouteSystem.js
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Navigation, Users, Phone, Car } from 'lucide-react';
import './BotswanaCombiRouteSystem.css';

const BotswanaCombiRouteSystem = ({ routes }) => {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [groupedRoutes, setGroupedRoutes] = useState({});

  // Group routes by destination
  useEffect(() => {
    const grouped = {};
    routes.forEach((route) => {
      const destination = route.destination;
      if (!grouped[destination]) {
        grouped[destination] = [];
      }
      grouped[destination].push(route);
    });
    setGroupedRoutes(grouped);
  }, [routes]);

  const formatFare = (fare) => {
    if (!fare) return 'Call for price';
    return `P ${fare}`;
  };

  const getVehicleIcon = (serviceType) => {
    switch (serviceType) {
      case 'combi':
        return '🚐';
      case 'taxi':
        return '🚕';
      case 'bus':
        return '🚌';
      default:
        return '🚐';
    }
  };

  const getRouteStatus = (route) => {
    if (route.operationType === 'on_demand') return 'Available';
    if (route.operationType === 'scheduled') return 'Scheduled';
    return route.status || 'Available';
  };

  return (
    <div className="botswana-combi-system">
      <div className="system-header">
        <h2>Botswana Transport Routes</h2>
        <p>Find combies and taxis to your destination - Different routes, same destination</p>
      </div>

      {/* Destination Grid */}
      <div className="destinations-grid">
        {Object.keys(groupedRoutes).map((destination) => (
          <div 
            key={destination}
            className={`destination-card ${selectedDestination === destination ? 'selected' : ''}`}
            onClick={() => setSelectedDestination(
              selectedDestination === destination ? null : destination
            )}
          >
            <div className="destination-header">
              <h3>{destination}</h3>
              <div className="route-count">
                {groupedRoutes[destination].length} route{groupedRoutes[destination].length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="destination-preview">
              <div className="vehicle-types">
                {[...new Set(groupedRoutes[destination].map(r => r.serviceType || 'combi'))].map(type => (
                  <span key={type} className="vehicle-type">
                    {getVehicleIcon(type)} {type}
                  </span>
                ))}
              </div>
              
              <div className="fare-range">
                {(() => {
                  const fares = groupedRoutes[destination]
                    .map(r => r.fare || r.pricing?.baseFare)
                    .filter(f => f)
                    .sort((a, b) => a - b);
                  
                  if (fares.length === 0) return 'Call for prices';
                  if (fares.length === 1) return `P ${fares[0]}`;
                  return `P ${fares[0]} - P ${fares[fares.length - 1]}`;
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Route Details */}
      {selectedDestination && (
        <div className="route-details-section">
          <div className="route-details-header">
            <h3>Routes to {selectedDestination}</h3>
            <p>Choose your preferred route and stops</p>
          </div>

          <div className="routes-list">
            {groupedRoutes[selectedDestination].map((route, index) => (
              <div key={route._id || index} className="route-card">
                <div className="route-card-header">
                  <div className="route-info">
                    <div className="route-title">
                      <span className="vehicle-icon">
                        {getVehicleIcon(route.serviceType || 'combi')}
                      </span>
                      <div className="route-name-section">
                        <h4>{route.routeName || `Route ${index + 1}`}</h4>
                        <div className="route-path">
                          <span className="origin">{route.origin}</span>
                          <Navigation className="route-arrow" />
                          <span className="destination">{route.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="route-status">
                      <span className={`status-indicator ${getRouteStatus(route).toLowerCase()}`}>
                        {getRouteStatus(route)}
                      </span>
                    </div>
                  </div>

                  <div className="route-pricing">
                    <div className="fare">
                      <DollarSign className="fare-icon" />
                      <span className="fare-amount">
                        {formatFare(route.fare || route.pricing?.baseFare)}
                      </span>
                    </div>
                    {route.operationType !== 'on_demand' && (
                      <div className="frequency">
                        <Clock className="frequency-icon" />
                        <span>{route.schedule?.frequency || 'As needed'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="route-card-body">
                  {/* Operator Info */}
                  <div className="operator-info">
                    <div className="operator-details">
                      <strong>{route.operatorName || 'Unknown Operator'}</strong>
                      <span className="operator-type">
                        {route.operatorType === 'individual' ? 'Individual' : 'Company'}
                      </span>
                    </div>
                    {route.contact?.phone && (
                      <div className="operator-contact">
                        <Phone className="contact-icon" />
                        <span>{route.contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Route Stops */}
                  <div className="route-stops">
                    <h5>Stops along this route:</h5>
                    <div className="stops-path">
                      {/* Starting Point */}
                      <div className="stop-item origin-stop">
                        <div className="stop-marker"></div>
                        <span className="stop-name">{route.origin}</span>
                      </div>

                      {/* Intermediate Stops */}
                      {route.stops && route.stops.map((stop, stopIndex) => (
                        <div key={stopIndex} className="stop-item">
                          <div className="stop-connector"></div>
                          <div className="stop-marker"></div>
                          <span className="stop-name">
                            {typeof stop === 'string' ? stop : stop.name}
                          </span>
                          {stop.fare && (
                            <span className="stop-fare">P {stop.fare}</span>
                          )}
                        </div>
                      ))}

                      {/* Destination */}
                      <div className="stop-item destination-stop">
                        <div className="stop-connector"></div>
                        <div className="stop-marker"></div>
                        <span className="stop-name">{route.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="vehicle-info">
                    <div className="vehicle-details">
                      <Car className="vehicle-icon-small" />
                      <div className="vehicle-specs">
                        <span className="vehicle-type">
                          {route.serviceType || 'Combi'} 
                          {route.vehicleInfo?.capacity && ` (${route.vehicleInfo.capacity} seats)`}
                        </span>
                        {route.vehicleInfo?.amenities && route.vehicleInfo.amenities.length > 0 && (
                          <span className="amenities">
                            {route.vehicleInfo.amenities.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="operating-hours">
                    <Clock className="hours-icon" />
                    <div className="hours-info">
                      <span className="hours-label">Operating Hours:</span>
                      <span className="hours-time">
                        {route.schedule?.startTime || '05:00'} - {route.schedule?.endTime || '22:00'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="route-actions">
                    <button className="action-btn primary">
                      <Phone className="btn-icon" />
                      Call Operator
                    </button>
                    <button className="action-btn secondary">
                      <MapPin className="btn-icon" />
                      View Route
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Destinations */}
      <div className="popular-destinations">
        <h3>Popular Destinations</h3>
        <div className="popular-grid">
          {Object.entries(groupedRoutes)
            .sort(([,a], [,b]) => b.length - a.length)
            .slice(0, 6)
            .map(([destination, routes]) => (
              <div 
                key={destination}
                className="popular-destination-card"
                onClick={() => setSelectedDestination(destination)}
              >
                <div className="popular-destination-name">{destination}</div>
                <div className="popular-destination-info">
                  <span className="route-count">{routes.length} routes</span>
                  <span className="vehicle-count">
                    {routes.reduce((sum, r) => sum + (r.vehicleInfo?.fleetSize || 1), 0)} vehicles
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="transport-tips">
        <h3>Transport Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">🚐</div>
            <div className="tip-content">
              <h4>Combis</h4>
              <p>Minibus taxis that follow set routes. Usually cheaper and more frequent than buses.</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🚕</div>
            <div className="tip-content">
              <h4>Taxis</h4>
              <p>Can take custom routes to your destination. More expensive but more flexible.</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📞</div>
            <div className="tip-content">
              <h4>Booking</h4>
              <p>Call operators directly to confirm availability and current prices.</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <div className="tip-content">
              <h4>Pricing</h4>
              <p>Prices may vary based on time of day, demand, and route taken.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotswanaCombiRouteSystem;
