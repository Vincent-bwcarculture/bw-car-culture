// client/src/components/profile/VehicleManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit2, Trash2, Settings, DollarSign, Calendar, 
  Bell, AlertCircle, Check, X, Save, Upload, Camera, Eye,
  Wrench, Gas, Navigation, Award, TrendingUp
} from 'lucide-react';
import axios from '../../config/axios.js';
import './VehicleManagement.css';

const VehicleManagement = ({ profileData, refreshProfile }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my_vehicles');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleFormData, setVehicleFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserVehicles();
  }, []);

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
      
      // Insurance & Documentation
      insuranceProvider: vehicle?.insurance?.provider || '',
      insurancePolicyNumber: vehicle?.insurance?.policyNumber || '',
      insuranceExpiryDate: vehicle?.insurance?.expiryDate || '',
      
      // Performance tracking
      averageFuelConsumption: vehicle?.performance?.averageFuelConsumption || '',
      maintenanceCosts: vehicle?.performance?.maintenanceCosts || '',
      
      // Additional features
      features: vehicle?.features || [],
      images: vehicle?.images || [],
      
      // Notes
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

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehicleFormData.year || !vehicleFormData.make || !vehicleFormData.model) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = editingVehicle 
        ? `/user/vehicles/${editingVehicle._id}`
        : '/user/vehicles';
      
      const method = editingVehicle ? 'put' : 'post';
      
      const response = await axios[method](endpoint, vehicleFormData);
      
      if (response.data.success) {
        await fetchUserVehicles();
        await refreshProfile();
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleFormData({});
        showMessage('success', editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`/user/vehicles/${vehicleId}`);
      if (response.data.success) {
        await fetchUserVehicles();
        await refreshProfile();
        showMessage('success', 'Vehicle deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Failed to delete vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSellVehicle = async (vehicle) => {
    const salePrice = prompt('Enter the sale price:', vehicle.salePrice || '');
    if (!salePrice) return;

    try {
      setLoading(true);
      const response = await axios.put(`/user/vehicles/${vehicle._id}`, {
        ...vehicle,
        forSale: true,
        salePrice: parseFloat(salePrice)
      });
      
      if (response.data.success) {
        await fetchUserVehicles();
        showMessage('success', 'Vehicle listed for sale successfully!');
      }
    } catch (error) {
      console.error('Error listing vehicle for sale:', error);
      showMessage('error', 'Failed to list vehicle for sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (vehicle) => {
    // Redirect to service booking or show service modal
    showMessage('info', 'Service booking feature coming soon!');
  };

  const isServiceDue = (vehicle) => {
    if (!vehicle.nextServiceDue) return false;
    const dueDate = new Date(vehicle.nextServiceDue);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30; // Service due in 30 days or less
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

  const tabs = [
    { id: 'my_vehicles', label: 'My Vehicles', icon: Car },
    { id: 'service_history', label: 'Service History', icon: Wrench },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

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
                        <img src={vehicle.images[0].url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
                      ) : (
                        <div className="vmanage-vehicle-placeholder">
                          <Car size={40} />
                        </div>
                      )}
                      <div className="vmanage-vehicle-age-badge">
                        {getVehicleAge(vehicle.year)} years
                      </div>
                    </div>
                    
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
                    <h4 className="vmanage-vehicle-title">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h4>
                    {vehicle.variant && (
                      <p className="vmanage-vehicle-variant">{vehicle.variant}</p>
                    )}

                    <div className="vmanage-vehicle-specs">
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Mileage</span>
                        <span className="vmanage-spec-value">{vehicle.mileage || 'N/A'} km</span>
                      </div>
                      <div className="vmanage-spec-item">
                        <span className="vmanage-spec-label">Fuel Type</span>
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
                      <div className={`vmanage-status-badge ${vehicle.forSale ? 'for-sale' : 'not-for-sale'}`}>
                        {vehicle.forSale ? `For Sale - ${formatCurrency(vehicle.salePrice)}` : 'Not for Sale'}
                      </div>
                      {isServiceDue(vehicle) && (
                        <div className="vmanage-status-badge service-due">
                          <Bell size={12} />
                          Service Due
                        </div>
                      )}
                    </div>

                    <div className="vmanage-vehicle-stats">
                      <div className="vmanage-stat-item">
                        <Calendar size={14} />
                        <span>Last Service: {formatDate(vehicle.lastServiceDate)}</span>
                      </div>
                      {vehicle.nextServiceDue && (
                        <div className="vmanage-stat-item">
                          <Bell size={14} />
                          <span>Next Service: {formatDate(vehicle.nextServiceDue)}</span>
                        </div>
                      )}
                    </div>

                    <div className="vmanage-vehicle-quick-actions">
                      <button 
                        className="vmanage-quick-action-btn vmanage-service-btn"
                        onClick={() => handleBookService(vehicle)}
                      >
                        <Settings size={14} />
                        Book Service
                      </button>
                      {!vehicle.forSale && (
                        <button 
                          className="vmanage-quick-action-btn vmanage-sell-btn"
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
            Vehicle Performance Analytics
          </h3>
          <div className="vmanage-performance-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vmanage-performance-card">
                <h4>{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                <div className="vmanage-performance-metrics">
                  <div className="vmanage-performance-metric">
                    <span className="vmanage-metric-label">Fuel Consumption</span>
                    <span className="vmanage-metric-value">
                      {vehicle.performance?.averageFuelConsumption || 'N/A'} L/100km
                    </span>
                  </div>
                  <div className="vmanage-performance-metric">
                    <span className="vmanage-metric-label">Maintenance Costs</span>
                    <span className="vmanage-metric-value">
                      {formatCurrency(vehicle.performance?.maintenanceCosts)}
                    </span>
                  </div>
                  <div className="vmanage-performance-metric">
                    <span className="vmanage-metric-label">Current Value</span>
                    <span className="vmanage-metric-value">
                      {formatCurrency(vehicle.currentValue || vehicle.purchasePrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="vmanage-modal-overlay">
          <div className="vmanage-modal">
            <div className="vmanage-modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button 
                className="vmanage-close-modal-btn"
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicle(null);
                  setVehicleFormData({});
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="vmanage-modal-form">
              <div className="vmanage-form-section">
                <h4>Basic Information</h4>
                <div className="vmanage-form-row">
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Year *</label>
                    <input
                      type="number"
                      className="vmanage-form-input"
                      value={vehicleFormData.year || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, year: e.target.value }))}
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Make *</label>
                    <input
                      type="text"
                      className="vmanage-form-input"
                      value={vehicleFormData.make || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="e.g., Toyota, BMW, Ford"
                      required
                    />
                  </div>
                </div>

                <div className="vmanage-form-row">
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Model *</label>
                    <input
                      type="text"
                      className="vmanage-form-input"
                      value={vehicleFormData.model || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g., Corolla, X3, Focus"
                      required
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Variant</label>
                    <input
                      type="text"
                      className="vmanage-form-input"
                      value={vehicleFormData.variant || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, variant: e.target.value }))}
                      placeholder="e.g., XLE, M Sport, Titanium"
                    />
                  </div>
                </div>

                <div className="vmanage-form-row">
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Color</label>
                    <input
                      type="text"
                      className="vmanage-form-input"
                      value={vehicleFormData.color || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g., White, Black, Silver"
                    />
                  </div>
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Mileage (km)</label>
                    <input
                      type="number"
                      className="vmanage-form-input"
                      value={vehicleFormData.mileage || ''}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, mileage: e.target.value }))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="vmanage-form-section">
                <h4>Vehicle Specifications</h4>
                <div className="vmanage-form-row">
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Fuel Type</label>
                    <select
                      className="vmanage-form-select"
                      value={vehicleFormData.fuelType || 'petrol'}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, fuelType: e.target.value }))}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                  <div className="vmanage-form-group">
                    <label className="vmanage-form-label">Transmission</label>
                    <select
                      className="vmanage-form-select"
                      value={vehicleFormData.transmission || 'manual'}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, transmission: e.target.value }))}
                    >
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                      <option value="cvt">CVT</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="vmanage-form-actions">
                <button 
                  type="button"
                  className="vmanage-btn vmanage-btn-secondary"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="vmanage-btn vmanage-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="vmanage-loading-overlay">
          <div className="vmanage-loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
