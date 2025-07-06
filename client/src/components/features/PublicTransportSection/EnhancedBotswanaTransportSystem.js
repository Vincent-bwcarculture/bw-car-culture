// client/src/components/features/PublicTransportSection/EnhancedBotswanaTransportSystem.js
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, DollarSign, Navigation, Users, Phone, Car, 
  BookOpen, UserCheck, AlertCircle, Star, CheckCircle, Timer,
  Zap, CreditCard, MapPinIcon
} from 'lucide-react';
import './EnhancedBotswanaTransportSystem.css';

const EnhancedBotswanaTransportSystem = ({ routes, coordinators = [] }) => {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [groupedRoutes, setGroupedRoutes] = useState({});
  const [stationCoordinators, setStationCoordinators] = useState({});

  // Group routes by destination and organize coordinators by station
  useEffect(() => {
    const grouped = {};
    const coordsByStation = {};
    
    routes.forEach((route) => {
      const destination = route.destination;
      if (!grouped[destination]) {
        grouped[destination] = {
          routes: [],
          stations: new Set()
        };
      }
      grouped[destination].routes.push(route);
      
      // Add loading stations
      if (route.loadingStation) {
        grouped[destination].stations.add(route.loadingStation);
      }
    });

    // Group coordinators by station
    coordinators.forEach((coordinator) => {
      coordinator.stations?.forEach((station) => {
        if (!coordsByStation[station]) {
          coordsByStation[station] = [];
        }
        coordsByStation[station].push(coordinator);
      });
    });

    setGroupedRoutes(grouped);
    setStationCoordinators(coordsByStation);
  }, [routes, coordinators]);

  const formatFare = (route) => {
    const baseFare = route.fare || route.pricing?.baseFare || 0;
    const serviceType = route.serviceType || 'combi';
    
    if (serviceType === 'taxi') {
      return {
        regular: `P ${baseFare}`,
        special: `P ${Math.round(baseFare * 1.5)} - P ${Math.round(baseFare * 2)}`,
        hasSpecial: true
      };
    }
    
    return {
      regular: `P ${baseFare}`,
      special: null,
      hasSpecial: false
    };
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

  const getCoordinatorForRoute = (route) => {
    const station = route.loadingStation;
    if (!station || !stationCoordinators[station]) return null;
    return stationCoordinators[station][0]; // Return first coordinator for the station
  };

  const getPriorityStatus = (route) => {
    const coordinator = getCoordinatorForRoute(route);
    if (!coordinator) return 'No coordinator';
    
    // Mock priority system - in real app, this would come from coordinator's queue
    const mockPriority = Math.floor(Math.random() * 5) + 1;
    return `Queue position: ${mockPriority}`;
  };

  return (
    <div className="enhanced-botswana-transport">
      <div className="transport-header">
        <h2>🇧🇼 Botswana Transport Network</h2>
        <p>Combies, Taxis & Coordinators - Your complete transport solution</p>
      </div>

      {/* Destinations Grid */}
      <div className="destinations-grid">
        {Object.entries(groupedRoutes).map(([destination, data]) => (
          <div 
            key={destination}
            className={`destination-card ${selectedDestination === destination ? 'selected' : ''}`}
            onClick={() => setSelectedDestination(
              selectedDestination === destination ? null : destination
            )}
          >
            <div className="destination-header">
              <div className="destination-info">
                <h3>{destination}</h3>
                <div className="destination-meta">
                  <span className="route-count">
                    {data.routes.length} route{data.routes.length !== 1 ? 's' : ''}
                  </span>
                  <span className="station-count">
                    {data.stations.size} station{data.stations.size !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {/* Coordinator indicator */}
              {data.stations.size > 0 && (
                <div className="coordinator-indicator">
                  <BookOpen className="coordinator-icon" />
                  <span className="coordinator-count">
                    {[...data.stations].reduce((count, station) => 
                      count + (stationCoordinators[station]?.length || 0), 0
                    )} coordinators
                  </span>
                </div>
              )}
            </div>
            
            <div className="destination-preview">
              <div className="vehicle-summary">
                {[...new Set(data.routes.map(r => r.serviceType || 'combi'))].map(type => (
                  <span key={type} className="vehicle-type">
                    {getVehicleIcon(type)} {type}
                  </span>
                ))}
              </div>
              
              <div className="fare-summary">
                {(() => {
                  const combiFares = data.routes.filter(r => r.serviceType === 'combi').map(r => r.fare || r.pricing?.baseFare).filter(f => f);
                  const taxiFares = data.routes.filter(r => r.serviceType === 'taxi').map(r => r.fare || r.pricing?.baseFare).filter(f => f);
                  
                  let fareText = '';
                  if (combiFares.length > 0) {
                    fareText += `Combi: P ${Math.min(...combiFares)}`;
                  }
                  if (taxiFares.length > 0) {
                    if (fareText) fareText += ' | ';
                    fareText += `Taxi: P ${Math.min(...taxiFares)}+`;
                  }
                  
                  return fareText || 'Call for prices';
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
            <p>Choose your transport option and check loading stations</p>
          </div>

          {/* Loading Stations */}
          {[...groupedRoutes[selectedDestination].stations].map((station) => (
            <div key={station} className="loading-station-section">
              <div className="station-header">
                <div className="station-info">
                  <MapPinIcon className="station-icon" />
                  <div>
                    <h4>{station}</h4>
                    <p className="station-description">Major loading station</p>
                  </div>
                </div>
                
                {/* Station Coordinators */}
                {stationCoordinators[station] && (
                  <div className="station-coordinators">
                    <h5>Station Coordinators</h5>
                    <div className="coordinators-list">
                      {stationCoordinators[station].map((coordinator, idx) => (
                        <div key={idx} className="coordinator-card">
                          <div className="coordinator-avatar">
                            <UserCheck className="coordinator-icon" />
                          </div>
                          <div className="coordinator-info">
                            <div className="coordinator-name">{coordinator.name}</div>
                            <div className="coordinator-details">
                              <span className="coordinator-experience">
                                {coordinator.experience || 5} years experience
                              </span>
                              <span className="coordinator-rating">
                                <Star className="star-icon" />
                                {coordinator.rating || 4.5}
                              </span>
                            </div>
                            <div className="coordinator-contact">
                              <Phone className="contact-icon" />
                              <span>{coordinator.phone}</span>
                            </div>
                          </div>
                          <div className="coordinator-status">
                            <div className={`status-dot ${coordinator.status || 'active'}`}></div>
                            <span className="status-text">
                              {coordinator.status === 'active' ? 'On Duty' : 'Off Duty'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Routes from this station */}
              <div className="station-routes">
                {groupedRoutes[selectedDestination].routes
                  .filter(route => route.loadingStation === station)
                  .map((route, index) => (
                    <div key={route._id || index} className="enhanced-route-card">
                      <div className="route-card-header">
                        <div className="route-info">
                          <div className="route-title">
                            <span className="vehicle-icon">
                              {getVehicleIcon(route.serviceType || 'combi')}
                            </span>
                            <div className="route-details">
                              <h4>{route.routeName || `${route.serviceType} Route ${index + 1}`}</h4>
                              <div className="route-path">
                                <span className="origin">{route.origin}</span>
                                <Navigation className="route-arrow" />
                                <span className="destination">{route.destination}</span>
                              </div>
                              <div className="operator-info">
                                <span className="operator-name">{route.operatorName}</span>
                                <span className="operator-type">({route.operatorType})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="pricing-section">
                          <div className="government-pricing">
                            <div className="price-type">
                              <span className="price-label">Government Rate</span>
                              <span className="price-value">{formatFare(route).regular}</span>
                            </div>
                            {formatFare(route).hasSpecial && (
                              <div className="price-type special">
                                <span className="price-label">
                                  <Zap className="special-icon" />
                                  Special Rate
                                </span>
                                <span className="price-value">{formatFare(route).special}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="route-card-body">
                        {/* Queue Status */}
                        <div className="queue-status">
                          <div className="queue-info">
                            <Timer className="queue-icon" />
                            <span className="queue-text">{getPriorityStatus(route)}</span>
                          </div>
                          <div className="loading-status">
                            <div className="status-indicator loading">
                              <div className="status-dot"></div>
                              <span>Loading now</span>
                            </div>
                          </div>
                        </div>

                        {/* Route Stops */}
                        <div className="route-stops">
                          <h5>Stops on this route:</h5>
                          <div className="stops-list">
                            <div className="stop-item origin">
                              <div className="stop-marker"></div>
                              <span className="stop-name">{route.origin}</span>
                            </div>
                            {route.stops && route.stops.map((stop, stopIndex) => (
                              <div key={stopIndex} className="stop-item">
                                <div className="stop-connector"></div>
                                <div className="stop-marker"></div>
                                <span className="stop-name">
                                  {typeof stop === 'string' ? stop : stop.name}
                                </span>
                              </div>
                            ))}
                            <div className="stop-item destination">
                              <div className="stop-connector"></div>
                              <div className="stop-marker"></div>
                              <span className="stop-name">{route.destination}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="route-actions">
                          <button className="action-btn primary">
                            <Phone className="btn-icon" />
                            Call Operator
                          </button>
                          {getCoordinatorForRoute(route) && (
                            <button className="action-btn secondary">
                              <BookOpen className="btn-icon" />
                              Contact Coordinator
                            </button>
                          )}
                          {route.serviceType === 'taxi' && (
                            <button className="action-btn special">
                              <Zap className="btn-icon" />
                              Request Special
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transport Information */}
      <div className="transport-info-section">
        <h3>Understanding Botswana Transport</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🚐</div>
            <div className="info-content">
              <h4>Combis</h4>
              <p>Minibus taxis with fixed government rates. Follow set routes with regular stops.</p>
              <div className="info-detail">
                <CreditCard className="detail-icon" />
                <span>Fixed pricing by government</span>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">🚕</div>
            <div className="info-content">
              <h4>Taxis</h4>
              <p>Can offer "special" rates for individual destinations when you're in a hurry.</p>
              <div className="info-detail">
                <Zap className="detail-icon" />
                <span>Regular + Special rates available</span>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">📖</div>
            <div className="info-content">
              <h4>Coordinators</h4>
              <p>Manage loading queues at major stations. They track which vehicle loads next.</p>
              <div className="info-detail">
                <BookOpen className="detail-icon" />
                <span>Digital queue management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBotswanaTransportSystem;
