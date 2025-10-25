// client/src/components/Admin/MarketOverview/AdminMarketOverview.js
// COMPLETE VERSION WITH ALL FIXES INTEGRATED

import React, { useState, useEffect } from 'react';
import './AdminMarketOverview.css';

// ==================== HELPER FUNCTIONS ====================

// Get authentication token from localStorage (checks multiple locations)
const getAuthToken = () => {
  const token = localStorage.getItem('token') || 
                localStorage.getItem('adminToken') || 
                localStorage.getItem('authToken');
  
  if (!token) {
    console.warn('⚠️ No authentication token found in localStorage');
    console.log('Available localStorage keys:', Object.keys(localStorage));
  } else {
    console.log('✅ Token found:', token.substring(0, 20) + '...');
  }
  
  return token;
};

// Check authentication status (debug helper)
const checkAuthStatus = async () => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('❌ No token found');
    alert('Not logged in. Please login first.');
    return { authenticated: false };
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('👤 Current User:', data);
    
    if (data.success) {
      console.log('✅ Logged in as:', data.data.email);
      console.log('✅ Role:', data.data.role);
      
      if (data.data.role !== 'admin') {
        console.warn(`⚠️ Your role is "${data.data.role}". Admin role required.`);
        return { 
          authenticated: true, 
          isAdmin: false, 
          user: data.data 
        };
      }
      
      return { 
        authenticated: true, 
        isAdmin: true, 
        user: data.data 
      };
    } else {
      console.error('❌ Auth check failed:', data.message);
      return { authenticated: false };
    }
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return { authenticated: false };
  }
};

// ==================== MAIN COMPONENT ====================

const AdminMarketOverview = () => {
  // State management
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [authStatus, setAuthStatus] = useState({ authenticated: false, isAdmin: false });
  
  // Filters state
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    year: '',
    condition: ''
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  });
  
  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    makes: [],
    models: [],
    years: [],
    conditions: ['new', 'used', 'certified']
  });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    condition: 'used',
    price: '',
    mileage: '',
    location: 'Botswana',
    recordedDate: new Date().toISOString().split('T')[0],
    notes: '',
    source: 'manual'
  });

  // Batch import state
  const [batchData, setBatchData] = useState('');

  // ==================== EFFECTS ====================

  // Check auth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const status = await checkAuthStatus();
      setAuthStatus(status);
      
      if (!status.authenticated) {
        console.error('❌ User not authenticated');
      } else if (!status.isAdmin) {
        console.warn('⚠️ User is not an admin');
      }
    };
    
    verifyAuth();
  }, []);

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchPrices();
    fetchFilterOptions();
  }, [pagination.currentPage, filters]);

  // ==================== API FUNCTIONS ====================

  // Fetch all prices with filters and pagination
  const fetchPrices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      console.log('📤 Fetching prices with params:', queryParams.toString());

      const response = await fetch(`/api/market-prices?${queryParams}`);
      const data = await response.json();

      console.log('📥 Prices response:', data);

      if (data.success) {
        setPrices(data.data);
        setPagination(data.pagination);
        console.log(`✅ Loaded ${data.data.length} prices`);
      } else {
        console.error('❌ Failed to fetch prices:', data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options (makes, models, years, conditions)
  const fetchFilterOptions = async () => {
    try {
      console.log('📤 Fetching filter options...');
      const response = await fetch('/api/market-prices/filters');
      const data = await response.json();

      console.log('📥 Filter options response:', data);

      if (data.success) {
        setFilterOptions(prev => ({
          ...prev,
          makes: data.data.makes,
          models: data.data.models,
          years: data.data.years,
          conditions: data.data.conditions.length > 0 ? data.data.conditions : ['new', 'used', 'certified']
        }));
        console.log('✅ Filter options loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
    }
  };

  // Add new price entry
  const handleAddPrice = async (e) => {
    e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }

    try {
      console.log('📤 Creating price entry:', formData);

      const response = await fetch('/api/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        alert('Market price added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchPrices();
        fetchFilterOptions();
      } else {
        alert(data.message || 'Failed to add market price');
        console.error('❌ Error details:', data);
      }
    } catch (error) {
      console.error('❌ Error adding price:', error);
      alert(`Error adding market price: ${error.message}`);
    }
  };

  // Edit existing price entry
  const handleEditPrice = async (e) => {
    e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }

    try {
      console.log('📤 Updating price entry:', selectedPrice._id, formData);

      const response = await fetch(`/api/market-prices/${selectedPrice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        alert('Market price updated successfully!');
        setShowEditModal(false);
        setSelectedPrice(null);
        resetForm();
        fetchPrices();
      } else {
        alert(data.message || 'Failed to update market price');
        console.error('❌ Error details:', data);
      }
    } catch (error) {
      console.error('❌ Error updating price:', error);
      alert(`Error updating market price: ${error.message}`);
    }
  };

  // Delete price entry
  const handleDeletePrice = async (priceId) => {
    if (!window.confirm('Are you sure you want to delete this price entry?')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }

    try {
      console.log('📤 Deleting price entry:', priceId);

      const response = await fetch(`/api/market-prices/${priceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        alert('Market price deleted successfully!');
        fetchPrices();
      } else {
        alert(data.message || 'Failed to delete market price');
        console.error('❌ Error details:', data);
      }
    } catch (error) {
      console.error('❌ Error deleting price:', error);
      alert(`Error deleting market price: ${error.message}`);
    }
  };

  // Batch import prices
  const handleBatchImport = async (e) => {
    e.preventDefault();

    const token = getAuthToken();
    if (!token) {
      alert('Please login first. No authentication token found.');
      return;
    }

    try {
      // Parse CSV or JSON data
      let prices;
      try {
        // Try JSON first
        prices = JSON.parse(batchData);
      } catch {
        // Try CSV format
        const lines = batchData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        prices = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });
      }

      console.log('📤 Batch importing:', prices.length, 'entries');

      const response = await fetch('/api/market-prices/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prices })
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        alert(`Batch import complete!\nSuccess: ${data.data.success.length}\nFailed: ${data.data.failed.length}`);
        setShowBatchModal(false);
        setBatchData('');
        fetchPrices();
        fetchFilterOptions();
      } else {
        alert(data.message || 'Failed to batch import');
        console.error('❌ Error details:', data);
      }
    } catch (error) {
      console.error('❌ Error batch importing:', error);
      alert(`Error processing batch import: ${error.message}\nPlease check your data format.`);
    }
  };

  // ==================== UI HELPER FUNCTIONS ====================

  // Open edit modal with selected price data
  const openEditModal = (price) => {
    setSelectedPrice(price);
    setFormData({
      make: price.make,
      model: price.model,
      year: price.year,
      condition: price.condition,
      price: price.price,
      mileage: price.mileage || '',
      location: price.location,
      recordedDate: new Date(price.recordedDate).toISOString().split('T')[0],
      notes: price.notes || '',
      source: price.source
    });
    setShowEditModal(true);
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      condition: 'used',
      price: '',
      mileage: '',
      location: 'Botswana',
      recordedDate: new Date().toISOString().split('T')[0],
      notes: '',
      source: 'manual'
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      make: '',
      model: '',
      year: '',
      condition: ''
    });
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Manual auth check button handler
  const handleAuthCheck = async () => {
    const status = await checkAuthStatus();
    
    if (!status.authenticated) {
      alert('❌ Not logged in. Please login first.');
    } else if (!status.isAdmin) {
      alert(`⚠️ You are logged in as: ${status.user.email}\nRole: ${status.user.role}\n\nAdmin role required for market price management.`);
    } else {
      alert(`✅ Authenticated as admin!\nEmail: ${status.user.email}\nRole: ${status.user.role}`);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="amo-container">
      {/* Header */}
      <div className="amo-header">
        <h1>Market Overview Management</h1>
        <div className="amo-header-actions">
          <button 
            className="amo-btn-debug" 
            onClick={handleAuthCheck}
            title="Check authentication status"
          >
            🔐 Check Auth
          </button>
          <button className="amo-btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Price
          </button>
          <button className="amo-btn-secondary" onClick={() => setShowBatchModal(true)}>
            📊 Batch Import
          </button>
        </div>
      </div>

      {/* Auth Status Warning */}
      {authStatus.authenticated && !authStatus.isAdmin && (
        <div className="amo-warning">
          ⚠️ Warning: You are logged in but don't have admin role. 
          You need admin privileges to manage market prices.
        </div>
      )}

      {!authStatus.authenticated && (
        <div className="amo-warning">
          ⚠️ Warning: Not authenticated. Please login to manage market prices.
        </div>
      )}

      {/* Filters */}
      <div className="amo-filters">
        <div className="amo-filter-group">
          <select
            value={filters.make}
            onChange={(e) => handleFilterChange('make', e.target.value)}
            className="amo-filter-select"
          >
            <option value="">All Makes</option>
            {filterOptions.makes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>

          <select
            value={filters.model}
            onChange={(e) => handleFilterChange('model', e.target.value)}
            className="amo-filter-select"
          >
            <option value="">All Models</option>
            {filterOptions.models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="amo-filter-select"
          >
            <option value="">All Years</option>
            {filterOptions.years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="amo-filter-select"
          >
            <option value="">All Conditions</option>
            {filterOptions.conditions.map(condition => (
              <option key={condition} value={condition}>
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </option>
            ))}
          </select>

          <button className="amo-btn-clear" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* Price List */}
      <div className="amo-list">
        {loading ? (
          <div className="amo-loading">Loading market prices...</div>
        ) : prices.length === 0 ? (
          <div className="amo-no-data">
            <p>No market prices found. Add some to get started!</p>
          </div>
        ) : (
          <>
            <div className="amo-table-wrapper">
              <table className="amo-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Year</th>
                    <th>Condition</th>
                    <th>Price</th>
                    <th>Mileage</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map(price => (
                    <tr key={price._id}>
                      <td>
                        <strong>{price.make} {price.model}</strong>
                      </td>
                      <td>{price.year}</td>
                      <td>
                        <span className={`amo-condition-badge ${price.condition}`}>
                          {price.condition}
                        </span>
                      </td>
                      <td className="amo-price-cell">P{price.price.toLocaleString()}</td>
                      <td>{price.mileage ? `${price.mileage.toLocaleString()} km` : 'N/A'}</td>
                      <td>{new Date(price.recordedDate).toLocaleDateString()}</td>
                      <td>{price.location}</td>
                      <td>
                        <div className="amo-actions">
                          <button 
                            className="amo-btn-edit"
                            onClick={() => openEditModal(price)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="amo-btn-delete"
                            onClick={() => handleDeletePrice(price._id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="amo-pagination">
                <button 
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="amo-btn-pagination"
                >
                  ← Previous
                </button>
                
                <span className="amo-pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.total} total entries)
                </span>
                
                <button 
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="amo-btn-pagination"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="amo-modal">
          <div className="amo-modal-content">
            <div className="amo-modal-header">
              <h2>Add Market Price</h2>
              <button className="amo-modal-close" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddPrice} className="amo-form">
              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="certified">Certified Pre-Owned</option>
                  </select>
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Price (BWP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="amo-form-group">
                  <label>Recorded Date *</label>
                  <input
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Any additional information about this price entry..."
                />
              </div>

              <div className="amo-form-actions">
                <button type="button" className="amo-btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="amo-btn-submit">
                  Add Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="amo-modal">
          <div className="amo-modal-content">
            <div className="amo-modal-header">
              <h2>Edit Market Price</h2>
              <button className="amo-modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditPrice} className="amo-form">
              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="certified">Certified Pre-Owned</option>
                  </select>
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Price (BWP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div className="amo-form-group">
                  <label>Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="amo-form-group">
                  <label>Recorded Date *</label>
                  <input
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Any additional information about this price entry..."
                />
              </div>

              <div className="amo-form-actions">
                <button type="button" className="amo-btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="amo-btn-submit">
                  Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="amo-modal">
          <div className="amo-modal-content amo-modal-large">
            <div className="amo-modal-header">
              <h2>Batch Import Market Prices</h2>
              <button className="amo-modal-close" onClick={() => setShowBatchModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleBatchImport} className="amo-form">
              <div className="amo-batch-instructions">
                <p><strong>Instructions:</strong></p>
                <p>Paste your data in JSON or CSV format below:</p>
                
                <p><strong>JSON Format Example:</strong></p>
                <pre>{`[
  {
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "condition": "used",
    "price": 180000,
    "mileage": 45000,
    "location": "Gaborone"
  },
  {
    "make": "BMW",
    "model": "X5",
    "year": 2019,
    "condition": "used",
    "price": 450000,
    "mileage": 60000,
    "location": "Francistown"
  }
]`}</pre>

                <p><strong>CSV Format Example:</strong></p>
                <pre>{`make,model,year,condition,price,mileage,location
Toyota,Camry,2020,used,180000,45000,Gaborone
BMW,X5,2019,used,450000,60000,Francistown`}</pre>
              </div>

              <div className="amo-form-group">
                <label>Paste Data (JSON or CSV)</label>
                <textarea
                  value={batchData}
                  onChange={(e) => setBatchData(e.target.value)}
                  rows="10"
                  placeholder="Paste your JSON array or CSV data here..."
                  required
                />
              </div>

              <div className="amo-form-actions">
                <button type="button" className="amo-btn-cancel" onClick={() => setShowBatchModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="amo-btn-submit">
                  Import Prices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketOverview;
