// client/src/components/profile/VehicleManagement.js - Complete Enhanced Version (FIXED)
import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Settings, DollarSign, Calendar, 
  Bell, AlertCircle, Check, X, Save, Upload, Camera, Eye,
  Wrench, Gas, Navigation, Award, TrendingUp, Calculator, Shield
} from 'lucide-react';
import axios from '../../config/axios.js';

// Import CarListingManager for selling and valuation functionality
import CarListingManager from './CarListingManager/CarListingManager.js';

import './VehicleManagement.css';

const VehicleManagement = ({ profileData, refreshProfile, urlAction }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my_vehicles');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // UPDATED: Enhanced tabs with selling and valuation
  const tabs = [
    { id: 'my_vehicles', label: 'My Vehicles', icon: Car },
    { id: 'sell_vehicle', label: 'Sell Vehicle', icon: DollarSign },
    { id: 'get_valuation', label: 'Get Valuation', icon: Calculator },
    { id: 'service_history', label: 'Service History', icon: Wrench },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

  useEffect(() => {
    fetchUserVehicles();
  }, []);

  // ADDED: Handle URL actions from Hero section
  useEffect(() => {
    if (urlAction === 'list') {
      setActiveTab('sell_vehicle');
    } else if (urlAction === 'valuation') {
      setActiveTab('get_valuation');
    }
  }, [urlAction]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showMessage('error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const initializeVehicleForm = (vehicle = null) => {
    setVehicleFormData({
      year: vehicle?.year || '',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      variant: vehicle?.variant || '',
      color: vehicle?.color || '',
      mileage: vehicle?.mileage || '',
      fuelType: vehicle?.fuelType || 'petrol',
      transmission: vehicle?.transmission || 'manual',
      bodyType: vehicle?.bodyType || 'sedan',
      condition: vehicle?.condition || 'excellent',
      
      // Vehicle identification
      vin: vehicle?.vin || '',
      licensePlate: vehicle?.licensePlate || '',
      registrationNumber: vehicle?.registrationNumber || '',
      
      // Ownership details
      ownershipStatus: vehicle?.ownershipStatus || 'owned',
      purchaseDate: vehicle?.purchaseDate || '',
      purchasePrice: vehicle?.purchasePrice || '',
      
      // Current status
      forSale: vehicle?.forSale || false,
      salePrice: vehicle?.salePrice || '',
      isActive: vehicle?.isActive !== false,
      
      // Service information
      lastServiceDate: vehicle?.lastServiceDate || '',
      nextServiceDue: vehicle?.nextServiceDue || '',
      preferredWorkshop: vehicle?.preferredWorkshop || '',
      serviceReminders: vehicle?.serviceReminders || true,
      
      // Insurance and registration
      insuranceProvider: vehicle?.insuranceProvider || '',
      insuranceExpiryDate: vehicle?.insuranceExpiryDate || '',
      registrationExpiryDate: vehicle?.registrationExpiryDate || '',
      
      // Additional info
      images: vehicle?.images || [],
      notes: vehicle?.notes || ''
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

  // FIXED: Replace confirm() with custom confirmation modal
  const handleDeleteVehicle = (vehicleId) => {
    setShowDeleteConfirm(vehicleId);
  };

  const confirmDeleteVehicle = async () => {
    if (!showDeleteConfirm) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/user/vehicles/${showDeleteConfirm}`);
      if (response.data.success) {
        showMessage('success', 'Vehicle deleted successfully');
        fetchUserVehicles();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Failed to delete vehicle');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveVehicle = async () => {
    try {
      setLoading(true);
      const url = editingVehicle 
        ? `/user/vehicles/${editingVehicle._id}`
        : '/user/vehicles';
      const method = editingVehicle ? 'put' : 'post';
      
      const response = await axios[method](url, vehicleFormData);
      
      if (response.data.success) {
        showMessage('success', `Vehicle ${editingVehicle ? 'updated' : 'added'} successfully`);
        setShowVehicleModal(false);
        fetchUserVehicles();
        if (refreshProfile) refreshProfile();
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showMessage('error', 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (vehicle) => {
    showMessage('info', 'Service booking feature coming soon!');
  };

  const isServiceDue = (vehicle) => {
    if (!vehicle.nextServiceDue) return false;
    const dueDate = new Date(vehicle.nextServiceDue);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP'
    }).format(amount);
  };

  const getVehicleAge = (year) => {
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(year);
  };

  return (
    <div className="vmanage-main-container">
      {/* Message Display */}
      {message.text && (
        <div className={`vmanage-message vmanage-message-${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* ADDED: Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-confirmation-modal">
            <div className="vmanage-confirmation-header">
              <AlertCircle size={24} className="vmanage-warning-icon" />
              <h3>Delete Vehicle</h3>
            </div>
            <div className="vmanage-confirmation-body">
              <p>Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            </div>
            <div className="vmanage-confirmation-actions">
              <button 
                className="vmanage-confirm-delete-btn"
                onClick={confirmDeleteVehicle}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                className="vmanage-cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="vmanage-tab-navigation">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`vmanage-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'my_vehicles' && (
        <div className="vmanage-vehicles-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Car size={20} />
              My Vehicles
            </h3>
            <button 
              className="vmanage-add-vehicle-btn"
              onClick={handleAddVehicle}
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          </div>

          <div className="vmanage-vehicles-grid">
            {vehicles.length > 0 ? (
              vehicles.map(vehicle => (
                <div key={vehicle._id} className="vmanage-vehicle-card">
                  <div className="vmanage-vehicle-header">
                    <div className="vmanage-vehicle-image">
                      {vehicle.images?.length > 0 ? (
                        <img 
                          src={vehicle.images[0].url || vehicle.images[0]} 
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="vmanage-vehicle-placeholder">
                          <Car size={48} />
                        </div>
                      )}
                    </div>
                    
                    <div className="vmanage-vehicle-age-badge">
                      {getVehicleAge(vehicle.year)} years old
                    </div>
                    
                    <div className="vmanage-vehicle-actions">
                      <button 
                        className="vmanage-vehicle-action-btn vmanage-edit-btn"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="vmanage-vehicle-action-btn vmanage-delete-btn"
                        onClick={() => handleDeleteVehicle(vehicle._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="vmanage-vehicle-content">
                    <h4 className="vmanage-vehicle-title">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    {vehicle.variant && (
                      <p className="vmanage-vehicle-variant">{vehicle.variant}</p>
                    )}

                    <div className="vmanage-vehicle-specs">
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Mileage</span>
                        <span className="vmanage-spec-value">{vehicle.mileage || 'Unknown'} km</span>
                      </div>
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Fuel</span>
                        <span className="vmanage-spec-value">{vehicle.fuelType}</span>
                      </div>
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Transmission</span>
                        <span className="vmanage-spec-value">{vehicle.transmission}</span>
                      </div>
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Condition</span>
                        <span className="vmanage-spec-value">{vehicle.condition}</span>
                      </div>
                    </div>

                    <div className="vmanage-vehicle-status">
                      {vehicle.forSale ? (
                        <span className="vmanage-status-badge for-sale">
                          <DollarSign size={12} />
                          For Sale - {formatCurrency(vehicle.salePrice)}
                        </span>
                      ) : (
                        <span className="vmanage-status-badge not-for-sale">
                          <Car size={12} />
                          Personal Use
                        </span>
                      )}

                      {isServiceDue(vehicle) && (
                        <span className="vmanage-status-badge service-due">
                          <Bell size={12} />
                          Service Due
                        </span>
                      )}
                    </div>

                    <div className="vmanage-vehicle-stats">
                      {vehicle.lastServiceDate && (
                        <div className="vmanage-stat-item">
                          <Wrench size={14} />
                          <span>Last Service: {formatDate(vehicle.lastServiceDate)}</span>
                        </div>
                      )}
                      {vehicle.insuranceExpiryDate && (
                        <div className="vmanage-stat-item">
                          <Shield size={14} />
                          <span>Insurance: {formatDate(vehicle.insuranceExpiryDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* ADDED: Quick Action Buttons */}
                    <div className="vmanage-vehicle-quick-actions">
                      <button 
                        className="vmanage-quick-action-btn vmanage-sell-btn"
                        onClick={() => {
                          setActiveTab('sell_vehicle');
                        }}
                      >
                        <DollarSign size={14} />
                        Sell This Car
                      </button>
                      
                      <button 
                        className="vmanage-quick-action-btn vmanage-valuation-btn"
                        onClick={() => {
                          setActiveTab('get_valuation');
                        }}
                      >
                        <Calculator size={14} />
                        Get Valuation
                      </button>
                      
                      {isServiceDue(vehicle) && (
                        <button 
                          className="vmanage-quick-action-btn vmanage-service-btn"
                          onClick={() => handleBookService(vehicle)}
                        >
                          <Calendar size={14} />
                          Book Service
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="vmanage-empty-state">
                <Car size={48} />
                <h3>No Vehicles Added</h3>
                <p>Add your first vehicle to start tracking services and performance</p>
                <button 
                  className="vmanage-add-first-vehicle-btn"
                  onClick={handleAddVehicle}
                >
                  <Plus size={16} />
                  Add Your First Vehicle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADDED: Sell Vehicle Tab */}
      {activeTab === 'sell_vehicle' && (
        <div className="vmanage-sell-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <DollarSign size={20} />
              List Vehicle for Sale
            </h3>
            <p>Choose a subscription plan and list your vehicle on our marketplace</p>
          </div>
          
          <CarListingManager 
            action="create" 
            userVehicles={vehicles}
            onVehicleListed={() => {
              showMessage('success', 'Vehicle listed successfully!');
              fetchUserVehicles();
            }}
            onCancel={() => setActiveTab('my_vehicles')}
          />
        </div>
      )}

      {/* ADDED: Get Valuation Tab */}
      {activeTab === 'get_valuation' && (
        <div className="vmanage-valuation-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Calculator size={20} />
              Get Vehicle Valuation
            </h3>
            <p>Get an instant estimate or request professional valuation for your vehicle</p>
          </div>
          
          <CarListingManager 
            action="valuation" 
            userVehicles={vehicles}
            onValuationSubmitted={() => {
              showMessage('success', 'Valuation request submitted successfully!');
            }}
            onCancel={() => setActiveTab('my_vehicles')}
          />
        </div>
      )}

      {activeTab === 'service_history' && (
        <div className="vmanage-service-history-section">
          <h3 className="vmanage-section-title">
            <Wrench size={20} />
            Service History & Reminders
          </h3>
          <div className="vmanage-service-summary">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vmanage-vehicle-service-summary">
                <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                <div className="vmanage-service-info">
                  <div className="vmanage-service-item">
                    <Calendar size={16} />
                    <span>Last Service: {formatDate(vehicle.lastServiceDate)}</span>
                  </div>
                  <div className="vmanage-service-item">
                    <Bell size={16} />
                    <span>Next Service: {formatDate(vehicle.nextServiceDue)}</span>
                  </div>
                  {vehicle.preferredWorkshop && (
                    <div className="vmanage-service-item">
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

      {activeTab === 'performance' && (
        <div className="vmanage-performance-section">
          <h3 className="vmanage-section-title">
            <TrendingUp size={20} />
            Vehicle Performance & Analytics
          </h3>
          <div className="vmanage-performance-summary">
            <p>Performance tracking features coming soon!</p>
            <div className="vmanage-coming-soon">
              <ul>
                <li>Fuel efficiency tracking</li>
                <li>Maintenance cost analysis</li>
                <li>Vehicle depreciation insights</li>
                <li>Service history reports</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Form Modal - Enhanced with additional fields */}
      {showVehicleModal && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-modal">
            <div className="vmanage-modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => setShowVehicleModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="vmanage-modal-body">
              {/* Basic Information Section */}
              <div className="vmanage-form-section">
                <h4>Basic Information</h4>
                <div className="vmanage-form-grid">
                  <div className="vmanage-form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      value={vehicleFormData.year}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, year: e.target.value})}
                      placeholder="e.g., 2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Make</label>
                    <input
                      type="text"
                      value={vehicleFormData.make}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, make: e.target.value})}
                      placeholder="e.g., Toyota"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={vehicleFormData.model}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, model: e.target.value})}
                      placeholder="e.g., Corolla"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Variant</label>
                    <input
                      type="text"
                      value={vehicleFormData.variant}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, variant: e.target.value})}
                      placeholder="e.g., 1.8L GLi"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      value={vehicleFormData.color}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, color: e.target.value})}
                      placeholder="e.g., White"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Mileage (km)</label>
                    <input
                      type="number"
                      value={vehicleFormData.mileage}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, mileage: e.target.value})}
                      placeholder="e.g., 50000"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="vmanage-form-section">
                <h4>Specifications</h4>
                <div className="vmanage-form-grid">
                  <div className="vmanage-form-group">
                    <label>Fuel Type</label>
                    <select
                      value={vehicleFormData.fuelType}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, fuelType: e.target.value})}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric</option>
                      <option value="lpg">LPG</option>
                    </select>
                  </div>
                  <div className="vmanage-form-group">
                    <label>Transmission</label>
                    <select
                      value={vehicleFormData.transmission}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, transmission: e.target.value})}
                    >
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                      <option value="cvt">CVT</option>
                      <option value="semi-automatic">Semi-Automatic</option>
                    </select>
                  </div>
                  <div className="vmanage-form-group">
                    <label>Body Type</label>
                    <select
                      value={vehicleFormData.bodyType}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, bodyType: e.target.value})}
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="pickup">Pickup</option>
                      <option value="wagon">Wagon</option>
                      <option value="coupe">Coupe</option>
                      <option value="convertible">Convertible</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                  <div className="vmanage-form-group">
                    <label>Condition</label>
                    <select
                      value={vehicleFormData.condition}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, condition: e.target.value})}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Identification */}
              <div className="vmanage-form-section">
                <h4>Vehicle Identification</h4>
                <div className="vmanage-form-grid">
                  <div className="vmanage-form-group">
                    <label>VIN (Optional)</label>
                    <input
                      type="text"
                      value={vehicleFormData.vin}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, vin: e.target.value})}
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>License Plate</label>
                    <input
                      type="text"
                      value={vehicleFormData.licensePlate}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, licensePlate: e.target.value})}
                      placeholder="e.g., B123 ABC"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      value={vehicleFormData.registrationNumber}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, registrationNumber: e.target.value})}
                      placeholder="Registration number"
                    />
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="vmanage-form-section">
                <h4>Service Information</h4>
                <div className="vmanage-form-grid">
                  <div className="vmanage-form-group">
                    <label>Last Service Date</label>
                    <input
                      type="date"
                      value={vehicleFormData.lastServiceDate}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, lastServiceDate: e.target.value})}
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Next Service Due</label>
                    <input
                      type="date"
                      value={vehicleFormData.nextServiceDue}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, nextServiceDue: e.target.value})}
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Preferred Workshop</label>
                    <input
                      type="text"
                      value={vehicleFormData.preferredWorkshop}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, preferredWorkshop: e.target.value})}
                      placeholder="Workshop name"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="vmanage-form-section">
                <h4>Additional Notes</h4>
                <div className="vmanage-form-group">
                  <label>Notes</label>
                  <textarea
                    value={vehicleFormData.notes}
                    onChange={(e) => setVehicleFormData({...vehicleFormData, notes: e.target.value})}
                    placeholder="Any additional information about your vehicle..."
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="vmanage-modal-actions">
                <button 
                  className="vmanage-save-btn"
                  onClick={handleSaveVehicle}
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Vehicle'}
                </button>
                <button 
                  className="vmanage-cancel-btn"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
