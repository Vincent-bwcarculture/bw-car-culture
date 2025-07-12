// client/src/components/profile/VehicleManagement.js
// COMPLETE FULL VERSION with all updates integrated - FIXED Lucide React Import

import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Settings, DollarSign, Calendar, 
  Bell, AlertCircle, Check, X, Save, Upload, Camera, Eye,
  Wrench, Fuel, Navigation, Award, TrendingUp, Calculator, Shield,
  User, Phone, MapPin, Clock, Star
} from 'lucide-react';
import axios from '../../config/axios.js';

// Import BOTH components
import CarListingManager from './CarListingManager/CarListingManager.js';
import UserCarListingForm from './UserCarListingForm.js';

import './VehicleManagement.css';

const VehicleManagement = ({ profileData, refreshProfile, urlAction }) => {
  // Main component state
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my_vehicles');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Car listing flow state
  const [listingStep, setListingStep] = useState('form'); // 'form' or 'subscription'
  const [pendingListingData, setPendingListingData] = useState(null);

  // Enhanced tabs with emojis for better visibility
  const tabs = [
    { id: 'my_vehicles', label: 'My Vehicles', icon: Car },
    { id: 'sell_vehicle', label: '🚗 List for Sale', icon: DollarSign },
    { id: 'get_valuation', label: '💰 Get Valuation', icon: Calculator },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'service_history', label: 'Service History', icon: Wrench },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

  // Load user vehicles on component mount
  useEffect(() => {
    fetchUserVehicles();
  }, []);

  // Handle URL actions from Hero section or other components
  useEffect(() => {
    if (urlAction) {
      switch (urlAction) {
        case 'sell':
        case 'sell_vehicle':
        case 'list':
          setActiveTab('sell_vehicle');
          setListingStep('form'); // Start with form step
          showMessage('info', 'Ready to list your vehicle for sale! Fill in the form below.');
          break;
        case 'valuation':
        case 'valuate':
        case 'estimate':
          setActiveTab('get_valuation');
          showMessage('info', 'Get an instant valuation for your vehicle.');
          break;
        case 'add_vehicle':
        case 'add':
          setActiveTab('my_vehicles');
          setTimeout(() => handleAddVehicle(), 500);
          break;
        default:
          setActiveTab('my_vehicles');
      }
    }
  }, [urlAction]);

  // Helper function to show messages
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fetch user's vehicles from the server
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

  // Car listing form submission handler
  const handleCarListingFormSubmit = async (listingData) => {
    try {
      // Save the car details and move to subscription step
      setPendingListingData(listingData);
      setListingStep('subscription');
      showMessage('success', 'Car details saved! Now choose your subscription plan.');
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', 'Failed to save car details');
      throw error;
    }
  };

  // Handle subscription completion
  const handleSubscriptionCompleted = () => {
    // Reset the flow
    setListingStep('form');
    setPendingListingData(null);
    showMessage('success', 'Vehicle listing process completed! Your listing is being reviewed.');
    setActiveTab('my_vehicles');
    fetchUserVehicles();
  };

  // Handle cancel subscription
  const handleCancelSubscription = () => {
    setListingStep('form');
    showMessage('info', 'Subscription cancelled. You can continue editing your car details.');
  };

  // Handle cancel car form
  const handleCancelCarForm = () => {
    setListingStep('form');
    setPendingListingData(null);
    setActiveTab('my_vehicles');
  };

  // Initialize vehicle form data
  const initializeVehicleForm = (vehicle = null) => {
    setVehicleFormData({
      year: vehicle?.year || new Date().getFullYear(),
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
      
      // Additional details
      notes: vehicle?.notes || '',
      images: vehicle?.images || []
    });
  };

  // Vehicle management functions
  const handleAddVehicle = () => {
    initializeVehicleForm();
    setEditingVehicle(null);
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    initializeVehicleForm(vehicle);
    setEditingVehicle(vehicle);
    setShowVehicleModal(true);
  };

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
      } else {
        showMessage('error', response.data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Failed to delete vehicle');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const endpoint = editingVehicle 
        ? `/user/vehicles/${editingVehicle._id}`
        : '/user/vehicles';
      
      const method = editingVehicle ? 'put' : 'post';
      
      const response = await axios[method](endpoint, vehicleFormData);
      
      if (response.data.success) {
        showMessage('success', `Vehicle ${editingVehicle ? 'updated' : 'added'} successfully`);
        setShowVehicleModal(false);
        fetchUserVehicles();
      } else {
        showMessage('error', response.data.message || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showMessage('error', 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatMileage = (mileage) => {
    if (!mileage) return 'Not specified';
    return Number(mileage).toLocaleString() + ' km';
  };

  const getVehicleAge = (year) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age === 0) return 'New';
    if (age === 1) return '1 year old';
    return `${age} years old`;
  };

  // Render vehicle card
  const renderVehicleCard = (vehicle) => (
    <div key={vehicle._id} className="vmanage-vehicle-card">
      <div className="vmanage-vehicle-header">
        <div className="vmanage-vehicle-image">
          {vehicle.images?.length > 0 ? (
            <img 
              src={vehicle.images[0].url || vehicle.images[0]} 
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div class="vmanage-vehicle-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 17h10l2-4V7c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v6l2 4z"/>
                      <circle cx="7" cy="17" r="2"/>
                      <circle cx="17" cy="17" r="2"/>
                    </svg>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="vmanage-vehicle-placeholder">
              <Car size={48} />
            </div>
          )}
        </div>
        
        {vehicle.year && (
          <div className="vmanage-vehicle-age-badge">
            {getVehicleAge(vehicle.year)}
          </div>
        )}
        
        <div className="vmanage-vehicle-actions">
          <button
            className="vmanage-vehicle-action-btn vmanage-edit-btn"
            onClick={() => handleEditVehicle(vehicle)}
            title="Edit Vehicle"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="vmanage-vehicle-action-btn vmanage-delete-btn"
            onClick={() => handleDeleteVehicle(vehicle._id)}
            title="Delete Vehicle"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="vmanage-vehicle-content">
        <div className="vmanage-vehicle-info">
          <h4 className="vmanage-vehicle-title">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h4>
          {vehicle.variant && (
            <p className="vmanage-vehicle-variant">{vehicle.variant}</p>
          )}
        </div>

        <div className="vmanage-vehicle-specs">
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Fuel Type</span>
            <span className="vmanage-spec-value">{vehicle.fuelType || 'Not specified'}</span>
          </div>
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Transmission</span>
            <span className="vmanage-spec-value">{vehicle.transmission || 'Not specified'}</span>
          </div>
          {vehicle.mileage && (
            <div className="vmanage-spec-item">
              <span className="vmanage-spec-label">Mileage</span>
              <span className="vmanage-spec-value">{formatMileage(vehicle.mileage)}</span>
            </div>
          )}
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Condition</span>
            <span className="vmanage-spec-value">{vehicle.condition || 'Not specified'}</span>
          </div>
        </div>

        <div className="vmanage-vehicle-status">
          <span className={`vmanage-status-badge ${vehicle.forSale ? 'for-sale' : 'not-for-sale'}`}>
            {vehicle.forSale ? (
              <>
                <DollarSign size={12} />
                For Sale
              </>
            ) : (
              <>
                <User size={12} />
                Personal Use
              </>
            )}
          </span>
          {vehicle.condition && (
            <span className="vmanage-status-badge condition">
              <Star size={12} />
              {vehicle.condition}
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="vmanage-vehicle-quick-actions">
          <button 
            className="vmanage-quick-action-btn vmanage-sell-btn"
            onClick={() => {
              setActiveTab('sell_vehicle');
              setListingStep('form');
              // Could pre-populate form with this vehicle's data
            }}
            title="List this vehicle for sale"
          >
            <DollarSign size={14} />
            Sell
          </button>
          <button 
            className="vmanage-quick-action-btn vmanage-valuation-btn"
            onClick={() => setActiveTab('get_valuation')}
            title="Get valuation for this vehicle"
          >
            <Calculator size={14} />
            Value
          </button>
          <button 
            className="vmanage-quick-action-btn vmanage-service-btn"
            onClick={() => setActiveTab('service_history')}
            title="View service history"
          >
            <Wrench size={14} />
            Service
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vmanage-main-container">
      {/* Display messages */}
      {message.text && (
        <div className={`vmanage-message vmanage-message-${message.type}`}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {message.text}
          <button 
            className="vmanage-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-confirmation-modal">
            <div className="vmanage-modal-header">
              <h3>Delete Vehicle</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="vmanage-confirmation-content">
              <div className="vmanage-warning-icon">
                <AlertCircle size={48} />
              </div>
              <p>Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            </div>
            <div className="vmanage-confirmation-actions">
              <button 
                className="vmanage-cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="vmanage-confirm-delete-btn"
                onClick={confirmDeleteVehicle}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Vehicle'}
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
              vehicles.map(renderVehicleCard)
            ) : (
              <div className="vmanage-empty-state">
                <div className="vmanage-empty-icon">
                  <Car size={64} />
                </div>
                <h3>No vehicles yet</h3>
                <p>Add your first vehicle to get started with managing your automotive portfolio</p>
                <button 
                  className="vmanage-add-vehicle-btn vmanage-primary-btn"
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

      {/* Sell Vehicle Tab - Two-step process */}
      {activeTab === 'sell_vehicle' && (
        <div className="vmanage-sell-section">
          {listingStep === 'form' ? (
            // Step 1: Car Listing Form
            <UserCarListingForm
              onSubmit={handleCarListingFormSubmit}
              onCancel={handleCancelCarForm}
              initialData={pendingListingData}
            />
          ) : (
            // Step 2: Subscription Selection
            <div className="vmanage-subscription-step">
              <div className="vmanage-step-header">
                <h3>Step 2: Choose Subscription Plan</h3>
                <p>Your car details have been saved. Now select a subscription plan to publish your listing.</p>
                <button 
                  className="vmanage-back-to-form-btn"
                  onClick={() => setListingStep('form')}
                >
                  ← Back to Edit Car Details
                </button>
              </div>
              
              <CarListingManager 
                action="create" 
                userVehicles={vehicles}
                listingData={pendingListingData}
                onVehicleListed={handleSubscriptionCompleted}
                onCancel={handleCancelSubscription}
              />
            </div>
          )}
        </div>
      )}

      {/* Get Valuation Tab */}
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

      {/* Insurance Tab */}
      {activeTab === 'insurance' && (
        <div className="vmanage-insurance-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Shield size={20} />
              Vehicle Insurance Management
            </h3>
            <p>Manage your vehicle insurance policies and get quotes</p>
          </div>
          
          <div className="vmanage-insurance-content">
            <div className="vmanage-coming-soon">
              <div className="vmanage-coming-soon-icon">
                <Shield size={64} />
              </div>
              <h4>Insurance Management Coming Soon!</h4>
              <p>We're working on comprehensive insurance management features including:</p>
              <div className="vmanage-feature-list">
                <div className="vmanage-feature-item">
                  <Bell size={16} />
                  <span>Automatic renewal reminders and notifications</span>
                </div>
                <div className="vmanage-feature-item">
                  <Calculator size={16} />
                  <span>Insurance calculator based on vehicle value</span>
                </div>
                <div className="vmanage-feature-item">
                  <Car size={16} />
                  <span>Coverage recommendations for your vehicle type</span>
                </div>
                <div className="vmanage-feature-item">
                  <Phone size={16} />
                  <span>Direct contact with insurance providers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service History Tab */}
      {activeTab === 'service_history' && (
        <div className="vmanage-service-history-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Wrench size={20} />
              Service History & Reminders
            </h3>
            <p>Track maintenance and service records for your vehicles</p>
          </div>
          
          <div className="vmanage-service-content">
            {vehicles.length > 0 ? (
              <div className="vmanage-service-vehicles">
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} className="vmanage-vehicle-service-summary">
                    <div className="vmanage-service-vehicle-header">
                      <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                      <span className="vmanage-vehicle-condition">{vehicle.condition}</span>
                    </div>
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
                      <div className="vmanage-service-item">
                        <Navigation size={16} />
                        <span>Current Mileage: {formatMileage(vehicle.mileage)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vmanage-empty-service">
                <Wrench size={48} />
                <h4>No vehicles to track</h4>
                <p>Add vehicles to start tracking their service history</p>
                <button 
                  className="vmanage-add-vehicle-btn"
                  onClick={handleAddVehicle}
                >
                  <Plus size={16} />
                  Add Vehicle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="vmanage-performance-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <TrendingUp size={20} />
              Vehicle Performance & Analytics
            </h3>
            <p>Track performance metrics and analytics for your vehicles</p>
          </div>
          
          <div className="vmanage-performance-content">
            <div className="vmanage-coming-soon">
              <div className="vmanage-coming-soon-icon">
                <TrendingUp size={64} />
              </div>
              <h4>Performance Analytics Coming Soon!</h4>
              <p>Advanced analytics and insights for your vehicles:</p>
              <div className="vmanage-feature-list">
                <div className="vmanage-feature-item">
                  <Fuel size={16} />
                  <span>Fuel efficiency tracking and optimization</span>
                </div>
                <div className="vmanage-feature-item">
                  <DollarSign size={16} />
                  <span>Maintenance cost analysis and budgeting</span>
                </div>
                <div className="vmanage-feature-item">
                  <TrendingUp size={16} />
                  <span>Vehicle depreciation insights and market value</span>
                </div>
                <div className="vmanage-feature-item">
                  <Calendar size={16} />
                  <span>Comprehensive service history reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showVehicleModal && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-modal">
            <div className="vmanage-modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => setShowVehicleModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="vmanage-vehicle-form">
              <div className="vmanage-form-section">
                <h4>Basic Information</h4>
                <div className="vmanage-form-grid">
                  <div className="vmanage-form-group">
                    <label>Year *</label>
                    <input
                      type="number"
                      value={vehicleFormData.year}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, year: parseInt(e.target.value)})}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Make *</label>
                    <input
                      type="text"
                      value={vehicleFormData.make}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, make: e.target.value})}
                      placeholder="e.g., Toyota, BMW"
                      required
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      value={vehicleFormData.model}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, model: e.target.value})}
                      placeholder="e.g., Corolla, X5"
                      required
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label>Variant</label>
                    <input
                      type="text"
                      value={vehicleFormData.variant}
                      onChange={(e) => setVehicleFormData({...vehicleFormData, variant: e.target.value})}
                      placeholder="e.g., 2.0 Turbo, XDrive"
                    />
                  </div>
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
                      <option value="semi-automatic">Semi-Automatic</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="vmanage-form-actions">
                <button 
                  type="button" 
                  className="vmanage-cancel-btn"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="vmanage-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Clock size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                    </>
                  )}
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
