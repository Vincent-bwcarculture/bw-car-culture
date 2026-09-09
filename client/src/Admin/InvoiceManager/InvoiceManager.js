// src/Admin/InvoiceManager/InvoiceManager.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../config/axios.js';
import './InvoiceManager.css';

const API_BASE = '/api/admin/invoices';

const STATUS_COLORS = {
  draft: '#6e7681', sent: '#58a6ff', paid: '#3fb950',
  accepted: '#3fb950', cancelled: '#f85149', rejected: '#f85149'
};

const empty_item = () => ({ description: '', quantity: 1, unitPrice: '' });

// ─────────────────────────────────────────────────────────────────────────────
// Service Catalog helpers
// ─────────────────────────────────────────────────────────────────────────────
const SVC_KEY = 'bcc_service_catalog';

const loadServices = () => {
  try { return JSON.parse(localStorage.getItem(SVC_KEY) || '[]'); } catch { return []; }
};
const saveServices = (svcs) => {
  try { localStorage.setItem(SVC_KEY, JSON.stringify(svcs)); } catch {}
};

const empty_service = () => ({
  id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  category: '',
  unitPrice: '',
  includes: [''],
});

// ─────────────────────────────────────────────────────────────────────────────
// ServiceCatalog component
// ─────────────────────────────────────────────────────────────────────────────
const ServiceCatalog = () => {
  const [services, setServices] = useState(loadServices);
  const [editing, setEditing] = useState(null); // null | service object

  const persist = (svcs) => { setServices(svcs); saveServices(svcs); };

  const startNew = () => setEditing(empty_service());
  const startEdit = (svc) => setEditing({ ...svc, includes: [...(svc.includes || [''])] });
  const cancelEdit = () => setEditing(null);

  const setEditField = (field, value) => setEditing(prev => ({ ...prev, [field]: value }));

  const setInclude = (idx, val) =>
    setEditing(prev => { const inc = [...prev.includes]; inc[idx] = val; return { ...prev, includes: inc }; });
  const addInclude = () => setEditing(prev => ({ ...prev, includes: [...prev.includes, ''] }));
  const removeInclude = (idx) =>
    setEditing(prev => ({ ...prev, includes: prev.includes.filter((_, i) => i !== idx) }));

  const saveEdit = () => {
    if (!editing.name.trim()) return;
    const clean = { ...editing, includes: editing.includes.filter(s => s.trim()) };
    const exists = services.find(s => s.id === clean.id);
    persist(exists
      ? services.map(s => s.id === clean.id ? clean : s)
      : [...services, clean]
    );
    setEditing(null);
  };

  const deleteService = (id) => {
    if (!window.confirm('Delete this service?')) return;
    persist(services.filter(s => s.id !== id));
  };

  // Group by category
  const groups = services.reduce((acc, svc) => {
    const cat = svc.category?.trim() || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <div className="im-catalog">
      <div className="im-catalog-header">
        <div>
          <h3 className="im-catalog-title">Services Catalog</h3>
          <p className="im-catalog-sub">Define your services and pricing. Use "Add from Catalog" when creating an invoice or quotation.</p>
        </div>
        <button className="im-btn-primary" onClick={startNew}>+ New Service</button>
      </div>

      {services.length === 0 ? (
        <div className="im-state im-empty">
          <p className="im-empty-icon">🛠️</p>
          <p>No services yet. Add your first service to build a catalog.</p>
          <button className="im-btn-ghost" onClick={startNew} style={{ marginTop: '0.75rem' }}>+ Add Service</button>
        </div>
      ) : (
        Object.entries(groups).map(([cat, svcs]) => (
          <div key={cat} className="im-catalog-group">
            <p className="im-catalog-group-title">{cat}</p>
            <div className="im-catalog-grid">
              {svcs.map(svc => (
                <div key={svc.id} className="im-catalog-card">
                  <div className="im-catalog-card-top">
                    <div>
                      <p className="im-catalog-card-name">{svc.name}</p>
                      <p className="im-catalog-card-price">{formatBWP(svc.unitPrice)}</p>
                    </div>
                    <div className="im-catalog-card-actions">
                      <button className="im-action-btn edit" title="Edit" onClick={() => startEdit(svc)}>✏️</button>
                      <button className="im-action-btn delete" title="Delete" onClick={() => deleteService(svc.id)}>🗑</button>
                    </div>
                  </div>
                  {svc.includes?.length > 0 && (
                    <ul className="im-catalog-includes">
                      {svc.includes.map((inc, i) => <li key={i}>{inc}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit / New modal */}
      {editing && (
        <div className="im-form-overlay">
          <div className="im-form-panel" style={{ maxWidth: '520px' }}>
            <div className="im-form-head">
              <h2 className="im-form-title">{editing.name ? 'Edit Service' : 'New Service'}</h2>
              <button className="im-form-close" onClick={cancelEdit}>✕</button>
            </div>
            <div className="im-form-body">
              <div className="im-form-section">
                <label className="im-form-label">Service Name *</label>
                <input className="im-input" placeholder="e.g. Premium Listing Package"
                  value={editing.name} onChange={e => setEditField('name', e.target.value)} />
              </div>
              <div className="im-form-section im-form-row-2">
                <div>
                  <label className="im-form-label">Category (optional)</label>
                  <input className="im-input" placeholder="e.g. Listings, Transport, Consulting"
                    value={editing.category} onChange={e => setEditField('category', e.target.value)} />
                </div>
                <div>
                  <label className="im-form-label">Price (BWP)</label>
                  <input className="im-input" type="number" min="0" step="0.01" placeholder="0.00"
                    value={editing.unitPrice} onChange={e => setEditField('unitPrice', e.target.value)} />
                </div>
              </div>
              <div className="im-form-section">
                <label className="im-form-label">What's Included</label>
                {editing.includes.map((inc, idx) => (
                  <div key={idx} className="im-include-row">
                    <input className="im-input" placeholder={`Item ${idx + 1}, e.g. 10 photos`}
                      value={inc} onChange={e => setInclude(idx, e.target.value)} />
                    <button className="im-remove-item" onClick={() => removeInclude(idx)}
                      disabled={editing.includes.length === 1}>×</button>
                  </div>
                ))}
                <button className="im-add-item-btn" type="button" onClick={addInclude}>+ Add Item</button>
              </div>
            </div>
            <div className="im-form-footer">
              <button className="im-btn-ghost" onClick={cancelEdit}>Cancel</button>
              <button className="im-btn-primary" onClick={saveEdit}
                disabled={!editing.name.trim()}>Save Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ServicePicker – modal opened from DocForm
// ─────────────────────────────────────────────────────────────────────────────
const ServicePicker = ({ onPick, onClose }) => {
  const services = loadServices();
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const confirm = () => {
    const picked = services.filter(s => selected.has(s.id));
    onPick(picked);
    onClose();
  };

  if (services.length === 0) {
    return (
      <div className="im-form-overlay" onClick={onClose}>
        <div className="im-form-panel" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
          <div className="im-form-head">
            <h2 className="im-form-title">Add from Catalog</h2>
            <button className="im-form-close" onClick={onClose}>✕</button>
          </div>
          <div className="im-form-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>No services in catalog yet.</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>Go to the Services tab to add your first service.</p>
          </div>
        </div>
      </div>
    );
  }

  const groups = services.reduce((acc, svc) => {
    const cat = svc.category?.trim() || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <div className="im-form-overlay" onClick={onClose}>
      <div className="im-form-panel" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="im-form-head">
          <h2 className="im-form-title">Add from Catalog</h2>
          <button className="im-form-close" onClick={onClose}>✕</button>
        </div>
        <div className="im-form-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {Object.entries(groups).map(([cat, svcs]) => (
            <div key={cat} style={{ marginBottom: '1rem' }}>
              <p className="im-catalog-group-title" style={{ marginBottom: '0.4rem' }}>{cat}</p>
              {svcs.map(svc => (
                <label key={svc.id} className={`im-picker-row${selected.has(svc.id) ? ' selected' : ''}`}>
                  <input type="checkbox" checked={selected.has(svc.id)} onChange={() => toggle(svc.id)} />
                  <div className="im-picker-row-body">
                    <span className="im-picker-name">{svc.name}</span>
                    <span className="im-picker-price">{formatBWP(svc.unitPrice)}</span>
                  </div>
                  {svc.includes?.length > 0 && (
                    <ul className="im-catalog-includes" style={{ marginTop: '0.2rem', paddingLeft: '1.5rem' }}>
                      {svc.includes.map((inc, i) => <li key={i}>{inc}</li>)}
                    </ul>
                  )}
                </label>
              ))}
            </div>
          ))}
        </div>
        <div className="im-form-footer">
          <button className="im-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="im-btn-primary" onClick={confirm} disabled={selected.size === 0}>
            Add {selected.size > 0 ? `${selected.size} Service${selected.size > 1 ? 's' : ''}` : 'Selected'}
          </button>
        </div>
      </div>
    </div>
  );
};

const genRefNumber = (type) => {
  const prefix = type === 'quotation' ? 'QUO' : 'INV';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${yy}${mm}-${seq}`;
};

const PAYMENT_DETAILS = [
  { label: 'FNB Paytocell',  value: '+267 72 573 475' },
  { label: 'FNB Account #',  value: '62918382300'     },
  { label: 'Orange Money',   value: '+267 72 573 475' }
];

const empty_doc = (type = 'invoice') => ({
  type,
  reference: genRefNumber(type),
  customer: { name: '', email: '', phone: '', address: '' },
  items: [empty_item()],
  notes: '',
  taxRate: 14,
  discountRate: 0,
  showPaymentDetails: false,
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
              {doc.reference && <p className="im-print-num">Ref: {doc.reference}</p>}
              {doc.number    && <p className="im-print-num" style={{ color: '#888', fontSize: '0.78rem' }}>ID: {doc.number}</p>}
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

        {doc.showPaymentDetails && (
          <div className="im-print-payment">
            <p className="im-print-payment-title">Payment Details</p>
            <div className="im-print-payment-grid">
              {PAYMENT_DETAILS.map(p => (
                <div key={p.label} className="im-print-payment-row">
                  <span className="im-print-payment-label">{p.label}</span>
                  <span className="im-print-payment-value">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
  const [showPicker, setShowPicker] = useState(false);

  const addFromCatalog = (pickedServices) => {
    const newItems = pickedServices.map(svc => ({
      description: svc.name + (svc.includes?.length > 0 ? ` (${svc.includes.join(', ')})` : ''),
      quantity: 1,
      unitPrice: svc.unitPrice || '',
    }));
    setForm(prev => ({ ...prev, items: [...prev.items.filter(it => it.description || it.unitPrice), ...newItems] }));
  };

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
                  onClick={() => { setField('type', 'invoice'); setField('reference', genRefNumber('invoice')); }}
                  type="button"
                >Invoice</button>
                <button
                  className={`im-type-btn ${form.type === 'quotation' ? 'active' : ''}`}
                  onClick={() => { setField('type', 'quotation'); setField('reference', genRefNumber('quotation')); }}
                  type="button"
                >Quotation</button>
              </div>
            </div>
          )}

          {/* Reference / Auto-ID */}
          <div className="im-form-section">
            <div className="im-ref-row">
              <div style={{ flex: 1 }}>
                <label className="im-form-label">Reference # (auto-generated, editable)</label>
                <input className="im-input im-ref-input" value={form.reference || ''}
                  onChange={e => setField('reference', e.target.value)}
                  placeholder="e.g. INV-2607-142" />
              </div>
              <button type="button" className="im-regen-btn"
                title="Regenerate reference number"
                onClick={() => setField('reference', genRefNumber(form.type))}>
                ↻
              </button>
            </div>
          </div>

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
            <div className="im-items-title-row">
              <p className="im-form-section-title" style={{ margin: 0 }}>Line Items</p>
              <button type="button" className="im-catalog-pick-btn" onClick={() => setShowPicker(true)}>
                📋 Add from Catalog
              </button>
            </div>
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

          {/* Payment details toggle */}
          <div className="im-form-section">
            <label className="im-payment-toggle">
              <input type="checkbox" checked={!!form.showPaymentDetails}
                onChange={e => setField('showPaymentDetails', e.target.checked)} />
              Include payment details on document
            </label>
            {form.showPaymentDetails && (
              <div className="im-payment-preview">
                {PAYMENT_DETAILS.map(p => (
                  <div key={p.label} className="im-payment-preview-row">
                    <span>{p.label}</span><span>{p.value}</span>
                  </div>
                ))}
              </div>
            )}
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
      {showPicker && <ServicePicker onPick={addFromCatalog} onClose={() => setShowPicker(false)} />}
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
  const [mainTab, setMainTab]       = useState('docs'); // 'docs' | 'services'
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
          <p className="im-subheading">{mainTab === 'docs' ? `${docs.length} document${docs.length !== 1 ? 's' : ''}` : 'Manage your service catalog'}</p>
        </div>
        {mainTab === 'docs' && (
          <div className="im-header-actions">
            <button className="im-btn-secondary" onClick={() => setForm(empty_doc('quotation'))}>+ New Quotation</button>
            <button className="im-btn-primary" onClick={() => setForm(empty_doc('invoice'))}>+ New Invoice</button>
          </div>
        )}
      </div>

      {/* Main tabs */}
      <div className="im-tabs">
        <button className={`im-tab ${mainTab === 'docs' ? 'active' : ''}`} onClick={() => setMainTab('docs')}>
          📄 Documents
        </button>
        <button className={`im-tab ${mainTab === 'services' ? 'active' : ''}`} onClick={() => setMainTab('services')}>
          🛠️ Services
        </button>
      </div>

      {/* Services view */}
      {mainTab === 'services' && <ServiceCatalog />}

      {/* Documents view */}
      {mainTab === 'docs' && <>
      {/* Type tabs */}
      <div className="im-tabs" style={{ marginTop: '0.5rem' }}>
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
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {doc.reference && <span className="im-doc-num">{doc.reference}</span>}
                        {doc.number    && <span style={{ fontSize: '0.72rem', color: '#6e7681', fontFamily: 'monospace' }}>{doc.number}</span>}
                      </div>
                    </td>
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

      </>}

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
