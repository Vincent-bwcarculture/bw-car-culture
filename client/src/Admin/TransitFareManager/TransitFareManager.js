// src/Admin/TransitFareManager/TransitFareManager.js
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { http } from '../../config/axios.js';
import './TransitFareManager.css';

const EMPTY_FARE = {
  origin: '', destination: '', routeType: 'Bus', provider: '',
  standardFare: '', childFare: '', seniorFare: '', studentFare: '',
  currency: 'BWP', notes: '', active: true
};

const TransitFareManager = () => {
  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // fare object or null for new
  const [form, setForm] = useState(EMPTY_FARE);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchFares(); }, []);

  const fetchFares = async () => {
    setLoading(true);
    try {
      const res = await http.get('/api/transit-fares/all');
      setFares(res.data?.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FARE); setShowModal(true); };
  const openEdit = (fare) => {
    setEditing(fare);
    setForm({
      origin: fare.origin || '',
      destination: fare.destination || '',
      routeType: fare.routeType || 'Bus',
      provider: fare.provider || '',
      standardFare: fare.standardFare ?? '',
      childFare: fare.childFare ?? '',
      seniorFare: fare.seniorFare ?? '',
      studentFare: fare.studentFare ?? '',
      currency: fare.currency || 'BWP',
      notes: fare.notes || '',
      active: fare.active !== false
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.origin.trim() || !form.destination.trim() || form.standardFare === '') return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        standardFare: Number(form.standardFare),
        childFare: form.childFare !== '' ? Number(form.childFare) : null,
        seniorFare: form.seniorFare !== '' ? Number(form.seniorFare) : null,
        studentFare: form.studentFare !== '' ? Number(form.studentFare) : null,
      };
      if (editing) {
        const res = await http.put(`/api/transit-fares/${editing._id}`, payload);
        setFares(prev => prev.map(f => f._id === editing._id ? res.data.data : f));
      } else {
        const res = await http.post('/api/transit-fares', payload);
        setFares(prev => [res.data.data, ...prev]);
      }
      setShowModal(false);
    } catch (_) {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await http.delete(`/api/transit-fares/${id}`);
      setFares(prev => prev.filter(f => f._id !== id));
    } catch (_) {}
    setDeleteId(null);
  };

  return (
    <div className="tfm-container">
      <div className="tfm-header">
        <div>
          <h3>Transit Fares</h3>
          <p>{fares.length} fare{fares.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="tfm-add-btn" onClick={openAdd}>
          <Plus size={16} /> Add Fare
        </button>
      </div>

      {loading ? (
        <div className="tfm-loading">Loading fares…</div>
      ) : fares.length === 0 ? (
        <div className="tfm-empty">No fares added yet. Click "Add Fare" to get started.</div>
      ) : (
        <div className="tfm-table-wrap">
          <table className="tfm-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Standard (BWP)</th>
                <th>Child</th>
                <th>Senior</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fares.map(f => (
                <tr key={f._id} className={!f.active ? 'tfm-inactive' : ''}>
                  <td><strong>{f.origin}</strong> → {f.destination}</td>
                  <td>{f.routeType}</td>
                  <td>{f.provider || '—'}</td>
                  <td className="tfm-price">P {Number(f.standardFare).toLocaleString()}</td>
                  <td>{f.childFare != null ? `P ${f.childFare}` : '—'}</td>
                  <td>{f.seniorFare != null ? `P ${f.seniorFare}` : '—'}</td>
                  <td>
                    <span className={`tfm-badge ${f.active ? 'active' : 'inactive'}`}>
                      {f.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="tfm-actions">
                    <button className="tfm-icon-btn" onClick={() => openEdit(f)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    {deleteId === f._id ? (
                      <>
                        <button className="tfm-icon-btn danger" onClick={() => handleDelete(f._id)} title="Confirm delete">
                          <Check size={14} />
                        </button>
                        <button className="tfm-icon-btn" onClick={() => setDeleteId(null)} title="Cancel">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button className="tfm-icon-btn danger" onClick={() => setDeleteId(f._id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="tfm-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="tfm-modal">
            <div className="tfm-modal-header">
              <h4>{editing ? 'Edit Fare' : 'Add Transit Fare'}</h4>
              <button className="tfm-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="tfm-form">
              <div className="tfm-row">
                <div className="tfm-field">
                  <label>From (Origin) *</label>
                  <input name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. Main Mall" required />
                </div>
                <div className="tfm-field">
                  <label>To (Destination) *</label>
                  <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Airport" required />
                </div>
              </div>
              <div className="tfm-row">
                <div className="tfm-field">
                  <label>Route Type</label>
                  <select name="routeType" value={form.routeType} onChange={handleChange}>
                    {['Bus','Taxi','Shuttle','Train','Combi','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="tfm-field">
                  <label>Provider / Operator</label>
                  <input name="provider" value={form.provider} onChange={handleChange} placeholder="e.g. Gaborone Express" />
                </div>
              </div>
              <div className="tfm-row">
                <div className="tfm-field">
                  <label>Standard Fare (BWP) *</label>
                  <input type="number" name="standardFare" value={form.standardFare} onChange={handleChange} min="0" step="0.50" required />
                </div>
                <div className="tfm-field">
                  <label>Child Fare</label>
                  <input type="number" name="childFare" value={form.childFare} onChange={handleChange} min="0" step="0.50" placeholder="Optional" />
                </div>
              </div>
              <div className="tfm-row">
                <div className="tfm-field">
                  <label>Senior Fare</label>
                  <input type="number" name="seniorFare" value={form.seniorFare} onChange={handleChange} min="0" step="0.50" placeholder="Optional" />
                </div>
                <div className="tfm-field">
                  <label>Student Fare</label>
                  <input type="number" name="studentFare" value={form.studentFare} onChange={handleChange} min="0" step="0.50" placeholder="Optional" />
                </div>
              </div>
              <div className="tfm-field">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="e.g. Peak hours may vary, cash only…" />
              </div>
              <div className="tfm-field tfm-checkbox">
                <label>
                  <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                  Active (visible to users)
                </label>
              </div>
              <div className="tfm-modal-actions">
                <button type="button" className="tfm-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="tfm-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Fare'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitFareManager;
