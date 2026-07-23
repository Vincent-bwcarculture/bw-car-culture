// src/Admin/InvoiceManager/InvoiceManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../config/axios.js';
import './InvoiceManager.css';

const API_BASE = '/api/admin/invoices';

const STATUS_COLORS = {
  draft: '#6e7681', sent: '#58a6ff', paid: '#3fb950',
  accepted: '#3fb950', cancelled: '#f85149', rejected: '#f85149'
};

const empty_item = () => ({ description: '', quantity: 1, unitPrice: '' });

const empty_doc = (type = 'invoice') => ({
  type,
  customer: { name: '', email: '', phone: '', address: '' },
  items: [empty_item()],
  notes: '',
  taxRate: 14,
  discountRate: 0,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  status: 'draft'
});

const formatBWP = (n) =>
  `BWP ${Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return '–';
  try { return new Date(d).toLocaleDateString('en-BW', { year: 'numeric', month: 'short', day: '2-digit' }); }
  catch { return '–'; }
};

const calcTotals = (items, taxRate, discountRate) => {
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const discountAmount = subtotal * ((Number(discountRate) || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * ((Number(taxRate) || 0) / 100);
  return { subtotal, discountAmount, taxAmount, total: afterDiscount + taxAmount };
};

// ─────────────────────────────────────────────────────────────────────────────
// PrintModal
// ─────────────────────────────────────────────────────────────────────────────
const PrintModal = ({ doc, onClose }) => {
  const totals = calcTotals(doc.items || [], doc.taxRate, doc.discountRate);
  return (
    <div className="im-print-overlay">
      <div className="im-print-toolbar no-print">
        <button className="im-print-close" onClick={onClose}>✕ Close</button>
        <button className="im-print-btn" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>
      <div className="im-print-doc">
        <div className="im-print-header">
          <div className="im-print-header-left">
            <img src="/bcc-logo.png" alt="BW Car Culture" className="im-print-logo" />
            <div className="im-print-doc-type">
              <h1 className="im-print-title">{doc.type === 'quotation' ? 'QUOTATION' : 'INVOICE'}</h1>
              <p className="im-print-num"># {doc.number}</p>
            </div>
          </div>
          <div className="im-print-meta">
            <div><span>Issue Date</span><strong>{fmtDate(doc.issueDate)}</strong></div>
            {doc.dueDate && <div><span>Due Date</span><strong>{fmtDate(doc.dueDate)}</strong></div>}
            <div>
              <span>Status</span>
              <strong style={{ color: STATUS_COLORS[doc.status] || '#555' }}>
                {doc.status?.toUpperCase()}
              </strong>
            </div>
          </div>
        </div>

        <div className="im-print-parties">
          <div>
            <p className="im-print-party-label">FROM</p>
            <p className="im-print-party-name">I3w Proprietary Limited</p>
            <p>Flowertown Ward, Mahalapye</p>
            <p>P O Box 1473, Mahalapye, Botswana</p>
            <p>+267 74 122 453</p>
          </div>
          <div>
            <p className="im-print-party-label">BILL TO</p>
            <p className="im-print-party-name">{doc.customer?.name || '–'}</p>
            {doc.customer?.email   && <p>{doc.customer.email}</p>}
            {doc.customer?.phone   && <p>{doc.customer.phone}</p>}
            {doc.customer?.address && <p>{doc.customer.address}</p>}
          </div>
        </div>

        <table className="im-print-items">
          <thead>
            <tr>
              <th className="desc-col">Description</th>
              <th className="num-col">Qty</th>
              <th className="num-col">Unit Price</th>
              <th className="num-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {(doc.items || []).map((item, i) => (
              <tr key={i}>
                <td>{item.description || '–'}</td>
                <td className="num-col">{item.quantity}</td>
                <td className="num-col">{formatBWP(item.unitPrice)}</td>
                <td className="num-col">{formatBWP((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="im-print-totals">
          <div className="im-print-totals-col">
            {doc.notes && (
              <div className="im-print-notes">
                <p className="im-print-notes-label">Notes</p>
                <p>{doc.notes}</p>
              </div>
            )}
          </div>
          <div className="im-print-totals-grid">
            <span>Subtotal</span><span>{formatBWP(totals.subtotal)}</span>
            {totals.discountAmount > 0 && (
              <><span>Discount ({doc.discountRate}%)</span><span>–{formatBWP(totals.discountAmount)}</span></>
            )}
            {totals.taxAmount > 0 && (
              <><span>VAT ({doc.taxRate}%)</span><span>{formatBWP(totals.taxAmount)}</span></>
            )}
            <span className="total-label">TOTAL</span>
            <span className="total-amount">{formatBWP(totals.total)}</span>
          </div>
        </div>

        <p className="im-print-footer">Thank you for your business! · I3w Proprietary Limited · +267 74 122 453 · P O Box 1473, Mahalapye, Botswana</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DocForm (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
const DocForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial);

  const setField = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] };
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const setCustomer = (field, value) => setField(`customer.${field}`, value);

  const setItem = (idx, field, value) => {
    setForm(prev => {
      const items = prev.items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
      return { ...prev, items };
    });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, empty_item()] }));

  const removeItem = (idx) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const totals = calcTotals(form.items, form.taxRate, form.discountRate);

  const statuses = form.type === 'quotation'
    ? ['draft', 'sent', 'accepted', 'rejected']
    : ['draft', 'sent', 'paid', 'cancelled'];

  return (
    <div className="im-form-overlay">
      <div className="im-form-panel">
        <div className="im-form-head">
          <div>
            <h2 className="im-form-title">
              {initial.number ? `Edit ${initial.type === 'quotation' ? 'Quotation' : 'Invoice'}` : `New ${form.type === 'quotation' ? 'Quotation' : 'Invoice'}`}
            </h2>
            {initial.number && <span className="im-form-num">#{initial.number}</span>}
          </div>
          <button className="im-form-close" onClick={onCancel}>✕</button>
        </div>

        <div className="im-form-body">
          {/* Type selector (only on new docs) */}
          {!initial.number && (
            <div className="im-form-section">
              <label className="im-form-label">Document Type</label>
              <div className="im-type-toggle">
                <button
                  className={`im-type-btn ${form.type === 'invoice' ? 'active' : ''}`}
                  onClick={() => setField('type', 'invoice')}
                  type="button"
                >Invoice</button>
                <button
                  className={`im-type-btn ${form.type === 'quotation' ? 'active' : ''}`}
                  onClick={() => setField('type', 'quotation')}
                  type="button"
                >Quotation</button>
              </div>
            </div>
          )}

          {/* Dates & Status */}
          <div className="im-form-section">
            <div className="im-form-row-3">
              <div>
                <label className="im-form-label">Issue Date</label>
                <input type="date" className="im-input" value={form.issueDate}
                  onChange={e => setField('issueDate', e.target.value)} />
              </div>
              <div>
                <label className="im-form-label">Due Date</label>
                <input type="date" className="im-input" value={form.dueDate}
                  onChange={e => setField('dueDate', e.target.value)} />
              </div>
              <div>
                <label className="im-form-label">Status</label>
                <select className="im-input" value={form.status}
                  onChange={e => setField('status', e.target.value)}>
                  {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="im-form-section">
            <p className="im-form-section-title">Customer</p>
            <div className="im-form-row-2">
              <div>
                <label className="im-form-label">Name *</label>
                <input className="im-input" placeholder="Customer name"
                  value={form.customer.name} onChange={e => setCustomer('name', e.target.value)} />
              </div>
              <div>
                <label className="im-form-label">Email</label>
                <input className="im-input" type="email" placeholder="email@example.com"
                  value={form.customer.email} onChange={e => setCustomer('email', e.target.value)} />
              </div>
            </div>
            <div className="im-form-row-2">
              <div>
                <label className="im-form-label">Phone</label>
                <input className="im-input" placeholder="+267 ..."
                  value={form.customer.phone} onChange={e => setCustomer('phone', e.target.value)} />
              </div>
              <div>
                <label className="im-form-label">Address</label>
                <input className="im-input" placeholder="City, Country"
                  value={form.customer.address} onChange={e => setCustomer('address', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="im-form-section">
            <p className="im-form-section-title">Line Items</p>
            <div className="im-items-table">
              <div className="im-items-header">
                <span className="desc-col">Description</span>
                <span className="num-col">Qty</span>
                <span className="num-col">Unit Price (BWP)</span>
                <span className="num-col">Total</span>
                <span className="act-col"></span>
              </div>
              {form.items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <div key={idx} className="im-item-row">
                    <input
                      className="im-input desc-col"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => setItem(idx, 'description', e.target.value)}
                    />
                    <input
                      className="im-input num-col"
                      type="number" min="1" placeholder="1"
                      value={item.quantity}
                      onChange={e => setItem(idx, 'quantity', e.target.value)}
                    />
                    <input
                      className="im-input num-col"
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.unitPrice}
                      onChange={e => setItem(idx, 'unitPrice', e.target.value)}
                    />
                    <span className="im-item-total num-col">{formatBWP(lineTotal)}</span>
                    <button className="im-remove-item act-col" onClick={() => removeItem(idx)}
                      disabled={form.items.length === 1} title="Remove item">×</button>
                  </div>
                );
              })}
            </div>
            <button className="im-add-item-btn" onClick={addItem} type="button">+ Add Line Item</button>
          </div>

          {/* Totals & Settings */}
          <div className="im-form-section im-form-row-2">
            <div>
              <p className="im-form-section-title">Tax & Discount</p>
              <div className="im-form-row-2">
                <div>
                  <div className="im-vat-label-row">
                    <label className="im-form-label">VAT %</label>
                    <label className="im-no-vat-check">
                      <input
                        type="checkbox"
                        checked={Number(form.taxRate) === 0}
                        onChange={e => setField('taxRate', e.target.checked ? 0 : 14)}
                      />
                      No VAT
                    </label>
                  </div>
                  <input className="im-input" type="number" min="0" max="100" step="0.1"
                    value={form.taxRate}
                    disabled={Number(form.taxRate) === 0}
                    onChange={e => setField('taxRate', e.target.value)} />
                </div>
                <div>
                  <label className="im-form-label">Discount %</label>
                  <input className="im-input" type="number" min="0" max="100" step="0.1"
                    value={form.discountRate} onChange={e => setField('discountRate', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="im-totals-box">
              <div className="im-totals-row"><span>Subtotal</span><span>{formatBWP(totals.subtotal)}</span></div>
              {totals.discountAmount > 0 && (
                <div className="im-totals-row"><span>Discount</span><span>–{formatBWP(totals.discountAmount)}</span></div>
              )}
              {totals.taxAmount > 0 && (
                <div className="im-totals-row"><span>VAT</span><span>{formatBWP(totals.taxAmount)}</span></div>
              )}
              <div className="im-totals-row total"><span>TOTAL</span><span>{formatBWP(totals.total)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="im-form-section">
            <label className="im-form-label">Notes / Terms</label>
            <textarea className="im-input im-textarea" placeholder="Payment terms, notes, etc."
              value={form.notes} onChange={e => setField('notes', e.target.value)} rows={3} />
          </div>
        </div>

        <div className="im-form-footer">
          <button className="im-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="im-btn-primary" onClick={() => onSave(form)} disabled={saving || !form.customer.name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main InvoiceManager
// ─────────────────────────────────────────────────────────────────────────────
const InvoiceManager = () => {
  const { user } = useAuth();

  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [typeTab, setTypeTab]       = useState('all');
  const [statusTab, setStatusTab]   = useState('all');
  const [form, setForm]             = useState(null);
  const [printDoc, setPrintDoc]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (typeTab !== 'all')   params.type   = typeTab;
      if (statusTab !== 'all') params.status = statusTab;
      params.limit = 100;

      const res = await api.get(API_BASE, { params });
      if (res.data.success) {
        setDocs(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load');
      }
    } catch (e) {
      setError('Network error — could not load invoices');
    } finally {
      setLoading(false);
    }
  }, [typeTab, statusTab]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const isEdit = !!formData._id;
      const res = isEdit
        ? await api.put(`${API_BASE}/${formData._id}`, formData)
        : await api.post(API_BASE, formData);

      if (res.data.success) {
        setForm(null);
        fetchDocs();
      } else {
        alert(res.data.message || 'Save failed');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Network error — save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (doc, newStatus) => {
    setActionLoading(doc._id);
    try {
      const res = await api.patch(`${API_BASE}/${doc._id}/status`, { status: newStatus });
      if (res.data.success) {
        setDocs(prev => prev.map(d => d._id === doc._id ? { ...d, status: newStatus } : d));
      }
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.type === 'quotation' ? 'quotation' : 'invoice'} #${doc.number}? This cannot be undone.`)) return;
    setActionLoading(doc._id);
    try {
      await api.delete(`${API_BASE}/${doc._id}`);
      setDocs(prev => prev.filter(d => d._id !== doc._id));
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const statuses = typeTab === 'quotation'
    ? ['all', 'draft', 'sent', 'accepted', 'rejected']
    : typeTab === 'invoice'
      ? ['all', 'draft', 'sent', 'paid', 'cancelled']
      : ['all', 'draft', 'sent', 'paid', 'accepted', 'cancelled', 'rejected'];

  const nextStatuses = (doc) => {
    const map = {
      invoice: { draft: ['sent', 'cancelled'], sent: ['paid', 'cancelled'], paid: [], cancelled: ['draft'] },
      quotation: { draft: ['sent', 'rejected'], sent: ['accepted', 'rejected'], accepted: [], rejected: ['draft'] }
    };
    return (map[doc.type] || {})[doc.status] || [];
  };

  return (
    <div className="im-container">
      {/* Header */}
      <div className="im-header">
        <div>
          <h2 className="im-heading">Invoices & Quotations</h2>
          <p className="im-subheading">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="im-header-actions">
          <button className="im-btn-secondary" onClick={() => setForm(empty_doc('quotation'))}>+ New Quotation</button>
          <button className="im-btn-primary" onClick={() => setForm(empty_doc('invoice'))}>+ New Invoice</button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="im-tabs">
        {[['all', 'All'], ['invoice', 'Invoices'], ['quotation', 'Quotations']].map(([key, label]) => (
          <button key={key} className={`im-tab ${typeTab === key ? 'active' : ''}`}
            onClick={() => { setTypeTab(key); setStatusTab('all'); }}>
            {label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="im-status-tabs">
        {statuses.map(s => (
          <button key={s} className={`im-status-tab ${statusTab === s ? 'active' : ''}`}
            onClick={() => setStatusTab(s)}
            style={s !== 'all' && statusTab === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}>
            {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="im-state">
          <div className="im-spinner" />
          <p>Loading documents…</p>
        </div>
      ) : error ? (
        <div className="im-state im-error">
          <p>{error}</p>
          <button className="im-btn-ghost" onClick={fetchDocs}>Try Again</button>
        </div>
      ) : docs.length === 0 ? (
        <div className="im-state im-empty">
          <p className="im-empty-icon">📄</p>
          <p>No documents yet. Create your first invoice or quotation.</p>
        </div>
      ) : (
        <div className="im-table-wrap">
          <table className="im-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th className="num-col">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => {
                const isBusy = actionLoading === doc._id;
                const transitions = nextStatuses(doc);
                return (
                  <tr key={doc._id} className={isBusy ? 'im-row-busy' : ''}>
                    <td><span className="im-doc-num">{doc.number}</span></td>
                    <td>
                      <span className={`im-type-badge ${doc.type}`}>
                        {doc.type === 'quotation' ? 'Quote' : 'Invoice'}
                      </span>
                    </td>
                    <td>
                      <div className="im-customer-cell">
                        <span className="im-customer-name">{doc.customer?.name || '–'}</span>
                        {doc.customer?.email && <span className="im-customer-email">{doc.customer.email}</span>}
                      </div>
                    </td>
                    <td>{fmtDate(doc.issueDate)}</td>
                    <td>{doc.dueDate ? fmtDate(doc.dueDate) : '–'}</td>
                    <td className="num-col im-total-cell">{formatBWP(doc.total)}</td>
                    <td>
                      <span className="im-status-badge" style={{ background: `${STATUS_COLORS[doc.status]}22`, color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55` }}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <div className="im-row-actions">
                        <button className="im-action-btn view" title="Print / View"
                          onClick={() => setPrintDoc(doc)} disabled={isBusy}>
                          🖨
                        </button>
                        <button className="im-action-btn edit" title="Edit"
                          onClick={() => setForm({ ...doc, issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().slice(0,10) : '', dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().slice(0,10) : '' })}
                          disabled={isBusy}>
                          ✏️
                        </button>
                        {transitions.length > 0 && (
                          <select className="im-action-select" value=""
                            onChange={e => { if (e.target.value) handleStatusChange(doc, e.target.value); e.target.value = ''; }}
                            disabled={isBusy} title="Change status">
                            <option value="">▸ Status</option>
                            {transitions.map(s => (
                              <option key={s} value={s}>→ {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        )}
                        <button className="im-action-btn delete" title="Delete"
                          onClick={() => handleDelete(doc)} disabled={isBusy}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit form */}
      {form && (
        <DocForm
          initial={form}
          onSave={handleSave}
          onCancel={() => setForm(null)}
          saving={saving}
        />
      )}

      {/* Print modal */}
      {printDoc && (
        <PrintModal doc={printDoc} onClose={() => setPrintDoc(null)} />
      )}
    </div>
  );
};

export default InvoiceManager;
