// AdminBusiness.js — Packages, Customers, Finances
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import './AdminBusiness.css';

const API = process.env.REACT_APP_API_URL || '/api';

const PKG_CATS = ['Marketing', 'Car Sales Listing', 'Photography / Media', 'Consulting', 'Events', 'Partnerships', 'Social Media', 'Design', 'Other'];
const DURATIONS = ['once-off', 'weekly', 'monthly', 'quarterly', 'annually'];
const CUST_STATUSES = ['lead', 'active', 'paused', 'completed', 'churned'];
const CUST_STATUS_COLORS = { lead: '#f59e0b', active: '#22c55e', paused: '#60a5fa', completed: '#8b5cf6', churned: '#6b7280' };
const INCOME_CATS = ['Package Payment', 'Service Fee', 'Commission', 'Consulting', 'Events', 'Ad Revenue', 'Partnership', 'Other'];
const EXPENSE_CATS = ['Operations', 'Advertising', 'Software / Tools', 'Salaries', 'Events', 'Equipment', 'Travel', 'Office', 'Other'];
const INCOME_STATUSES = ['pending', 'received', 'allocated', 'partial'];
const EXPENSE_STATUSES = ['budgeted', 'spent', 'partial'];
const INCOME_STATUS_COLORS = { pending: '#f59e0b', received: '#22c55e', allocated: '#60a5fa', partial: '#f97316' };
const EXPENSE_STATUS_COLORS = { budgeted: '#8b5cf6', spent: '#ef4444', partial: '#f97316' };

function useHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtMoney(n, cur = 'BWP') {
  if (n == null) return '—';
  return `${cur} ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="biz-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`biz-modal${wide ? ' biz-modal--wide' : ''}`}>
        <div className="biz-modal-head">
          <h2 className="biz-modal-title">{title}</h2>
          <button className="biz-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="biz-modal-body">{children}</div>
        {footer && <div className="biz-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Packages ─────────────────────────────────────────────────────────────────
function PackagesTab() {
  const headers = useHeaders();
  const [pkgs, setPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | pkg
  const [form, setForm] = useState({ name: '', category: 'Marketing', description: '', price: '', currency: 'BWP', duration: 'monthly', features: [], templates: [], status: 'active' });
  const [newFeature, setNewFeature] = useState('');
  const [newTpl, setNewTpl] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [expandedPkg, setExpandedPkg] = useState(null);
  const [copiedTpl, setCopiedTpl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/packages`, { headers });
      const d = await res.json();
      if (d.success) setPkgs(d.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ name: '', category: 'Marketing', description: '', price: '', currency: 'BWP', duration: 'monthly', features: [], templates: [], status: 'active' });
    setNewFeature(''); setNewTpl({ title: '', content: '' });
    setModal({});
  };

  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, description: p.description, price: p.price, currency: p.currency, duration: p.duration, features: [...(p.features || [])], templates: [...(p.templates || [])], status: p.status });
    setNewFeature(''); setNewTpl({ title: '', content: '' });
    setModal(p);
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, newFeature.trim()] }));
    setNewFeature('');
  };

  const addTpl = () => {
    if (!newTpl.title.trim() || !newTpl.content.trim()) return;
    setForm(f => ({ ...f, templates: [...f.templates, { ...newTpl, id: Date.now() }] }));
    setNewTpl({ title: '', content: '' });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isNew = !modal?._id;
      const url = isNew ? `${API}/admin/packages` : `${API}/admin/packages/${modal._id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify({ ...form, price: Number(form.price) || 0 }) });
      const d = await res.json();
      if (d.success) { await load(); setModal(null); }
    } catch (_) {}
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    await fetch(`${API}/admin/packages/${id}`, { method: 'DELETE', headers });
    setPkgs(prev => prev.filter(p => p._id !== id));
  };

  const copyTpl = (id, content) => {
    navigator.clipboard.writeText(content).then(() => { setCopiedTpl(id); setTimeout(() => setCopiedTpl(null), 2000); });
  };

  const toggleStatus = async (pkg) => {
    const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API}/admin/packages/${pkg._id}`, { method: 'PUT', headers, body: JSON.stringify({ status: newStatus }) });
      const d = await res.json();
      if (d.success) setPkgs(prev => prev.map(p => p._id === pkg._id ? d.data : p));
    } catch (_) {}
  };

  return (
    <div>
      <div className="biz-section-head">
        <div>
          <h2 className="biz-section-title">Service Packages</h2>
          <p className="biz-section-desc">Define the services you offer and attach message templates to each.</p>
        </div>
        <button className="biz-btn biz-btn--primary" onClick={openNew}>+ New Package</button>
      </div>

      {loading ? <div className="biz-empty">Loading…</div> : pkgs.length === 0 ? (
        <div className="biz-empty">No packages yet. Create your first service package.</div>
      ) : (
        <div className="biz-pkg-grid">
          {pkgs.map(p => (
            <div key={p._id} className={`biz-pkg-card${p.status === 'inactive' ? ' biz-pkg-card--inactive' : ''}`}>
              <div className="biz-pkg-card-head">
                <div>
                  <span className="biz-pkg-name">{p.name}</span>
                  <span className="biz-cat-badge">{p.category}</span>
                </div>
                <div className="biz-pkg-actions">
                  <button className="biz-btn biz-btn--ghost biz-btn--xs" onClick={() => openEdit(p)}>Edit</button>
                  <button className={`biz-btn biz-btn--xs ${p.status === 'active' ? 'biz-btn--ghost' : 'biz-btn--primary'}`} onClick={() => toggleStatus(p)}>
                    {p.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="biz-btn biz-btn--danger biz-btn--xs" onClick={() => remove(p._id)}>✕</button>
                </div>
              </div>

              <div className="biz-pkg-price">
                <span className="biz-price-amount">{fmtMoney(p.price, p.currency)}</span>
                <span className="biz-price-dur">/ {p.duration}</span>
              </div>

              {p.description && <p className="biz-pkg-desc">{p.description}</p>}

              {(p.features || []).length > 0 && (
                <ul className="biz-pkg-features">
                  {p.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}

              {(p.templates || []).length > 0 && (
                <div className="biz-pkg-tpls">
                  <button className="biz-expand-tpl-btn" onClick={() => setExpandedPkg(expandedPkg === p._id ? null : p._id)}>
                    {p.templates.length} template{p.templates.length !== 1 ? 's' : ''} {expandedPkg === p._id ? '▲' : '▼'}
                  </button>
                  {expandedPkg === p._id && (
                    <div className="biz-tpl-list">
                      {p.templates.map((t, i) => {
                        const tplId = `${p._id}-${i}`;
                        return (
                          <div key={i} className="biz-tpl-item">
                            <div className="biz-tpl-item-head">
                              <span className="biz-tpl-item-title">{t.title}</span>
                              <button
                                className={`biz-btn biz-btn--copy biz-btn--xs${copiedTpl === tplId ? ' copied' : ''}`}
                                onClick={() => copyTpl(tplId, t.content)}
                              >{copiedTpl === tplId ? '✓ Copied' : 'Copy'}</button>
                            </div>
                            <pre className="biz-tpl-preview">{t.content}</pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="biz-pkg-footer">
                <span className={`biz-status-dot${p.status === 'active' ? ' active' : ''}`}></span>
                <span className="biz-pkg-meta">{p.status === 'active' ? 'Active' : 'Inactive'} · Added by {p.createdBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal
          title={modal._id ? `Edit — ${modal.name}` : 'New Service Package'}
          onClose={() => setModal(null)}
          wide
          footer={
            <>
              <button className="biz-btn biz-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="biz-btn biz-btn--primary" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save Package'}</button>
            </>
          }
        >
          <div className="biz-form-grid">
            <div className="biz-field biz-field--full">
              <label className="biz-label">Package Name *</label>
              <input className="biz-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Social Media Growth Package" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Category</label>
              <select className="biz-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {PKG_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Status</label>
              <select className="biz-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Price</label>
              <div className="biz-price-row">
                <select className="biz-input biz-input--cur" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="BWP">BWP</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
                <input className="biz-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="biz-field">
              <label className="biz-label">Billing Duration</label>
              <select className="biz-input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div className="biz-field biz-field--full">
              <label className="biz-label">Description</label>
              <textarea className="biz-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's included, target audience, outcome…" />
            </div>

            {/* Features */}
            <div className="biz-field biz-field--full">
              <label className="biz-label">What's Included</label>
              {form.features.map((ft, i) => (
                <div key={i} className="biz-chip-row">
                  <span className="biz-feature-chip">✓ {ft}</span>
                  <button className="biz-remove-btn" onClick={() => setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
              <div className="biz-add-row">
                <input className="biz-input" value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeature()} placeholder="Add feature or deliverable…" />
                <button className="biz-btn biz-btn--ghost" onClick={addFeature}>+ Add</button>
              </div>
            </div>

            {/* Templates */}
            <div className="biz-field biz-field--full">
              <label className="biz-label">Message Templates for this Package</label>
              {form.templates.map((t, i) => (
                <div key={i} className="biz-tpl-edit-card">
                  <div className="biz-tpl-edit-head">
                    <span className="biz-tpl-edit-title">{t.title}</span>
                    <button className="biz-remove-btn" onClick={() => setForm(f => ({ ...f, templates: f.templates.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                  <pre className="biz-tpl-preview">{t.content}</pre>
                </div>
              ))}
              <div className="biz-tpl-add-form">
                <input className="biz-input" value={newTpl.title} onChange={e => setNewTpl(p => ({ ...p, title: e.target.value }))} placeholder="Template title (e.g. Sales Pitch)" />
                <textarea className="biz-textarea" rows={4} value={newTpl.content} onChange={e => setNewTpl(p => ({ ...p, content: e.target.value }))} placeholder="Message content…" />
                <button className="biz-btn biz-btn--ghost" style={{ alignSelf: 'flex-start' }} onClick={addTpl} disabled={!newTpl.title.trim() || !newTpl.content.trim()}>+ Add Template</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────
function CustomersTab() {
  const headers = useHeaders();
  const [customers, setCustomers] = useState([]);
  const [pkgs, setPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', packageId: '', packageName: '', serviceStart: '', serviceEnd: '', amountAgreed: '', currency: 'BWP', status: 'lead', notes: '', source: '' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, pr] = await Promise.all([
        fetch(`${API}/admin/customers`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/packages`, { headers }).then(r => r.json()),
      ]);
      if (cr.success) setCustomers(cr.data || []);
      if (pr.success) setPkgs(pr.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ name: '', phone: '', email: '', company: '', packageId: '', packageName: '', serviceStart: '', serviceEnd: '', amountAgreed: '', currency: 'BWP', status: 'lead', notes: '', source: '' });
    setModal({});
  };

  const openEdit = (c) => {
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', company: c.company || '', packageId: c.packageId || '', packageName: c.packageName || '', serviceStart: c.serviceStart ? new Date(c.serviceStart).toISOString().split('T')[0] : '', serviceEnd: c.serviceEnd ? new Date(c.serviceEnd).toISOString().split('T')[0] : '', amountAgreed: c.amountAgreed || '', currency: c.currency || 'BWP', status: c.status, notes: c.notes || '', source: c.source || '' });
    setModal(c);
  };

  const handlePkgSelect = (pkgId) => {
    const pkg = pkgs.find(p => p._id === pkgId);
    setForm(f => ({ ...f, packageId: pkgId, packageName: pkg?.name || '', amountAgreed: pkg?.price || f.amountAgreed, currency: pkg?.currency || f.currency }));
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isNew = !modal?._id;
      const url = isNew ? `${API}/admin/customers` : `${API}/admin/customers/${modal._id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify({ ...form, amountAgreed: Number(form.amountAgreed) || 0 }) });
      const d = await res.json();
      if (d.success) { await load(); setModal(null); }
    } catch (_) {}
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this customer?')) return;
    await fetch(`${API}/admin/customers/${id}`, { method: 'DELETE', headers });
    setCustomers(prev => prev.filter(c => c._id !== id));
  };

  const quickStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/admin/customers/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (d.success) setCustomers(prev => prev.map(c => c._id === id ? d.data : c));
    } catch (_) {}
  };

  const visible = customers.filter(c => {
    const s = !filterStatus || c.status === filterStatus;
    const q = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search) || (c.packageName || '').toLowerCase().includes(search.toLowerCase());
    return s && q;
  });

  const counts = CUST_STATUSES.reduce((acc, s) => { acc[s] = customers.filter(c => c.status === s).length; return acc; }, {});

  return (
    <div>
      <div className="biz-section-head">
        <div>
          <h2 className="biz-section-title">Customers</h2>
          <p className="biz-section-desc">Track clients, their services, agreements and progress.</p>
        </div>
        <button className="biz-btn biz-btn--primary" onClick={openNew}>+ Add Customer</button>
      </div>

      {/* Status quick-filters */}
      <div className="biz-status-filters">
        {CUST_STATUSES.map(s => (
          <button
            key={s}
            className={`biz-status-pill${filterStatus === s ? ' active' : ''}`}
            style={{ '--pill-color': CUST_STATUS_COLORS[s] }}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} <span className="biz-pill-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="biz-toolbar">
        <input className="biz-search" placeholder="Search by name, company, phone, package…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="biz-empty">Loading…</div> : visible.length === 0 ? (
        <div className="biz-empty">{customers.length === 0 ? 'No customers yet.' : 'Nothing matches your filters.'}</div>
      ) : (
        <div className="biz-customer-list">
          {visible.map(c => (
            <div key={c._id} className="biz-customer-card">
              <div className="biz-customer-main" onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}>
                <div className="biz-customer-avatar">{(c.name || 'C').charAt(0).toUpperCase()}</div>
                <div className="biz-customer-info">
                  <span className="biz-customer-name">{c.name}{c.company && <span className="biz-customer-company"> · {c.company}</span>}</span>
                  <div className="biz-customer-meta-row">
                    {c.phone && <span>{c.phone}</span>}
                    {c.packageName && <span className="biz-customer-pkg">◈ {c.packageName}</span>}
                    {c.amountAgreed > 0 && <span className="biz-customer-amount">{fmtMoney(c.amountAgreed, c.currency)}</span>}
                  </div>
                </div>
                <div className="biz-customer-right">
                  <span className="biz-status-badge" style={{ background: `${CUST_STATUS_COLORS[c.status]}18`, color: CUST_STATUS_COLORS[c.status], borderColor: `${CUST_STATUS_COLORS[c.status]}35` }}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  <span className="biz-customer-chevron">{expandedId === c._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedId === c._id && (
                <div className="biz-customer-expand">
                  <div className="biz-customer-details">
                    {c.email && <div className="biz-detail-row"><span className="biz-detail-label">Email</span><span>{c.email}</span></div>}
                    {c.source && <div className="biz-detail-row"><span className="biz-detail-label">Source</span><span>{c.source}</span></div>}
                    {c.serviceStart && <div className="biz-detail-row"><span className="biz-detail-label">Start</span><span>{fmtDate(c.serviceStart)}</span></div>}
                    {c.serviceEnd && <div className="biz-detail-row"><span className="biz-detail-label">End</span><span>{fmtDate(c.serviceEnd)}</span></div>}
                    {c.notes && <div className="biz-detail-row biz-detail-row--notes"><span className="biz-detail-label">Notes</span><span>{c.notes}</span></div>}
                    <div className="biz-detail-row"><span className="biz-detail-label">Added by</span><span>{c.createdBy} · {fmtDate(c.createdAt)}</span></div>
                    {c.updatedBy && <div className="biz-detail-row"><span className="biz-detail-label">Last edit</span><span>{c.updatedBy}</span></div>}
                  </div>
                  <div className="biz-customer-expand-actions">
                    <div className="biz-quick-status">
                      {CUST_STATUSES.filter(s => s !== c.status).map(s => (
                        <button key={s} className="biz-btn biz-btn--ghost biz-btn--xs" onClick={() => quickStatus(c._id, s)}>→ {s}</button>
                      ))}
                    </div>
                    <div>
                      <button className="biz-btn biz-btn--ghost biz-btn--xs" onClick={() => openEdit(c)}>Edit</button>
                      <button className="biz-btn biz-btn--danger biz-btn--xs" style={{ marginLeft: '0.35rem' }} onClick={() => remove(c._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal
          title={modal._id ? `Edit — ${modal.name}` : 'Add Customer'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="biz-btn biz-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="biz-btn biz-btn--primary" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="biz-form-grid">
            <div className="biz-field">
              <label className="biz-label">Name *</label>
              <input className="biz-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Company</label>
              <input className="biz-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Business name (optional)" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Phone</label>
              <input className="biz-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+267…" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Email</label>
              <input className="biz-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Service Package</label>
              <select className="biz-input" value={form.packageId} onChange={e => handlePkgSelect(e.target.value)}>
                <option value="">No package</option>
                {pkgs.filter(p => p.status === 'active').map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Status</label>
              <select className="biz-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {CUST_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Amount Agreed</label>
              <div className="biz-price-row">
                <select className="biz-input biz-input--cur" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="BWP">BWP</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
                <input className="biz-input" type="number" min="0" value={form.amountAgreed} onChange={e => setForm(f => ({ ...f, amountAgreed: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="biz-field">
              <label className="biz-label">How did they find us?</label>
              <input className="biz-input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Referral, Instagram, WhatsApp…" />
            </div>
            <div className="biz-field">
              <label className="biz-label">Service Start</label>
              <input className="biz-input" type="date" value={form.serviceStart} onChange={e => setForm(f => ({ ...f, serviceStart: e.target.value }))} />
            </div>
            <div className="biz-field">
              <label className="biz-label">Service End</label>
              <input className="biz-input" type="date" value={form.serviceEnd} onChange={e => setForm(f => ({ ...f, serviceEnd: e.target.value }))} />
            </div>
            <div className="biz-field biz-field--full">
              <label className="biz-label">Notes</label>
              <textarea className="biz-textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional context, agreements, or follow-ups…" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Finances ─────────────────────────────────────────────────────────────────
function FinancesTab() {
  const headers = useHeaders();
  const [summary, setSummary] = useState(null);
  const [txns, setTxns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pkgs, setPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ type: 'income', amount: '', currency: 'BWP', category: 'Package Payment', description: '', customerId: '', customerName: '', packageId: '', packageName: '', status: 'pending', allocatedTo: '', reference: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const [tr, sr, cr, pr] = await Promise.all([
        fetch(`${API}/admin/transactions?${params}`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/finance/summary`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/customers`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/packages`, { headers }).then(r => r.json()),
      ]);
      if (tr.success) setTxns(tr.data || []);
      if (sr.success) setSummary(sr.data);
      if (cr.success) setCustomers(cr.data || []);
      if (pr.success) setPkgs(pr.data || []);
    } catch (_) {}
    setLoading(false);
  }, [typeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const openNew = (type = 'income') => {
    setForm({ type, amount: '', currency: 'BWP', category: type === 'income' ? 'Package Payment' : 'Operations', description: '', customerId: '', customerName: '', packageId: '', packageName: '', status: type === 'income' ? 'pending' : 'budgeted', allocatedTo: '', reference: '', date: new Date().toISOString().split('T')[0] });
    setModal({});
  };

  const handleCustomerSelect = (customerId) => {
    const c = customers.find(x => x._id === customerId);
    setForm(f => ({ ...f, customerId, customerName: c?.name || '', packageId: c?.packageId || f.packageId, packageName: c?.packageName || f.packageName }));
  };

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/transactions`, { method: 'POST', headers, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      const d = await res.json();
      if (d.success) { await load(); setModal(null); }
    } catch (_) {}
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/admin/transactions/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (d.success) { setTxns(prev => prev.map(t => t._id === id ? d.data : t)); await load(); setEditingId(null); }
    } catch (_) {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await fetch(`${API}/admin/transactions/${id}`, { method: 'DELETE', headers });
    setTxns(prev => prev.filter(t => t._id !== id));
    load();
  };

  const getStatusColor = (txn) => {
    if (txn.type === 'income') return INCOME_STATUS_COLORS[txn.status] || '#6b7280';
    return EXPENSE_STATUS_COLORS[txn.status] || '#6b7280';
  };

  return (
    <div>
      <div className="biz-section-head">
        <div>
          <h2 className="biz-section-title">Finances</h2>
          <p className="biz-section-desc">Track money in, money out, allocations and pending payments.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="biz-btn biz-btn--income" onClick={() => openNew('income')}>+ Income</button>
          <button className="biz-btn biz-btn--expense" onClick={() => openNew('expense')}>+ Expense</button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="biz-summary-grid">
          <div className="biz-summary-card biz-summary-card--in">
            <span className="biz-summary-label">Total Received</span>
            <span className="biz-summary-amount">{fmtMoney(summary.totalReceived)}</span>
            {summary.totalPending > 0 && <span className="biz-summary-sub">+{fmtMoney(summary.totalPending)} pending</span>}
          </div>
          <div className="biz-summary-card biz-summary-card--out">
            <span className="biz-summary-label">Total Spent</span>
            <span className="biz-summary-amount">{fmtMoney(summary.totalSpent)}</span>
            {summary.totalBudgeted > 0 && <span className="biz-summary-sub">{fmtMoney(summary.totalBudgeted)} budgeted</span>}
          </div>
          <div className={`biz-summary-card biz-summary-card--net${summary.available >= 0 ? ' positive' : ' negative'}`}>
            <span className="biz-summary-label">Available Balance</span>
            <span className="biz-summary-amount">{fmtMoney(summary.available)}</span>
            {summary.totalAllocated > 0 && <span className="biz-summary-sub">{fmtMoney(summary.totalAllocated)} allocated</span>}
          </div>
          <div className="biz-summary-card biz-summary-card--customers">
            <span className="biz-summary-label">Customers</span>
            <span className="biz-summary-amount">{summary.customerCount}</span>
            <span className="biz-summary-sub">{summary.activeCustomers} active</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="biz-finance-filters">
        <div className="biz-filter-btns">
          <button className={`biz-filter-btn${typeFilter === '' ? ' active' : ''}`} onClick={() => setTypeFilter('')}>All</button>
          <button className={`biz-filter-btn biz-filter-btn--income${typeFilter === 'income' ? ' active' : ''}`} onClick={() => setTypeFilter('income')}>Income</button>
          <button className={`biz-filter-btn biz-filter-btn--expense${typeFilter === 'expense' ? ' active' : ''}`} onClick={() => setTypeFilter('expense')}>Expenses</button>
        </div>
        <select className="biz-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {[...INCOME_STATUSES, ...EXPENSE_STATUSES].filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="biz-date-range">
          <input className="biz-input biz-input--date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="biz-date-sep">–</span>
          <input className="biz-input biz-input--date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {(typeFilter || statusFilter || dateFrom || dateTo) && (
          <button className="biz-btn biz-btn--ghost biz-btn--xs" onClick={() => { setTypeFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }}>Clear</button>
        )}
      </div>

      {loading ? <div className="biz-empty">Loading…</div> : txns.length === 0 ? (
        <div className="biz-empty">No transactions found.</div>
      ) : (
        <div className="biz-txn-list">
          {txns.map(t => (
            <div key={t._id} className={`biz-txn-row biz-txn-row--${t.type}`}>
              <div className="biz-txn-type-indicator">
                <span className={`biz-txn-type-dot biz-txn-type-dot--${t.type}`}></span>
              </div>
              <div className="biz-txn-body">
                <div className="biz-txn-top">
                  <span className="biz-txn-desc">{t.description || t.category}</span>
                  {t.customerName && <span className="biz-txn-customer">· {t.customerName}</span>}
                  {t.packageName && <span className="biz-txn-pkg">◈ {t.packageName}</span>}
                </div>
                <div className="biz-txn-meta">
                  <span className="biz-txn-cat">{t.category}</span>
                  <span>{fmtDate(t.date)}</span>
                  {t.reference && <span>Ref: {t.reference}</span>}
                  {t.allocatedTo && <span className="biz-txn-alloc">→ {t.allocatedTo}</span>}
                  <span className="biz-muted">by {t.recordedBy}</span>
                </div>
              </div>
              <div className="biz-txn-right">
                <span className={`biz-txn-amount${t.type === 'expense' ? ' biz-txn-amount--out' : ' biz-txn-amount--in'}`}>
                  {t.type === 'expense' ? '−' : '+'}{fmtMoney(t.amount, t.currency)}
                </span>
                {editingId === t._id ? (
                  <div className="biz-txn-status-edit">
                    <select
                      className="biz-input biz-input--xs"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                    >
                      {(t.type === 'income' ? INCOME_STATUSES : EXPENSE_STATUSES).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <button className="biz-btn biz-btn--primary biz-btn--xs" onClick={() => updateStatus(t._id, editStatus)}>Save</button>
                    <button className="biz-btn biz-btn--ghost biz-btn--xs" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                ) : (
                  <button
                    className="biz-status-badge biz-status-badge--btn"
                    style={{ background: `${getStatusColor(t)}18`, color: getStatusColor(t), borderColor: `${getStatusColor(t)}35` }}
                    onClick={() => { setEditingId(t._id); setEditStatus(t.status); }}
                    title="Click to change status"
                  >
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </button>
                )}
                <button className="biz-btn biz-btn--danger biz-btn--xs" onClick={() => remove(t._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal
          title={`Record ${form.type === 'income' ? 'Income' : 'Expense'}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="biz-btn biz-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="biz-btn biz-btn--primary" onClick={save} disabled={saving || !form.amount || Number(form.amount) <= 0}>{saving ? 'Saving…' : 'Record'}</button>
            </>
          }
        >
          <div className="biz-form-grid">
            <div className="biz-field">
              <label className="biz-label">Type</label>
              <div className="biz-type-toggle">
                <button className={`biz-type-btn${form.type === 'income' ? ' active-income' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'income', status: 'pending', category: 'Package Payment' }))}>Income</button>
                <button className={`biz-type-btn${form.type === 'expense' ? ' active-expense' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'expense', status: 'budgeted', category: 'Operations' }))}>Expense</button>
              </div>
            </div>
            <div className="biz-field">
              <label className="biz-label">Amount *</label>
              <div className="biz-price-row">
                <select className="biz-input biz-input--cur" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="BWP">BWP</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
                <input className="biz-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" autoFocus />
              </div>
            </div>
            <div className="biz-field">
              <label className="biz-label">Category</label>
              <select className="biz-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Status</label>
              <select className="biz-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {(form.type === 'income' ? INCOME_STATUSES : EXPENSE_STATUSES).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="biz-field">
              <label className="biz-label">Date</label>
              <input className="biz-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="biz-field">
              <label className="biz-label">Reference / Invoice #</label>
              <input className="biz-input" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional ref number" />
            </div>
            {form.type === 'income' && (
              <div className="biz-field">
                <label className="biz-label">Customer</label>
                <select className="biz-input" value={form.customerId} onChange={e => handleCustomerSelect(e.target.value)}>
                  <option value="">No customer linked</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
                </select>
              </div>
            )}
            <div className="biz-field">
              <label className="biz-label">Package</label>
              <select className="biz-input" value={form.packageId} onChange={e => { const p = pkgs.find(x => x._id === e.target.value); setForm(f => ({ ...f, packageId: e.target.value, packageName: p?.name || '' })); }}>
                <option value="">No package</option>
                {pkgs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            {form.status === 'allocated' && (
              <div className="biz-field biz-field--full">
                <label className="biz-label">Allocated to (purpose)</label>
                <input className="biz-input" value={form.allocatedTo} onChange={e => setForm(f => ({ ...f, allocatedTo: e.target.value }))} placeholder="e.g. Marketing Campaign, Office Rent, etc." />
              </div>
            )}
            <div className="biz-field biz-field--full">
              <label className="biz-label">Description</label>
              <textarea className="biz-textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this transaction for?" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminBusiness = () => {
  const [tab, setTab] = useState('packages');

  return (
    <div className="biz-page">
      <div className="biz-page-header">
        <h1 className="biz-page-title">Business</h1>
        <p className="biz-page-sub">Service packages, customer relationships, and financial tracking.</p>
      </div>

      <div className="biz-tabs">
        {[
          { key: 'packages', label: '◈ Packages' },
          { key: 'customers', label: '◐ Customers' },
          { key: 'finances', label: '◆ Finances' },
        ].map(t => (
          <button key={t.key} className={`biz-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="biz-tab-content">
        {tab === 'packages' && <PackagesTab />}
        {tab === 'customers' && <CustomersTab />}
        {tab === 'finances' && <FinancesTab />}
      </div>
    </div>
  );
};

export default AdminBusiness;
