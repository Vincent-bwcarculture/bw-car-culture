// src/Admin/components/AdminInventoryListings.js
// Admin panel for managing live inventory items (approved & in inventoryitems collection)
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, RefreshCw, Trash2, Eye, EyeOff, Star, StarOff,
  Search, AlertCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import axios from '../../config/axios.js';
import './AdminInventoryListings.css';

const CATEGORIES = ['All', 'Parts', 'Accessories', 'Apparel', 'Collectibles', 'Tools', 'Fluids', 'Electronics', 'Other'];
const STATUSES   = ['all', 'active', 'inactive'];

const AdminInventoryListings = () => {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [status, setStatus]       = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast]         = useState({ type: '', text: '' });

  const LIMIT = 20;

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const token = () => localStorage.getItem('token') || localStorage.getItem('authToken');

  const fetchItems = useCallback(async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search)              params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (status !== 'all')   params.append('status', status);

      const res = await axios.get(`/api/admin/inventory?${params}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => { fetchItems(page); }, [page, category, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete-${deleteTarget._id}`);
    try {
      await axios.delete(`/api/admin/inventory/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      showToast('success', `"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      fetchItems(page);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Delete failed.');
    } finally {
      setActionLoading('');
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    setActionLoading(`status-${item._id}`);
    try {
      await axios.put(`/api/admin/inventory/${item._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      showToast('success', `Item ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, status: newStatus } : i));
    } catch (err) {
      showToast('error', 'Status update failed.');
    } finally {
      setActionLoading('');
    }
  };

  const toggleFeatured = async (item) => {
    const newFeatured = !item.featured;
    setActionLoading(`featured-${item._id}`);
    try {
      await axios.put(`/api/admin/inventory/${item._id}/status`,
        { featured: newFeatured },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      showToast('success', newFeatured ? 'Marked as featured.' : 'Removed from featured.');
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, featured: newFeatured } : i));
    } catch (err) {
      showToast('error', 'Failed to update featured status.');
    } finally {
      setActionLoading('');
    }
  };

  const getFirstImage = (item) => {
    const imgs = item?.images;
    if (!imgs?.length) return null;
    const f = imgs[0];
    return typeof f === 'string' ? f : f?.url || null;
  };

  const stockLabel = (item) => {
    const q = item?.stock?.quantity;
    if (q === undefined || q === null) return null;
    if (q <= 0)  return { text: 'Out of Stock', cls: 'ail-stock-out' };
    if (q <= 5)  return { text: `Low (${q})`,   cls: 'ail-stock-low' };
    return { text: `${q} in stock`, cls: 'ail-stock-ok' };
  };

  return (
    <div className="ail-container">
      {/* Toast */}
      {toast.text && (
        <div className={`ail-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '!'} {toast.text}
          <button onClick={() => setToast({ type: '', text: '' })}><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="ail-header">
        <div className="ail-header-info">
          <Package size={20} />
          <div>
            <h3>Live Inventory Listings</h3>
            <p>{total} item{total !== 1 ? 's' : ''} in catalogue</p>
          </div>
        </div>
        <button className="ail-refresh-btn" onClick={() => fetchItems(page)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="ail-filters">
        <form className="ail-search-form" onSubmit={handleSearch}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, brand, category…"
          />
          {search && <button type="button" onClick={() => { setSearch(''); setPage(1); fetchItems(1); }}><X size={13} /></button>}
          <button type="submit">Search</button>
        </form>

        <select className="ail-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>

        <select className="ail-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {error && <div className="ail-error"><AlertCircle size={15} /> {error}</div>}

      {loading ? (
        <div className="ail-loading"><RefreshCw size={28} className="spinning" /><p>Loading items…</p></div>
      ) : items.length === 0 ? (
        <div className="ail-empty"><Package size={40} /><p>No inventory items found.</p></div>
      ) : (
        <>
          <div className="ail-table-wrapper">
            <table className="ail-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Seller</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const stock = stockLabel(item);
                  const imgUrl = getFirstImage(item);
                  return (
                    <tr key={item._id}>
                      <td className="ail-item-cell">
                        <div className="ail-item-thumb">
                          {imgUrl
                            ? <img src={imgUrl} alt={item.title} onError={e => { e.target.src = '/images/placeholders/part.jpg'; }} />
                            : <Package size={18} />
                          }
                        </div>
                        <div className="ail-item-info">
                          <span className="ail-item-title">{item.title}</span>
                          {item.featured && <span className="ail-featured-badge">Featured</span>}
                        </div>
                      </td>
                      <td><span className="ail-category-tag">{item.category}</span></td>
                      <td className="ail-price">P{Number(item.price || 0).toLocaleString()}</td>
                      <td>{stock ? <span className={stock.cls}>{stock.text}</span> : '—'}</td>
                      <td>
                        <span className={`ail-status-badge ${item.status === 'active' ? 'active' : 'inactive'}`}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td className="ail-seller-cell">
                        <span>{item.sellerType === 'dealership' ? 'Dealer' : 'Private'}</span>
                      </td>
                      <td>
                        <div className="ail-row-actions">
                          <a
                            href={`/inventory/${item._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ail-action-btn view"
                            title="View listing"
                          >
                            <Eye size={14} />
                          </a>
                          <button
                            className={`ail-action-btn ${item.status === 'active' ? 'deactivate' : 'activate'}`}
                            onClick={() => toggleStatus(item)}
                            disabled={actionLoading === `status-${item._id}`}
                            title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {item.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            className={`ail-action-btn ${item.featured ? 'unfeature' : 'feature'}`}
                            onClick={() => toggleFeatured(item)}
                            disabled={actionLoading === `featured-${item._id}`}
                            title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                          >
                            {item.featured ? <StarOff size={14} /> : <Star size={14} />}
                          </button>
                          <button
                            className="ail-action-btn delete"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ail-pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={16} />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="ail-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ail-confirm-modal" onClick={e => e.stopPropagation()}>
            <Trash2 size={32} className="ail-confirm-icon" />
            <h4>Delete Listing?</h4>
            <p>This will permanently remove <strong>"{deleteTarget.title}"</strong> from the public inventory. This cannot be undone.</p>
            <div className="ail-confirm-actions">
              <button className="ail-cancel-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="ail-delete-btn"
                onClick={handleDelete}
                disabled={!!actionLoading}
              >
                {actionLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryListings;
