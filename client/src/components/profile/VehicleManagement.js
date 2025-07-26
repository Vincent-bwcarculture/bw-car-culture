// client/src/components/profile/VehicleManagement.js
// COMPLETE VERSION WITH EDITING FUNCTIONALITY (My Garage Removed)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Car, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, 
  Clock, X, Upload, DollarSign, Star, Settings, Phone, Info, Image,
  ExternalLink, TrendingUp, Copy
} from 'lucide-react';
import axios from '../../config/axios.js';
import UserCarListingForm from './UserCarListingForm.js';
import CarListingManager from './CarListingManager/CarListingManager.js';
import UserSubmissionCard from './UserSubmissionCard.js';
import SubmissionEditModal from './SubmissionEditModal.js';
import './VehicleManagement.css';

const VehicleManagement = () => {
  const navigate = useNavigate();

  // === MAIN STATE VARIABLES ===
  const [activeSection, setActiveSection] = useState('vehicles');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // === VEHICLE STATE ===
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // === LISTING STATE ===
  const [listingStep, setListingStep] = useState('pricing');
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

  // === NEW: EDITING STATE ===
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // === PRICING STATE ===
  const [pricingData, setPricingData] = useState({
    tiers: {},
    addons: {},
    loaded: false
  });

  // === FREE TIER STATE ===
  const [hasFreeOption, setHasFreeOption] = useState(false);
  const [freeListingStats, setFreeListingStats] = useState({
    active: 0,
    maxAllowed: 8,
    remaining: 8,
    canAddMore: true
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
  console.log('🖼️ Getting primary image for submission:', submission?.listingData?.title);
  
  if (!submission?.listingData?.images) {
    console.log('❌ No images found in submission');
    return null;
  }
  
  const images = submission.listingData.images;
  console.log('📸 Images data:', images);
  
  // Handle both array and non-array cases
  const imageArray = Array.isArray(images) ? images : [images];
  
  if (imageArray.length === 0) {
    console.log('❌ Empty images array');
    return null;
  }
  
  // SIMPLIFIED: Always use first image as primary (selection order)
  const primaryImage = imageArray[0];
  console.log('✅ Using first image as primary (selection order):', primaryImage);
  
  // Extract URL from image object
  if (typeof primaryImage === 'string') {
    return primaryImage;
  }
  
  if (typeof primaryImage === 'object' && primaryImage !== null) {
    const imageUrl = primaryImage.url || 
                    primaryImage.thumbnail || 
                    primaryImage.src || 
                    primaryImage.imageUrl ||
                    primaryImage.path ||
                    primaryImage.location;
    
    return imageUrl || null;
  }
  
  return null;
};

  // ===== ADMIN-STYLE PRICING FUNCTIONS =====
  const getPlanInfo = (planId) => {
    if (!pricingData.loaded || !planId) {
      return { name: 'Plan Not Available', price: 0, duration: 0 };
    }
    
    const planData = pricingData.tiers[planId];
    if (!planData) {
      return { name: 'Unknown Plan', price: 0, duration: 0 };
    }
    
    return {
      name: planData.name,
      price: planData.price,
      duration: planData.duration
    };
  };

  const getAddonInfo = (addonId) => {
    if (!pricingData.loaded || !addonId) {
      return { name: 'Addon Not Available', price: 0 };
    }
    
    const addonData = pricingData.addons[addonId];
    if (!addonData) {
      return { name: 'Unknown Addon', price: 0 };
    }
    
    return {
      name: addonData.name,
      price: addonData.price
    };
  };

  const calculateTotalCost = (selectedPlan, selectedAddons) => {
    if (!pricingData.loaded) return 0;
    
    let total = 0;
    
    // Add plan cost (FREE tier has price: 0)
    if (selectedPlan && pricingData.tiers[selectedPlan]) {
      total += pricingData.tiers[selectedPlan].price;
    }
    
    // Add addons cost
    if (selectedAddons && Array.isArray(selectedAddons)) {
      selectedAddons.forEach(addonId => {
        if (pricingData.addons[addonId]) {
          total += pricingData.addons[addonId].price;
        }
      });
    }
    
    return total;
  };

  // Helper function to get addon details
  const getAddonDetails = (selectedAddons) => {
    if (!Array.isArray(selectedAddons) || selectedAddons.length === 0) {
      return [];
    }
    
    return selectedAddons.map(addonId => getAddonInfo(addonId)).filter(addon => addon.price > 0);
  };

  // === NEW: SUBMISSION EDITING FUNCTIONS ===
  
  // Handle edit submission
  const handleEditSubmission = async (submission) => {
    try {
      setEditLoading(true);
      
      const apiUrl = `https://bw-car-culture-api.vercel.app/api/user/submissions/${submission._id}/edit`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setEditingSubmission(result.data);
        setShowEditModal(true);
        showMessage('info', 'Loading submission for editing...');
      } else {
        showMessage('error', result.message || 'Cannot edit this submission');
      }
    } catch (error) {
      console.error('Error loading submission for editing:', error);
      showMessage('error', 'Failed to load submission for editing');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle save edited submission
  const handleSaveEditedSubmission = async (editData) => {
    try {
      setEditLoading(true);
      
      const apiUrl = `https://bw-car-culture-api.vercel.app/api/user/submissions/${editingSubmission._id}`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setShowEditModal(false);
        setEditingSubmission(null);
        showMessage('success', result.message);
        
        // Refresh submissions to show updated data
        fetchUserSubmissions();
      } else {
        showMessage('error', result.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving submission changes:', error);
      showMessage('error', 'Failed to save changes');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle clone submission
  const handleCloneSubmission = async (submission) => {
    try {
      setLoading(true);
      
      const apiUrl = `https://bw-car-culture-api.vercel.app/api/user/submissions/${submission._id}/clone`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showMessage('success', 'Submission cloned successfully! You can now edit the copy.');
        
        // Refresh submissions to show the new cloned submission
        fetchUserSubmissions();
      } else {
        showMessage('error', result.message || 'Failed to clone submission');
      }
    } catch (error) {
      console.error('Error cloning submission:', error);
      showMessage('error', 'Failed to clone submission');
    } finally {
      setLoading(false);
    }
  };

  // Check if submission can be edited
  const canEditSubmission = (submission) => {
    const editableStatuses = ['pending_review', 'rejected', 'approved'];
    return editableStatuses.includes(submission.status);
  };

  // Check if submission can be cloned
  const canCloneSubmission = (submission) => {
    // Can clone any submission except deleted ones
    return submission.status !== 'deleted';
  };

  // Get edit button text and type
  const getEditButtonInfo = (submission) => {
    switch (submission.status) {
      case 'pending_review':
        return { text: 'Edit', type: 'primary', tooltip: 'Edit submission while pending review' };
      case 'rejected':
        return { text: 'Fix & Resubmit', type: 'warning', tooltip: 'Fix issues and resubmit for review' };
      case 'approved':
        return { text: 'Edit (Review Required)', type: 'secondary', tooltip: 'Editing will require new admin review' };
      case 'listing_created':
        return { text: 'Edit Live Listing', type: 'warning', tooltip: 'Editing will take listing offline for review' };
      default:
        return { text: 'Edit', type: 'secondary', tooltip: 'Edit submission' };
    }
  };

  // === DATA FETCHING FUNCTIONS ===
  
  // Load pricing data with FREE TIER support
  const loadPricingData = async () => {
    try {
      console.log('🔍 Fetching pricing data from endpoints...');
      
      const [tiersResponse, addonsResponse] = await Promise.all([
        axios.get('/payments/available-tiers'),
        axios.get('/addons/available')
      ]);

      if (tiersResponse.data.success && addonsResponse.data.success) {
        const { tiers, hasFreeOption = false, freeListingStats = {} } = tiersResponse.data.data;
        const addons = addonsResponse.data.data.addons;

        setPricingData({
          tiers,
          addons,
          loaded: true
        });

        setHasFreeOption(hasFreeOption);
        if (freeListingStats && Object.keys(freeListingStats).length > 0) {
          setFreeListingStats(freeListingStats);
        }

        console.log('💰 Pricing data loaded with free tier:', { 
          tiers, 
          addons, 
          hasFreeOption,
          freeStats: freeListingStats 
        });
      } else {
        throw new Error('Pricing endpoints returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching pricing data:', error);
      setPricingData(prev => ({ 
        ...prev, 
        loaded: false
      }));
    }
  };

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
        const submissions = result.data || [];
        setUserSubmissions(submissions);
        
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

  // Load pricing data on mount
  useEffect(() => {
    loadPricingData();
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
    console.log('Plan selected:', planId);
    
    if (planId === 'free') {
      showMessage('success', 'Free tier selected! No payment required after approval.');
    } else {
      showMessage('success', 'Plan selected! Continue to fill out your car details.');
    }
  };

  // Handle addon selection in preview mode
  const handleAddonSelection = (addonIds) => {
    setSelectedAddons(addonIds);
    console.log('Addons selected:', addonIds);
    showMessage('info', `${addonIds.length} add-on(s) selected.`);
  };

  // Proceed from plan selection to listing form
  const handleProceedToForm = () => {
    console.log('Proceeding to form with:', { selectedPlan, selectedAddons });
    setListingStep('form');
    
    if (selectedPlan === 'free') {
      showMessage('info', 'Fill out your car details for FREE admin review!');
    } else {
      showMessage('info', 'Now fill out your car details for admin review.');
    }
  };

  // Handle car listing form submission
  const handleListingFormSubmit = async (listingData) => {
    try {
      setLoading(true);
      
      const apiUrl = 'https://bw-car-culture-api.vercel.app/api/user/submit-listing';
      
      // Calculate pricing details
      let pricingDetails = null;
      if (selectedPlan && pricingData.loaded) {
        const planInfo = getPlanInfo(selectedPlan);
        const totalCost = calculateTotalCost(selectedPlan, selectedAddons);
        const addonCost = totalCost - planInfo.price;
        const selectedAddonDetails = getAddonDetails(selectedAddons);
        
        pricingDetails = {
          ...planInfo,
          addonCost,
          totalCost,
          addons: selectedAddonDetails,
          hasAddons: selectedAddonDetails.length > 0
        };
      }
      
      console.log('Submitting to:', apiUrl);
      console.log('Listing data with pricing:', {
        ...listingData,
        selectedPlan,
        selectedAddons,
        pricingDetails,
        status: 'pending_review',
        submissionType: selectedPlan === 'free' ? 'free_tier' : 'paid_tier'
      });
      
      // Submit listing for admin review
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
            pricingDetails,
            status: 'pending_review',
            submissionType: selectedPlan === 'free' ? 'free_tier' : 'paid_tier'
          }
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setPendingListingData(result.data);
        setListingStep('submitted');
        
        if (selectedPlan === 'free') {
          showMessage('success', '🎉 FREE listing submitted for review! No payment required - we\'ll contact you within 24-48 hours.');
        } else {
          showMessage('success', '🎉 Listing submitted for review! We\'ll contact you within 24-48 hours.');
        }
        
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

  // Handle payment completion with FREE TIER support
  const handlePaymentComplete = (paymentData) => {
    console.log('Payment completed:', paymentData);
    
    // Handle free tier completion
    if (paymentData.tier === 'free') {
      showMessage('success', 
        '🎉 Free listing submitted successfully! Your car listing is now in the admin review queue. ' +
        'You\'ll receive an email notification once it\'s approved and live on the platform.'
      );
      
      // Reset to submissions view to show the new submission
      setListingStep('pricing'); 
      setActiveSection('submissions');
      
      // Refresh submissions to show the new one
      fetchUserSubmissions();
    } else {
      // Handle paid tier completion (existing logic)
      showMessage('success', 'Payment completed successfully! Your listing will be reviewed and activated.');
      setListingStep('pricing');
      setActiveSection('submissions');
      fetchUserSubmissions();
    }
    
    // Reset form state
    setSelectedPlan(null);
    setSelectedAddons([]);
    setPendingListingData(null);
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

  // UPDATED: Submissions with editing functionality
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
            <span className="vm-stat-number">{submissionStats.listing_created}</span>
            <span className="vm-stat-label">Live</span>
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
          {userSubmissions.map(submission => (
            <UserSubmissionCard
              key={submission._id}
              submission={submission}
              getPlanInfo={getPlanInfo}
              calculateTotalCost={calculateTotalCost}
              getAddonDetails={getAddonDetails}
              getAddonInfo={getAddonInfo}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              getPrimaryImage={getPrimaryImage}
              pricingData={pricingData}
              showMessage={showMessage}
              setActiveSection={setActiveSection}
              setListingStep={setListingStep}
              setSelectedPlan={setSelectedPlan}
              // NEW: Edit functionality props
              onEditSubmission={handleEditSubmission}
              onCloneSubmission={handleCloneSubmission}
              canEditSubmission={canEditSubmission}
              canCloneSubmission={canCloneSubmission}
              getEditButtonInfo={getEditButtonInfo}
              editLoading={editLoading}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Create listing with FREE TIER support
  const renderCreateListing = () => {
    // Step 1: Plan Selection (Preview Mode)
    if (listingStep === 'pricing') {
      return (
        <div className="vm-create-listing-section">
          <div className="vm-section-header">
            <h3>Create New Car Listing</h3>
            <div className="vm-flow-info">
              <p className="vm-flow-description">
                📋 <strong>How it works:</strong> Select plan → Fill car details → FREE admin review → Pay after approval (or FREE for free tier) → Listing goes live
              </p>
              <div className="vm-flow-highlight">
                <Info size={16} />
                <span>🆓 FREE tier available! No payment required for basic listings.</span>
              </div>
            </div>
          </div>
          
          <CarListingManager
            onProceedToForm={handleProceedToForm}
            onPlanSelected={handlePlanSelection}
            onAddonSelected={handleAddonSelection}
            selectedPlan={selectedPlan}
            selectedAddons={selectedAddons}
            mode="preview"
            showPaymentInfo={false}
            submitButtonText="Continue to Listing Form"
            allowSkipPlan={true}
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
            <h3>
              Car Listing Details 
              {selectedPlan === 'free' && <span className="vm-free-badge-header">FREE TIER</span>}
            </h3>
            <div className="vm-step-indicator">
              <span className="vm-step vm-step-completed">1. Plan Selected</span>
              <span className="vm-step vm-step-active">2. Car Details</span>
              <span className="vm-step">3. Admin Review</span>
              <span className="vm-step">{selectedPlan === 'free' ? '4. Go Live' : '4. Payment'}</span>
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
            <h3>
              Listing Submitted Successfully!
              {selectedPlan === 'free' && <span className="vm-free-badge-large">FREE TIER</span>}
            </h3>
            <p>Your car listing has been submitted for admin review.</p>
            <div className="vm-next-steps">
              <h4>What happens next?</h4>
              <ul>
                <li>✅ Admin reviews your listing (FREE)</li>
                <li>📧 You'll receive email notification within 24-48 hours</li>
                {selectedPlan === 'free' ? (
                  <li>🚗 Your FREE listing goes live immediately after approval</li>
                ) : (
                  <>
                    <li>💳 Pay for your selected plan after approval</li>
                    <li>🚗 Your listing goes live immediately after payment</li>
                  </>
                )}
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

  // Vehicle Modal
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
          {submissionStats.listing_created > 0 && (
            <span className="vm-tab-badge">{submissionStats.listing_created}</span>
          )}
        </button>
      </div>

      {/* Content Areas */}
      {activeSection === 'vehicles' && renderVehicles()}
      {activeSection === 'create-listing' && renderCreateListing()}
      {activeSection === 'submissions' && renderSubmissions()}

      {/* Vehicle Modal */}
      {renderVehicleModal()}

      {/* NEW: Submission Edit Modal */}
      <SubmissionEditModal
        submission={editingSubmission}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSubmission(null);
        }}
        onSave={handleSaveEditedSubmission}
        loading={editLoading}
      />
    </div>
  );
};

export default VehicleManagement;