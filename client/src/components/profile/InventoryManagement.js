// client/src/components/profile/InventoryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Edit2, Trash2, RefreshCw,
  Tag, MapPin, AlertCircle, CheckCircle, X, Eye
} from 'lucide-react';
import axios from '../../config/axios.js';
import InventoryForm from '../../Admin/InventoryManager/InventoryForm.js';
import './InventoryManagement.css';

const InventoryManagement = ({ profileData }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await axios.get('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setItems(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMsg('success', 'Item updated successfully.');
      } else {
        await axios.post('/api/inventory', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMsg('success', 'Item listed successfully.');
      }
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to save item.');
    }
  };

  const handleDelete = async (item) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await axios.delete(`/api/inventory/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(prev => prev.filter(i => i._id !== item._id));
      setDeleteConfirm(null);
      showMsg('success', 'Item removed.');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to delete item.');
      setDeleteConfirm(null);
    }
  };

  const openAdd = () => { setEditingItem(null); setShowForm(true); };
  const openEdit = (item) => { setEditingItem(item); setShowForm(true); };

  const getImageUrl = (item) => {
    const imgs = item.images;
    if (!imgs || !imgs.length) return null;
    const first = imgs[0];
    return typeof first === 'string' ? first : first?.url || null;
  };

  const formatPrice = (price) =>
    price ? `P${Number(price).toLocaleString()}` : 'Price not set';

  return (
    <div className="inv-mgmt-container">
      {/* Toast message */}
      {message.text && (
        <div className={`inv-mgmt-toast ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="inv-mgmt-header">
        <div className="inv-mgmt-header-left">
          <Package size={22} />
          <div>
            <h2>Sell Inventory</h2>
            <p>List car parts, merchandise, accessories & more</p>
          </div>
        </div>
        <div className="inv-mgmt-header-actions">
          <button className="inv-mgmt-refresh-btn" onClick={fetchItems} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          </button>
          <a href="/inventory" target="_blank" rel="noopener noreferrer" className="inv-mgmt-preview-btn">
            <Eye size={15} /> Preview Page
          </a>
          <button className="inv-mgmt-add-btn" onClick={openAdd}>
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Admin note */}
      <div className="inv-mgmt-admin-note">
        <AlertCircle size={14} />
        <span>Inventory is currently visible to admins only. The public page is in preview mode.</span>
      </div>

      {/* Error */}
      {error && (
        <div className="inv-mgmt-error">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="inv-mgmt-loading">
          <RefreshCw size={28} className="spinning" />
          <p>Loading inventory…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="inv-mgmt-empty">
          <Package size={48} />
          <h3>No inventory items yet</h3>
          <p>Start listing parts, merchandise, or accessories.</p>
          <button className="inv-mgmt-add-btn large" onClick={openAdd}>
            <Plus size={16} /> Add Your First Item
          </button>
        </div>
      ) : (
        <div className="inv-mgmt-grid">
          {items.map(item => {
            const imgUrl = getImageUrl(item);
            return (
              <div key={item._id} className="inv-mgmt-card">
                <div className="inv-mgmt-card-img">
                  {imgUrl
                    ? <img src={imgUrl} alt={item.name} />
                    : <div className="inv-mgmt-img-placeholder"><Package size={28} /></div>
                  }
                  <span className={`inv-mgmt-condition-tag ${item.condition || 'used'}`}>
                    {item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'Used'}
                  </span>
                </div>
                <div className="inv-mgmt-card-body">
                  <h4 className="inv-mgmt-item-name">{item.name || 'Unnamed Item'}</h4>
                  <div className="inv-mgmt-item-meta">
                    {item.category && (
                      <span className="inv-mgmt-tag"><Tag size={11} />{item.category}</span>
                    )}
                    {item.location?.city && (
                      <span className="inv-mgmt-tag"><MapPin size={11} />{item.location.city}</span>
                    )}
                  </div>
                  <div className="inv-mgmt-price">{formatPrice(item.price)}</div>
                  <div className="inv-mgmt-stock">
                    {item.quantity > 0
                      ? <span className="in-stock">In stock ({item.quantity})</span>
                      : <span className="out-of-stock">Out of stock</span>
                    }
                  </div>
                </div>
                <div className="inv-mgmt-card-actions">
                  <button className="inv-mgmt-edit-btn" onClick={() => openEdit(item)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="inv-mgmt-delete-btn" onClick={() => setDeleteConfirm(item)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="inv-mgmt-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingItem(null); } }}>
          <div className="inv-mgmt-modal">
            <div className="inv-mgmt-modal-header">
              <h3>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</h3>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }}><X size={18} /></button>
            </div>
            <div className="inv-mgmt-modal-body">
              <InventoryForm
                item={editingItem}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingItem(null); }}
                businesses={[]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="inv-mgmt-modal-overlay">
          <div className="inv-mgmt-confirm-modal">
            <Trash2 size={28} className="inv-mgmt-confirm-icon" />
            <h3>Delete Item?</h3>
            <p>Remove <strong>{deleteConfirm.name}</strong> from inventory? This cannot be undone.</p>
            <div className="inv-mgmt-confirm-actions">
              <button className="inv-mgmt-cancel-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="inv-mgmt-delete-confirm-btn" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
