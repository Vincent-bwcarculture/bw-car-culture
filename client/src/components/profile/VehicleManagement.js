// client/src/components/profile/VehicleManagement.js
// UPDATED VERSION with ProfilePricingSection integrated

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
import ProfilePricingSection from './ProfilePricingSection.js'; // NEW IMPORT

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

  // NEW: Pricing and addon state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [sellerType, setSellerType] = useState('private');

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
    fetchUserSellerType(); // NEW: Get user's seller type
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
        default:
          break;
      }
    }
  }, [urlAction]);

  // NEW: Fetch user's seller type
  const fetchUserSellerType = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      if (response.data.success && response.data.data.sellerType) {
        setSellerType(response.data.data.sellerType);
      }
    } catch (error) {
      console.error('Error fetching seller type:', error);
      // Default to private if we can't fetch
      setSellerType('private');
    }
  };

  // Load user vehicles
  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showMessage('error', 'Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Show message utility
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle vehicle operations
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleFormData({});
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleFormData(vehicle);
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = (vehicleId) => {
    setShowDeleteConfirm(vehicleId);
  };

  const confirmDeleteVehicle = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/user/vehicles/${showDeleteConfirm}`);
      
      if (response.data.success) {
        await fetchUserVehicles();
        showMessage('success', 'Vehicle deleted successfully');
        setShowDeleteConfirm(null);
      } else {
        showMessage('error', response.data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Failed to delete vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle form save
  const handleVehicleSave = async (vehicleData) => {
    try {
      setLoading(true);
      const isEditing = editingVehicle && editingVehicle._id;
      
      const response = isEditing 
        ? await axios.put(`/api/user/vehicles/${editingVehicle._id}`, vehicleData)
        : await axios.post('/api/user/vehicles', vehicleData);

      if (response.data.success) {
        await fetchUserVehicles();
        setShowVehicleModal(false);
        showMessage('success', isEditing ? 'Vehicle updated successfully' : 'Vehicle added successfully');
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

  // Handle car listing form submission
  const handleListingFormSubmit = async (listingData) => {
    try {
      setLoading(true);
      
      // Check if plan is selected
      if (!selectedPlan) {
        showMessage('error', 'Please select a listing plan first');
        return;
      }

      // Store listing data and proceed to payment
      setPendingListingData({
        ...listingData,
        selectedPlan,
        selectedAddons
      });
      
      // Move to subscription step
      setListingStep('subscription');
      showMessage('info', 'Listing saved! Now complete your payment to publish.');
      
    } catch (error) {
      console.error('Error processing listing:', error);
      showMessage('error', 'Failed to process listing');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle plan selection from pricing section
  const handlePlanSelection = (planId, planDetails) => {
    setSelectedPlan(planId);
    showMessage('success', `${planDetails.name} plan selected`);
  };

  // NEW: Handle addon selection from pricing section
  const handleAddonSelection = (addonIds) => {
    setSelectedAddons(addonIds);
    if (addonIds.length > 0) {
      showMessage('info', `${addonIds.length} add-on${addonIds.length > 1 ? 's' : ''} selected`);
    }
  };

  // Handle listing payment completion
  const handleListingPaymentComplete = async (paymentData) => {
    try {
      setLoading(true);
      
      // Create the actual listing with payment data
      const response = await axios.post('/api/listings/create', {
        ...pendingListingData,
        paymentData
      });
      
      if (response.data.success) {
        showMessage('success', 'Your car is now listed for sale!');
        setListingStep('form');
        setPendingListingData(null);
        setSelectedPlan(null);
        setSelectedAddons([]);
        setActiveTab('my_vehicles');
        await fetchUserVehicles();
      } else {
        showMessage('error', response.data.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      showMessage('error', 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Vehicle action handlers
  const handleSellVehicle = (vehicle) => {
    setActiveTab('sell_vehicle');
    setListingStep('form');
    // Pre-populate form with vehicle data if available
    if (vehicle) {
      showMessage('info', `Preparing to list ${vehicle.make} ${vehicle.model} for sale`);
    }
  };

  const handleGetValuation = (vehicle) => {
    setActiveTab('get_valuation');
    if (vehicle) {
      showMessage('info', `Getting valuation for ${vehicle.make} ${vehicle.model}`);
    }
  };

  // Render individual vehicle card
  const renderVehicleCard = (vehicle) => (
    <div key={vehicle._id} className="vmanage-vehicle-card">
      <div className="vmanage-vehicle-image">
        {vehicle.images && vehicle.images.length > 0 ? (
          <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} />
        ) : (
          <div className="vmanage-no-image">
            <Car size={48} />
          </div>
        )}
      </div>
      
      <div className="vmanage-vehicle-info">
        <div className="vmanage-vehicle-header">
          <h4 className="vmanage-vehicle-title">{vehicle.make} {vehicle.model}</h4>
          <p className="vmanage-vehicle-variant">{vehicle.year} • {vehicle.variant || 'Standard'}</p>
        </div>
        
        <div className="vmanage-vehicle-specs">
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Mileage</span>
            <span className="vmanage-spec-value">{vehicle.mileage?.toLocaleString() || 'N/A'} km</span>
          </div>
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Fuel Type</span>
            <span className="vmanage-spec-value">{vehicle.fuelType || 'N/A'}</span>
          </div>
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Transmission</span>
            <span className="vmanage-spec-value">{vehicle.transmission || 'N/A'}</span>
          </div>
          <div className="vmanage-spec-item">
            <span className="vmanage-spec-label">Status</span>
            <span className="vmanage-spec-value">{vehicle.isForSale ? 'For Sale' : 'Personal Use'}</span>
          </div>
        </div>
        
        <div className="vmanage-vehicle-quick-actions">
          <button 
            className="vmanage-quick-action-btn vmanage-sell-btn"
            onClick={() => handleSellVehicle(vehicle)}
            title="List this vehicle for sale"
          >
            <DollarSign size={14} />
            Sell
          </button>
          <button 
            className="vmanage-quick-action-btn vmanage-valuation-btn"
            onClick={() => handleGetValuation(vehicle)}
            title="Get current market valuation"
          >
            <Calculator size={14} />
            Value
          </button>
          <button 
            className="vmanage-quick-action-btn vmanage-service-btn"
            onClick={() => handleEditVehicle(vehicle)}
            title="Edit vehicle details"
          >
            <Edit2 size={14} />
            Edit
          </button>
        </div>
      </div>
      
      <div className="vmanage-vehicle-actions">
        <button 
          className="vmanage-vehicle-action-btn"
          onClick={() => handleEditVehicle(vehicle)}
          title="Edit vehicle"
        >
          <Edit2 size={16} />
        </button>
        <button 
          className="vmanage-vehicle-action-btn vmanage-delete-btn"
          onClick={() => handleDeleteVehicle(vehicle._id)}
          title="Delete vehicle"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="vmanage-container">
      {/* Message Display */}
      {message.text && (
        <div className={`vmanage-message ${message.type}`}>
          <div className="vmanage-message-content">
            {message.type === 'success' && <Check size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'info' && <Bell size={16} />}
            <span>{message.text}</span>
          </div>
          <button 
            className="vmanage-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-delete-confirmation">
            <div className="vmanage-confirmation-header">
              <h3>Delete Vehicle</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="vmanage-confirmation-content">
              <p>Are you sure you want to delete this vehicle from your garage? This action cannot be undone.</p>
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

      {/* UPDATED: Sell Vehicle Tab with Pricing Section */}
      {activeTab === 'sell_vehicle' && (
        <div className="vmanage-sell-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <DollarSign size={20} />
              List Your Car for Sale
            </h3>
            <p>Choose your plan, add optional services, and create your listing</p>
          </div>

          {listingStep === 'form' ? (
            <>
              {/* NEW: Pricing Section at the top */}
              <ProfilePricingSection
                onPlanSelect={handlePlanSelection}
                onAddonSelect={handleAddonSelection}
                sellerType={sellerType}
                showAddons={true}
              />

              {/* Car Listing Form */}
              <UserCarListingForm 
                onSubmit={handleListingFormSubmit}
                onCancel={() => {
                  setActiveTab('my_vehicles');
                  setSelectedPlan(null);
                  setSelectedAddons([]);
                }}
                initialData={null}
                selectedPlan={selectedPlan}
                selectedAddons={selectedAddons}
              />
            </>
          ) : (
            // Subscription/Payment Step
            <CarListingManager 
              listingData={pendingListingData}
              onPaymentComplete={handleListingPaymentComplete}
              onCancel={() => {
                setListingStep('form');
                setPendingListingData(null);
              }}
            />
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
            <p>Get an instant market valuation for your vehicle</p>
          </div>
          
          <div className="vmanage-valuation-content">
            <div className="vmanage-valuation-info">
              <h4>Quick Vehicle Valuation</h4>
              <p>Get an accurate market value assessment for your vehicle based on current market conditions, vehicle condition, and local demand.</p>
              
              <div className="vmanage-valuation-features">
                <div className="vmanage-feature-item">
                  <CheckCircle size={16} />
                  <span>Instant market analysis</span>
                </div>
                <div className="vmanage-feature-item">
                  <CheckCircle size={16} />
                  <span>Local market comparison</span>
                </div>
                <div className="vmanage-feature-item">
                  <CheckCircle size={16} />
                  <span>Professional assessment</span>
                </div>
              </div>
              
              <button 
                className="vmanage-valuation-cta-btn"
                onClick={() => {
                  const whatsappNumber = '+26774122453';
                  const message = encodeURIComponent('Hi! I would like to get a valuation for my vehicle. Please assist me with the process.');
                  window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                }}
              >
                <Phone size={16} />
                Get Free Valuation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs remain the same... */}
      {activeTab === 'insurance' && (
        <div className="vmanage-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Shield size={20} />
              Insurance Management
            </h3>
          </div>
          <div className="vmanage-coming-soon">
            <p>Insurance management features coming soon</p>
          </div>
        </div>
      )}

      {activeTab === 'service_history' && (
        <div className="vmanage-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <Wrench size={20} />
              Service History
            </h3>
          </div>
          <div className="vmanage-coming-soon">
            <p>Service history tracking coming soon</p>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="vmanage-section">
          <div className="vmanage-section-header">
            <h3 className="vmanage-section-title">
              <TrendingUp size={20} />
              Performance Analytics
            </h3>
          </div>
          <div className="vmanage-coming-soon">
            <p>Vehicle performance analytics coming soon</p>
          </div>
        </div>
      )}

      {/* Vehicle Modal - existing modal code remains the same */}
      {showVehicleModal && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-vehicle-modal">
            <div className="vmanage-modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => setShowVehicleModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Vehicle form content would go here */}
            <div className="vmanage-modal-content">
              <p>Vehicle form component would be integrated here</p>
              <div className="vmanage-modal-actions">
                <button 
                  className="vmanage-cancel-btn"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="vmanage-save-btn"
                  onClick={() => handleVehicleSave(vehicleFormData)}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Vehicle'}
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
