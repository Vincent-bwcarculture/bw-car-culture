// client/src/components/profile/VehicleManagement.js
// COMPLETE FIXED VERSION with all required state variables and dependencies

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
  const [activeSection, setActiveSection] = useState('vehicles'); // Fixed: activeSection defined
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // === VEHICLE STATE ===
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // === LISTING STATE ===
  const [showListingForm, setShowListingForm] = useState(false); // Fixed: setShowListingForm defined
  const [listingStep, setListingStep] = useState('pricing'); // Show pricing first for browsing, but no payment required
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

  // === VEHICLE MODAL MANAGEMENT ===
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
      const response = await axios.get('/api/user/my-submissions');
      if (response.data.success) {
        setUserSubmissions(response.data.data || []);
        
        // Calculate stats
        const submissions = response.data.data || [];
        const stats = {
          total: submissions.length,
          pending: submissions.filter(s => s.status === 'pending_review').length,
          approved: submissions.filter(s => s.status === 'approved').length,
          rejected: submissions.filter(s => s.status === 'rejected').length
        };
        setSubmissionStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user submissions:', error);
    }
  };

  // === VEHICLE CRUD OPERATIONS ===
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      showMessage('error', 'Make and model are required');
      return;
    }

    try {
      setLoading(true);
      
      const vehicleData = {
        ...vehicleForm,
        year: parseInt(vehicleForm.year),
        mileage: vehicleForm.mileage ? parseInt(vehicleForm.mileage) : null
      };

      const response = editingVehicle 
        ? await axios.put(`/api/user/vehicles/${editingVehicle._id}`, vehicleData)
        : await axios.post('/api/user/vehicles', vehicleData);

      if (response.data.success) {
        await fetchUserVehicles();
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleForm({
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
        showMessage('success', editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
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

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage || '',
      purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.split('T')[0] : '',
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

  // === LISTING MANAGEMENT FUNCTIONS ===
  
  // FIXED: Handle car listing form submission - NO PAYMENT REQUIRED YET
  const handleListingFormSubmit = async (listingData) => {
    try {
      setLoading(true);
      console.log('Submitting user listing for admin review...', listingData);
      
      // NO PLAN REQUIRED - user submits for free review first
      // Payment happens AFTER admin approval

      // FIXED: Submit to the correct user submission endpoint
      const response = await axios.post('/api/user/submit-listing', {
        listingData: {
          ...listingData,
          // Don't include plan/addons yet - those come after admin approval
          status: 'pending_review',
          submissionType: 'free_review' // Mark as free submission for review
        }
      });

      if (response.data.success) {
        showMessage('success', '🎉 Listing submitted successfully! Our team will review it within 24-48 hours and contact you about next steps.');
        
        // Reset form data
        setPendingListingData(null);
        
        // Close the listing form and go back to submissions view
        setShowListingForm(false);
        setListingStep('form'); // Reset to form step
        setActiveSection('submissions'); // Show user their submissions
        
        // Refresh submissions to show the new one
        await fetchUserSubmissions();
        
      } else {
        showMessage('error', response.data.message || 'Failed to submit listing');
      }
      
    } catch (error) {
      console.error('Error submitting listing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit listing for review';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle plan selection from pricing section
  const handlePlanSelection = (planId, planDetails) => {
    setSelectedPlan(planId);
    showMessage('success', `${planDetails?.name || planId} plan selected`);
  };

  // Handle addon selection from pricing section
  const handleAddonSelection = (addonIds) => {
    setSelectedAddons(addonIds);
    if (addonIds.length > 0) {
      showMessage('info', `${addonIds.length} add-on${addonIds.length > 1 ? 's' : ''} selected`);
    }
  };

  // === FORM INPUT HANDLERS ===
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // === LIFECYCLE HOOKS ===
  useEffect(() => {
    if (activeSection === 'vehicles') {
      fetchUserVehicles();
    } else if (activeSection === 'submissions') {
      fetchUserSubmissions();
    }
  }, [activeSection]);

  // === UTILITY FUNCTIONS ===
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_review': { icon: Clock, color: 'orange', label: 'Pending Review' },
      'approved': { icon: CheckCircle, color: 'green', label: 'Approved' },
      'rejected': { icon: X, color: 'red', label: 'Rejected' },
      'listing_created': { icon: Car, color: 'blue', label: 'Listing Created' }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const IconComponent = config.icon;

    return (
      <span className={`status-badge status-${config.color}`}>
        <IconComponent size={14} />
        {config.label}
      </span>
    );
  };

  // === RENDER FUNCTIONS ===
  const renderVehicleModal = () => {
    if (!showVehicleModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <button 
              className="modal-close"
              onClick={() => {
                setShowVehicleModal(false);
                setEditingVehicle(null);
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleVehicleSubmit} className="vehicle-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="make">Make *</label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={vehicleForm.make}
                  onChange={handleInputChange}
                  placeholder="e.g., Toyota"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={vehicleForm.model}
                  onChange={handleInputChange}
                  placeholder="e.g., Camry"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={vehicleForm.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={vehicleForm.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Silver"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN</label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={vehicleForm.vin}
                  onChange={handleInputChange}
                  placeholder="Vehicle Identification Number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="licensePlate">License Plate</label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={vehicleForm.licensePlate}
                  onChange={handleInputChange}
                  placeholder="License plate number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={vehicleForm.mileage}
                  onChange={handleInputChange}
                  placeholder="Current mileage"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchaseDate">Purchase Date</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={vehicleForm.purchaseDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={vehicleForm.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about this vehicle"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicle(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderVehiclesList = () => (
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
          <h4>No vehicles yet</h4>
          <p>Add your first vehicle to get started with listings</p>
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
              <div className="vehicle-info">
                <h4>{vehicle.make} {vehicle.model}</h4>
                <p className="vehicle-year">{vehicle.year}</p>
                {vehicle.color && <p className="vehicle-detail">Color: {vehicle.color}</p>}
                {vehicle.mileage && <p className="vehicle-detail">Mileage: {vehicle.mileage.toLocaleString()} km</p>}
                {vehicle.licensePlate && <p className="vehicle-detail">Plate: {vehicle.licensePlate}</p>}
              </div>
              
              <div className="vehicle-actions">
                <button 
                  className="btn-icon"
                  onClick={() => handleEditVehicle(vehicle)}
                  title="Edit vehicle"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="btn-icon"
                  onClick={() => handleDeleteVehicle(vehicle._id)}
                  title="Delete vehicle"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmissionsList = () => (
    <div className="submissions-section">
      <div className="section-header">
        <h3>My Listing Submissions</h3>
        <div className="stats-summary">
          <span className="stat">Total: {submissionStats.total}</span>
          <span className="stat pending">Pending: {submissionStats.pending}</span>
          <span className="stat approved">Approved: {submissionStats.approved}</span>
          {submissionStats.rejected > 0 && (
            <span className="stat rejected">Rejected: {submissionStats.rejected}</span>
          )}
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
              setListingStep('pricing'); // Start with pricing/plan showcase
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
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateListing = () => {
    if (listingStep === 'pricing') {
      return (
        <div className="create-listing-section">
          <div className="section-header">
            <h3>Create New Car Listing</h3>
            <div className="flow-info">
              <p className="flow-description">
                📋 <strong>How it works:</strong> Browse plans below → Fill out your car details → Admin reviews (FREE) → Pay for approved plan → Listing goes live
              </p>
              <div className="flow-highlight">
                <Info size={16} />
                <span>No payment required upfront! Select a plan to see what you'll get, then submit for free review.</span>
              </div>
            </div>
          </div>
          
          {/* SIMPLIFIED: Show plan selection inline instead of complex CarListingManager */}
          <div className="inline-plan-selection">
            <h4>Choose Your Plan (Optional)</h4>
            <p>Browse our plans to see what you'll get after admin approval. You can also skip and choose later.</p>
            
            <div className="quick-plans-grid">
              <div className={`quick-plan-card ${selectedPlan === 'basic' ? 'selected' : ''}`}
                   onClick={() => setSelectedPlan('basic')}>
                <h5>Basic Plan</h5>
                <div className="plan-price">P100</div>
                <ul>
                  <li>30 days listing</li>
                  <li>Basic visibility</li>
                  <li>Email support</li>
                </ul>
              </div>
              
              <div className={`quick-plan-card ${selectedPlan === 'standard' ? 'selected' : ''}`}
                   onClick={() => setSelectedPlan('standard')}>
                <h5>Standard Plan</h5>
                <div className="plan-price">P200</div>
                <ul>
                  <li>45 days listing</li>
                  <li>Enhanced visibility</li>
                  <li>Priority support</li>
                </ul>
              </div>
              
              <div className={`quick-plan-card ${selectedPlan === 'premium' ? 'selected' : ''}`}
                   onClick={() => setSelectedPlan('premium')}>
                <h5>Premium Plan</h5>
                <div className="plan-price">P300</div>
                <ul>
                  <li>60 days listing</li>
                  <li>Featured placement</li>
                  <li>Premium support</li>
                </ul>
              </div>
            </div>
            
            <div className="plan-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSelectedPlan(null);
                  setListingStep('form');
                }}
              >
                Skip for Now
              </button>
              
              <button 
                className="btn-primary"
                onClick={() => setListingStep('form')}
              >
                Continue to Listing Form
              </button>
            </div>
          </div>
        </div>
      );
    }

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
            onCancel={() => {
              setListingStep('pricing'); // Go back to plan selection
            }}
            selectedPlan={selectedPlan}
            selectedAddons={selectedAddons}
            showPlanSelection={false} // Don't show plan selection in form
            showSelectedPlanSummary={true} // Show what they selected
          />
        </div>
      );
    }

    return null;
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
          onClick={() => setActiveSection('create-listing')}
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
          {submissionStats.pending > 0 && (
            <span className="notification-badge">{submissionStats.pending}</span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeSection === 'vehicles' && renderVehiclesList()}
        {activeSection === 'create-listing' && renderCreateListing()}
        {activeSection === 'submissions' && renderSubmissionsList()}
      </div>

      {/* Modals */}
      {renderVehicleModal()}
    </div>
  );
};

export default VehicleManagement;
