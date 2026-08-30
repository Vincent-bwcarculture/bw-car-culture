import { useState, useEffect, useCallback } from 'react';
import axios from '../../config/axios.js';
import './MechanicDashboard.css';

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: '#f1c40f',
  in_progress: '#0078ff',
  completed: '#00c37c',
  invoiced: '#9b59b6',
  paid: '#2ecc71',
};

const MAKE_OPTIONS = [
  'Toyota','Volkswagen','BMW','Mercedes-Benz','Ford','Hyundai','Kia','Nissan',
  'Mazda','Isuzu','Mitsubishi','Land Rover','Range Rover','Audi','Renault',
  'Peugeot','Chevrolet','Opel','Lexus','Honda','Subaru','Volvo','Jeep',
  'Suzuki','Fiat','Alfa Romeo','Other',
];

const WORK_TYPES = [
  'Engine Repair','Transmission','Electrical','Brakes','Suspension','Air Conditioning',
  'Diagnostics','Body Work','Tyres & Alignment','Exhaust','Auto Glass','Detailing',
  '4×4 / Off-road','Service / Oil Change','Clutch','Radiator / Cooling',
  'Fuel System','Starter / Alternator','Other',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtP = (n) => `P ${Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BW', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const genInvoiceNum = () => `INV-${Date.now().toString().slice(-6)}`;

const buildInvoiceText = (job) => {
  const line = '─'.repeat(40);
  const lines = [
    `*BW CAR CULTURE — ${(job.workshopName || 'Workshop').toUpperCase()}*`,
    `Invoice #: ${job.invoiceNumber || '—'}   Date: ${fmtDate(job.invoiceDate || new Date())}`,
    line,
    `*CUSTOMER*`,
    `Name: ${job.customer?.name || '—'}`,
    `Phone: ${job.customer?.phone || '—'}`,
    line,
    `*VEHICLE*`,
    `${job.vehicle?.year || ''} ${job.vehicle?.make || ''} ${job.vehicle?.model || ''} ${job.vehicle?.registration ? `(${job.vehicle.registration})` : ''}`.trim(),
    job.vehicle?.mileage ? `Mileage: ${Number(job.vehicle.mileage).toLocaleString()} km` : '',
    line,
  ];

  if (job.issues) lines.push(`*ISSUES REPORTED*\n${job.issues}`, line);
  if (job.diagnosis) lines.push(`*DIAGNOSIS*\n${job.diagnosis}`, line);

  lines.push('*WORK PERFORMED*');
  (job.workItems || []).forEach((w, i) => {
    lines.push(`${i + 1}. ${w.description} — ${fmtP(w.total)}`);
  });

  if (job.parts?.length) {
    lines.push(line, '*PARTS USED*');
    job.parts.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}${p.partNumber ? ` (${p.partNumber})` : ''} x${p.quantity} @ ${fmtP(p.unitPrice)} = ${fmtP(p.total)}`);
    });
  }

  lines.push(
    line,
    `Labour:  ${fmtP(job.labourTotal)}`,
    `Parts:   ${fmtP(job.partsTotal)}`,
    job.tax ? `Tax:     ${fmtP(job.tax)}` : '',
    `*TOTAL:  ${fmtP(job.total)}*`,
    line,
    job.notes ? `Notes: ${job.notes}` : '',
    `Thank you for choosing ${job.workshopName || 'us'}! 🔧`,
    `Powered by bwcarculture.com`,
  );
  return lines.filter(Boolean).join('\n');
};

const sendWhatsApp = (phone, text) => {
  const num = phone.replace(/\D/g, '');
  const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const sendEmail = (email, subject, text) => {
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="md-stat-card">
      <div className="md-stat-value" style={{ color }}>{value}</div>
      <div className="md-stat-label">{label}</div>
    </div>
  );
}

function JobRow({ job, onClick }) {
  const sc = STATUS_COLORS[job.status] || '#aaa';
  return (
    <tr className="md-job-row" onClick={() => onClick(job)}>
      <td className="md-mono">{job.invoiceNumber || '—'}</td>
      <td>{fmtDate(job.jobDate)}</td>
      <td>{job.customer?.name || '—'}</td>
      <td>{job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}</td>
      <td className="md-mono md-small">{job.vehicle?.registration || '—'}</td>
      <td><span className="md-status-badge" style={{ background: sc + '22', color: sc, border: `1px solid ${sc}44` }}>{job.status?.replace('_', ' ')}</span></td>
      <td className="md-amount">{fmtP(job.total)}</td>
    </tr>
  );
}

// ─── New Job Form ─────────────────────────────────────────────────────────────

const EMPTY_JOB = {
  customer: { name: '', phone: '', email: '', whatsapp: '' },
  vehicle: { registration: '', make: '', model: '', year: '', mileage: '', color: '', vin: '' },
  issues: '',
  diagnosis: '',
  workItems: [{ description: '', type: 'Labour', quantity: 1, unitPrice: 0, total: 0 }],
  parts: [],
  labourTotal: 0,
  partsTotal: 0,
  tax: 0,
  total: 0,
  notes: '',
  status: 'pending',
  invoiceNumber: genInvoiceNum(),
  invoiceDate: new Date().toISOString().slice(0, 10),
};

function calcTotals(draft) {
  const labourTotal = (draft.workItems || []).reduce((s, w) => s + (Number(w.total) || 0), 0);
  const partsTotal = (draft.parts || []).reduce((s, p) => s + (Number(p.total) || 0), 0);
  const subtotal = labourTotal + partsTotal;
  const tax = Number(draft.tax) || 0;
  return { labourTotal, partsTotal, total: subtotal + tax };
}

function JobForm({ initial = EMPTY_JOB, workshopName, onSave, onCancel, saving }) {
  const [job, setJob] = useState({ ...EMPTY_JOB, ...initial, workshopName });

  const setField = (path, val) => {
    setJob(prev => {
      const keys = path.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = val;
      const totals = calcTotals(next);
      return { ...next, ...totals };
    });
  };

  const updateWorkItem = (idx, field, val) => {
    setJob(prev => {
      const items = prev.workItems.map((w, i) => {
        if (i !== idx) return w;
        const updated = { ...w, [field]: val };
        updated.total = Number(updated.quantity || 1) * Number(updated.unitPrice || 0);
        return updated;
      });
      const totals = calcTotals({ ...prev, workItems: items });
      return { ...prev, workItems: items, ...totals };
    });
  };

  const addWorkItem = () => setJob(prev => {
    const items = [...prev.workItems, { description: '', type: 'Labour', quantity: 1, unitPrice: 0, total: 0 }];
    return { ...prev, workItems: items };
  });

  const removeWorkItem = (idx) => setJob(prev => {
    const items = prev.workItems.filter((_, i) => i !== idx);
    const totals = calcTotals({ ...prev, workItems: items });
    return { ...prev, workItems: items, ...totals };
  });

  const updatePart = (idx, field, val) => {
    setJob(prev => {
      const parts = prev.parts.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: val };
        updated.total = Number(updated.quantity || 1) * Number(updated.unitPrice || 0);
        return updated;
      });
      const totals = calcTotals({ ...prev, parts });
      return { ...prev, parts, ...totals };
    });
  };

  const addPart = () => setJob(prev => {
    const parts = [...(prev.parts || []), { name: '', partNumber: '', quantity: 1, unitPrice: 0, total: 0 }];
    return { ...prev, parts };
  });

  const removePart = (idx) => setJob(prev => {
    const parts = prev.parts.filter((_, i) => i !== idx);
    const totals = calcTotals({ ...prev, parts });
    return { ...prev, parts, ...totals };
  });

  const i = (label, path, type = 'text', placeholder = '') => (
    <div className="md-field">
      <label>{label}</label>
      <input type={type} value={path.split('.').reduce((o, k) => o?.[k] ?? '', job)}
        onChange={e => setField(path, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="md-form">
      <div className="md-form-section">
        <h3>Customer</h3>
        <div className="md-form-grid">
          {i('Name *', 'customer.name', 'text', 'Full name')}
          {i('Phone *', 'customer.phone', 'tel', '+267 XX XXX XXX')}
          {i('WhatsApp', 'customer.whatsapp', 'tel', 'If different from phone')}
          {i('Email', 'customer.email', 'email', 'customer@email.com')}
        </div>
      </div>

      <div className="md-form-section">
        <h3>Vehicle</h3>
        <div className="md-form-grid">
          {i('Registration Plate *', 'vehicle.registration', 'text', 'e.g. B XXX XXX')}
          <div className="md-field">
            <label>Make *</label>
            <select value={job.vehicle?.make || ''} onChange={e => setField('vehicle.make', e.target.value)}>
              <option value="">Select make</option>
              {MAKE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {i('Model *', 'vehicle.model', 'text', 'e.g. Hilux')}
          {i('Year', 'vehicle.year', 'number', new Date().getFullYear())}
          {i('Mileage (km)', 'vehicle.mileage', 'number', '0')}
          {i('Colour', 'vehicle.color', 'text', 'e.g. Silver')}
          {i('VIN / Chassis', 'vehicle.vin', 'text', 'Optional')}
        </div>
      </div>

      <div className="md-form-section">
        <h3>Issues Reported by Customer</h3>
        <textarea className="md-textarea" rows={3} value={job.issues} onChange={e => setJob(prev => ({ ...prev, issues: e.target.value }))}
          placeholder="What did the customer complain about? e.g. 'Loud noise from front right wheel when braking'" />
      </div>

      <div className="md-form-section">
        <h3>Diagnosis / Findings</h3>
        <textarea className="md-textarea" rows={3} value={job.diagnosis} onChange={e => setJob(prev => ({ ...prev, diagnosis: e.target.value }))}
          placeholder="What did you find upon inspection? e.g. 'Worn brake pads on front axle, brake disc scored'" />
      </div>

      <div className="md-form-section">
        <h3>Work Performed</h3>
        {job.workItems.map((w, idx) => (
          <div key={idx} className="md-line-item">
            <div className="md-field md-field-grow">
              <label>Description</label>
              <select value={w.description} onChange={e => updateWorkItem(idx, 'description', e.target.value)}
                style={{ marginBottom: '0.3rem' }}>
                <option value="">Select or type below</option>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="text" value={w.description} onChange={e => updateWorkItem(idx, 'description', e.target.value)}
                placeholder="Or type custom description..." />
            </div>
            <div className="md-field md-field-small">
              <label>Qty</label>
              <input type="number" min="0.5" step="0.5" value={w.quantity} onChange={e => updateWorkItem(idx, 'quantity', e.target.value)} />
            </div>
            <div className="md-field md-field-small">
              <label>Unit Price (P)</label>
              <input type="number" min="0" value={w.unitPrice} onChange={e => updateWorkItem(idx, 'unitPrice', e.target.value)} />
            </div>
            <div className="md-field md-field-small">
              <label>Total</label>
              <input type="number" value={w.total} readOnly className="md-readonly" />
            </div>
            <button className="md-remove-btn" onClick={() => removeWorkItem(idx)} title="Remove">✕</button>
          </div>
        ))}
        <button className="md-add-btn" onClick={addWorkItem}>+ Add Work Item</button>
      </div>

      <div className="md-form-section">
        <h3>Parts Used</h3>
        {(job.parts || []).map((p, idx) => (
          <div key={idx} className="md-line-item">
            <div className="md-field md-field-grow">
              <label>Part Name</label>
              <input type="text" value={p.name} onChange={e => updatePart(idx, 'name', e.target.value)} placeholder="e.g. Brake Pad Set" />
            </div>
            <div className="md-field md-field-small">
              <label>Part #</label>
              <input type="text" value={p.partNumber} onChange={e => updatePart(idx, 'partNumber', e.target.value)} placeholder="Optional" />
            </div>
            <div className="md-field md-field-small">
              <label>Qty</label>
              <input type="number" min="1" value={p.quantity} onChange={e => updatePart(idx, 'quantity', e.target.value)} />
            </div>
            <div className="md-field md-field-small">
              <label>Unit Price (P)</label>
              <input type="number" min="0" value={p.unitPrice} onChange={e => updatePart(idx, 'unitPrice', e.target.value)} />
            </div>
            <div className="md-field md-field-small">
              <label>Total</label>
              <input type="number" value={p.total} readOnly className="md-readonly" />
            </div>
            <button className="md-remove-btn" onClick={() => removePart(idx)} title="Remove">✕</button>
          </div>
        ))}
        <button className="md-add-btn" onClick={addPart}>+ Add Part</button>
      </div>

      <div className="md-form-section">
        <div className="md-totals-row">
          <div className="md-field">
            <label>Tax / VAT (P)</label>
            <input type="number" min="0" value={job.tax} onChange={e => {
              const tax = Number(e.target.value) || 0;
              setJob(prev => { const totals = calcTotals({ ...prev, tax }); return { ...prev, tax, ...totals }; });
            }} />
          </div>
          <div className="md-field">
            <label>Notes / Recommendations</label>
            <textarea rows={2} value={job.notes} onChange={e => setJob(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Recommend replacing rear brake disc at next service" className="md-textarea" />
          </div>
        </div>
        <div className="md-totals-summary">
          <div>Labour: <strong>{fmtP(job.labourTotal)}</strong></div>
          <div>Parts: <strong>{fmtP(job.partsTotal)}</strong></div>
          {job.tax > 0 && <div>Tax: <strong>{fmtP(job.tax)}</strong></div>}
          <div className="md-grand-total">TOTAL: <strong>{fmtP(job.total)}</strong></div>
        </div>
      </div>

      <div className="md-form-section">
        <h3>Status &amp; Invoice</h3>
        <div className="md-form-grid">
          <div className="md-field">
            <label>Job Status</label>
            <select value={job.status} onChange={e => setJob(prev => ({ ...prev, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="md-field">
            <label>Invoice #</label>
            <input type="text" value={job.invoiceNumber} onChange={e => setJob(prev => ({ ...prev, invoiceNumber: e.target.value }))} />
          </div>
          <div className="md-field">
            <label>Invoice Date</label>
            <input type="date" value={job.invoiceDate} onChange={e => setJob(prev => ({ ...prev, invoiceDate: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="md-form-actions">
        <button className="md-btn md-btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="md-btn md-btn-primary" onClick={() => onSave(job)} disabled={saving}>
          {saving ? 'Saving…' : 'Save Job'}
        </button>
      </div>
    </div>
  );
}

// ─── Invoice View ─────────────────────────────────────────────────────────────

function InvoiceView({ job, onEdit, onClose, onStatusChange }) {
  const text = buildInvoiceText(job);
  const whatsappNum = job.customer?.whatsapp || job.customer?.phone || '';
  const email = job.customer?.email || '';
  const subject = `Invoice ${job.invoiceNumber} — ${job.vehicle?.make} ${job.vehicle?.model} (${job.vehicle?.registration})`;

  return (
    <div className="md-invoice-view">
      <div className="md-invoice-header">
        <div>
          <h2 className="md-invoice-title">Invoice {job.invoiceNumber}</h2>
          <div className="md-invoice-meta">{fmtDate(job.invoiceDate)} · {job.customer?.name}</div>
        </div>
        <div className="md-invoice-actions">
          <button className="md-btn md-btn-outline" onClick={() => onEdit(job)}>Edit</button>
          <button className="md-btn md-btn-secondary" onClick={onClose}>← Back</button>
        </div>
      </div>

      {/* Status control */}
      <div className="md-status-bar">
        <span>Status:</span>
        {['pending','in_progress','completed','invoiced','paid'].map(s => (
          <button key={s}
            className={`md-status-chip ${job.status === s ? 'active' : ''}`}
            style={job.status === s ? { background: STATUS_COLORS[s] + '33', color: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : {}}
            onClick={() => onStatusChange(job._id, s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Invoice preview */}
      <div className="md-invoice-preview">
        <div className="md-invoice-block">
          <div className="md-invoice-shop">{job.workshopName}</div>
          <div className="md-invoice-num">Invoice #{job.invoiceNumber}</div>
          <div className="md-invoice-date">{fmtDate(job.invoiceDate)}</div>
        </div>

        <div className="md-invoice-two-col">
          <div>
            <h4>Customer</h4>
            <p>{job.customer?.name}</p>
            <p>{job.customer?.phone}</p>
            {job.customer?.email && <p>{job.customer.email}</p>}
          </div>
          <div>
            <h4>Vehicle</h4>
            <p>{job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}</p>
            {job.vehicle?.registration && <p>Reg: <strong>{job.vehicle.registration}</strong></p>}
            {job.vehicle?.mileage && <p>Mileage: {Number(job.vehicle.mileage).toLocaleString()} km</p>}
            {job.vehicle?.color && <p>Colour: {job.vehicle.color}</p>}
          </div>
        </div>

        {job.issues && <div className="md-invoice-section"><h4>Issues Reported</h4><p>{job.issues}</p></div>}
        {job.diagnosis && <div className="md-invoice-section"><h4>Diagnosis / Findings</h4><p>{job.diagnosis}</p></div>}

        {job.workItems?.length > 0 && (
          <div className="md-invoice-section">
            <h4>Work Performed</h4>
            <table className="md-invoice-table">
              <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>
                {job.workItems.map((w, i) => (
                  <tr key={i}>
                    <td>{w.description}</td>
                    <td>{w.quantity}</td>
                    <td>{fmtP(w.unitPrice)}</td>
                    <td>{fmtP(w.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {job.parts?.length > 0 && (
          <div className="md-invoice-section">
            <h4>Parts Used</h4>
            <table className="md-invoice-table">
              <thead><tr><th>Part</th><th>Part #</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>
                {job.parts.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td className="md-small">{p.partNumber || '—'}</td>
                    <td>{p.quantity}</td>
                    <td>{fmtP(p.unitPrice)}</td>
                    <td>{fmtP(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="md-invoice-totals">
          <div><span>Labour</span><span>{fmtP(job.labourTotal)}</span></div>
          <div><span>Parts</span><span>{fmtP(job.partsTotal)}</span></div>
          {job.tax > 0 && <div><span>Tax / VAT</span><span>{fmtP(job.tax)}</span></div>}
          <div className="md-grand-line"><span>TOTAL</span><span>{fmtP(job.total)}</span></div>
        </div>

        {job.notes && <div className="md-invoice-section md-notes"><strong>Notes:</strong> {job.notes}</div>}
      </div>

      {/* Send buttons */}
      <div className="md-send-row">
        {whatsappNum && (
          <button className="md-btn md-btn-wa" onClick={() => sendWhatsApp(whatsappNum, text)}>
            📱 Send via WhatsApp
          </button>
        )}
        {email && (
          <button className="md-btn md-btn-email" onClick={() => sendEmail(email, subject, text)}>
            ✉️ Send via Email
          </button>
        )}
        <button className="md-btn md-btn-outline" onClick={() => {
          navigator.clipboard?.writeText(text).then(() => alert('Invoice text copied to clipboard!'));
        }}>
          📋 Copy Text
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function MechanicDashboard({ profileData }) {
  const [view, setView] = useState('overview'); // overview | jobs | newjob | editjob | invoice | customers
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');

  const workshopName = profileData?.mechanicProfile?.workshopName
    || profileData?.workshopName
    || profileData?.name
    || 'My Workshop';

  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

  const loadJobs = useCallback(async () => {
    try {
      const res = await axios.get('/mechanic/jobs', authHeader());
      if (res.data.success) setJobs(res.data.data || []);
    } catch (e) { setError('Failed to load jobs'); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await axios.get('/mechanic/stats', authHeader());
      if (res.data.success) setStats(res.data.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadJobs(), loadStats()]);
      setLoading(false);
    })();
  }, [loadJobs, loadStats]);

  const saveJob = async (jobData) => {
    setSaving(true);
    try {
      const payload = { ...jobData, workshopName };
      let res;
      if (jobData._id) {
        res = await axios.put(`/mechanic/jobs/${jobData._id}`, payload, authHeader());
      } else {
        res = await axios.post('/mechanic/jobs', payload, authHeader());
      }
      if (res.data.success) {
        await loadJobs();
        await loadStats();
        setSelectedJob(res.data.data);
        setView('invoice');
      } else {
        alert(res.data.message || 'Save failed');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (jobId, status) => {
    try {
      const res = await axios.patch(`/mechanic/jobs/${jobId}/status`, { status }, authHeader());
      if (res.data.success) {
        setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status } : j));
        setSelectedJob(prev => prev ? { ...prev, status } : prev);
      }
    } catch (_) { alert('Status update failed'); }
  };

  const filteredJobs = jobs.filter(j => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q || [j.customer?.name, j.vehicle?.make, j.vehicle?.model, j.vehicle?.registration, j.invoiceNumber]
      .some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="md-loading"><div className="md-spinner" /></div>;

  return (
    <div className="md-root">
      {/* Header */}
      <div className="md-header">
        <div>
          <h1 className="md-title">🔧 {workshopName}</h1>
          <p className="md-subtitle">Mechanic Dashboard</p>
        </div>
        <button className="md-btn md-btn-primary" onClick={() => setView('newjob')}>+ New Job</button>
      </div>

      {/* Nav tabs */}
      <div className="md-nav">
        {[['overview', 'Overview'], ['jobs', 'Jobs'], ['customers', 'Customers']].map(([id, label]) => (
          <button key={id} className={`md-nav-btn ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>

      {error && <div className="md-error">{error}</div>}

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <div className="md-overview">
          <div className="md-stats-row">
            <StatCard label="Total Jobs" value={stats?.total ?? jobs.length} color="#d4af37" />
            <StatCard label="Pending" value={stats?.pending ?? jobs.filter(j => j.status === 'pending').length} color="#f1c40f" />
            <StatCard label="In Progress" value={stats?.in_progress ?? jobs.filter(j => j.status === 'in_progress').length} color="#0078ff" />
            <StatCard label="Completed" value={stats?.completed ?? jobs.filter(j => ['completed','invoiced','paid'].includes(j.status)).length} color="#00c37c" />
            <StatCard label="Revenue (P)" value={(stats?.revenue ?? jobs.filter(j => j.status === 'paid').reduce((s, j) => s + (j.total || 0), 0)).toLocaleString()} color="#2ecc71" />
          </div>

          <h3 className="md-section-title">Recent Jobs</h3>
          {jobs.length === 0 ? (
            <div className="md-empty">No jobs yet. Click <strong>+ New Job</strong> to get started.</div>
          ) : (
            <div className="md-table-wrap">
              <table className="md-table">
                <thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Reg</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  {jobs.slice(0, 5).map(j => (
                    <JobRow key={j._id} job={j} onClick={(j) => { setSelectedJob(j); setView('invoice'); }} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {jobs.length > 5 && (
            <button className="md-btn md-btn-outline md-see-all" onClick={() => setView('jobs')}>See All Jobs →</button>
          )}
        </div>
      )}

      {/* ── JOBS LIST ── */}
      {view === 'jobs' && (
        <div className="md-jobs">
          <div className="md-jobs-controls">
            <input className="md-search" placeholder="Search customer, vehicle, reg, invoice…" value={searchQ}
              onChange={e => setSearchQ(e.target.value)} />
            <select className="md-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {filteredJobs.length === 0 ? (
            <div className="md-empty">No jobs match your filter.</div>
          ) : (
            <div className="md-table-wrap">
              <table className="md-table">
                <thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Reg</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  {filteredJobs.map(j => (
                    <JobRow key={j._id} job={j} onClick={(j) => { setSelectedJob(j); setView('invoice'); }} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── NEW JOB FORM ── */}
      {view === 'newjob' && (
        <JobForm workshopName={workshopName} saving={saving}
          onSave={saveJob}
          onCancel={() => setView('overview')} />
      )}

      {/* ── EDIT JOB FORM ── */}
      {view === 'editjob' && selectedJob && (
        <JobForm initial={selectedJob} workshopName={workshopName} saving={saving}
          onSave={saveJob}
          onCancel={() => setView('invoice')} />
      )}

      {/* ── INVOICE VIEW ── */}
      {view === 'invoice' && selectedJob && (
        <InvoiceView job={selectedJob}
          onEdit={(j) => { setSelectedJob(j); setView('editjob'); }}
          onClose={() => setView('jobs')}
          onStatusChange={changeStatus} />
      )}

      {/* ── CUSTOMERS ── */}
      {view === 'customers' && (
        <div className="md-customers">
          <h2 className="md-section-title">Customers ({[...new Map(jobs.map(j => [j.customer?.phone, j.customer])).values()].filter(Boolean).length})</h2>
          {jobs.length === 0 ? (
            <div className="md-empty">No customers yet — they will appear here as you create jobs.</div>
          ) : (
            <div className="md-customer-grid">
              {[...new Map(jobs.map(j => [j.customer?.phone, j])).values()].map((j, i) => (
                <div key={i} className="md-customer-card">
                  <div className="md-customer-avatar">{j.customer?.name?.[0]?.toUpperCase() || '?'}</div>
                  <div className="md-customer-info">
                    <div className="md-customer-name">{j.customer?.name}</div>
                    <div className="md-customer-phone">{j.customer?.phone}</div>
                    {j.customer?.email && <div className="md-customer-email">{j.customer.email}</div>}
                  </div>
                  <div className="md-customer-jobs">
                    {jobs.filter(jj => jj.customer?.phone === j.customer?.phone).length} job(s)
                  </div>
                  {j.customer?.whatsapp && (
                    <a className="md-btn md-btn-wa md-btn-sm" href={`https://wa.me/${j.customer.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">
                      📱
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
