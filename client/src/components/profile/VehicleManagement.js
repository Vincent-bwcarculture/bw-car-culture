// client/src/components/profile/VehicleManagement.js
// FIXED VERSION - Correct flow: Plan Selection → Car Form → Admin Review → Payment → Live

import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, 
  Clock, X, Upload, DollarSign, Star, Settings, Phone, Info
} from 'lucide-react';
import axios from '../../config/axios.js';
import UserCarListingForm from './UserCarListingForm.js';
import CarListingManager from './CarListingManager/CarListingManager.js';
import './VehicleManagement.css';

const VehicleManagement = () => {
  // === MAIN STATE VARIABLES ===
  const [activeSection, setActiveSection] = useState('vehicles');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // === VEHICLE STATE ===
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // === LISTING STATE ===
  const [listingStep, setListingStep] = useState('pricing'); // 'pricing' → 'form' → 'submitted'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [pendingListingData, setPendingListingData] = useState(null);
  
  // === USER SUBMISSIONS STATE ===
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [submissionStats, setSubmissionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // === FORM STATE ===
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    color: '',
    mileage: '',
    purchaseDate: '',
    notes: ''
  });

  // === UTILITY FUNCTIONS ===
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // === DATA FETCHING FUNCTIONS ===
  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/vehicles');
      
      if (response.data.success) {
        setVehicles(response.data.data || []);
      } else {
        showMessage('error', 'Failed to load vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showMessage('error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

 const fetchUserSubmissions = async () => {
  try {
    setLoading(true);
    
    // FIXED: Use explicit full URL
    const apiUrl = 'https://bw-car-culture-api.vercel.app/api/user/my-submissions';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      setUserSubmissions(result.data.submissions || []);
      setSubmissionStats(result.data.stats || submissionStats);
    } else {
      console.error('Failed to load submissions:', result);
      showMessage('error', 'Failed to load submissions');
    }
  } catch (error) {
    console.error('Error fetching submissions:', error);
    showMessage('error', 'Failed to load submissions');
  } finally {
    setLoading(false);
  }
};

const debugAuthToken = () => {
  const authToken = localStorage.getItem('authToken');
  const token = localStorage.getItem('token');
  
  console.log('Auth Debug:', {
    authToken: authToken ? `${authToken.substring(0, 20)}...` : 'null',
    token: token ? `${token.substring(0, 20)}...` : 'null',
    hasAuth: !!(authToken || token)
  });
  
  return authToken || token;
};

useEffect(() => {
  const authToken = localStorage.getItem('authToken');
  const token = localStorage.getItem('token');
  
  console.log('🔑 Auth Debug:', {
    authToken: authToken ? `Present: ${authToken.substring(0, 20)}...` : '❌ Missing',
    token: token ? `Present: ${token.substring(0, 20)}...` : '❌ Missing',
    hasAnyAuth: !!(authToken || token)
  });
  
  if (!authToken && !token) {
    console.error('🚨 No authentication token found! User may need to log in again.');
  }
}, []);

  useEffect(() => {
    if (activeSection === 'vehicles') {
      fetchUserVehicles();
    } else if (activeSection === 'submissions') {
      fetchUserSubmissions();
    }
  }, [activeSection]);

  // === LISTING MANAGEMENT FUNCTIONS ===
  
  // Handle plan selection in preview mode
  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    console.log('Plan selected:', planId); // Debug log
    showMessage('success', 'Plan selected! Continue to fill out your car details.');
  };

  // Handle addon selection in preview mode
  const handleAddonSelection = (addonIds) => {
    setSelectedAddons(addonIds);
    console.log('Addons selected:', addonIds); // Debug log
    showMessage('info', `${addonIds.length} add-on(s) selected.`);
  };

  // Proceed from plan selection to listing form
  const handleProceedToForm = () => {
    console.log('Proceeding to form with:', { selectedPlan, selectedAddons }); // Debug log
    setListingStep('form');
    showMessage('info', 'Now fill out your car details for admin review.');
  };

  // Handle car listing form submission (FREE - for admin review)
const handleListingFormSubmit = async (listingData) => {
  try {
    setLoading(true);
    
    // FIXED: Use explicit full URL to ensure proper routing
    const apiUrl = 'https://bw-car-culture-api.vercel.app/api/user/submit-listing';
    
    console.log('Submitting to:', apiUrl);
    console.log('Listing data:', {
      ...listingData,
      selectedPlan,
      selectedAddons,
      status: 'pending_review',
      submissionType: 'free_review'
    });
    
    // Submit listing for FREE admin review - Use fetch instead of axios to avoid config issues
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        listingData: {
          ...listingData,
          selectedPlan,
          selectedAddons,
          status: 'pending_review',
          submissionType: 'free_review'
        }
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      setPendingListingData(result.data);
      setListingStep('submitted');
      showMessage('success', '🎉 Listing submitted for review! We\'ll contact you within 24-48 hours.');
      
      // Refresh submissions
      fetchUserSubmissions();
      
      // Reset form state
      setTimeout(() => {
        setSelectedPlan(null);
        setSelectedAddons([]);
        setActiveSection('submissions');
      }, 3000);
    } else {
      console.error('API Error Response:', result);
      showMessage('error', result.message || 'Failed to submit listing');
    }
  } catch (error) {
    console.error('Listing submission error:', error);
    showMessage('error', 'Failed to submit listing for review');
  } finally {
    setLoading(false);
  }
};

  // Handle payment after admin approval (separate flow)
  const handlePaymentComplete = (paymentData) => {
    showMessage('success', '🎉 Payment successful! Your listing is now live.');
    fetchUserSubmissions(); // Refresh to show updated status
  };

  // === VEHICLE MANAGEMENT FUNCTIONS ===
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    const isEditing = editingVehicle !== null;
    const url = isEditing 
      ? `/api/user/vehicles/${editingVehicle._id}` 
      : '/api/user/vehicles';
    const method = isEditing ? 'put' : 'post';

    try {
      setLoading(true);
      const response = await axios[method](url, vehicleForm);
      
      if (response.data.success) {
        await fetchUserVehicles();
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleForm({
          make: '', model: '', year: new Date().getFullYear(),
          vin: '', licensePlate: '', color: '', mileage: '',
          purchaseDate: '', notes: ''
        });
        showMessage('success', `Vehicle ${isEditing ? 'updated' : 'added'} successfully`);
      } else {
        showMessage('error', response.data.message || `Failed to ${isEditing ? 'update' : 'add'} vehicle`);
      }
    } catch (error) {
      console.error('Vehicle submit error:', error);
      showMessage('error', `Failed to ${isEditing ? 'update' : 'add'} vehicle`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage?.toString() || '',
      purchaseDate: vehicle.purchaseDate ? 
        vehicle.purchaseDate.split('T')[0] : '',
      notes: vehicle.notes || ''
    });
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`/api/user/vehicles/${vehicleId}`);
      
      if (response.data.success) {
        await fetchUserVehicles();
        showMessage('success', 'Vehicle deleted successfully');
      } else {
        showMessage('error', 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Failed to delete vehicle');
    } finally {
      setLoading(false);
    }
  };

  // === RENDER HELPER FUNCTIONS ===
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_review: { icon: Clock, color: '#f39c12', text: 'Under Review' },
      approved: { icon: CheckCircle, color: '#27ae60', text: 'Approved - Ready for Payment' },
      rejected: { icon: X, color: '#e74c3c', text: 'Needs Revision' },
      active: { icon: CheckCircle, color: '#27ae60', text: 'Live' },
      expired: { icon: AlertCircle, color: '#95a5a6', text: 'Expired' }
    };

    const config = statusConfig[status] || { icon: AlertCircle, color: '#95a5a6', text: status };
    const IconComponent = config.icon;

    return (
      <span className="status-badge" style={{ color: config.color }}>
        <IconComponent size={14} />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // === RENDER SECTIONS ===
  const renderVehicles = () => (
    <div className="vehicles-section">
      <div className="section-header">
        <h3>My Vehicles</h3>
        <button 
          className="btn-primary"
          onClick={() => setShowVehicleModal(true)}
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <Car size={48} />
          <h4>No vehicles added yet</h4>
          <p>Add your vehicles to start creating listings</p>
          <button 
            className="btn-primary"
            onClick={() => setShowVehicleModal(true)}
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="vehicle-card">
              <div className="vehicle-header">
                <h4>{vehicle.make} {vehicle.model}</h4>
                <span className="vehicle-year">{vehicle.year}</span>
              </div>
              
              <div className="vehicle-details">
                <p><strong>Color:</strong> {vehicle.color}</p>
                <p><strong>Mileage:</strong> {vehicle.mileage} km</p>
                {vehicle.licensePlate && (
                  <p><strong>License:</strong> {vehicle.licensePlate}</p>
                )}
              </div>
              
              <div className="vehicle-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleEditVehicle(vehicle)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteVehicle(vehicle._id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="submissions-section">
      <div className="section-header">
        <h3>My Submissions</h3>
        <div className="submission-stats">
          <div className="stat">
            <span className="stat-number">{submissionStats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-number">{submissionStats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-number">{submissionStats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading submissions...</p>
        </div>
      ) : userSubmissions.length === 0 ? (
        <div className="empty-state">
          <Upload size={48} />
          <h4>No submissions yet</h4>
          <p>Start by creating your first car listing</p>
          <button 
            className="btn-primary"
            onClick={() => {
              setActiveSection('create-listing');
              setListingStep('pricing');
            }}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="submissions-list">
          {userSubmissions.map(submission => (
            <div key={submission._id} className="submission-card">
              <div className="submission-header">
                <h4>{submission.listingData.title}</h4>
                {getStatusBadge(submission.status)}
              </div>
              
              <div className="submission-details">
                <p><strong>Price:</strong> P{submission.listingData.pricing?.price?.toLocaleString()}</p>
                <p><strong>Vehicle:</strong> {submission.listingData.specifications?.make} {submission.listingData.specifications?.model} ({submission.listingData.specifications?.year})</p>
                <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
                {submission.adminReview && (
                  <p><strong>Review Notes:</strong> {submission.adminReview.notes}</p>
                )}
              </div>
              
              {submission.status === 'approved' && (
                <div className="submission-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      // Trigger payment flow for approved listing
                      showMessage('info', 'Redirecting to payment...');
                    }}
                  >
                    <DollarSign size={14} />
                    Complete Payment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateListing = () => {
    // Step 1: Plan Selection (Preview Mode)
    if (listingStep === 'pricing') {
      return (
        <div className="create-listing-section">
          <div className="section-header">
            <h3>Create New Car Listing</h3>
            <div className="flow-info">
              <p className="flow-description">
                📋 <strong>How it works:</strong> Select plan → Fill car details → FREE admin review → Pay after approval → Listing goes live
              </p>
              <div className="flow-highlight">
                <Info size={16} />
                <span>No payment required upfront! Pay only after admin approval.</span>
              </div>
            </div>
          </div>
          
          <CarListingManager
            onProceedToForm={handleProceedToForm}
            onPlanSelected={handlePlanSelection}
            onAddonSelected={handleAddonSelection}
            selectedPlan={selectedPlan}
            selectedAddons={selectedAddons}
            mode="preview" // PREVIEW MODE - no payment required
            showPaymentInfo={false} // Hide payment buttons
            submitButtonText="Continue to Listing Form"
            allowSkipPlan={true} // Allow proceeding without plan selection
            onCancel={() => setActiveSection('vehicles')}
          />
        </div>
      );
    }

    // Step 2: Car Listing Form
    if (listingStep === 'form') {
      return (
        <div className="create-listing-section">
          <div className="section-header">
            <h3>Car Listing Details</h3>
            <div className="step-indicator">
              <span className="step completed">1. Plan Selected</span>
              <span className="step active">2. Car Details</span>
              <span className="step">3. Admin Review</span>
              <span className="step">4. Payment</span>
            </div>
          </div>
          
          <UserCarListingForm
            onSubmit={handleListingFormSubmit}
            onCancel={() => setListingStep('pricing')}
            selectedPlan={selectedPlan}
            selectedAddons={selectedAddons}
          />
        </div>
      );
    }

    // Step 3: Submission Confirmation
    if (listingStep === 'submitted') {
      return (
        <div className="create-listing-section">
          <div className="submission-success">
            <CheckCircle size={64} color="#27ae60" />
            <h3>Listing Submitted Successfully!</h3>
            <p>Your car listing has been submitted for admin review.</p>
            <div className="next-steps">
              <h4>What happens next?</h4>
              <ul>
                <li>✅ Admin reviews your listing (FREE)</li>
                <li>📧 You'll receive email notification within 24-48 hours</li>
                <li>💳 Pay for your selected plan after approval</li>
                <li>🚗 Your listing goes live immediately after payment</li>
              </ul>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setActiveSection('submissions')}
            >
              View My Submissions
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // === VEHICLE MODAL ===
  const renderVehicleModal = () => {
    if (!showVehicleModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <button 
              className="close-btn"
              onClick={() => {
                setShowVehicleModal(false);
                setEditingVehicle(null);
                setVehicleForm({
                  make: '', model: '', year: new Date().getFullYear(),
                  vin: '', licensePlate: '', color: '', mileage: '',
                  purchaseDate: '', notes: ''
                });
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleVehicleSubmit} className="modal-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="make">Make*</label>
                <input
                  type="text"
                  id="make"
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="model">Model*</label>
                <input
                  type="text"
                  id="model"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="year">Year*</label>
                <input
                  type="number"
                  id="year"
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="mileage"
                  value={vehicleForm.mileage}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, mileage: e.target.value }))}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="licensePlate">License Plate</label>
                <input
                  type="text"
                  id="licensePlate"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="vin">VIN</label>
              <input
                type="text"
                id="vin"
                value={vehicleForm.vin}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, vin: e.target.value }))}
              />
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="purchaseDate">Purchase Date</label>
              <input
                type="date"
                id="purchaseDate"
                value={vehicleForm.purchaseDate}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={vehicleForm.notes}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicle(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // === MAIN RENDER ===
  return (
    <div className="vehicle-management">
      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <div className="message-content">
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'info' && <Info size={16} />}
            <span>{message.text}</span>
          </div>
          <button 
            className="message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="section-tabs">
        <button 
          className={`tab-button ${activeSection === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveSection('vehicles')}
        >
          <Car size={16} />
          My Vehicles
        </button>
        
        <button 
          className={`tab-button ${activeSection === 'create-listing' ? 'active' : ''}`}
          onClick={() => {
            setActiveSection('create-listing');
            setListingStep('pricing');
          }}
        >
          <Plus size={16} />
          Create Listing
        </button>
        
        <button 
          className={`tab-button ${activeSection === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveSection('submissions')}
        >
          <Upload size={16} />
          My Submissions
        </button>
      </div>

      {/* Content Areas */}
      {activeSection === 'vehicles' && renderVehicles()}
      {activeSection === 'create-listing' && renderCreateListing()}
      {activeSection === 'submissions' && renderSubmissions()}

      {/* Vehicle Modal */}
      {renderVehicleModal()}
    </div>
  );
};

export default VehicleManagement;
