// src/Admin/FinancialRecords/FinancialRecords.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import api from '../../config/axios.js';
import './FinancialRecords.css';

const API = '/api/admin/financial-records';

const INCOME_CATEGORIES = [
  { value: 'car_sales_ad',       label: 'Car Sales Advertisement' },
  { value: 'company_marketing',  label: 'Company Sales Marketing' },
  { value: 'motorshow_event',    label: 'Motorshow / Event' },
  { value: 'inventory_sale',     label: 'Inventory Sale' },
  { value: 'other_income',       label: 'Other' }
];

const EXPENSE_CATEGORIES = [
  { value: 'software',     label: 'Software / Subscriptions' },
  { value: 'transport',    label: 'Transport / Petrol' },
  { value: 'airtime',      label: 'Airtime' },
  { value: 'travel',       label: 'Travel' },
  { value: 'bank_charges', label: 'Bank Charges' },
  { value: 'domain',       label: 'Domain / Hosting' },
  { value: 'entertainment',label: 'Entertainment' },
  { value: 'other_expense',label: 'Other' }
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const catLabel = (v) => ALL_CATEGORIES.find(c => c.value === v)?.label || v;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PIE_COLORS = [
  '#ff3300','#ff6633','#ff9966','#58a6ff','#3fb950',
  '#d2991d','#bc8cff','#f85149','#79c0ff','#56d364'
];

const formatBWP = (n) =>
  `P ${Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return '–';
  try { return new Date(d).toLocaleDateString('en-BW', { year: 'numeric', month: 'short', day: '2-digit' }); }
  catch { return '–'; }
};

const toInputDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

const emptyEntry = (type = 'income') => ({
  type,
  category: type === 'income' ? 'car_sales_ad' : 'software',
  description: '',
  customerName: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  notes: ''
});

// ── Tooltip customisation ─────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="fr-tooltip">
      <p className="fr-tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatBWP(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Entry Form ────────────────────────────────────────────
const EntryForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fr-form-overlay">
      <div className="fr-form-panel">
        <div className="fr-form-head">
          <h2>{initial._id ? 'Edit Entry' : 'New Entry'}</h2>
          <button className="fr-form-close" onClick={onCancel}>✕</button>
        </div>
        <div className="fr-form-body">

          {/* Type */}
          {!initial._id && (
            <div className="fr-form-section">
              <label className="fr-label">Entry Type</label>
              <div className="fr-type-toggle">
                <button type="button"
                  className={`fr-type-btn ${form.type === 'income' ? 'active income' : ''}`}
                  onClick={() => set('type', 'income') || set('category', 'car_sales_ad')}>
                  ↑ Income
                </button>
                <button type="button"
                  className={`fr-type-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => { set('type', 'expense'); set('category', 'software'); }}>
                  ↓ Expense
                </button>
              </div>
            </div>
          )}

          <div className="fr-form-row-2">
            <div>
              <label className="fr-label">Category</label>
              <select className="fr-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="fr-label">Date</label>
              <input type="date" className="fr-input" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          {form.type === 'income' && (
            <div>
              <label className="fr-label">Customer Name</label>
              <input className="fr-input" placeholder="Customer / Client name"
                value={form.customerName} onChange={e => set('customerName', e.target.value)} />
            </div>
          )}

          <div>
            <label className="fr-label">Description / Service</label>
            <input className="fr-input" placeholder="e.g. Car sales advertisement"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="fr-label">Amount (BWP)</label>
            <input type="number" className="fr-input" placeholder="0.00" min="0" step="0.01"
              value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>

          <div>
            <label className="fr-label">Notes (optional)</label>
            <textarea className="fr-input fr-textarea" rows={2} placeholder="Any additional notes"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="fr-form-footer">
          <button className="fr-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          <button
            className={`fr-btn-primary ${form.type}`}
            onClick={() => onSave(form)}
            disabled={saving || !form.amount || !form.date}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────
const FinancialRecords = () => {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [tab, setTab]               = useState('overview');  // overview | income | expenses
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [form, setForm]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { limit: 500 };
      if (yearFilter) params.year = yearFilter;
      const res = await api.get(API, { params });
      if (res.data.success) setRecords(res.data.data || []);
      else setError(res.data.message || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [yearFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const res = formData._id
        ? await api.put(`${API}/${formData._id}`, formData)
        : await api.post(API, formData);
      if (res.data.success) { setForm(null); fetchRecords(); }
      else alert(res.data.message || 'Save failed');
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete this ${rec.type} entry?`)) return;
    setDeleting(rec._id);
    try {
      await api.delete(`${API}/${rec._id}`);
      setRecords(prev => prev.filter(r => r._id !== rec._id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  // ── Computed values ───────────────────────────────────
  const income   = records.filter(r => r.type === 'income');
  const expenses = records.filter(r => r.type === 'expense');

  const totalIncome   = income.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const netProfit     = totalIncome - totalExpenses;

  // Monthly bar chart data
  const monthlyData = MONTHS.map((month, idx) => {
    const inc = income.filter(r => new Date(r.date).getMonth() === idx)
                      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const exp = expenses.filter(r => new Date(r.date).getMonth() === idx)
                        .reduce((s, r) => s + Number(r.amount || 0), 0);
    return { month, Income: inc, Expenses: exp };
  }).filter(d => d.Income > 0 || d.Expenses > 0);

  // Expense category pie
  const expCatData = EXPENSE_CATEGORIES.map(c => ({
    name: c.label,
    value: expenses.filter(r => r.category === c.value)
                   .reduce((s, r) => s + Number(r.amount || 0), 0)
  })).filter(d => d.value > 0);

  // Income category pie
  const incCatData = INCOME_CATEGORIES.map(c => ({
    name: c.label,
    value: income.filter(r => r.category === c.value)
                 .reduce((s, r) => s + Number(r.amount || 0), 0)
  })).filter(d => d.value > 0);

  const years = [];
  const thisYear = new Date().getFullYear();
  for (let y = 2025; y <= thisYear + 1; y++) years.push(String(y));

  // ── Render helpers ────────────────────────────────────
  const RecordTable = ({ rows, showCustomer }) => (
    <div className="fr-table-wrap">
      <table className="fr-table">
        <thead>
          <tr>
            {showCustomer && <th>Customer</th>}
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th className="num-col">Amount</th>
            <th>Source</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={showCustomer ? 7 : 6} className="fr-empty-row">No records found</td></tr>
          ) : rows.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
            <tr key={r._id} className={deleting === r._id ? 'fr-row-busy' : ''}>
              {showCustomer && <td className="fr-customer">{r.customerName || '–'}</td>}
              <td className="fr-date">{fmtDate(r.date)}</td>
              <td><span className="fr-cat-badge">{catLabel(r.category)}</span></td>
              <td className="fr-desc">{r.description || '–'}</td>
              <td className={`num-col fr-amount ${r.type}`}>{formatBWP(r.amount)}</td>
              <td>
                <span className={`fr-source-badge ${r.source || 'manual'}`}>
                  {r.source === 'invoice' ? '🧾 Invoice' : '✏️ Manual'}
                </span>
              </td>
              <td>
                <div className="fr-row-actions">
                  {r.source !== 'invoice' && (
                    <button className="fr-action-btn" title="Edit"
                      onClick={() => setForm({ ...r, date: toInputDate(r.date) })}>✏️</button>
                  )}
                  <button className="fr-action-btn delete" title="Delete"
                    onClick={() => handleDelete(r)} disabled={deleting === r._id}>🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fr-container">
      {/* Header */}
      <div className="fr-header">
        <div>
          <h2 className="fr-heading">Financial Records</h2>
          <p className="fr-subheading">BW Car Culture — {yearFilter}</p>
        </div>
        <div className="fr-header-right">
          <select className="fr-year-select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="fr-btn-expense" onClick={() => setForm(emptyEntry('expense'))}>+ Expense</button>
          <button className="fr-btn-income"  onClick={() => setForm(emptyEntry('income'))}>+ Income</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="fr-cards">
        <div className="fr-card income">
          <p className="fr-card-label">Total Revenue</p>
          <p className="fr-card-amount">{formatBWP(totalIncome)}</p>
          <p className="fr-card-count">{income.length} records</p>
        </div>
        <div className="fr-card expense">
          <p className="fr-card-label">Total Expenses</p>
          <p className="fr-card-amount">{formatBWP(totalExpenses)}</p>
          <p className="fr-card-count">{expenses.length} records</p>
        </div>
        <div className={`fr-card net ${netProfit >= 0 ? 'positive' : 'negative'}`}>
          <p className="fr-card-label">Net Profit</p>
          <p className="fr-card-amount">{formatBWP(Math.abs(netProfit))}</p>
          <p className="fr-card-count">{netProfit >= 0 ? '▲ Profit' : '▼ Loss'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="fr-tabs">
        {[['overview','Overview'],['income','Revenue'],['expenses','Expenses']].map(([key,label]) => (
          <button key={key} className={`fr-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="fr-state"><div className="fr-spinner" /><p>Loading records…</p></div>
      ) : error ? (
        <div className="fr-state fr-error"><p>{error}</p><button className="fr-btn-ghost" onClick={fetchRecords}>Retry</button></div>
      ) : (
        <>
          {/* ── Overview tab ── */}
          {tab === 'overview' && (
            <div className="fr-overview">
              {monthlyData.length > 0 ? (
                <>
                  <div className="fr-chart-card">
                    <p className="fr-chart-title">Monthly Revenue vs Expenses</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis dataKey="month" tick={{ fill: '#6e7681', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `P${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#8b949e' }} />
                        <Bar dataKey="Income"   fill="#3fb950" radius={[4,4,0,0]} />
                        <Bar dataKey="Expenses" fill="#f85149" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="fr-pies">
                    {incCatData.length > 0 && (
                      <div className="fr-chart-card">
                        <p className="fr-chart-title">Revenue by Category</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={incCatData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                              dataKey="value" paddingAngle={3}>
                              {incCatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => formatBWP(v)} />
                            <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#8b949e' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {expCatData.length > 0 && (
                      <div className="fr-chart-card">
                        <p className="fr-chart-title">Expenses by Category</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={expCatData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                              dataKey="value" paddingAngle={3}>
                              {expCatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => formatBWP(v)} />
                            <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#8b949e' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="fr-state fr-empty">
                  <p className="fr-empty-icon">📊</p>
                  <p>No records for {yearFilter} yet. Add income and expenses to see charts.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Revenue tab ── */}
          {tab === 'income' && (
            <div>
              <div className="fr-section-bar">
                <span className="fr-section-total income">Total: {formatBWP(totalIncome)}</span>
              </div>
              <RecordTable rows={income} showCustomer={true} />
            </div>
          )}

          {/* ── Expenses tab ── */}
          {tab === 'expenses' && (
            <div>
              <div className="fr-section-bar">
                <span className="fr-section-total expense">Total: {formatBWP(totalExpenses)}</span>
              </div>
              <RecordTable rows={expenses} showCustomer={false} />
            </div>
          )}
        </>
      )}

      {form && (
        <EntryForm initial={form} onSave={handleSave} onCancel={() => setForm(null)} saving={saving} />
      )}
    </div>
  );
};

export default FinancialRecords;
