// client/src/components/profile/VehicleManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Calendar, Settings, 
  DollarSign, Eye, Bell, Camera, FileText, 
  CheckCircle, AlertCircle, Clock, Star
} from 'lucide-react';
import axios from '../../config/axios.js';

const VehicleManagement = ({ profileData, refreshProfile }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('my_vehicles');
  const [vehicleFormData, setVehicleFormData] = useState({});

  useEffect(() => {
    fetchUserVehicles();
  }, []);

  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeVehicleForm = (vehicle = null) => {
    setVehicleFormData({
      // Basic Information
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year || new Date().getFullYear(),
      color: vehicle?.color || '',
      bodyType: vehicle?.bodyType || 'sedan',
      fuelType: vehicle?.fuelType || 'petrol',
      transmission: vehicle?.transmission || 'manual',
      
      // Identification
      vin: vehicle?.vin || '',
      licensePlate: vehicle?.licensePlate || '',
      engineNumber: vehicle?.engineNumber || '',
      
      // Ownership & Documentation
      ownershipStatus: vehicle?.ownershipStatus || 'owned',
      purchaseDate: vehicle?.purchaseDate || '',
      purchasePrice: vehicle?.purchasePrice || '',
      
      // Current Status
      mileage: vehicle?.mileage || '',
      condition: vehicle?.condition || 'excellent',
      location: vehicle?.location || profileData?.profile?.address?.city || '',
      
      // Service Tracking
      lastServiceDate: vehicle?.lastServiceDate || '',
      nextServiceDue: vehicle?.nextServiceDue || '',
      preferredWorkshop: vehicle?.preferredWorkshop || '',
      serviceReminders: vehicle?.serviceReminders || true,
      
      // Selling Information
      forSale: vehicle?.forSale || false,
      askingPrice: vehicle?.askingPrice || '',
      sellingReason: vehicle?.sellingReason || '',
      negotiable: vehicle?.negotiable || true,
      
      // Performance Tracking
      trackPerformance: vehicle?.trackPerformance || true,
      allowListingByOthers: vehicle?.allowListingByOthers || false,
      
      // Insurance & Legal
      insuranceCompany: vehicle?.insuranceCompany || '',
      insuranceExpiryDate: vehicle?.insuranceExpiryDate || '',
      licenseExpiryDate: vehicle?.licenseExpiryDate || '',
      
      // Additional Details
      description: vehicle?.description || '',
      specialFeatures: vehicle?.specialFeatures || [],
      images: vehicle?.images || [],
      
      // Notifications
      notifications: {
        serviceReminders: vehicle?.notifications?.serviceReminders !== false,
        insuranceReminders: vehicle?.notifications?.insuranceReminders !== false,
        licenseReminders: vehicle?.notifications?.licenseReminders !== false,
        listingUpdates: vehicle?.notifications?.listingUpdates !== false
      }
    });
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    initializeVehicleForm();
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    initializeVehicleForm(vehicle);
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your profile?')) return;
    
    try {
      const response = await axios.delete(`/user/profile/vehicles/${vehicleId}`);
      if (response.data.success) {
        await fetchUserVehicles();
        alert('Vehicle removed successfully');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to remove vehicle');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const url = editingVehicle 
        ? `/user/profile/vehicles/${editingVehicle._id}`
        : '/user/profile/vehicles';
      
      const method = editingVehicle ? 'put' : 'post';
      
      const response = await axios[method](url, vehicleFormData);
      
      if (response.data.success) {
        await fetchUserVehicles();
        setShowVehicleModal(false);
        setEditingVehicle(null);
        alert(editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (vehicle) => {
    // Navigate to workshop booking with pre-filled vehicle info
    window.location.href = `/workshops?vehicle=${vehicle._id}`;
  };

  const handleSellVehicle = (vehicle) => {
    // Navigate to listing creation with pre-filled vehicle info
    window.location.href = `/listings/create?vehicle=${vehicle._id}`;
  };

  const handleFormChange = (field, value) => {
    setVehicleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFormChange = (parent, field, value) => {
    setVehicleFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const getConditionBadge = (condition) => {
    const badges = {
      excellent: { color: 'green', icon: CheckCircle },
      good: { color: 'blue', icon: CheckCircle },
      fair: { color: 'yellow', icon: AlertCircle },
      poor: { color: 'red', icon: AlertCircle }
    };
    
    const badge = badges[condition] || badges.good;
    const Icon = badge.icon;
    
    return (
      <span className={`condition-badge ${badge.color}`}>
        <Icon size={12} />
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const isServiceDue = (vehicle) => {
    if (!vehicle.nextServiceDue) return false;
    const serviceDate = new Date(vehicle.nextServiceDue);
    const today = new Date();
    const daysUntilService = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilService <= 30;
  };

  return (
    <div className="vehicle-management-tab">
      <div className="tab-header">
        <h2><Car size={24} /> Vehicle Management</h2>
        <p>Manage your vehicles, track services, and monitor listings</p>
        <button className="add-vehicle-btn" onClick={handleAddVehicle}>
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="vehicle-sub-nav">
        <button 
          className={`sub-nav-btn ${activeTab === 'my_vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('my_vehicles')}
        >
          <Car size={16} />
          My Vehicles
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'service_history' ? 'active' : ''}`}
          onClick={() => setActiveTab('service_history')}
        >
          <Settings size={16} />
          Service History
        </button>
        <button 
          className={`sub-nav-btn ${activeTab === 'listings_tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings_tracking')}
        >
          <Eye size={16} />
          Listing Tracking
        </button>
      </div>

      {/* Vehicle Content */}
      {activeTab === 'my_vehicles' && (
        <div className="vehicles-grid">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div key={vehicle._id} className="vehicle-card">
                <div className="vehicle-header">
                  <div className="vehicle-image">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} />
                    ) : (
                      <div className="no-image">
                        <Car size={40} />
                      </div>
                    )}
                  </div>
                  <div className="vehicle-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteVehicle(vehicle._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="vehicle-info">
                  <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                  <p className="vehicle-details">
                    {vehicle.color} • {vehicle.bodyType} • {vehicle.fuelType}
                  </p>
                  
                  <div className="vehicle-status">
                    {getConditionBadge(vehicle.condition)}
                    {vehicle.forSale && (
                      <span className="for-sale-badge">
                        <DollarSign size={12} />
                        For Sale
                      </span>
                    )}
                  </div>

                  <div className="vehicle-stats">
                    <div className="stat">
                      <span className="stat-label">Mileage</span>
                      <span className="stat-value">{vehicle.mileage || 'N/A'} km</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Last Service</span>
                      <span className="stat-value">{formatDate(vehicle.lastServiceDate)}</span>
                    </div>
                  </div>

                  {isServiceDue(vehicle) && (
                    <div className="service-alert">
                      <AlertCircle size={14} />
                      <span>Service due soon!</span>
                    </div>
                  )}

                  <div className="vehicle-quick-actions">
                    <button 
                      className="quick-action-btn service"
                      onClick={() => handleBookService(vehicle)}
                    >
                      <Settings size={14} />
                      Book Service
                    </button>
                    {!vehicle.forSale && (
                      <button 
                        className="quick-action-btn sell"
                        onClick={() => handleSellVehicle(vehicle)}
                      >
                        <DollarSign size={14} />
                        Sell Vehicle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Car size={48} />
              <h3>No Vehicles Added</h3>
              <p>Add your first vehicle to start tracking services and performance</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'service_history' && (
        <div className="service-history-content">
          <h3>Service History & Reminders</h3>
          <div className="service-summary">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vehicle-service-summary">
                <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                <div className="service-info">
                  <div className="service-item">
                    <Calendar size={16} />
                    <span>Last Service: {formatDate(vehicle.lastServiceDate)}</span>
                  </div>
                  <div className="service-item">
                    <Bell size={16} />
                    <span>Next Service: {formatDate(vehicle.nextServiceDue)}</span>
                  </div>
                  {vehicle.preferredWorkshop && (
                    <div className="service-item">
                      <Settings size={16} />
                      <span>Preferred Workshop: {vehicle.preferredWorkshop}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'listings_tracking' && (
        <div className="listings-tracking-content">
          <h3>Listing Performance & Tracking</h3>
          <div className="tracking-summary">
            {vehicles.filter(v => v.trackPerformance).map(vehicle => (
              <div key={vehicle._id} className="vehicle-tracking-summary">
                <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                <div className="tracking-stats">
                  <div className="tracking-stat">
                    <Eye size={16} />
                    <span>Views: N/A</span>
                  </div>
                  <div className="tracking-stat">
                    <Star size={16} />
                    <span>Favorites: N/A</span>
                  </div>
                  <div className="tracking-stat">
                    <FileText size={16} />
                    <span>Inquiries: N/A</span>
                  </div>
                </div>
                <p className="tracking-note">
                  Performance tracking will show data when your vehicle is listed or being sold
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal">
            <div className="vehicle-modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowVehicleModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleVehicleSubmit} className="vehicle-form">
              {/* Basic Information */}
              <div className="form-section">
                <h4>Vehicle Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Make *</label>
                    <input
                      type="text"
                      value={vehicleFormData.make || ''}
                      onChange={(e) => handleFormChange('make', e.target.value)}
                      placeholder="Toyota, BMW, etc."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      value={vehicleFormData.model || ''}
                      onChange={(e) => handleFormChange('model', e.target.value)}
                      placeholder="Corolla, X3, etc."
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Year *</label>
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear() + 1}
                      value={vehicleFormData.year || ''}
                      onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      value={vehicleFormData.color || ''}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      placeholder="White, Black, etc."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>License Plate</label>
                    <input
                      type="text"
                      value={vehicleFormData.licensePlate || ''}
                      onChange={(e) => handleFormChange('licensePlate', e.target.value)}
                      placeholder="ABC 123 GP"
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Mileage (km)</label>
                    <input
                      type="number"
                      value={vehicleFormData.mileage || ''}
                      onChange={(e) => handleFormChange('mileage', e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              {/* Service Tracking */}
              <div className="form-section">
                <h4>Service & Maintenance</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Last Service Date</label>
                    <input
                      type="date"
                      value={vehicleFormData.lastServiceDate || ''}
                      onChange={(e) => handleFormChange('lastServiceDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Next Service Due</label>
                    <input
                      type="date"
                      value={vehicleFormData.nextServiceDue || ''}
                      onChange={(e) => handleFormChange('nextServiceDue', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Preferred Workshop</label>
                  <input
                    type="text"
                    value={vehicleFormData.preferredWorkshop || ''}
                    onChange={(e) => handleFormChange('preferredWorkshop', e.target.value)}
                    placeholder="Workshop name or location"
                  />
                </div>
              </div>

              {/* Selling Options */}
              <div className="form-section">
                <h4>Selling & Tracking Options</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vehicleFormData.forSale || false}
                      onChange={(e) => handleFormChange('forSale', e.target.checked)}
                    />
                    <span>Currently for sale</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vehicleFormData.trackPerformance || false}
                      onChange={(e) => handleFormChange('trackPerformance', e.target.checked)}
                    />
                    <span>Track listing performance</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vehicleFormData.allowListingByOthers || false}
                      onChange={(e) => handleFormChange('allowListingByOthers', e.target.checked)}
                    />
                    <span>Get notified if others list my vehicle</span>
                  </label>
                </div>

                {vehicleFormData.forSale && (
                  <div className="form-group">
                    <label>Asking Price (BWP)</label>
                    <input
                      type="number"
                      value={vehicleFormData.askingPrice || ''}
                      onChange={(e) => handleFormChange('askingPrice', e.target.value)}
                      placeholder="150000"
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
