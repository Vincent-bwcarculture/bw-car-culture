// client/src/components/admin/MarketOverview/AdminMarketOverview.js
import React, { useState, useEffect } from 'react';
import './AdminMarketOverview.css';

const AdminMarketOverview = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    year: '',
    condition: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  });
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

  useEffect(() => {
    fetchPrices();
    fetchFilterOptions();
  }, [pagination.currentPage, filters]);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/market-prices?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPrices(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/market-prices/filters');
      const data = await response.json();

      if (data.success) {
        setFilterOptions(prev => ({
          ...prev,
          makes: data.data.makes,
          models: data.data.models,
          years: data.data.years
        }));
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleAddPrice = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Market price added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchPrices();
        fetchFilterOptions();
      } else {
        alert(data.message || 'Failed to add market price');
      }
    } catch (error) {
      console.error('Error adding price:', error);
      alert('Error adding market price');
    }
  };

  const handleEditPrice = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/market-prices/${selectedPrice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Market price updated successfully!');
        setShowEditModal(false);
        setSelectedPrice(null);
        resetForm();
        fetchPrices();
      } else {
        alert(data.message || 'Failed to update market price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating market price');
    }
  };

  const handleDeletePrice = async (priceId) => {
    if (!window.confirm('Are you sure you want to delete this price entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/market-prices/${priceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Market price deleted successfully!');
        fetchPrices();
      } else {
        alert(data.message || 'Failed to delete market price');
      }
    } catch (error) {
      console.error('Error deleting price:', error);
      alert('Error deleting market price');
    }
  };

  const handleBatchImport = async (e) => {
    e.preventDefault();

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

      const response = await fetch('/api/market-prices/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prices })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Batch import complete!\nSuccess: ${data.data.success.length}\nFailed: ${data.data.failed.length}`);
        setShowBatchModal(false);
        setBatchData('');
        fetchPrices();
        fetchFilterOptions();
      } else {
        alert(data.message || 'Failed to batch import');
      }
    } catch (error) {
      console.error('Error batch importing:', error);
      alert('Error processing batch import. Please check your data format.');
    }
  };

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      make: '',
      model: '',
      year: '',
      condition: ''
    });
  };

  return (
    <div className="amo-container">
      <div className="amo-header">
        <h1>Market Overview Management</h1>
        <div className="amo-header-actions">
          <button className="amo-btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Price
          </button>
          <button className="amo-btn-secondary" onClick={() => setShowBatchModal(true)}>
            📊 Batch Import
          </button>
        </div>
      </div>

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
                        <div className="amo-action-buttons">
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
                  className="amo-page-btn"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </button>
                <span className="amo-page-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  <span className="amo-total-count"> ({pagination.total} total entries)</span>
                </span>
                <button
                  className="amo-page-btn"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNext}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="amo-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="amo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="amo-modal-header">
              <h2>Add Market Price</h2>
              <button className="amo-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddPrice} className="amo-form">
              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    required
                    placeholder="e.g., Toyota"
                  />
                </div>
                <div className="amo-form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    required
                    placeholder="e.g., Corolla"
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="amo-form-group">
                  <label>Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="certified">Certified</option>
                  </select>
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Price (BWP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g., 150000"
                  />
                </div>
                <div className="amo-form-group">
                  <label>Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                    min="0"
                    placeholder="e.g., 45000"
                  />
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Gaborone"
                  />
                </div>
                <div className="amo-form-group">
                  <label>Recorded Date *</label>
                  <input
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({...formData, recordedDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes about this price entry..."
                />
              </div>

              <div className="amo-modal-actions">
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
        <div className="amo-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="amo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="amo-modal-header">
              <h2>Edit Market Price</h2>
              <button className="amo-modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditPrice} className="amo-form">
              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    required
                  />
                </div>
                <div className="amo-form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="amo-form-group">
                  <label>Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="certified">Certified</option>
                  </select>
                </div>
              </div>

              <div className="amo-form-row">
                <div className="amo-form-group">
                  <label>Price (BWP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="amo-form-group">
                  <label>Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({...formData, mileage: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="amo-form-group">
                  <label>Recorded Date *</label>
                  <input
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => setFormData({...formData, recordedDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="amo-form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="amo-modal-actions">
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
        <div className="amo-modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="amo-modal-content amo-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="amo-modal-header">
              <h2>Batch Import Prices</h2>
              <button className="amo-modal-close" onClick={() => setShowBatchModal(false)}>×</button>
            </div>
            <form onSubmit={handleBatchImport} className="amo-batch-form">
              <div className="amo-batch-instructions">
                <p><strong>CSV Format:</strong> Include header row</p>
                <code>make,model,year,condition,price,mileage,location,recordedDate</code>
                <p style={{marginTop: '10px'}}><strong>JSON Format:</strong> Array of objects</p>
                <code>[{'{'}make:"Toyota",model:"Corolla",year:2020,condition:"used",price:150000{'}'}]</code>
              </div>
              
              <div className="amo-form-group">
                <label>Paste CSV or JSON Data</label>
                <textarea
                  value={batchData}
                  onChange={(e) => setBatchData(e.target.value)}
                  rows="12"
                  required
                  placeholder="Paste your CSV or JSON data here..."
                  className="amo-batch-textarea"
                />
              </div>

              <div className="amo-modal-actions">
                <button type="button" className="amo-btn-cancel" onClick={() => setShowBatchModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="amo-btn-submit">
                  Import Data
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
