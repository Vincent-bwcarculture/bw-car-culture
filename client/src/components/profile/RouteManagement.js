// client/src/components/profile/RouteManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Route, Plus, Edit2, Trash2, MapPin, Clock, Settings, Car,
  DollarSign, Users, Phone, Check, X, Navigation,
  Calendar, Star, Eye, Save, AlertCircle, Activity,
  ArrowRight, Map, Zap, Timer
} from 'lucide-react';
import axios from '../../config/axios.js';
import './RouteManagement.css';

const RouteManagement = ({ profileData, refreshProfile, setActiveTab }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeFormData, setRouteFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get transport services for the user
  const transportServices = profileData?.businessProfile?.services?.filter(
    s => s.serviceType === 'public_transport'
  ) || [];

  useEffect(() => {
    if (transportServices.length > 0) {
      fetchUserRoutes();
    }
  }, [profileData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchUserRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile/routes');
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeRouteForm = (route = null) => {
    setRouteFormData({
      routeName: route?.routeName || '',
      routeNumber: route?.routeNumber || '',
      serviceType: route?.serviceType || (transportServices[0]?.businessType || 'taxi'),
      
      origin: {
        name: route?.origin?.name || '',
        address: route?.origin?.address || '',
        coordinates: route?.origin?.coordinates || { lat: 0, lng: 0 }
      },
      destination: {
        name: route?.destination?.name || '',
        address: route?.destination?.address || '',
        coordinates: route?.destination?.coordinates || { lat: 0, lng: 0 }
      },
      
      stops: route?.stops || [],
      
      // Flexible scheduling for Botswana transport
      operationType: route?.operationType || 'on_demand', // on_demand, scheduled, hybrid
      schedule: {
        operatingDays: route?.schedule?.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        startTime: route?.schedule?.startTime || '05:00',
        endTime: route?.schedule?.endTime || '22:00',
        frequency: route?.schedule?.frequency || 'On demand', // "On demand", "Every 30 min", etc.
        customSchedule: route?.schedule?.customSchedule || ''
      },
      
      pricing: {
        basePrice: route?.pricing?.basePrice || '',
        pricePerKm: route?.pricing?.pricePerKm || '',
        discounts: route?.pricing?.discounts || [],
        specialRates: route?.pricing?.specialRates || []
      },
      
      vehicleInfo: {
        vehicleType: route?.vehicleInfo?.vehicleType || '',
        capacity: route?.vehicleInfo?.capacity || '',
        amenities: route?.vehicleInfo?.amenities || [],
        vehicleNumber: route?.vehicleInfo?.vehicleNumber || ''
      },
      
      operationalInfo: {
        estimatedDuration: route?.operationalInfo?.estimatedDuration || '',
        distance: route?.operationalInfo?.distance || '',
        routeCondition: route?.operationalInfo?.routeCondition || 'good',
        specialInstructions: route?.operationalInfo?.specialInstructions || ''
      },
      
      contactInfo: {
        primaryPhone: route?.contactInfo?.primaryPhone || profileData?.contactInfo?.primaryPhone || '',
        secondaryPhone: route?.contactInfo?.secondaryPhone || '',
        whatsappNumber: route?.contactInfo?.whatsappNumber || ''
      },
      
      isActive: route?.isActive !== undefined ? route.isActive : true,
      isVerified: route?.isVerified || false
    });
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const routeData = {
        ...routeFormData,
        providerId: profileData._id
      };

      let response;
      if (editingRoute) {
        response = await axios.put(`/user/profile/routes/${editingRoute._id}`, routeData);
      } else {
        response = await axios.post('/user/profile/routes', routeData);
      }

      if (response.data.success) {
        showMessage('success', editingRoute ? 'Route updated successfully!' : 'Route added successfully!');
        await fetchUserRoutes();
        setShowRouteModal(false);
        setEditingRoute(null);
        setRouteFormData({});
        if (refreshProfile) {
          refreshProfile();
        }
      }
    } catch (error) {
      console.error('Error saving route:', error);
      showMessage('error', error.response?.data?.message || 'Error saving route');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    initializeRouteForm(route);
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`/user/profile/routes/${routeId}`);
      
      if (response.data.success) {
        showMessage('success', 'Route deleted successfully!');
        await fetchUserRoutes();
        if (refreshProfile) {
          refreshProfile();
        }
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      showMessage('error', 'Error deleting route');
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteStatus = async (route) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/user/profile/routes/${route._id}/status`, {
        isActive: !route.isActive
      });
      
      if (response.data.success) {
        showMessage('success', `Route ${!route.isActive ? 'activated' : 'deactivated'} successfully!`);
        await fetchUserRoutes();
        if (refreshProfile) {
          refreshProfile();
        }
      }
    } catch (error) {
      console.error('Error updating route status:', error);
      showMessage('error', 'Error updating route status');
    } finally {
      setLoading(false);
    }
  };

  // Service registration redirect
  const handleRegisterService = () => {
    if (setActiveTab) {
      setActiveTab('services');
    }
  };

  // Check if user has transport services
  if (transportServices.length === 0) {
    return (
      <div className="rmanage-main-container">
        <div className="rmanage-no-service-state">
          <Settings size={48} />
          <h3>No Transport Service Registered</h3>
          <p>You need to register a transport service before you can manage routes.</p>
          <button 
            className="rmanage-register-service-btn"
            onClick={handleRegisterService}
          >
            <Plus size={16} />
            Register Transport Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rmanage-main-container">
      {/* Message Display */}
      {message.text && (
        <div className={`rmanage-message rmanage-message-${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.type === 'info' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Header Section */}
      <div className="rmanage-header-section">
        <div className="rmanage-section-header">
          <h2 className="rmanage-section-title">
            <Route size={24} />
            Route Management
          </h2>
          <button 
            className="rmanage-add-route-btn"
            onClick={() => {
              initializeRouteForm();
              setShowRouteModal(true);
            }}
          >
            <Plus size={16} />
            Add New Route
          </button>
        </div>

        {/* Service Info */}
        <div className="rmanage-service-info">
          <p>Managing routes for your transport services</p>
          <div className="rmanage-service-badges">
            {transportServices.map((service, index) => (
              <div key={index} className="rmanage-service-badge">
                <Car size={12} />
                {service.businessType || 'Transport Service'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routes Section */}
      <div className="rmanage-routes-section">
        <div className="rmanage-section-header">
          <h3 className="rmanage-section-title">
            <Map size={20} />
            Your Routes ({routes.length})
          </h3>
        </div>

        {routes.length === 0 ? (
          <div className="rmanage-empty-state">
            <Route size={48} />
            <h3>No Routes Added Yet</h3>
            <p>Start by adding your first transport route to help customers find your services.</p>
            <button 
              className="rmanage-add-first-route-btn"
              onClick={() => {
                initializeRouteForm();
                setShowRouteModal(true);
              }}
            >
              <Plus size={16} />
              Add Your First Route
            </button>
          </div>
        ) : (
          <div className="rmanage-routes-grid">
            {routes.map((route) => (
              <div key={route._id} className="rmanage-route-card">
                {/* Route Header */}
                <div className="rmanage-route-header">
                  <div className="rmanage-route-title-section">
                    <h4 className="rmanage-route-title">
                      <Navigation size={18} />
                      {route.routeName}
                      {route.routeNumber && (
                        <span className="rmanage-route-number">#{route.routeNumber}</span>
                      )}
                    </h4>
                    
                    <div className="rmanage-route-badges">
                      <span className={`rmanage-operation-badge rmanage-blue`}>
                        {route.operationType?.replace('_', ' ') || 'On Demand'}
                      </span>
                      
                      {route.isVerified && (
                        <span className="rmanage-verified-badge">
                          <Check size={10} />
                          Verified
                        </span>
                      )}
                      
                      <span className={`rmanage-status-badge ${route.isActive ? 'active' : 'inactive'}`}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="rmanage-route-actions">
                    <button 
                      className="rmanage-route-action-btn rmanage-edit-btn"
                      onClick={() => handleEditRoute(route)}
                      title="Edit Route"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="rmanage-route-action-btn rmanage-delete-btn"
                      onClick={() => handleDeleteRoute(route._id)}
                      title="Delete Route"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Route Content */}
                <div className="rmanage-route-content">
                  {/* Route Path */}
                  <div className="rmanage-route-path">
                    <div className="rmanage-location">
                      <MapPin className="rmanage-origin-icon" size={16} />
                      <div className="rmanage-location-info">
                        <div className="rmanage-location-name">{route.origin?.name}</div>
                        {route.origin?.address && (
                          <div className="rmanage-location-address">{route.origin.address}</div>
                        )}
                      </div>
                    </div>
                    
                    <ArrowRight className="rmanage-route-arrow" size={16} />
                    
                    <div className="rmanage-location">
                      <MapPin className="rmanage-destination-icon" size={16} />
                      <div className="rmanage-location-info">
                        <div className="rmanage-location-name">{route.destination?.name}</div>
                        {route.destination?.address && (
                          <div className="rmanage-location-address">{route.destination.address}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="rmanage-route-details">
                    {route.pricing?.basePrice && (
                      <div className="rmanage-detail-item">
                        <DollarSign size={14} />
                        <span>P{route.pricing.basePrice}</span>
                      </div>
                    )}
                    
                    {route.schedule?.operatingDays && (
                      <div className="rmanage-detail-item">
                        <Calendar size={14} />
                        <span>{route.schedule.operatingDays.length} days/week</span>
                      </div>
                    )}
                    
                    {route.contactInfo?.primaryPhone && (
                      <div className="rmanage-detail-item">
                        <Phone size={14} />
                        <span>{route.contactInfo.primaryPhone}</span>
                      </div>
                    )}
                    
                    {route.vehicleInfo?.capacity && (
                      <div className="rmanage-detail-item">
                        <Users size={14} />
                        <span>{route.vehicleInfo.capacity} passengers</span>
                      </div>
                    )}
                    
                    {route.estimatedDuration && (
                      <div className="rmanage-detail-item">
                        <Timer size={14} />
                        <span>{route.estimatedDuration}</span>
                      </div>
                    )}
                  </div>

                  {/* Route Stats */}
                  {route.analytics && (
                    <div className="rmanage-route-stats">
                      <div className="rmanage-stat-item">
                        <Eye size={12} />
                        <span>{route.analytics.views || 0} views</span>
                      </div>
                      <div className="rmanage-stat-item">
                        <Star size={12} />
                        <span>{(route.analytics.rating || 0).toFixed(1)}/5</span>
                      </div>
                      <div className="rmanage-stat-item">
                        <Activity size={12} />
                        <span>{route.analytics.bookings || 0} bookings</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="rmanage-route-quick-actions">
                    <button 
                      className={`rmanage-quick-action-btn ${route.isActive ? 'rmanage-deactivate-btn' : 'rmanage-activate-btn'}`}
                      onClick={() => toggleRouteStatus(route)}
                    >
                      <Zap size={14} />
                      {route.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="rmanage-quick-action-btn rmanage-view-btn"
                      onClick={() => {/* Handle view route details */}}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="rmanage-modal-overlay">
          <div className="rmanage-modal">
            <div className="rmanage-modal-header">
              <h3>{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
              <button 
                className="rmanage-close-modal-btn"
                onClick={() => {
                  setShowRouteModal(false);
                  setEditingRoute(null);
                  setRouteFormData({});
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="rmanage-modal-form">
              <div className="rmanage-form-section">
                <h4>Basic Information</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Route Name *</label>
                    <input
                      type="text"
                      className="rmanage-form-input"
                      value={routeFormData.routeName || ''}
                      onChange={(e) => setRouteFormData(prev => ({ ...prev, routeName: e.target.value }))}
                      placeholder="e.g., Gaborone to Molepolole"
                      required
                    />
                  </div>
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Route Number</label>
                    <input
                      type="text"
                      className="rmanage-form-input"
                      value={routeFormData.routeNumber || ''}
                      onChange={(e) => setRouteFormData(prev => ({ ...prev, routeNumber: e.target.value }))}
                      placeholder="e.g., R001"
                    />
                  </div>
                </div>
              </div>

              <div className="rmanage-form-section">
                <h4>Route Details</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Origin *</label>
                    <input
                      type="text"
                      className="rmanage-form-input"
                      value={routeFormData.origin?.name || ''}
                      onChange={(e) => setRouteFormData(prev => ({ 
                        ...prev, 
                        origin: { ...prev.origin, name: e.target.value } 
                      }))}
                      placeholder="Starting point"
                      required
                    />
                  </div>
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Destination *</label>
                    <input
                      type="text"
                      className="rmanage-form-input"
                      value={routeFormData.destination?.name || ''}
                      onChange={(e) => setRouteFormData(prev => ({ 
                        ...prev, 
                        destination: { ...prev.destination, name: e.target.value } 
                      }))}
                      placeholder="End point"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rmanage-form-section">
                <h4>Schedule & Pricing</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Operation Type</label>
                    <select
                      className="rmanage-form-select"
                      value={routeFormData.operationType || 'on_demand'}
                      onChange={(e) => setRouteFormData(prev => ({ ...prev, operationType: e.target.value }))}
                    >
                      <option value="on_demand">On Demand</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="rmanage-form-group">
                    <label className="rmanage-form-label">Base Price (BWP)</label>
                    <input
                      type="number"
                      className="rmanage-form-input"
                      value={routeFormData.pricing?.basePrice || ''}
                      onChange={(e) => setRouteFormData(prev => ({ 
                        ...prev, 
                        pricing: { ...prev.pricing, basePrice: e.target.value } 
                      }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="rmanage-form-actions">
                <button 
                  type="button"
                  className="rmanage-btn rmanage-btn-secondary"
                  onClick={() => setShowRouteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rmanage-btn rmanage-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : editingRoute ? 'Update Route' : 'Add Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="rmanage-loading-overlay">
          <div className="rmanage-loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
