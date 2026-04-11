import React, { useState, useEffect, useCallback } from 'react';
import './AdminScripts.css';

const API = process.env.REACT_APP_API_URL || '/api';

const CATEGORIES = ['Sales Pitch', 'Listing Update', 'Enquiry Reply', 'Onboarding', 'Follow-up', 'General'];

// ─── Message Templates ───────────────────────────────────────────────────────

const blankTemplate = () => ({ title: '', category: 'General', content: '' });

function TemplatesSection({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | template object
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
        <input
          className="as-search"
          placeholder="Search templates…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="as-filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Editor */}
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
            <textarea
              className="as-input as-textarea"
              rows={10}
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Type your message template here…"
            />
          </div>
          {error && <p className="as-error">{error}</p>}
          <div className="as-editor-actions">
            <button className="as-btn as-btn--ghost" onClick={cancelEdit}>Cancel</button>
            <button className="as-btn as-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          </div>
        </div>
      )}

      {/* List */}
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
                  <button
                    className={`as-btn as-btn--copy ${copied === t._id ? 'copied' : ''}`}
                    onClick={() => copy(t._id, t.content)}
                  >
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

// ─── Daily Activity Log ───────────────────────────────────────────────────────

function ActivityLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskText, setTaskText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/activity-log`, { headers });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitLog = async () => {
    if (!taskText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/activity-log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks: taskText.trim() }),
      });
      const data = await res.json();
      if (data.success) { setTaskText(''); await load(); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const markReviewed = async (id) => {
    setReviewingId(id);
    try {
      const res = await fetch(`${API}/admin/activity-log/${id}/review`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) {
        setLogs(prev => prev.map(l => l._id === id ? data.data : l));
      }
    } catch (e) { console.error(e); }
    setReviewingId(null);
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const formatTime = (d) => {
    try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const alreadyReviewed = (log) => log.reviews?.some(r => r.adminId === user?._id || r.adminId === user?.id);
  const isOwn = (log) => log.adminId === (user?._id || user?.id);

  return (
    <section className="as-section as-section--log">
      <div className="as-section-header">
        <div>
          <h2 className="as-section-title">Daily Activity Log</h2>
          <p className="as-section-desc">Record what you did today. Other admins can mark entries as reviewed to acknowledge contributions.</p>
        </div>
      </div>

      {/* Log entry form */}
      <div className="as-log-form">
        <label className="as-label">Log your tasks for today — <span style={{ color: '#6b7280', fontWeight: 400 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></label>
        <textarea
          className="as-input as-textarea"
          rows={5}
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          placeholder={`What did you work on today?\n\n• Listed 3 vehicles for private sellers\n• Responded to 7 enquiries\n• Updated pricing for dealer listings…`}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
          <button className="as-btn as-btn--primary" onClick={submitLog} disabled={submitting || !taskText.trim()}>
            {submitting ? 'Submitting…' : 'Submit Log Entry'}
          </button>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="as-empty">Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className="as-empty">No activity logged yet. Be the first to submit.</div>
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
                          {log.reviews.map((r, i) => (
                            <span key={i} className="as-reviewer-chip">{r.adminName}</span>
                          ))}
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
        <h1 className="as-page-title">Scripts & Activity</h1>
        <p className="as-page-subtitle">Manage message templates and track daily admin contributions.</p>
      </div>
      <TemplatesSection user={user} />
      <ActivityLog user={user} />
    </div>
  );
};

export default AdminScripts;
