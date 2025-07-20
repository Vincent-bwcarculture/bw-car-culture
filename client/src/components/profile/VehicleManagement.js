// client/src/components/profile/VehicleManagement.js
// IMPROVED VERSION WITH BETTER STYLING AND LAYOUT

import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, 
  Clock, X, Upload, DollarSign, Star, Settings, Phone, Info, Image
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
    rejected: 0,
    listing_created: 0
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

  // Debug auth token function
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

  // Status badge function with improved styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_review: {
        icon: '⏳',
        color: '#d97706',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        label: 'Pending Review'
      },
      approved: {
        icon: '✅',
        color: '#059669',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        label: 'Approved'
      },
      rejected: {
        icon: '❌',
        color: '#dc2626',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        label: 'Rejected'
      },
      listing_created: {
        icon: '🚗',
        color: '#2563eb',
        bgColor: '#dbeafe',
        borderColor: '#3b82f6',
        label: 'Live'
      },
      payment_pending: {
        icon: '💳',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        borderColor: '#8b5cf6',
        label: 'Payment Required'
      }
    };

    const config = statusConfig[status] || statusConfig.pending_review;

    return (
      <span 
        className="vm-status-badge"
        data-status={status}
        style={{
          '--status-color': config.color,
          '--status-bg': config.bgColor,
          '--status-border': config.borderColor
        }}
      >
        <span className="vm-status-icon">{config.icon}</span>
        <span className="vm-status-text">{config.label}</span>
      </span>
    );
  };

  // Format date function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get primary image from submission
  const getPrimaryImage = (submission) => {
    if (!submission?.listingData?.images) return null;
    
    const images = submission.listingData.images;
    if (Array.isArray(images) && images.length > 0) {
      // Return first image or primary image if specified
      const primaryIndex = submission.listingData.primaryImageIndex || 0;
      return images[primaryIndex] || images[0];
    }
    
    return null;
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

  // FIXED: Updated fetchUserSubmissions function
  const fetchUserSubmissions = async () => {
    try {
      setLoading(true);
      
      // FIXED: Use correct endpoint and fetch method
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
        // FIXED: Handle the correct data structure
        const submissions = result.data || [];
        setUserSubmissions(submissions);
        
        // FIXED: Calculate stats from submissions data
        const calculatedStats = {
          total: submissions.length,
          pending: submissions.filter(s => s.status === 'pending_review').length,
          approved: submissions.filter(s => s.status === 'approved').length,
          rejected: submissions.filter(s => s.status === 'rejected').length,
          listing_created: submissions.filter(s => s.status === 'listing_created').length
        };
        
        setSubmissionStats(calculatedStats);
        
        console.log('✅ Submissions loaded:', {
          count: submissions.length,
          stats: calculatedStats
        });
      } else {
        console.error('Failed to load submissions:', result);
        showMessage('error', result.message || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      showMessage('error', 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  // Debug auth token on component mount
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

  // === RENDER SECTIONS ===
  const renderVehicles = () => (
    <div className="vm-vehicles-section">
      <div className="vm-section-header">
        <h3>My Vehicles</h3>
        <button 
          className="vm-btn vm-btn-primary"
          onClick={() => setShowVehicleModal(true)}
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {loading ? (
        <div className="vm-loading-state">
          <div className="vm-spinner"></div>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="vm-empty-state">
          <Car size={48} />
          <h4>No vehicles added yet</h4>
          <p>Add your vehicles to start creating listings</p>
          <button 
            className="vm-btn vm-btn-primary"
            onClick={() => setShowVehicleModal(true)}
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="vm-vehicles-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="vm-vehicle-card">
              <div className="vm-vehicle-header">
                <h4>{vehicle.make} {vehicle.model}</h4>
                <span className="vm-vehicle-year">{vehicle.year}</span>
              </div>
              
              <div className="vm-vehicle-details">
                <p><strong>Color:</strong> {vehicle.color}</p>
                <p><strong>Mileage:</strong> {vehicle.mileage} km</p>
                {vehicle.licensePlate && (
                  <p><strong>License:</strong> {vehicle.licensePlate}</p>
                )}
              </div>
              
              <div className="vm-vehicle-actions">
                <button 
                  className="vm-btn vm-btn-secondary"
                  onClick={() => handleEditVehicle(vehicle)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  className="vm-btn vm-btn-danger"
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

  // IMPROVED: Better submissions layout with images and compact design
  const renderSubmissions = () => (
    <div className="vm-submissions-section">
      <div className="vm-section-header">
        <h3>My Submissions</h3>
        <div className="vm-submission-stats">
          <div className="vm-stat">
            <span className="vm-stat-number">{submissionStats.total}</span>
            <span className="vm-stat-label">Total</span>
          </div>
          <div className="vm-stat">
            <span className="vm-stat-number">{submissionStats.pending}</span>
            <span className="vm-stat-label">Pending</span>
          </div>
          <div className="vm-stat">
            <span className="vm-stat-number">{submissionStats.approved}</span>
            <span className="vm-stat-label">Approved</span>
          </div>
          <div className="vm-stat">
            <span className="vm-stat-number">{submissionStats.rejected}</span>
            <span className="vm-stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="vm-loading-state">
          <div className="vm-spinner"></div>
          <p>Loading submissions...</p>
        </div>
      ) : userSubmissions.length === 0 ? (
        <div className="vm-empty-state">
          <Upload size={48} />
          <h4>No submissions yet</h4>
          <p>Create your first car listing to see submissions here</p>
          <button 
            className="vm-btn vm-btn-primary"
            onClick={() => setActiveSection('create-listing')}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="vm-submissions-grid">
          {userSubmissions.map(submission => {
            const primaryImage = getPrimaryImage(submission);
            
            return (
              <div key={submission._id} className="vm-submission-card">
                <div className="vm-submission-main">
                  {/* Image Section */}
                  <div className="vm-submission-image">
                    {primaryImage ? (
                      <img 
                        src={primaryImage} 
                        alt={submission.listingData?.title || 'Car listing'}
                        className="vm-car-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`vm-image-placeholder ${primaryImage ? 'vm-hidden' : ''}`}>
                      <Image size={24} />
                      <span>No Image</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="vm-submission-content">
                    <div className="vm-submission-header">
                      <h4 className="vm-submission-title">
                        {submission.listingData?.title || 'Untitled Listing'}
                      </h4>
                      {getStatusBadge(submission.status)}
                    </div>

                    <div className="vm-submission-details">
                      <div className="vm-detail-row">
                        <span className="vm-detail-label">Vehicle:</span>
                        <span className="vm-detail-value">
                          {submission.listingData?.specifications?.year} {submission.listingData?.specifications?.make} {submission.listingData?.specifications?.model}
                        </span>
                      </div>
                      
                      <div className="vm-detail-row">
                        <span className="vm-detail-label">Price:</span>
                        <span className="vm-detail-value vm-price">
                          {submission.listingData?.pricing?.price 
                            ? `P${submission.listingData.pricing.price.toLocaleString()}`
                            : 'Not specified'
                          }
                        </span>
                      </div>

                      <div className="vm-detail-row">
                        <span className="vm-detail-label">Location:</span>
                        <span className="vm-detail-value">
                          📍 {submission.listingData?.contact?.location?.city || 'Not specified'}
                        </span>
                      </div>

                      <div className="vm-detail-row">
                        <span className="vm-detail-label">Submitted:</span>
                        <span className="vm-detail-value vm-date">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status-specific actions */}
                <div className="vm-submission-actions">
                  {submission.status === 'pending_review' && (
                    <div className="vm-status-message vm-status-pending">
                      <Info size={14} />
                      <span>Your listing is being reviewed by our team. We'll contact you within 24-48 hours.</span>
                    </div>
                  )}
                  
                  {submission.status === 'approved' && (
                    <div className="vm-status-message vm-status-approved">
                      <CheckCircle size={14} />
                      <div className="vm-message-content">
                        <span>Great! Your listing has been approved. Complete payment to make it live.</span>
                        <button className="vm-btn vm-btn-primary vm-btn-small">
                          <DollarSign size={14} />
                          Complete Payment
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {submission.status === 'rejected' && (
                    <div className="vm-status-message vm-status-rejected">
                      <AlertCircle size={14} />
                      <div className="vm-message-content">
                        <span>
                          This listing was not approved.
                          {submission.adminNotes && (
                            <span className="vm-admin-notes"> Reason: {submission.adminNotes}</span>
                          )}
                        </span>
                        <button 
                          className="vm-btn vm-btn-secondary vm-btn-small"
                          onClick={() => {
                            setActiveSection('create-listing');
                            setListingStep('form');
                          }}
                        >
                          Create New Listing
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {submission.status === 'listing_created' && (
                    <div className="vm-status-message vm-status-live">
                      <Star size={14} />
                      <div className="vm-message-content">
                        <span>Your listing is now live on our platform!</span>
                        {submission.listingId && (
                          <button className="vm-btn vm-btn-secondary vm-btn-small">
                            <Eye size={14} />
                            View Live Listing
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCreateListing = () => {
    // Step 1: Plan Selection (Preview Mode)
    if (listingStep === 'pricing') {
      return (
        <div className="vm-create-listing-section">
          <div className="vm-section-header">
            <h3>Create New Car Listing</h3>
            <div className="vm-flow-info">
              <p className="vm-flow-description">
                📋 <strong>How it works:</strong> Select plan → Fill car details → FREE admin review → Pay after approval → Listing goes live
              </p>
              <div className="vm-flow-highlight">
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
        <div className="vm-create-listing-section">
          <div className="vm-section-header">
            <h3>Car Listing Details</h3>
            <div className="vm-step-indicator">
              <span className="vm-step vm-step-completed">1. Plan Selected</span>
              <span className="vm-step vm-step-active">2. Car Details</span>
              <span className="vm-step">3. Admin Review</span>
              <span className="vm-step">4. Payment</span>
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
        <div className="vm-create-listing-section">
          <div className="vm-submission-success">
            <CheckCircle size={64} color="#27ae60" />
            <h3>Listing Submitted Successfully!</h3>
            <p>Your car listing has been submitted for admin review.</p>
            <div className="vm-next-steps">
              <h4>What happens next?</h4>
              <ul>
                <li>✅ Admin reviews your listing (FREE)</li>
                <li>📧 You'll receive email notification within 24-48 hours</li>
                <li>💳 Pay for your selected plan after approval</li>
                <li>🚗 Your listing goes live immediately after payment</li>
              </ul>
            </div>
            <button 
              className="vm-btn vm-btn-primary"
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
      <div className="vm-modal-overlay">
        <div className="vm-modal">
          <div className="vm-modal-header">
            <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <button 
              className="vm-close-btn"
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
          
          <form onSubmit={handleVehicleSubmit} className="vm-modal-form">
            <div className="vm-form-grid">
              <div className="vm-form-group">
                <label htmlFor="make">Make*</label>
                <input
                  type="text"
                  id="make"
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              
              <div className="vm-form-group">
                <label htmlFor="model">Model*</label>
                <input
                  type="text"
                  id="model"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                  required
                />
              </div>
              
              <div className="vm-form-group">
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
              
              <div className="vm-form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              
              <div className="vm-form-group">
                <label htmlFor="mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="mileage"
                  value={vehicleForm.mileage}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, mileage: e.target.value }))}
                  min="0"
                />
              </div>
              
              <div className="vm-form-group">
                <label htmlFor="licensePlate">License Plate</label>
                <input
                  type="text"
                  id="licensePlate"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="vm-form-group vm-full-width">
              <label htmlFor="vin">VIN</label>
              <input
                type="text"
                id="vin"
                value={vehicleForm.vin}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, vin: e.target.value }))}
              />
            </div>
            
            <div className="vm-form-group vm-full-width">
              <label htmlFor="purchaseDate">Purchase Date</label>
              <input
                type="date"
                id="purchaseDate"
                value={vehicleForm.purchaseDate}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            
            <div className="vm-form-group vm-full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={vehicleForm.notes}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
              />
            </div>
            
            <div className="vm-modal-actions">
              <button 
                type="button" 
                className="vm-btn vm-btn-secondary"
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
                className="vm-btn vm-btn-primary"
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
    <div className="vm-vehicle-management">
      {/* Message Display */}
      {message.text && (
        <div className={`vm-message vm-message-${message.type}`}>
          <div className="vm-message-content">
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'info' && <Info size={16} />}
            <span>{message.text}</span>
          </div>
          <button 
            className="vm-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="vm-section-tabs">
        <button 
          className={`vm-tab-button ${activeSection === 'vehicles' ? 'vm-active' : ''}`}
          onClick={() => setActiveSection('vehicles')}
        >
          <Car size={16} />
          My Vehicles
        </button>
        
        <button 
          className={`vm-tab-button ${activeSection === 'create-listing' ? 'vm-active' : ''}`}
          onClick={() => {
            setActiveSection('create-listing');
            setListingStep('pricing');
          }}
        >
          <Plus size={16} />
          Create Listing
        </button>
        
        <button 
          className={`vm-tab-button ${activeSection === 'submissions' ? 'vm-active' : ''}`}
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
