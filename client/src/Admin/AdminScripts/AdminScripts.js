import React, { useState, useEffect, useCallback } from 'react';
import './AdminScripts.css';

const API = process.env.REACT_APP_API_URL || '/api';

const CATEGORIES = ['Sales Pitch', 'Listing Update', 'Enquiry Reply', 'Onboarding', 'Follow-up', 'General'];

const LOG_CATEGORIES = ['Listings', 'Enquiries', 'Communications', 'Content', 'Tech/Platform', 'Admin/Operations', 'Customer Support', 'Finance', 'Other'];

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

// ─── Message Templates ───────────────────────────────────────────────────────

const blankTemplate = () => ({ title: '', category: 'General', content: '' });

function TemplatesSection({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankTemplate());
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/scripts`, { headers });
      const data = await res.json();
      if (data.success) setTemplates(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(blankTemplate()); setEditing('new'); setError(''); };
  const openEdit = (t) => { setForm({ title: t.title, category: t.category, content: t.content }); setEditing(t); setError(''); };
  const cancelEdit = () => { setEditing(null); setError(''); };

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? `${API}/admin/scripts` : `${API}/admin/scripts/${editing._id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await load();
      setEditing(null);
    } catch (e) { setError(e.message || 'Save failed.'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await fetch(`${API}/admin/scripts/${id}`, { method: 'DELETE', headers });
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch (e) { console.error(e); }
  };

  const copy = (id, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const visible = templates.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || t.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <section className="as-section">
      <div className="as-section-header">
        <div>
          <h2 className="as-section-title">Message Templates</h2>
          <p className="as-section-desc">Store, refine and copy messages to send to sellers, buyers and enquiries.</p>
        </div>
        <button className="as-btn as-btn--primary" onClick={openNew}>+ New Template</button>
      </div>

      <div className="as-toolbar">
        <input className="as-search" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="as-filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {editing && (
        <div className="as-editor">
          <h3 className="as-editor-title">{editing === 'new' ? 'New Template' : 'Edit Template'}</h3>
          <div className="as-editor-row">
            <div className="as-field">
              <label className="as-label">Title *</label>
              <input className="as-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Listing Confirmation Message" />
            </div>
            <div className="as-field">
              <label className="as-label">Category</label>
              <select className="as-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="as-field">
            <label className="as-label">Message *</label>
            <textarea className="as-input as-textarea" rows={10} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Type your message template here…" />
          </div>
          {error && <p className="as-error">{error}</p>}
          <div className="as-editor-actions">
            <button className="as-btn as-btn--ghost" onClick={cancelEdit}>Cancel</button>
            <button className="as-btn as-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="as-empty">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="as-empty">{templates.length === 0 ? 'No templates yet. Create your first one.' : 'No templates match your search.'}</div>
      ) : (
        <div className="as-templates-list">
          {visible.map(t => (
            <div key={t._id} className="as-template-card">
              <div className="as-template-header">
                <div className="as-template-meta">
                  <span className="as-template-title">{t.title}</span>
                  <span className="as-category-badge">{t.category}</span>
                </div>
                <div className="as-template-actions">
                  <button className={`as-btn as-btn--copy ${copied === t._id ? 'copied' : ''}`} onClick={() => copy(t._id, t.content)}>
                    {copied === t._id ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button className="as-btn as-btn--ghost" onClick={() => openEdit(t)}>Edit</button>
                  <button className="as-btn as-btn--danger" onClick={() => remove(t._id)}>✕</button>
                </div>
              </div>
              <pre className="as-template-preview">{t.content}</pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Collaborative Tasks ──────────────────────────────────────────────────────

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function CollaborativeTasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedToName: '', priority: 'medium', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterAssignee) params.set('assignedTo', filterAssignee);
      const res = await fetch(`${API}/admin/tasks?${params}`, { headers });
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterStatus, filterAssignee]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/tasks`, { method: 'POST', headers, body: JSON.stringify({ ...form, assignedTo: form.assignedToName || null }) });
      const data = await res.json();
      if (data.success) { setTasks(prev => [data.data, ...prev]); setForm({ title: '', description: '', assignedToName: '', priority: 'medium', dueDate: '' }); setCreating(false); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const setStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/admin/tasks/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) setTasks(prev => prev.map(t => t._id === id ? data.data : t));
    } catch (e) { console.error(e); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await fetch(`${API}/admin/tasks/${id}`, { method: 'DELETE', headers });
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (e) { console.error(e); }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
  };

  const isOverdue = (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();

  // Gather known assignees from loaded tasks for filter dropdown
  const knownAssignees = [...new Set(tasks.filter(t => t.assignedToName).map(t => ({ id: t.assignedTo, name: t.assignedToName })).map(a => JSON.stringify(a)))].map(s => JSON.parse(s));

  const statusOrder = { open: 0, 'in-progress': 1, done: 2 };
  const sorted = [...tasks].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return (
    <section className="as-section">
      <div className="as-section-header">
        <div>
          <h2 className="as-section-title">Collaborative Tasks</h2>
          <p className="as-section-desc">Assign tasks to team members, track progress and mark them done.</p>
        </div>
        <button className="as-btn as-btn--primary" onClick={() => setCreating(p => !p)}>
          {creating ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {creating && (
        <div className="as-editor">
          <h3 className="as-editor-title">New Task</h3>
          <div className="as-field">
            <label className="as-label">Task Title *</label>
            <input className="as-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Update pricing for March listings" />
          </div>
          <div className="as-field">
            <label className="as-label">Details / Notes</label>
            <textarea className="as-input as-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Additional context or instructions…" />
          </div>
          <div className="as-editor-row">
            <div className="as-field">
              <label className="as-label">Assign To</label>
              <input className="as-input" value={form.assignedToName} onChange={e => setForm(p => ({ ...p, assignedToName: e.target.value }))} placeholder="Admin name" />
            </div>
            <div className="as-field">
              <label className="as-label">Priority</label>
              <select className="as-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="as-field">
            <label className="as-label">Due Date</label>
            <input className="as-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <div className="as-editor-actions">
            <button className="as-btn as-btn--ghost" onClick={() => setCreating(false)}>Cancel</button>
            <button className="as-btn as-btn--primary" onClick={submit} disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Create Task'}</button>
          </div>
        </div>
      )}

      <div className="as-toolbar">
        <select className="as-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        {knownAssignees.length > 0 && (
          <select className="as-filter-select" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="">All Assignees</option>
            {knownAssignees.map(a => <option key={a.id || a.name} value={a.id || a.name}>{a.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="as-empty">Loading tasks…</div>
      ) : sorted.length === 0 ? (
        <div className="as-empty">No tasks yet. Create one to coordinate with your team.</div>
      ) : (
        <div className="as-tasks-list">
          {sorted.map(task => (
            <div key={task._id} className={`as-task-card${task.status === 'done' ? ' as-task-card--done' : ''}${isOverdue(task) ? ' as-task-card--overdue' : ''}`}>
              <div className="as-task-left">
                <button
                  className={`as-task-check${task.status === 'done' ? ' checked' : ''}`}
                  onClick={() => setStatus(task._id, task.status === 'done' ? 'open' : 'done')}
                  title={task.status === 'done' ? 'Mark as open' : 'Mark as done'}
                >
                  {task.status === 'done' ? '✓' : ''}
                </button>
              </div>
              <div className="as-task-body">
                <div className="as-task-top">
                  <span className="as-task-title">{task.title}</span>
                  <span className="as-task-priority" style={{ color: PRIORITY_COLORS[task.priority] || '#8b949e' }}>
                    {task.priority}
                  </span>
                  <span className={`as-task-status-badge as-task-status--${task.status}`}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                {task.description && <p className="as-task-desc">{task.description}</p>}
                <div className="as-task-meta">
                  {task.assignedToName && <span className="as-task-meta-item">→ {task.assignedToName}</span>}
                  {task.dueDate && (
                    <span className={`as-task-meta-item${isOverdue(task) ? ' as-task-overdue-text' : ''}`}>
                      Due {formatDate(task.dueDate)}{isOverdue(task) ? ' — Overdue' : ''}
                    </span>
                  )}
                  <span className="as-task-meta-item as-task-meta-muted">by {task.createdByName} · {formatDate(task.createdAt)}</span>
                  {task.status === 'done' && task.completedByName && (
                    <span className="as-task-meta-item as-task-done-by">✓ completed by {task.completedByName} {formatDate(task.completedAt)}</span>
                  )}
                </div>
              </div>
              <div className="as-task-right">
                {task.status !== 'done' && (
                  <button
                    className={`as-btn as-btn--ghost as-btn--xs${task.status === 'in-progress' ? ' active-status' : ''}`}
                    onClick={() => setStatus(task._id, task.status === 'in-progress' ? 'open' : 'in-progress')}
                  >
                    {task.status === 'in-progress' ? 'Pause' : 'Start'}
                  </button>
                )}
                <button className="as-btn as-btn--danger as-btn--xs" onClick={() => remove(task._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Daily Activity Log ───────────────────────────────────────────────────────

function ActivityLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [form, setForm] = useState({ category: 'Admin/Operations', summary: '', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (adminFilter) params.set('adminId', adminFilter);
      const res = await fetch(`${API}/admin/activity-log?${params}`, { headers });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [dateFrom, dateTo, adminFilter]);

  useEffect(() => { load(); }, [load]);

  const buildTasksText = () => {
    const parts = [`[${form.category}]`];
    if (form.summary.trim()) parts.push(form.summary.trim());
    if (form.details.trim()) parts.push('\n' + form.details.trim());
    return parts.join(' ');
  };

  const submitLog = async () => {
    if (!form.summary.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/activity-log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks: buildTasksText() }),
      });
      const data = await res.json();
      if (data.success) { setForm({ category: 'Admin/Operations', summary: '', details: '' }); await load(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const markReviewed = async (id) => {
    setReviewingId(id);
    try {
      const res = await fetch(`${API}/admin/activity-log/${id}/review`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) setLogs(prev => prev.map(l => l._id === id ? data.data : l));
    } catch (e) { console.error(e); }
    setReviewingId(null);
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
  };

  const formatTime = (d) => {
    try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  const alreadyReviewed = (log) => log.reviews?.some(r => r.adminId === user?._id || r.adminId === user?.id);
  const isOwn = (log) => log.adminId === (user?._id || user?.id);

  // Gather known admins for dropdown
  const knownAdmins = [...new Map(logs.filter(l => l.adminId && l.adminName).map(l => [l.adminId, { id: l.adminId, name: l.adminName }])).values()];

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setAdminFilter(''); };
  const hasFilters = dateFrom || dateTo || adminFilter;

  return (
    <section className="as-section as-section--log">
      <div className="as-section-header">
        <div>
          <h2 className="as-section-title">Daily Activity Log</h2>
          <p className="as-section-desc">Record what you did today. Other admins can mark entries as reviewed.</p>
        </div>
      </div>

      {/* Log form */}
      <div className="as-log-form">
        <div className="as-log-form-header">
          <span className="as-label">Log for — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="as-log-form-row">
          <div className="as-field" style={{ minWidth: 0, flex: '0 0 200px' }}>
            <label className="as-label">Category</label>
            <select className="as-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {LOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="as-field" style={{ flex: 1 }}>
            <label className="as-label">Summary *</label>
            <input className="as-input" value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} placeholder="e.g. Listed 3 vehicles, responded to 7 enquiries" />
          </div>
        </div>
        <div className="as-field">
          <label className="as-label">Details (optional)</label>
          <textarea
            className="as-input as-textarea"
            rows={4}
            value={form.details}
            onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
            placeholder={`Additional notes, specific actions, observations…\n• Dealt with seller complaint re: listing #1234\n• Updated 5 vehicle prices after market check`}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
          <button className="as-btn as-btn--primary" onClick={submitLog} disabled={submitting || !form.summary.trim()}>
            {submitting ? 'Submitting…' : 'Submit Log Entry'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="as-log-filters">
        <div className="as-filter-group">
          <label className="as-label">From</label>
          <input className="as-input as-input--date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="as-filter-group">
          <label className="as-label">To</label>
          <input className="as-input as-input--date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {knownAdmins.length > 1 && (
          <div className="as-filter-group">
            <label className="as-label">Admin</label>
            <select className="as-input" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}>
              <option value="">All Admins</option>
              {knownAdmins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {hasFilters && (
          <button className="as-btn as-btn--ghost" style={{ alignSelf: 'flex-end' }} onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="as-empty">Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className="as-empty">{hasFilters ? 'No logs match your filters.' : 'No activity logged yet. Be the first to submit.'}</div>
      ) : (
        <div className="as-log-list">
          {logs.map(log => {
            const own = isOwn(log);
            const reviewed = alreadyReviewed(log);
            return (
              <div key={log._id} className={`as-log-card ${own ? 'as-log-card--own' : ''}`}>
                <div className="as-log-card-header">
                  <div className="as-log-author-info">
                    <div className="as-log-avatar">{(log.adminName || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="as-log-author-name">{log.adminName}</span>
                      {own && <span className="as-log-own-badge">You</span>}
                      <div className="as-log-date">{formatDate(log.createdAt)} at {formatTime(log.createdAt)}</div>
                    </div>
                  </div>
                  <div className="as-log-review-area">
                    {log.reviews?.length > 0 && (
                      <div className="as-log-reviewers">
                        <span className="as-reviewed-count">✓ {log.reviews.length} reviewed</span>
                        <div className="as-reviewer-names">
                          {log.reviews.map((r, i) => <span key={i} className="as-reviewer-chip">{r.adminName}</span>)}
                        </div>
                      </div>
                    )}
                    {!own && (
                      <button
                        className={`as-btn ${reviewed ? 'as-btn--reviewed' : 'as-btn--review'}`}
                        onClick={() => !reviewed && markReviewed(log._id)}
                        disabled={reviewed || reviewingId === log._id}
                      >
                        {reviewingId === log._id ? '…' : reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                      </button>
                    )}
                  </div>
                </div>
                <pre className="as-log-tasks">{log.tasks}</pre>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminScripts = ({ user }) => {
  return (
    <div className="as-page">
      <div className="as-page-header">
        <h1 className="as-page-title">Scripts &amp; Activity</h1>
        <p className="as-page-subtitle">Manage message templates, coordinate team tasks, and track daily admin contributions.</p>
      </div>
      <TemplatesSection user={user} />
      <CollaborativeTasks user={user} />
      <ActivityLog user={user} />
    </div>
  );
};

export default AdminScripts;
