import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/axios.js';
import './MorasimoApp.css';

// ── Helpers ──────────────────────────────────────────────────
const fmt  = n => 'P ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = d => d ? new Date(d).toLocaleDateString('en-BW', { year: 'numeric', month: 'short', day: '2-digit' }) : '–';

const BADGE_CLASS = {
  pending:    'badge-warn',
  approved:   'badge-ok',
  active:     'badge-ok',
  rejected:   'badge-bad',
  suspended:  'badge-bad',
  verified:   'badge-ok',
  paid:       'badge-blue',
  cancelled:  'badge-dim',
  draft:      'badge-dim',
  ended:      'badge-dim',
  paused:     'badge-warn',
  processing: 'badge-blue',
};

const BIZ_TYPES = [
  'Car Dealership', 'Restaurant', 'Retail Store', 'Clothing', 'Electronics',
  'Pharmacy', 'Supermarket', 'Service Provider', 'Real Estate', 'Other',
];

// ── Shared UI ────────────────────────────────────────────────
const Spin  = () => <div className="mor-spin" />;
const Empty = ({ msg }) => (
  <div className="mor-empty">
    <span>◎</span>
    <p>{msg || 'No data yet'}</p>
  </div>
);
const Badge = ({ s }) => (
  <span className={`mor-badge ${BADGE_CLASS[s] || 'badge-dim'}`}>{s}</span>
);
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`mor-stat${accent ? ' ' + accent : ''}`}>
    <div className="mor-stat-val">{value}</div>
    <div className="mor-stat-label">{label}</div>
    {sub && <div className="mor-stat-sub">{sub}</div>}
  </div>
);
const Modal = ({ title, onClose, children }) => (
  <div className="mor-modal-overlay" onClick={onClose}>
    <div className="mor-modal" onClick={e => e.stopPropagation()}>
      <div className="mor-modal-head">
        <h3>{title}</h3>
        <button className="mor-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="mor-modal-body">{children}</div>
    </div>
  </div>
);

// ── useData ───────────────────────────────────────────────────
function useData(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(url);
      setData(r.data.data ?? r.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

// ── Overview ─────────────────────────────────────────────────
function OverviewSection() {
  const { data, loading } = useData('/api/morasimo/stats');
  if (loading) return <div className="mor-sec-body"><Spin /></div>;
  const s = data || {};
  return (
    <div className="mor-sec-body">
      <div className="mor-stat-grid">
        <StatCard label="Businesses"          value={s.businesses || 0}          sub={`${s.pendingBiz || 0} pending`}    accent="gold" />
        <StatCard label="Distributors"        value={s.distributors || 0}        sub={`${s.activeDist || 0} active`}     accent="blue" />
        <StatCard label="Active Campaigns"    value={s.campaigns || 0}           sub="running" />
        <StatCard label="Pending Commissions" value={fmt(s.pendingCommissions || 0)} sub="to distribute"               accent="gold" />
        <StatCard label="Transactions"        value={s.transactions || 0}        sub="all time" />
        <StatCard label="Withdrawal Requests" value={s.pendingWithdrawals || 0}  sub="awaiting approval"                accent="warn" />
      </div>
      <p className="mor-sub-head">Recent Transactions</p>
      {(s.recentTxns || []).length === 0 ? <Empty msg="No transactions yet" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Ref</th><th>Business</th><th>Distributor</th>
              <th>Amount</th><th>Commission</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              {(s.recentTxns || []).map(t => (
                <tr key={t._id}>
                  <td className="mor-mono">{t.refId}</td>
                  <td>{t.businessName}</td>
                  <td>{t.distributorName}<br/><span className="mor-code">{t.distributorCode}</span></td>
                  <td className="mor-mono">{fmt(t.saleAmount)}</td>
                  <td className="mor-mono">{fmt(t.commission)}</td>
                  <td><Badge s={t.status} /></td>
                  <td>{fmtD(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Businesses ───────────────────────────────────────────────
function BusinessesSection() {
  const [search,  setSearch]  = useState('');
  const [sfilt,   setSfilt]   = useState('');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const { data, loading, reload } = useData('/api/morasimo/businesses');

  const rows = (data || []).filter(b =>
    (!search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.email?.toLowerCase().includes(search.toLowerCase())) &&
    (!sfilt  || b.status === sfilt)
  );

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd  = () => { setForm({}); setModal({ type: 'add' }); };
  const openEdit = b  => { setForm({ ...b }); setModal({ type: 'edit' }); };
  const close    = () => setModal(null);

  const save = async () => {
    if (!form.name) return alert('Business name is required');
    setSaving(true);
    try {
      if (modal.type === 'add') await api.post('/api/morasimo/businesses', form);
      else                       await api.put(`/api/morasimo/businesses/${form._id}`, form);
      close(); reload();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/morasimo/businesses/${id}/status`, { status }); reload(); }
    catch { alert('Failed to update status'); }
  };

  return (
    <div className="mor-sec-body">
      <div className="mor-toolbar">
        <input className="mor-search" placeholder="Search businesses…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="mor-select" value={sfilt} onChange={e => setSfilt(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="mor-btn-gold" onClick={openAdd}>+ Add Business</button>
      </div>

      {loading ? <Spin /> : rows.length === 0 ? <Empty msg="No businesses found" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Name</th><th>Type</th><th>Contact</th><th>Phone</th>
              <th>Processing%</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(b => (
                <tr key={b._id}>
                  <td><strong>{b.name}</strong><small>{b.email}</small></td>
                  <td>{b.type || '–'}</td>
                  <td>{b.contactPerson || '–'}</td>
                  <td className="mor-mono">{b.phone || '–'}</td>
                  <td className="mor-mono">{b.processingFeeRate || 0}%</td>
                  <td><Badge s={b.status} /></td>
                  <td>{fmtD(b.createdAt)}</td>
                  <td className="mor-actions">
                    <button className="mor-btn-xs" onClick={() => openEdit(b)}>Edit</button>
                    {b.status === 'pending'   && <button className="mor-btn-xs ok"  onClick={() => setStatus(b._id, 'approved')}>Approve</button>}
                    {b.status === 'approved'  && <button className="mor-btn-xs bad" onClick={() => setStatus(b._id, 'suspended')}>Suspend</button>}
                    {b.status === 'suspended' && <button className="mor-btn-xs ok"  onClick={() => setStatus(b._id, 'approved')}>Reinstate</button>}
                    {b.status === 'pending'   && <button className="mor-btn-xs bad" onClick={() => setStatus(b._id, 'rejected')}>Reject</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.type === 'add' ? 'Add Business' : 'Edit Business'} onClose={close}>
          <div className="mor-form">
            <div className="mor-form-row">
              <label>Business Name *</label>
              <input value={form.name || ''} onChange={e => F('name', e.target.value)} placeholder="e.g. BW Car Culture" />
            </div>
            <div className="mor-form-row">
              <label>Business Type</label>
              <select value={form.type || ''} onChange={e => F('type', e.target.value)}>
                <option value="">Select type…</option>
                {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Email</label>
                <input type="email" value={form.email || ''} onChange={e => F('email', e.target.value)} />
              </div>
              <div className="mor-form-row">
                <label>Phone</label>
                <input value={form.phone || ''} onChange={e => F('phone', e.target.value)} />
              </div>
            </div>
            <div className="mor-form-row">
              <label>Contact Person</label>
              <input value={form.contactPerson || ''} onChange={e => F('contactPerson', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>Address</label>
              <input value={form.address || ''} onChange={e => F('address', e.target.value)} />
            </div>
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Monthly Fee (P)</label>
                <input type="number" value={form.monthlyFee || ''} onChange={e => F('monthlyFee', e.target.value)} placeholder="0.00" />
              </div>
              <div className="mor-form-row">
                <label>Morasimo Processing Fee %</label>
                <input type="number" value={form.processingFeeRate || ''} onChange={e => F('processingFeeRate', e.target.value)} placeholder="e.g. 5" />
                <small>% of commission that goes to Morasimo</small>
              </div>
            </div>
            {modal.type === 'edit' && (
              <div className="mor-form-row">
                <label>Status</label>
                <select value={form.status || 'pending'} onChange={e => F('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
            <div className="mor-form-actions">
              <button className="mor-btn-ghost" onClick={close}>Cancel</button>
              <button className="mor-btn-gold"  onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Business'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Distributors ─────────────────────────────────────────────
function DistributorsSection() {
  const [search,   setSearch]   = useState('');
  const [sfilt,    setSfilt]    = useState('');
  const [modal,    setModal]    = useState(null);
  const [viewDist, setViewDist] = useState(null);
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const { data, loading, reload } = useData('/api/morasimo/distributors');

  const rows = (data || []).filter(d =>
    (!search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.referralCode?.toLowerCase().includes(search.toLowerCase())) &&
    (!sfilt  || d.status === sfilt)
  );

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd  = () => { setForm({}); setModal({ type: 'add' }); };
  const close    = () => setModal(null);

  const save = async () => {
    if (!form.name || !form.phone) return alert('Name and phone are required');
    setSaving(true);
    try {
      if (modal.type === 'add') await api.post('/api/morasimo/distributors', form);
      else                       await api.put(`/api/morasimo/distributors/${form._id}`, form);
      close(); reload();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/morasimo/distributors/${id}/status`, { status }); reload(); }
    catch { alert('Failed'); }
  };

  return (
    <div className="mor-sec-body">
      <div className="mor-toolbar">
        <input className="mor-search" placeholder="Search name or code…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="mor-select" value={sfilt} onChange={e => setSfilt(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending KYC</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="mor-btn-gold" onClick={openAdd}>+ Add Distributor</button>
      </div>

      {loading ? <Spin /> : rows.length === 0 ? <Empty msg="No distributors found" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Name</th><th>Code</th><th>Phone</th>
              <th>Available</th><th>Lifetime</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d._id}>
                  <td><strong>{d.name}</strong><small>{d.email}</small></td>
                  <td><span className="mor-code">{d.referralCode}</span></td>
                  <td>{d.phone}</td>
                  <td className="mor-mono">{fmt(d.wallet?.available || 0)}</td>
                  <td className="mor-mono">{fmt(d.wallet?.lifetime || 0)}</td>
                  <td><Badge s={d.status} /></td>
                  <td className="mor-actions">
                    <button className="mor-btn-xs" onClick={() => setViewDist(d)}>View</button>
                    <button className="mor-btn-xs" onClick={() => { setForm({ ...d }); setModal({ type: 'edit' }); }}>Edit</button>
                    {d.status === 'pending'   && <button className="mor-btn-xs ok"  onClick={() => setStatus(d._id, 'active')}>Activate</button>}
                    {d.status === 'active'    && <button className="mor-btn-xs bad" onClick={() => setStatus(d._id, 'suspended')}>Suspend</button>}
                    {d.status === 'suspended' && <button className="mor-btn-xs ok"  onClick={() => setStatus(d._id, 'active')}>Reinstate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.type === 'add' ? 'Add Distributor' : 'Edit Distributor'} onClose={close}>
          <div className="mor-form">
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Full Name *</label>
                <input value={form.name || ''} onChange={e => F('name', e.target.value)} />
              </div>
              <div className="mor-form-row">
                <label>Phone *</label>
                <input value={form.phone || ''} onChange={e => F('phone', e.target.value)} />
              </div>
            </div>
            <div className="mor-form-row">
              <label>Email</label>
              <input type="email" value={form.email || ''} onChange={e => F('email', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>National ID Number</label>
              <input value={form.idNumber || ''} onChange={e => F('idNumber', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>Referral Code <small>(leave blank to auto-generate)</small></label>
              <input value={form.referralCode || ''} onChange={e => F('referralCode', e.target.value.toUpperCase())} placeholder="e.g. KATSO24" />
            </div>
            <div className="mor-form-row">
              <label>Withdrawal Method</label>
              <select value={form.withdrawalMethod || ''} onChange={e => F('withdrawalMethod', e.target.value)}>
                <option value="">Select…</option>
                <option value="bank">Bank Transfer</option>
                <option value="orange_money">Orange Money</option>
                <option value="myzaka">MyZaka</option>
              </select>
            </div>
            <div className="mor-form-row">
              <label>Account / Wallet Number</label>
              <input value={form.accountDetails || ''} onChange={e => F('accountDetails', e.target.value)} />
            </div>
            {modal.type === 'edit' && (
              <div className="mor-form-row">
                <label>Status</label>
                <select value={form.status || 'pending'} onChange={e => F('status', e.target.value)}>
                  <option value="pending">Pending KYC</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
            <div className="mor-form-actions">
              <button className="mor-btn-ghost" onClick={close}>Cancel</button>
              <button className="mor-btn-gold"  onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {viewDist && (
        <Modal title={viewDist.name} onClose={() => setViewDist(null)}>
          <div className="mor-dist-detail">
            <div className="mor-dist-code-big">{viewDist.referralCode}</div>
            <div className="mor-wallet-grid">
              <div className="mor-wallet-card"><p>Pending</p><strong>{fmt(viewDist.wallet?.pending || 0)}</strong></div>
              <div className="mor-wallet-card"><p>Available</p><strong className="mor-gold">{fmt(viewDist.wallet?.available || 0)}</strong></div>
              <div className="mor-wallet-card"><p>Withdrawn</p><strong>{fmt(viewDist.wallet?.withdrawn || 0)}</strong></div>
              <div className="mor-wallet-card"><p>Lifetime</p><strong>{fmt(viewDist.wallet?.lifetime || 0)}</strong></div>
            </div>
            <table className="mor-detail-table">
              <tbody>
                <tr><td>Phone</td><td>{viewDist.phone}</td></tr>
                <tr><td>Email</td><td>{viewDist.email || '–'}</td></tr>
                <tr><td>National ID</td><td>{viewDist.idNumber || '–'}</td></tr>
                <tr><td>Withdrawal</td><td>{viewDist.withdrawalMethod?.replace('_', ' ') || '–'}</td></tr>
                <tr><td>Account</td><td className="mor-mono">{viewDist.accountDetails || '–'}</td></tr>
                <tr><td>Status</td><td><Badge s={viewDist.status} /></td></tr>
                <tr><td>Joined</td><td>{fmtD(viewDist.createdAt)}</td></tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Campaigns ─────────────────────────────────────────────────
function CampaignsSection() {
  const [search,  setSearch] = useState('');
  const [modal,   setModal]  = useState(null);
  const [form,    setForm]   = useState({ products: [] });
  const [saving,  setSaving] = useState(false);
  const { data, loading, reload } = useData('/api/morasimo/campaigns');
  const { data: bizList } = useData('/api/morasimo/businesses');

  const rows = (data || []).filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd  = () => { setForm({ products: [], commissionRate: '', discountRate: '', status: 'draft' }); setModal({ type: 'add' }); };
  const openEdit = c  => { setForm({ ...c, products: c.products || [] }); setModal({ type: 'edit' }); };
  const close    = () => setModal(null);

  const addProduct    = () => setForm(p => ({ ...p, products: [...p.products, { name: '', price: '', commissionRate: '', discountRate: '' }] }));
  const removeProduct = i  => setForm(p => ({ ...p, products: p.products.filter((_, j) => j !== i) }));
  const setProduct    = (i, k, v) => setForm(p => {
    const arr = [...p.products];
    arr[i] = { ...arr[i], [k]: v };
    return { ...p, products: arr };
  });

  const save = async () => {
    if (!form.name || !form.businessId) return alert('Campaign name and business are required');
    const biz = (bizList || []).find(b => b._id === form.businessId);
    const payload = { ...form, businessName: biz?.name || form.businessName };
    setSaving(true);
    try {
      if (modal.type === 'add') await api.post('/api/morasimo/campaigns', payload);
      else                       await api.put(`/api/morasimo/campaigns/${form._id}`, payload);
      close(); reload();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mor-sec-body">
      <div className="mor-toolbar">
        <input className="mor-search" placeholder="Search campaigns…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="mor-btn-gold" onClick={openAdd}>+ New Campaign</button>
      </div>

      {loading ? <Spin /> : rows.length === 0 ? <Empty msg="No campaigns yet" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Campaign</th><th>Business</th><th>Commission%</th>
              <th>Discount%</th><th>Products</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.businessName}</td>
                  <td className="mor-mono">{c.commissionRate}%</td>
                  <td className="mor-mono">{c.discountRate}%</td>
                  <td>{(c.products || []).length}</td>
                  <td><Badge s={c.status || 'draft'} /></td>
                  <td className="mor-actions">
                    <button className="mor-btn-xs" onClick={() => openEdit(c)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.type === 'add' ? 'New Campaign' : 'Edit Campaign'} onClose={close}>
          <div className="mor-form">
            <div className="mor-form-row">
              <label>Campaign Name *</label>
              <input value={form.name || ''} onChange={e => F('name', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>Business *</label>
              <select value={form.businessId || ''} onChange={e => F('businessId', e.target.value)}>
                <option value="">Select business…</option>
                {(bizList || []).filter(b => b.status === 'approved').map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Commission Rate %</label>
                <input type="number" value={form.commissionRate || ''} onChange={e => F('commissionRate', e.target.value)} placeholder="e.g. 5" />
                <small>Paid by business to distributor</small>
              </div>
              <div className="mor-form-row">
                <label>Discount Rate %</label>
                <input type="number" value={form.discountRate || ''} onChange={e => F('discountRate', e.target.value)} placeholder="e.g. 3" />
                <small>Given to customer at checkout</small>
              </div>
            </div>
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Start Date</label>
                <input type="date" value={form.startDate ? form.startDate.slice(0, 10) : ''} onChange={e => F('startDate', e.target.value)} />
              </div>
              <div className="mor-form-row">
                <label>End Date</label>
                <input type="date" value={form.endDate ? form.endDate.slice(0, 10) : ''} onChange={e => F('endDate', e.target.value)} />
              </div>
            </div>
            <div className="mor-form-row">
              <label>Status</label>
              <select value={form.status || 'draft'} onChange={e => F('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div className="mor-form-row">
              <label>Terms & Conditions</label>
              <textarea value={form.terms || ''} onChange={e => F('terms', e.target.value)} rows={3} placeholder="Campaign terms…" />
            </div>

            <div className="mor-products-head">
              <span>Products / Services</span>
              <button className="mor-btn-xs" onClick={addProduct}>+ Add Product</button>
            </div>
            {(form.products || []).map((p, i) => (
              <div key={i} className="mor-product-row">
                <input className="pr-name"  placeholder="Product name"  value={p.name || ''}           onChange={e => setProduct(i, 'name', e.target.value)} />
                <input className="pr-price" placeholder="Price"         value={p.price || ''}          onChange={e => setProduct(i, 'price', e.target.value)}         type="number" />
                <input className="pr-pct"   placeholder="Com%"          value={p.commissionRate || ''} onChange={e => setProduct(i, 'commissionRate', e.target.value)} type="number" />
                <input className="pr-pct"   placeholder="Dis%"          value={p.discountRate || ''}   onChange={e => setProduct(i, 'discountRate', e.target.value)}   type="number" />
                <button className="mor-btn-xs bad" onClick={() => removeProduct(i)}>✕</button>
              </div>
            ))}

            <div className="mor-form-actions">
              <button className="mor-btn-ghost" onClick={close}>Cancel</button>
              <button className="mor-btn-gold"  onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Campaign'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Transactions ──────────────────────────────────────────────
function TxnsSection() {
  const [search,  setSearch] = useState('');
  const [sfilt,   setSfilt]  = useState('');
  const [modal,   setModal]  = useState(null);
  const [form,    setForm]   = useState({});
  const [saving,  setSaving] = useState(false);
  const { data, loading, reload } = useData('/api/morasimo/transactions');
  const { data: bizList }  = useData('/api/morasimo/businesses');
  const { data: distList } = useData('/api/morasimo/distributors');
  const { data: campList } = useData('/api/morasimo/campaigns');

  const rows = (data || []).filter(t =>
    (!sfilt  || t.status === sfilt) &&
    (!search || t.refId?.toLowerCase().includes(search.toLowerCase()) ||
                t.distributorName?.toLowerCase().includes(search.toLowerCase()) ||
                t.businessName?.toLowerCase().includes(search.toLowerCase()))
  );

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const close = () => setModal(null);

  const selBiz  = (bizList  || []).find(b => b._id === form.businessId);
  const selDist = (distList || []).find(d => d._id === form.distributorId);
  const selCamp = (campList || []).find(c => c._id === form.campaignId);
  const selProd = selCamp?.products?.find(p => p.name === form.productName);

  const sale      = Number(form.saleAmount) || 0;
  const commRate  = Number(selProd?.commissionRate || selCamp?.commissionRate || 0);
  const discRate  = Number(selProd?.discountRate   || selCamp?.discountRate   || 0);
  const procRate  = Number(selBiz?.processingFeeRate || 0);
  const grossComm = sale * commRate / 100;
  const procFee   = grossComm * procRate / 100;
  const netComm   = grossComm - procFee;
  const custDisc  = sale * discRate / 100;

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/morasimo/transactions/${id}/status`, { status }); reload(); }
    catch { alert('Failed'); }
  };

  const save = async () => {
    if (!form.businessId || !form.distributorId || !form.saleAmount)
      return alert('Business, distributor, and sale amount are required');
    const payload = {
      ...form,
      businessName:    selBiz?.name,
      distributorName: selDist?.name,
      distributorCode: selDist?.referralCode,
      campaignName:    selCamp?.name,
      commission:      grossComm,
      processingFee:   procFee,
      netCommission:   netComm,
      customerDiscount: custDisc,
    };
    setSaving(true);
    try {
      await api.post('/api/morasimo/transactions', payload);
      close(); reload();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mor-sec-body">
      <div className="mor-toolbar">
        <input className="mor-search" placeholder="Search ref, business, distributor…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="mor-select" value={sfilt} onChange={e => setSfilt(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
        <button className="mor-btn-gold" onClick={() => { setForm({}); setModal({ type: 'add' }); }}>+ Record Sale</button>
      </div>

      {loading ? <Spin /> : rows.length === 0 ? <Empty msg="No transactions found" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Ref</th><th>Business</th><th>Distributor</th><th>Product</th>
              <th>Sale</th><th>Commission</th><th>Net</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(t => (
                <tr key={t._id}>
                  <td className="mor-mono">{t.refId}</td>
                  <td>{t.businessName}</td>
                  <td>{t.distributorName}<br/><span className="mor-code">{t.distributorCode}</span></td>
                  <td>{t.productName || '–'}</td>
                  <td className="mor-mono">{fmt(t.saleAmount)}</td>
                  <td className="mor-mono">{fmt(t.commission)}</td>
                  <td className="mor-mono">{fmt(t.netCommission)}</td>
                  <td><Badge s={t.status} /></td>
                  <td>{fmtD(t.createdAt)}</td>
                  <td className="mor-actions">
                    {t.status === 'pending'  && <>
                      <button className="mor-btn-xs ok"   onClick={() => setStatus(t._id, 'verified')}>Verify</button>
                      <button className="mor-btn-xs bad"  onClick={() => setStatus(t._id, 'rejected')}>Reject</button>
                    </>}
                    {t.status === 'verified' && <button className="mor-btn-xs blue" onClick={() => setStatus(t._id, 'paid')}>Mark Paid</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="Record Sale" onClose={close}>
          <div className="mor-form">
            <div className="mor-form-row">
              <label>Business *</label>
              <select value={form.businessId || ''} onChange={e => F('businessId', e.target.value)}>
                <option value="">Select business…</option>
                {(bizList || []).filter(b => b.status === 'approved').map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
            {form.businessId && (
              <div className="mor-form-row">
                <label>Campaign</label>
                <select value={form.campaignId || ''} onChange={e => F('campaignId', e.target.value)}>
                  <option value="">Select campaign…</option>
                  {(campList || []).filter(c => c.businessId === form.businessId && c.status === 'active').map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {selCamp?.products?.length > 0 && (
              <div className="mor-form-row">
                <label>Product / Service</label>
                <select value={form.productName || ''} onChange={e => F('productName', e.target.value)}>
                  <option value="">Select product…</option>
                  {selCamp.products.map((p, i) => (
                    <option key={i} value={p.name}>{p.name}{p.price ? ` – P${p.price}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mor-form-row">
              <label>Distributor *</label>
              <select value={form.distributorId || ''} onChange={e => F('distributorId', e.target.value)}>
                <option value="">Select distributor…</option>
                {(distList || []).filter(d => d.status === 'active').map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.referralCode})</option>
                ))}
              </select>
            </div>
            <div className="mor-form-2col">
              <div className="mor-form-row">
                <label>Sale Amount (P) *</label>
                <input type="number" value={form.saleAmount || ''} onChange={e => F('saleAmount', e.target.value)} placeholder="0.00" />
              </div>
              <div className="mor-form-row">
                <label>Invoice / Ref No.</label>
                <input value={form.invoiceNumber || ''} onChange={e => F('invoiceNumber', e.target.value)} />
              </div>
            </div>
            {sale > 0 && (
              <div className="mor-calc-preview">
                <div className="mor-calc-row">
                  <span>Commission ({commRate}%)</span>
                  <strong>{fmt(grossComm)}</strong>
                </div>
                <div className="mor-calc-row">
                  <span className="mor-dim">Morasimo processing ({procRate}%)</span>
                  <span className="mor-dim">– {fmt(procFee)}</span>
                </div>
                <div className="mor-calc-row">
                  <span className="mor-dim">Customer discount ({discRate}%)</span>
                  <span className="mor-dim">– {fmt(custDisc)}</span>
                </div>
                <div className="mor-calc-row highlight">
                  <span>Net to Distributor</span>
                  <strong className="mor-gold">{fmt(netComm)}</strong>
                </div>
              </div>
            )}
            <div className="mor-form-row">
              <label>Notes</label>
              <textarea value={form.notes || ''} onChange={e => F('notes', e.target.value)} rows={2} placeholder="Any additional notes…" />
            </div>
            <div className="mor-form-actions">
              <button className="mor-btn-ghost" onClick={close}>Cancel</button>
              <button className="mor-btn-gold"  onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Record Sale'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Withdrawals ───────────────────────────────────────────────
function WithdrawalsSection() {
  const [sfilt, setSfilt] = useState('');
  const { data, loading, reload } = useData('/api/morasimo/withdrawals');

  const rows = (data || []).filter(w => !sfilt || w.status === sfilt);

  const setStatus = async (id, status) => {
    try { await api.patch(`/api/morasimo/withdrawals/${id}/status`, { status }); reload(); }
    catch { alert('Failed to update'); }
  };

  return (
    <div className="mor-sec-body">
      <div className="mor-toolbar">
        <select className="mor-select" value={sfilt} onChange={e => setSfilt(e.target.value)}>
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="mor-toolbar-note">Withdrawal requests are submitted by distributors</span>
      </div>

      {loading ? <Spin /> : rows.length === 0 ? <Empty msg="No withdrawal requests" /> : (
        <div className="mor-table-wrap">
          <table className="mor-table">
            <thead><tr>
              <th>Distributor</th><th>Amount</th><th>Method</th>
              <th>Account</th><th>Status</th><th>Requested</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(w => (
                <tr key={w._id}>
                  <td><strong>{w.distributorName}</strong></td>
                  <td className="mor-mono">{fmt(w.amount)}</td>
                  <td>{w.method?.replace('_', ' ')}</td>
                  <td className="mor-mono">{w.accountDetails}</td>
                  <td><Badge s={w.status} /></td>
                  <td>{fmtD(w.requestedAt)}</td>
                  <td className="mor-actions">
                    {w.status === 'pending'  && <>
                      <button className="mor-btn-xs ok"   onClick={() => setStatus(w._id, 'approved')}>Approve</button>
                      <button className="mor-btn-xs bad"  onClick={() => setStatus(w._id, 'rejected')}>Reject</button>
                    </>}
                    {w.status === 'approved' && <button className="mor-btn-xs blue" onClick={() => setStatus(w._id, 'paid')}>Mark Paid</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────
function AnalyticsSection() {
  const { data, loading } = useData('/api/morasimo/analytics');
  if (loading) return <div className="mor-sec-body"><Spin /></div>;
  const d = data || {};
  const topDist = d.topDistributors || [];
  const maxEarn = Math.max(...topDist.map(t => t.netCommission || 0), 1);

  return (
    <div className="mor-sec-body">
      <div className="mor-stat-grid">
        <StatCard label="Morasimo Revenue"    value={fmt(d.totalProcessingFees || 0)} sub="all time"           accent="gold" />
        <StatCard label="Total Paid Out"      value={fmt(d.totalPaidOut || 0)}        sub="to distributors"    accent="blue" />
        <StatCard label="Total Transactions"  value={d.totalTxns || 0} />
        <StatCard label="Avg Commission"      value={fmt(d.avgCommission || 0)}       sub="per transaction" />
      </div>

      <p className="mor-sub-head">Top Distributors by Earnings</p>
      <div className="mor-bar-chart">
        {topDist.length === 0 ? <Empty msg="No earnings data yet" /> : topDist.map((t, i) => (
          <div key={i} className="mor-bar-row">
            <span className="mor-bar-label">{t.name}</span>
            <div className="mor-bar-track">
              <div className="mor-bar-fill" style={{ width: `${Math.round((t.netCommission || 0) / maxEarn * 100)}%` }} />
            </div>
            <span className="mor-bar-val">{fmt(t.netCommission)}</span>
          </div>
        ))}
      </div>

      <p className="mor-sub-head">Transaction Status Breakdown</p>
      <div className="mor-status-breakdown">
        {Object.entries(d.byStatus || {}).map(([s, count]) => (
          <div key={s} className="mor-breakdown-row">
            <Badge s={s} />
            <div className="mor-breakdown-bar-track">
              <div
                className="mor-breakdown-bar"
                style={{
                  width: `${Math.round(count / (d.totalTxns || 1) * 100)}%`,
                  background: s === 'verified' || s === 'paid' ? '#28C76F' : s === 'pending' ? '#FF9F43' : '#EA5455',
                }}
              />
            </div>
            <span className="mor-breakdown-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────
function SettingsSection() {
  const { data, loading, reload } = useData('/api/morasimo/settings');
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/api/morasimo/settings', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      reload();
    } catch (e) { alert(e.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="mor-sec-body"><Spin /></div>;

  return (
    <div className="mor-sec-body">
      <div className="mor-settings-card">
        <p className="mor-settings-head">Platform Settings</p>
        <div className="mor-form">
          <div className="mor-form-row">
            <label>Platform Name</label>
            <input value={form.platformName || 'Morasimo'} onChange={e => F('platformName', e.target.value)} />
          </div>
          <div className="mor-form-2col">
            <div className="mor-form-row">
              <label>Default Processing Fee %</label>
              <input type="number" value={form.defaultProcessingFee || ''} onChange={e => F('defaultProcessingFee', e.target.value)} placeholder="e.g. 5" />
              <small>% of gross commission that goes to Morasimo</small>
            </div>
            <div className="mor-form-row">
              <label>Minimum Withdrawal (P)</label>
              <input type="number" value={form.minWithdrawal || ''} onChange={e => F('minWithdrawal', e.target.value)} placeholder="e.g. 50" />
            </div>
          </div>
          <div className="mor-form-row">
            <label>Payout Schedule</label>
            <select value={form.payoutSchedule || 'monthly'} onChange={e => F('payoutSchedule', e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly (end of month)</option>
            </select>
          </div>
          <div className="mor-form-row">
            <label>Distributor Invite Code</label>
            <input value={form.inviteCode || ''} onChange={e => F('inviteCode', e.target.value.toUpperCase())} placeholder="e.g. MORASIMO2026" />
            <small>Distributors who enter this code during registration are auto-activated. Default: MORASIMO2026</small>
          </div>
        </div>
      </div>

      <div className="mor-settings-card">
        <p className="mor-settings-head">Morasimo Payment Details</p>
        <div className="mor-form">
          <div className="mor-form-row">
            <label>Bank Name</label>
            <input value={form.bankName || ''} onChange={e => F('bankName', e.target.value)} />
          </div>
          <div className="mor-form-2col">
            <div className="mor-form-row">
              <label>Account Name</label>
              <input value={form.accountName || ''} onChange={e => F('accountName', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>Account Number</label>
              <input value={form.accountNumber || ''} onChange={e => F('accountNumber', e.target.value)} />
            </div>
          </div>
          <div className="mor-form-2col">
            <div className="mor-form-row">
              <label>Support Email</label>
              <input type="email" value={form.supportEmail || ''} onChange={e => F('supportEmail', e.target.value)} />
            </div>
            <div className="mor-form-row">
              <label>Support Phone</label>
              <input value={form.supportPhone || ''} onChange={e => F('supportPhone', e.target.value)} />
            </div>
          </div>
          <div className="mor-form-actions">
            {saved && <span className="mor-save-msg">✓ Saved</span>}
            <button className="mor-btn-gold" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
const NAV = [
  { id: 'overview',     label: 'Overview',     icon: '◈' },
  { id: 'businesses',   label: 'Businesses',   icon: '⬡' },
  { id: 'distributors', label: 'Distributors', icon: '◉' },
  { id: 'campaigns',    label: 'Campaigns',    icon: '◆' },
  { id: 'transactions', label: 'Transactions', icon: '⇄' },
  { id: 'withdrawals',  label: 'Withdrawals',  icon: '◎' },
  { id: 'analytics',    label: 'Analytics',    icon: '▤' },
  { id: 'settings',     label: 'Settings',     icon: '⊙' },
];

export default function MorasimoApp() {
  const [section,     setSection]     = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (section) {
      case 'businesses':   return <BusinessesSection />;
      case 'distributors': return <DistributorsSection />;
      case 'campaigns':    return <CampaignsSection />;
      case 'transactions': return <TxnsSection />;
      case 'withdrawals':  return <WithdrawalsSection />;
      case 'analytics':    return <AnalyticsSection />;
      case 'settings':     return <SettingsSection />;
      default:             return <OverviewSection />;
    }
  };

  const currentNav = NAV.find(n => n.id === section);

  return (
    <div className="mor-root">
      {/* Sidebar */}
      <aside className={`mor-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="mor-logo">
          <span className="mor-logo-hex">⬡</span>
          <div className="mor-logo-text">
            <span className="mor-logo-name">MORASIMO</span>
            <span className="mor-logo-tag">Referral Commerce</span>
          </div>
        </div>
        <nav className="mor-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`mor-nav-item${section === n.id ? ' active' : ''}`}
              onClick={() => { setSection(n.id); setSidebarOpen(false); }}
            >
              <span className="mor-nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <a href="/morasimo/distributor" target="_blank" rel="noopener noreferrer" className="mor-back-link" style={{ borderBottom: '1px solid #22222E' }}>
          ↗ Distributor Portal
        </a>
        <a href="/admin" className="mor-back-link">← Back to Admin</a>
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="mor-overlay-bg" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="mor-main">
        <header className="mor-header">
          <button className="mor-hamburger" onClick={() => setSidebarOpen(p => !p)}>☰</button>
          <h2 className="mor-page-title">{currentNav?.label}</h2>
          <span className="mor-header-badge">⬡ MORASIMO</span>
        </header>
        <div className="mor-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
