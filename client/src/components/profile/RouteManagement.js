// client/src/components/profile/RouteManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Route, Plus, Edit2, Trash2, MapPin, Clock, 
  DollarSign, Users, Phone, Check, X, Navigation
} from 'lucide-react';
import axios from '../../config/axios.js';

const RouteManagement = ({ profileData, refreshProfile }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeFormData, setRouteFormData] = useState({});

  // Get transport services for the user
  const transportServices = profileData?.businessProfile?.services?.filter(
    s => s.serviceType === 'public_transport'
  ) || [];

  useEffect(() => {
    if (transportServices.length > 0) {
      fetchUserRoutes();
    }
  }, [profileData]);

  const fetchUserRoutes = async () => {
    try {
      setLoading(true);
      // This would be a new endpoint to get user's routes
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
        departureTimes: route?.schedule?.departureTimes || []
      },
      
      pricing: {
        baseFare: route?.pricing?.baseFare || 0,
        currency: route?.pricing?.currency || 'BWP',
        paymentMethods: route?.pricing?.paymentMethods || ['cash'],
        discounts: route?.pricing?.discounts || {}
      },
      
      vehicleInfo: {
        vehicleType: route?.vehicleInfo?.vehicleType || 'sedan',
        capacity: route?.vehicleInfo?.capacity || 4,
        amenities: route?.vehicleInfo?.amenities || [],
        licensePlate: route?.vehicleInfo?.licensePlate || ''
      },
      
      contact: {
        phone: route?.contact?.phone || profileData?.profile?.phone || '',
        whatsapp: route?.contact?.whatsapp || '',
        emergencyContact: route?.contact?.emergencyContact || ''
      },
      
      accessibility: {
        wheelchairAccessible: route?.accessibility?.wheelchairAccessible || false,
        allowPets: route?.accessibility?.allowPets || false,
        smokingAllowed: route?.accessibility?.smokingAllowed || false
      },
      
      description: route?.description || '',
      isActive: route?.isActive !== undefined ? route.isActive : true
    });
  };

  const handleAddRoute = () => {
    setEditingRoute(null);
    initializeRouteForm();
    setShowRouteModal(true);
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    initializeRouteForm(route);
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      const response = await axios.delete(`/user/profile/routes/${routeId}`);
      if (response.data.success) {
        await fetchUserRoutes();
        alert('Route deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route');
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const url = editingRoute 
        ? `/user/profile/routes/${editingRoute._id}`
        : '/user/profile/routes';
      
      const method = editingRoute ? 'put' : 'post';
      
      const response = await axios[method](url, routeFormData);
      
      if (response.data.success) {
        await fetchUserRoutes();
        setShowRouteModal(false);
        setEditingRoute(null);
        alert(editingRoute ? 'Route updated successfully!' : 'Route added successfully!');
      }
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setRouteFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFormChange = (parent, field, value) => {
    setRouteFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const getServiceTypeIcon = (type) => {
    switch (type) {
      case 'taxi': return '🚕';
      case 'combi': return '🚐';
      case 'bus': return '🚌';
      case 'ride_share': return '🚗';
      default: return '🚗';
    }
  };

  const getOperationTypeLabel = (type) => {
    switch (type) {
      case 'on_demand': return 'On Demand';
      case 'scheduled': return 'Scheduled';
      case 'hybrid': return 'Hybrid';
      default: return 'On Demand';
    }
  };

  if (transportServices.length === 0) {
    return (
      <div className="route-management-tab">
        <div className="tab-header">
          <h2><Route size={24} /> Route Management</h2>
          <p>Register a transport service first to manage routes</p>
        </div>
        <div className="empty-state">
          <Route size={48} />
          <h3>No Transport Services</h3>
          <p>You need to register as a transport service provider first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-management-tab">
      <div className="tab-header">
        <h2><Route size={24} /> Route Management</h2>
        <p>Manage your transport routes and schedules</p>
        <button className="add-route-btn" onClick={handleAddRoute}>
          <Plus size={16} />
          Add New Route
        </button>
      </div>

      {/* Routes Grid */}
      <div className="routes-grid">
        {routes.length > 0 ? (
          routes.map((route) => (
            <div key={route._id} className="route-card">
              <div className="route-header">
                <div className="route-title">
                  <span className="route-icon">
                    {getServiceTypeIcon(route.serviceType)}
                  </span>
                  <div>
                    <h4>{route.routeName}</h4>
                    {route.routeNumber && (
                      <span className="route-number">Route #{route.routeNumber}</span>
                    )}
                  </div>
                </div>
                <div className="route-actions">
                  <button 
                    className="action-btn edit"
                    onClick={() => handleEditRoute(route)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteRoute(route._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="route-info">
                <div className="route-path">
                  <div className="location">
                    <MapPin size={14} />
                    <span>{route.origin.name}</span>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="location">
                    <MapPin size={14} />
                    <span>{route.destination.name}</span>
                  </div>
                </div>

                <div className="route-details">
                  <div className="detail-item">
                    <Clock size={14} />
                    <span>{getOperationTypeLabel(route.operationType)}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={14} />
                    <span>P{route.pricing.baseFare}</span>
                  </div>
                  <div className="detail-item">
                    <Users size={14} />
                    <span>{route.vehicleInfo.capacity} seats</span>
                  </div>
                </div>

                {route.contact.phone && (
                  <div className="route-contact">
                    <Phone size={14} />
                    <span>{route.contact.phone}</span>
                  </div>
                )}

                <div className="route-status">
                  <span className={`status-badge ${route.isActive ? 'active' : 'inactive'}`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="service-type">
                    {route.serviceType}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Route size={48} />
            <h3>No Routes Added</h3>
            <p>Add your first transport route to start managing your service</p>
          </div>
        )}
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="route-modal-overlay">
          <div className="route-modal">
            <div className="route-modal-header">
              <h3>{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowRouteModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRouteSubmit} className="route-form">
              {/* Basic Information */}
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Route Name *</label>
                    <input
                      type="text"
                      value={routeFormData.routeName || ''}
                      onChange={(e) => handleFormChange('routeName', e.target.value)}
                      placeholder="e.g., City Center to Airport"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Route Number</label>
                    <input
                      type="text"
                      value={routeFormData.routeNumber || ''}
                      onChange={(e) => handleFormChange('routeNumber', e.target.value)}
                      placeholder="e.g., R1, A2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Service Type</label>
                  <select
                    value={routeFormData.serviceType || 'taxi'}
                    onChange={(e) => handleFormChange('serviceType', e.target.value)}
                  >
                    <option value="taxi">🚕 Taxi Service</option>
                    <option value="combi">🚐 Combi Service</option>
                    <option value="bus">🚌 Bus Service</option>
                    <option value="ride_share">🚗 Ride Share</option>
                  </select>
                </div>
              </div>

              {/* Route Details */}
              <div className="form-section">
                <h4>Route Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Origin *</label>
                    <input
                      type="text"
                      value={routeFormData.origin?.name || ''}
                      onChange={(e) => handleNestedFormChange('origin', 'name', e.target.value)}
                      placeholder="Starting point"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Destination *</label>
                    <input
                      type="text"
                      value={routeFormData.destination?.name || ''}
                      onChange={(e) => handleNestedFormChange('destination', 'name', e.target.value)}
                      placeholder="End point"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Operation Type - Flexible for Botswana */}
              <div className="form-section">
                <h4>Operation Schedule</h4>
                <div className="form-group">
                  <label>Operation Type</label>
                  <select
                    value={routeFormData.operationType || 'on_demand'}
                    onChange={(e) => handleFormChange('operationType', e.target.value)}
                  >
                    <option value="on_demand">On Demand (Call/Text based)</option>
                    <option value="scheduled">Fixed Schedule</option>
                    <option value="hybrid">Hybrid (Both)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Operating Hours From</label>
                    <input
                      type="time"
                      value={routeFormData.schedule?.startTime || '05:00'}
                      onChange={(e) => handleNestedFormChange('schedule', 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Operating Hours To</label>
                    <input
                      type="time"
                      value={routeFormData.schedule?.endTime || '22:00'}
                      onChange={(e) => handleNestedFormChange('schedule', 'endTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Frequency/Schedule Note</label>
                  <input
                    type="text"
                    value={routeFormData.schedule?.frequency || ''}
                    onChange={(e) => handleNestedFormChange('schedule', 'frequency', e.target.value)}
                    placeholder="e.g., On demand, Every 30 minutes, Call ahead"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="form-section">
                <h4>Pricing & Contact</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Base Fare (BWP)</label>
                    <input
                      type="number"
                      step="0.50"
                      value={routeFormData.pricing?.baseFare || ''}
                      onChange={(e) => handleNestedFormChange('pricing', 'baseFare', parseFloat(e.target.value))}
                      placeholder="10.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Capacity</label>
                    <input
                      type="number"
                      value={routeFormData.vehicleInfo?.capacity || ''}
                      onChange={(e) => handleNestedFormChange('vehicleInfo', 'capacity', parseInt(e.target.value))}
                      placeholder="4"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      value={routeFormData.contact?.phone || ''}
                      onChange={(e) => handleNestedFormChange('contact', 'phone', e.target.value)}
                      placeholder="+267 xxxxxxxx"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input
                      type="tel"
                      value={routeFormData.contact?.whatsapp || ''}
                      onChange={(e) => handleNestedFormChange('contact', 'whatsapp', e.target.value)}
                      placeholder="+267 xxxxxxxx"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowRouteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingRoute ? 'Update Route' : 'Add Route')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
