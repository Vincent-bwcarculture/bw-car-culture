// AdminOps.js — Mission/Vision, Rules of Execution, Admin Roles
import React, { useState, useEffect, useCallback } from 'react';
import './AdminOps.css';

const API = process.env.REACT_APP_API_URL || '/api';

// ─── Mission & Vision ─────────────────────────────────────────────────────────
function MissionSection() {
  const [data, setData] = useState({ mission: '', vision: '' });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ mission: '', vision: '' });
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/ops/mission`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {});
  }, []);

  const startEdit = () => { setForm({ mission: data.mission, vision: data.vision }); setEditing(true); };
  const cancel = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/ops/mission`, { method: 'PUT', headers, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { setData(form); setEditing(false); }
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="ops-block ops-block--mv">
      <div className="ops-block-head">
        <div>
          <span className="ops-block-icon">◎</span>
          <span className="ops-block-title">Mission &amp; Vision</span>
        </div>
        {!editing && <button className="ops-edit-btn" onClick={startEdit}>Edit</button>}
      </div>

      {editing ? (
        <div className="ops-mv-edit">
          <div className="ops-field">
            <label className="ops-label">Mission</label>
            <textarea
              className="ops-textarea"
              rows={3}
              value={form.mission}
              onChange={e => setForm(p => ({ ...p, mission: e.target.value }))}
              placeholder="What we do and why we exist…"
            />
          </div>
          <div className="ops-field">
            <label className="ops-label">Vision</label>
            <textarea
              className="ops-textarea"
              rows={3}
              value={form.vision}
              onChange={e => setForm(p => ({ ...p, vision: e.target.value }))}
              placeholder="Where we are heading…"
            />
          </div>
          <div className="ops-actions">
            <button className="ops-btn ops-btn--ghost" onClick={cancel}>Cancel</button>
            <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div className="ops-mv-display">
          <div className="ops-mv-item">
            <span className="ops-mv-label">Mission</span>
            <p className="ops-mv-text">{data.mission || <span className="ops-placeholder">Not set — click Edit to add.</span>}</p>
          </div>
          <div className="ops-mv-item">
            <span className="ops-mv-label">Vision</span>
            <p className="ops-mv-text">{data.vision || <span className="ops-placeholder">Not set — click Edit to add.</span>}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rules of Execution ───────────────────────────────────────────────────────
function RulesSection() {
  const [rules, setRules] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState('');
  const [editingRule, setEditingRule] = useState(null); // { id, field, rules[] }
  const [newRuleText, setNewRuleText] = useState('');
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/ops/rules`, { headers });
      const d = await res.json();
      if (d.success) setRules(d.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const addField = async () => {
    if (!newField.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/ops/rules`, { method: 'POST', headers, body: JSON.stringify({ field: newField.trim(), rules: [] }) });
      const d = await res.json();
      if (d.success) { await load(); setNewField(''); setAddingField(false); setExpanded(d.data._id); setEditingRule({ id: d.data._id, field: d.data.field, rules: [] }); }
    } catch (_) {}
    setSaving(false);
  };

  const deleteField = async (id) => {
    if (!window.confirm('Delete this rules section?')) return;
    try {
      await fetch(`${API}/admin/ops/rules/${id}`, { method: 'DELETE', headers });
      setRules(prev => prev.filter(r => r._id !== id));
      if (expanded === id) setExpanded(null);
    } catch (_) {}
  };

  const startEdit = (r) => { setEditingRule({ id: r._id, field: r.field, rules: [...(r.rules || [])] }); setExpanded(r._id); };

  const addRule = () => {
    if (!newRuleText.trim()) return;
    setEditingRule(prev => ({ ...prev, rules: [...prev.rules, newRuleText.trim()] }));
    setNewRuleText('');
  };

  const removeRule = (idx) => setEditingRule(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/ops/rules/${editingRule.id}`, { method: 'PUT', headers, body: JSON.stringify({ field: editingRule.field, rules: editingRule.rules }) });
      const d = await res.json();
      if (d.success) { setRules(prev => prev.map(r => r._id === editingRule.id ? d.data : r)); setEditingRule(null); }
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="ops-block ops-block--rules">
      <div className="ops-block-head">
        <div>
          <span className="ops-block-icon">◈</span>
          <span className="ops-block-title">Rules of Execution</span>
        </div>
        <button className="ops-edit-btn" onClick={() => setAddingField(true)}>+ Add Field</button>
      </div>

      {addingField && (
        <div className="ops-add-row">
          <input
            className="ops-input"
            placeholder="Business field (e.g. Social Media, Events, Customer Interactions…)"
            value={newField}
            onChange={e => setNewField(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addField()}
            autoFocus
          />
          <button className="ops-btn ops-btn--primary" onClick={addField} disabled={saving || !newField.trim()}>Add</button>
          <button className="ops-btn ops-btn--ghost" onClick={() => { setAddingField(false); setNewField(''); }}>Cancel</button>
        </div>
      )}

      {rules.length === 0 && !addingField && (
        <p className="ops-placeholder">No rules yet. Click &ldquo;+ Add Field&rdquo; to create a business field section.</p>
      )}

      <div className="ops-rules-list">
        {rules.map(r => {
          const isExpanded = expanded === r._id;
          const isEditing = editingRule?.id === r._id;
          return (
            <div key={r._id} className={`ops-rule-card${isExpanded ? ' ops-rule-card--open' : ''}`}>
              <button
                className="ops-rule-header"
                onClick={() => { setExpanded(isExpanded ? null : r._id); if (!isExpanded) setEditingRule(null); }}
              >
                <span className="ops-rule-field">{r.field}</span>
                <span className="ops-rule-count">{(r.rules || []).length} rules</span>
                <span className="ops-rule-chevron">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="ops-rule-body">
                  {isEditing ? (
                    <>
                      <div className="ops-field" style={{ marginBottom: '0.75rem' }}>
                        <label className="ops-label">Section Title</label>
                        <input className="ops-input" value={editingRule.field} onChange={e => setEditingRule(p => ({ ...p, field: e.target.value }))} />
                      </div>
                      <div className="ops-rules-items">
                        {editingRule.rules.map((rule, i) => (
                          <div key={i} className="ops-rule-item ops-rule-item--edit">
                            <span className="ops-rule-num">{i + 1}.</span>
                            <span className="ops-rule-text">{rule}</span>
                            <button className="ops-rule-remove" onClick={() => removeRule(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div className="ops-add-rule-row">
                        <input
                          className="ops-input"
                          placeholder="Add a rule…"
                          value={newRuleText}
                          onChange={e => setNewRuleText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addRule()}
                        />
                        <button className="ops-btn ops-btn--ghost" onClick={addRule}>+ Add</button>
                      </div>
                      <div className="ops-actions" style={{ marginTop: '0.75rem' }}>
                        <button className="ops-btn ops-btn--ghost" onClick={() => setEditingRule(null)}>Cancel</button>
                        <button className="ops-btn ops-btn--primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {(r.rules || []).length === 0 ? (
                        <p className="ops-placeholder" style={{ padding: '0.5rem 0' }}>No rules added yet.</p>
                      ) : (
                        <ol className="ops-rules-ordered">
                          {r.rules.map((rule, i) => <li key={i} className="ops-rule-item">{rule}</li>)}
                        </ol>
                      )}
                      <div className="ops-actions" style={{ marginTop: '0.75rem' }}>
                        <button className="ops-btn ops-btn--ghost ops-btn--sm" onClick={() => deleteField(r._id)}>Delete Section</button>
                        <button className="ops-btn ops-btn--primary ops-btn--sm" onClick={() => startEdit(r)}>Edit Rules</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Admin Roles & Responsibilities ──────────────────────────────────────────
function RolesSection() {
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | role object
  const [form, setForm] = useState({ name: '', position: '', responsibilities: [] });
  const [newResp, setNewResp] = useState('');
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/ops/roles`, { headers });
      const d = await res.json();
      if (d.success) setRoles(d.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: '', position: '', responsibilities: [] }); setNewResp(''); setEditing('new'); };
  const openEdit = (r) => { setForm({ name: r.name, position: r.position, responsibilities: [...(r.responsibilities || [])] }); setNewResp(''); setEditing(r); };
  const cancel = () => { setEditing(null); setNewResp(''); };

  const addResp = () => {
    if (!newResp.trim()) return;
    setForm(p => ({ ...p, responsibilities: [...p.responsibilities, newResp.trim()] }));
    setNewResp('');
  };

  const removeResp = (i) => setForm(p => ({ ...p, responsibilities: p.responsibilities.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? `${API}/admin/ops/roles` : `${API}/admin/ops/roles/${editing._id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { await load(); cancel(); }
    } catch (_) {}
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this admin profile?')) return;
    try {
      await fetch(`${API}/admin/ops/roles/${id}`, { method: 'DELETE', headers });
      setRoles(prev => prev.filter(r => r._id !== id));
    } catch (_) {}
  };

  return (
    <div className="ops-block ops-block--roles">
      <div className="ops-block-head">
        <div>
          <span className="ops-block-icon">◐</span>
          <span className="ops-block-title">Admin Team &amp; Roles</span>
        </div>
        <button className="ops-edit-btn" onClick={openNew}>+ Add Admin</button>
      </div>

      {editing && (
        <div className="ops-role-editor">
          <h3 className="ops-editor-title">{editing === 'new' ? 'Add Admin Profile' : 'Edit Admin Profile'}</h3>
          <div className="ops-editor-row">
            <div className="ops-field">
              <label className="ops-label">Name *</label>
              <input className="ops-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="ops-field">
              <label className="ops-label">Position / Title</label>
              <input className="ops-input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Operations Manager" />
            </div>
          </div>
          <div className="ops-field">
            <label className="ops-label">Daily Responsibilities</label>
            {form.responsibilities.map((r, i) => (
              <div key={i} className="ops-resp-item">
                <span className="ops-resp-dot">•</span>
                <span className="ops-resp-text">{r}</span>
                <button className="ops-rule-remove" onClick={() => removeResp(i)}>✕</button>
              </div>
            ))}
            <div className="ops-add-rule-row" style={{ marginTop: form.responsibilities.length ? '0.5rem' : 0 }}>
              <input
                className="ops-input"
                placeholder="Add a responsibility…"
                value={newResp}
                onChange={e => setNewResp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addResp()}
              />
              <button className="ops-btn ops-btn--ghost" onClick={addResp}>+ Add</button>
            </div>
          </div>
          <div className="ops-actions">
            <button className="ops-btn ops-btn--ghost" onClick={cancel}>Cancel</button>
            <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {roles.length === 0 && !editing && (
        <p className="ops-placeholder">No admin profiles yet.</p>
      )}

      <div className="ops-roles-grid">
        {roles.map(r => (
          <div key={r._id} className="ops-role-card">
            <div className="ops-role-avatar">{(r.name || 'A').charAt(0).toUpperCase()}</div>
            <div className="ops-role-info">
              <span className="ops-role-name">{r.name}</span>
              {r.position && <span className="ops-role-position">{r.position}</span>}
              {(r.responsibilities || []).length > 0 && (
                <ul className="ops-resp-list">
                  {r.responsibilities.map((resp, i) => <li key={i}>{resp}</li>)}
                </ul>
              )}
            </div>
            <div className="ops-role-btns">
              <button className="ops-btn ops-btn--ghost ops-btn--sm" onClick={() => openEdit(r)}>Edit</button>
              <button className="ops-btn ops-btn--danger ops-btn--sm" onClick={() => remove(r._id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminOps = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="ops-wrap">
      <div className="ops-header">
        <div className="ops-header-left">
          <span className="ops-header-icon">◆</span>
          <div>
            <h2 className="ops-header-title">Operations Centre</h2>
            <p className="ops-header-sub">Mission, rules of execution, and team responsibilities.</p>
          </div>
        </div>
        <button className="ops-collapse-btn" onClick={() => setCollapsed(p => !p)}>
          {collapsed ? 'Show ▼' : 'Collapse ▲'}
        </button>
      </div>

      {!collapsed && (
        <div className="ops-body">
          <MissionSection />
          <RulesSection />
          <RolesSection />
        </div>
      )}
    </div>
  );
};

export default AdminOps;
