// AdminOps.js — Full Operations Centre (one page for everything)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import './AdminOps.css';

const API = process.env.REACT_APP_API_URL || '/api';

const POSITIONS = [
  'Founder / CEO', 'Co-Founder', 'Director',
  'Operations Manager', 'Sales Manager', 'Listings Manager',
  'Content Manager', 'Marketing Manager', 'Customer Support Lead',
  'Finance Manager', 'Tech Lead', 'Other',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TEMPLATE_CATS = ['Sales Pitch', 'Listing Update', 'Enquiry Reply', 'Onboarding', 'Follow-up', 'General'];
const LOG_CATS = ['Listings', 'Enquiries', 'Communications', 'Content', 'Tech/Platform', 'Admin/Operations', 'Customer Support', 'Finance', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

function useToken() {
  const token = localStorage.getItem('token');
  return { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
}

async function readBody(req) {
  let body = {};
  try { const c = []; for await (const ch of req) c.push(ch); body = JSON.parse(Buffer.concat(c).toString()); } catch (_) {}
  return body;
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
}
function fmtTime(d) {
  try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}
function fmtShortDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
}

// ─── Rules Modal ──────────────────────────────────────────────────────────────
function RulesModal({ rule, onClose, onSaved, headers }) {
  const [field, setField] = useState(rule?.field || '');
  const [rules, setRules] = useState(rule?.rules || []);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);

  const addRule = () => {
    if (!newRule.trim()) return;
    setRules(p => [...p, newRule.trim()]);
    setNewRule('');
  };

  const removeRule = (i) => setRules(p => p.filter((_, idx) => idx !== i));

  const moveRule = (i, dir) => {
    const next = [...rules];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setRules(next);
  };

  const save = async () => {
    if (!field.trim()) return;
    setSaving(true);
    try {
      const isNew = !rule?._id;
      const url = isNew ? `${API}/admin/ops/rules` : `${API}/admin/ops/rules/${rule._id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers, body: JSON.stringify({ field: field.trim(), rules }) });
      const d = await res.json();
      if (d.success) { onSaved(d.data, isNew); onClose(); }
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="ops-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ops-modal">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">{rule?._id ? 'Edit Rules — ' + rule.field : 'New Rules Section'}</h2>
          <button className="ops-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ops-modal-body">
          <div className="ops-field">
            <label className="ops-label">Business Field / Section Title</label>
            <input className="ops-input" value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Social Media, Events, Customer Interactions…" />
          </div>

          <div className="ops-field" style={{ marginTop: '1.25rem' }}>
            <label className="ops-label">Rules ({rules.length})</label>
            {rules.length === 0 && <p className="ops-placeholder" style={{ padding: '0.5rem 0' }}>No rules yet.</p>}
            <div className="ops-rules-edit-list">
              {rules.map((r, i) => (
                <div key={i} className="ops-rule-edit-item">
                  <span className="ops-rule-num">{i + 1}.</span>
                  <span className="ops-rule-edit-text">{r}</span>
                  <div className="ops-rule-edit-btns">
                    <button className="ops-icon-btn" onClick={() => moveRule(i, -1)} disabled={i === 0} title="Move up">↑</button>
                    <button className="ops-icon-btn" onClick={() => moveRule(i, 1)} disabled={i === rules.length - 1} title="Move down">↓</button>
                    <button className="ops-icon-btn ops-icon-btn--del" onClick={() => removeRule(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="ops-add-rule-row">
              <input
                className="ops-input"
                placeholder="Add a rule…"
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRule()}
              />
              <button className="ops-btn ops-btn--ghost" onClick={addRule}>+ Add</button>
            </div>
          </div>
        </div>
        <div className="ops-modal-footer">
          <button className="ops-btn ops-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving || !field.trim()}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Edit Modal ────────────────────────────────────────────────────────
function ProfileModal({ profile, userName, onClose, onSaved, headers }) {
  const [position, setPosition] = useState(profile?.position || '');
  const [responsibilities, setResponsibilities] = useState(profile?.responsibilities || []);
  const [newResp, setNewResp] = useState('');
  const [schedule, setSchedule] = useState(profile?.schedule || { checkIn: '09:00', checkOut: '17:00', days: ['Mon','Tue','Wed','Thu','Fri'], statusNote: '' });
  const [saving, setSaving] = useState(false);

  const toggleDay = (d) => setSchedule(p => ({ ...p, days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d] }));

  const addResp = () => {
    if (!newResp.trim()) return;
    setResponsibilities(p => [...p, newResp.trim()]);
    setNewResp('');
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/ops/profile`, { method: 'PUT', headers, body: JSON.stringify({ position, responsibilities, schedule }) });
      const d = await res.json();
      if (d.success) { onSaved(d.data); onClose(); }
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="ops-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ops-modal ops-modal--profile">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">My Profile — {userName}</h2>
          <button className="ops-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ops-modal-body">
          <div className="ops-field">
            <label className="ops-label">Position / Title</label>
            <select className="ops-input" value={position} onChange={e => setPosition(e.target.value)}>
              <option value="">Select position…</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="ops-field" style={{ marginTop: '1rem' }}>
            <label className="ops-label">Daily Responsibilities</label>
            {responsibilities.map((r, i) => (
              <div key={i} className="ops-rule-edit-item">
                <span className="ops-rule-num">{i + 1}.</span>
                <span className="ops-rule-edit-text">{r}</span>
                <button className="ops-icon-btn ops-icon-btn--del" onClick={() => setResponsibilities(p => p.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <div className="ops-add-rule-row">
              <input className="ops-input" placeholder="Add responsibility…" value={newResp} onChange={e => setNewResp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addResp()} />
              <button className="ops-btn ops-btn--ghost" onClick={addResp}>+ Add</button>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label className="ops-label" style={{ display: 'block', marginBottom: '0.35rem' }}>Expected Working Hours</label>
            <p className="ops-placeholder" style={{ marginBottom: '0.75rem', marginTop: 0 }}>Your typical schedule — shown on team cards. Actual daily check-in/out is logged from the Team section.</p>
            <div className="ops-schedule-row">
              <div className="ops-field">
                <label className="ops-label">Usual start time</label>
                <input className="ops-input ops-input--time" type="time" value={schedule.checkIn} onChange={e => setSchedule(p => ({ ...p, checkIn: e.target.value }))} />
              </div>
              <div className="ops-field">
                <label className="ops-label">Usual end time</label>
                <input className="ops-input ops-input--time" type="time" value={schedule.checkOut} onChange={e => setSchedule(p => ({ ...p, checkOut: e.target.value }))} />
              </div>
            </div>
            <div className="ops-days-row">
              {DAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`ops-day-btn${(schedule.days || []).includes(d) ? ' active' : ''}`}
                  onClick={() => toggleDay(d)}
                >{d}</button>
              ))}
            </div>
            <div className="ops-field" style={{ marginTop: '0.75rem' }}>
              <label className="ops-label">Status note (optional)</label>
              <input className="ops-input" value={schedule.statusNote || ''} onChange={e => setSchedule(p => ({ ...p, statusNote: e.target.value }))} placeholder="e.g. Available on WhatsApp after hours" />
            </div>
          </div>
        </div>
        <div className="ops-modal-footer">
          <button className="ops-btn ops-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Company ─────────────────────────────────────────────────────────
function CompanySection({ headers }) {
  const [mv, setMv] = useState({ mission: '', vision: '' });
  const [editingMv, setEditingMv] = useState(false);
  const [mvForm, setMvForm] = useState({ mission: '', vision: '' });
  const [mvMeta, setMvMeta] = useState(null);
  const [savingMv, setSavingMv] = useState(false);
  const [rules, setRules] = useState([]);
  const [ruleModal, setRuleModal] = useState(null); // null | {} | ruleObj

  const loadMv = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/ops/mission`, { headers });
      const d = await res.json();
      if (d.success) { setMv({ mission: d.data.mission || '', vision: d.data.vision || '' }); setMvMeta(d.data); }
    } catch (_) {}
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/ops/rules`, { headers });
      const d = await res.json();
      if (d.success) setRules(d.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => { loadMv(); loadRules(); }, [loadMv, loadRules]);

  const saveMv = async () => {
    setSavingMv(true);
    try {
      const res = await fetch(`${API}/admin/ops/mission`, { method: 'PUT', headers, body: JSON.stringify(mvForm) });
      const d = await res.json();
      if (d.success) { setMv(mvForm); setEditingMv(false); await loadMv(); }
    } catch (_) {}
    setSavingMv(false);
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    await fetch(`${API}/admin/ops/rules/${id}`, { method: 'DELETE', headers });
    setRules(prev => prev.filter(r => r._id !== id));
  };

  const handleRuleSaved = (data, isNew) => {
    if (isNew) setRules(prev => [...prev, data]);
    else setRules(prev => prev.map(r => r._id === data._id ? data : r));
  };

  return (
    <div className="ops-section">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">◎ Company</h2>
      </div>

      {/* Mission & Vision */}
      <div className="ops-card">
        <div className="ops-card-head">
          <div>
            <span className="ops-card-label">Mission &amp; Vision</span>
            {mvMeta?.updatedBy && <span className="ops-card-meta">Last edited by {mvMeta.updatedBy}</span>}
          </div>
          {!editingMv && (
            <button className="ops-edit-btn" onClick={() => { setMvForm({ mission: mv.mission, vision: mv.vision }); setEditingMv(true); }}>Edit</button>
          )}
        </div>

        {editingMv ? (
          <div className="ops-mv-edit">
            <div className="ops-field">
              <label className="ops-label">Mission</label>
              <textarea className="ops-textarea" rows={3} value={mvForm.mission} onChange={e => setMvForm(p => ({ ...p, mission: e.target.value }))} placeholder="What we do and why we exist…" />
            </div>
            <div className="ops-field">
              <label className="ops-label">Vision</label>
              <textarea className="ops-textarea" rows={3} value={mvForm.vision} onChange={e => setMvForm(p => ({ ...p, vision: e.target.value }))} placeholder="Where we're heading…" />
            </div>
            <div className="ops-actions">
              <button className="ops-btn ops-btn--ghost" onClick={() => setEditingMv(false)}>Cancel</button>
              <button className="ops-btn ops-btn--primary" onClick={saveMv} disabled={savingMv}>{savingMv ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        ) : (
          <div className="ops-mv-display">
            <div className="ops-mv-item">
              <span className="ops-mv-label">Mission</span>
              <p className="ops-mv-text">{mv.mission || <em className="ops-placeholder">Not set.</em>}</p>
            </div>
            <div className="ops-mv-item">
              <span className="ops-mv-label">Vision</span>
              <p className="ops-mv-text">{mv.vision || <em className="ops-placeholder">Not set.</em>}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rules of Execution */}
      <div className="ops-card" style={{ marginTop: '1rem' }}>
        <div className="ops-card-head">
          <span className="ops-card-label">Rules of Execution</span>
          <button className="ops-edit-btn" onClick={() => setRuleModal({})}>+ Add Field</button>
        </div>

        {rules.length === 0 && <p className="ops-placeholder">No rules yet.</p>}

        <div className="ops-rules-grid">
          {rules.map(r => (
            <div key={r._id} className="ops-rule-chip-card">
              <div className="ops-rule-chip-head">
                <span className="ops-rule-chip-name">{r.field}</span>
                <span className="ops-rule-chip-count">{(r.rules || []).length}</span>
              </div>
              {(r.rules || []).length > 0 && (
                <ol className="ops-rule-chip-preview">
                  {(r.rules || []).slice(0, 3).map((rule, i) => <li key={i}>{rule}</li>)}
                  {(r.rules || []).length > 3 && <li className="ops-rule-chip-more">+{r.rules.length - 3} more…</li>}
                </ol>
              )}
              <div className="ops-rule-chip-actions">
                <button className="ops-btn ops-btn--primary ops-btn--xs" onClick={() => setRuleModal(r)}>Edit Rules</button>
                <button className="ops-btn ops-btn--danger ops-btn--xs" onClick={() => deleteRule(r._id)}>Delete</button>
              </div>
              {r.updatedBy && <span className="ops-chip-meta">Edited by {r.updatedBy}</span>}
            </div>
          ))}
        </div>
      </div>

      {ruleModal !== null && (
        <RulesModal
          rule={ruleModal?._id ? ruleModal : null}
          headers={headers}
          onClose={() => setRuleModal(null)}
          onSaved={handleRuleSaved}
        />
      )}
    </div>
  );
}

// ─── Section: Team ────────────────────────────────────────────────────────────
function TeamSection({ currentUser, headers }) {
  const [team, setTeam] = useState([]);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [profileModal, setProfileModal] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logAdminFilter, setLogAdminFilter] = useState('');
  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // 'in' | 'out'
  const [noteText, setNoteText] = useState('');
  const myId = String(currentUser?._id || currentUser?.id || '');

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team`, { headers });
      const d = await res.json();
      if (d.success) setTeam(d.data || []);
    } catch (_) {}
  }, []);

  const loadTodayCheckins = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/checkins/today`, { headers });
      const d = await res.json();
      if (d.success) setTodayCheckins(d.data || []);
    } catch (_) {}
  }, []);

  const loadLog = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (logAdminFilter) params.set('adminId', logAdminFilter);
      if (logFrom) params.set('from', logFrom);
      if (logTo) params.set('to', logTo);
      const res = await fetch(`${API}/admin/checkins?${params}`, { headers });
      const d = await res.json();
      if (d.success) setAllCheckins(d.data || []);
    } catch (_) {}
  }, [logAdminFilter, logFrom, logTo]);

  useEffect(() => { loadTeam(); loadTodayCheckins(); }, [loadTeam, loadTodayCheckins]);
  useEffect(() => { if (showLog) loadLog(); }, [showLog, loadLog]);

  const myEntry = team.find(t => String(t._id) === myId);
  const myProfile = myEntry?.opsProfile;
  const myToday = todayCheckins.find(c => c.adminId === myId);

  const getCheckinForMember = (memberId) => todayCheckins.find(c => c.adminId === String(memberId));

  const checkin = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch(`${API}/admin/checkins/checkin`, { method: 'POST', headers, body: JSON.stringify({ note: noteText }) });
      const d = await res.json();
      if (d.success) { await loadTodayCheckins(); setNoteModal(null); setNoteText(''); }
      else alert(d.message);
    } catch (_) {}
    setCheckingIn(false);
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch(`${API}/admin/checkins/checkout`, { method: 'POST', headers, body: JSON.stringify({ note: noteText }) });
      const d = await res.json();
      if (d.success) { await loadTodayCheckins(); if (showLog) loadLog(); setNoteModal(null); setNoteText(''); }
      else alert(d.message);
    } catch (_) {}
    setCheckingOut(false);
  };

  const deleteCheckin = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await fetch(`${API}/admin/checkins/${id}`, { method: 'DELETE', headers });
    setAllCheckins(prev => prev.filter(c => c._id !== id));
    loadTodayCheckins();
  };

  const fmtDuration = (mins) => {
    if (!mins && mins !== 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleProfileSaved = (data) => {
    setTeam(prev => prev.map(m => String(m._id) === myId ? { ...m, opsProfile: data } : m));
  };

  const knownAdmins = [...new Map(allCheckins.filter(c => c.adminId && c.adminName).map(c => [c.adminId, { id: c.adminId, name: c.adminName }])).values()];

  return (
    <div className="ops-section">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">◐ Admin Team</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* My check-in/out for today */}
          {!myToday ? (
            <button className="ops-btn ops-btn--checkin" onClick={() => { setNoteModal('in'); setNoteText(''); }} disabled={checkingIn}>
              ● Check In
            </button>
          ) : !myToday.checkOut ? (
            <button className="ops-btn ops-btn--checkout" onClick={() => { setNoteModal('out'); setNoteText(myToday.note || ''); }} disabled={checkingOut}>
              ○ Check Out
            </button>
          ) : (
            <span className="ops-checkin-done">✓ Done {myToday.checkIn}–{myToday.checkOut} ({fmtDuration(myToday.duration)})</span>
          )}
          <button className="ops-edit-btn" onClick={() => setProfileModal(true)}>Edit My Profile</button>
          <button className="ops-edit-btn" onClick={() => setShowLog(p => !p)}>{showLog ? 'Hide Log' : 'View Log'}</button>
        </div>
      </div>

      {/* Team cards */}
      <div className="ops-team-grid">
        {team.length === 0 && <p className="ops-placeholder">No admin users found.</p>}
        {team.map(member => {
          const p = member.opsProfile;
          const isMe = String(member._id) === myId;
          const ci = getCheckinForMember(member._id);
          const checkedInToday = !!ci;
          const checkedOutToday = !!ci?.checkOut;
          return (
            <div key={member._id} className={`ops-member-card${isMe ? ' ops-member-card--me' : ''}`}>
              <div className="ops-member-top">
                <div className="ops-member-avatar-wrap">
                  <div className="ops-member-avatar">{(member.name || 'A').charAt(0).toUpperCase()}</div>
                  <span
                    className={`ops-member-dot${checkedInToday && !checkedOutToday ? ' online' : checkedOutToday ? ' done' : ''}`}
                    title={checkedOutToday ? `Checked out at ${ci.checkOut}` : checkedInToday ? `Checked in at ${ci.checkIn}` : 'Not checked in today'}
                  ></span>
                </div>
                <div className="ops-member-info">
                  <span className="ops-member-name">{member.name}{isMe && <span className="ops-me-badge">You</span>}</span>
                  {p?.position ? (
                    <span className="ops-member-position">{p.position}</span>
                  ) : (
                    <span className="ops-placeholder ops-member-position">{isMe ? 'Set your position →' : 'No position set'}</span>
                  )}
                </div>
              </div>

              {/* Today's attendance */}
              {ci ? (
                <div className="ops-member-ci-today">
                  <span className="ops-ci-in">In {ci.checkIn}</span>
                  {ci.checkOut && <><span className="ops-ci-sep">→</span><span className="ops-ci-out">Out {ci.checkOut}</span></>}
                  {ci.duration != null && <span className="ops-ci-dur">{fmtDuration(ci.duration)}</span>}
                  {ci.note && <span className="ops-ci-note">{ci.note}</span>}
                </div>
              ) : (
                <div className="ops-member-ci-today ops-member-ci-absent">Not checked in today</div>
              )}

              {/* Expected schedule */}
              {p?.schedule && (
                <div className="ops-member-schedule">
                  <span className="ops-schedule-time">
                    Expected {p.schedule.checkIn} – {p.schedule.checkOut}
                    {p.schedule.days?.length ? ` · ${p.schedule.days.join(', ')}` : ''}
                  </span>
                  {p.schedule.statusNote && <span className="ops-schedule-note">{p.schedule.statusNote}</span>}
                </div>
              )}

              {(p?.responsibilities || []).length > 0 && (
                <ul className="ops-member-resp">
                  {p.responsibilities.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                  {p.responsibilities.length > 3 && <li className="ops-placeholder">+{p.responsibilities.length - 3} more</li>}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Check-in/out note modal */}
      {noteModal && (
        <div className="ops-modal-overlay" onClick={e => e.target === e.currentTarget && setNoteModal(null)}>
          <div className="ops-modal ops-modal--profile">
            <div className="ops-modal-header">
              <h2 className="ops-modal-title">{noteModal === 'in' ? '● Check In' : '○ Check Out'} — {currentUser?.name}</h2>
              <button className="ops-modal-close" onClick={() => setNoteModal(null)}>✕</button>
            </div>
            <div className="ops-modal-body">
              <p className="ops-note-hint">
                {noteModal === 'in'
                  ? `Recording check-in at ${new Date().toTimeString().slice(0, 5)} today.`
                  : `Recording check-out at ${new Date().toTimeString().slice(0, 5)}. You checked in at ${myToday?.checkIn}.`}
              </p>
              <div className="ops-field" style={{ marginTop: '0.75rem' }}>
                <label className="ops-label">Note (optional)</label>
                <textarea
                  className="ops-textarea"
                  rows={3}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={noteModal === 'in' ? 'What are you working on today?' : 'Summary of what you accomplished…'}
                  autoFocus
                />
              </div>
            </div>
            <div className="ops-modal-footer">
              <button className="ops-btn ops-btn--ghost" onClick={() => setNoteModal(null)}>Cancel</button>
              <button
                className={`ops-btn ${noteModal === 'in' ? 'ops-btn--checkin' : 'ops-btn--checkout'}`}
                onClick={noteModal === 'in' ? checkin : checkout}
                disabled={noteModal === 'in' ? checkingIn : checkingOut}
              >
                {noteModal === 'in' ? (checkingIn ? 'Checking in…' : '● Confirm Check In') : (checkingOut ? 'Checking out…' : '○ Confirm Check Out')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance log */}
      {showLog && (
        <div className="ops-checkin-log">
          <div className="ops-log-filters" style={{ marginBottom: '0.85rem' }}>
            <div className="ops-filter-group">
              <label className="ops-label">From</label>
              <input className="ops-input ops-input--date" type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)} />
            </div>
            <div className="ops-filter-group">
              <label className="ops-label">To</label>
              <input className="ops-input ops-input--date" type="date" value={logTo} onChange={e => setLogTo(e.target.value)} />
            </div>
            {team.length > 1 && (
              <div className="ops-filter-group">
                <label className="ops-label">Admin</label>
                <select className="ops-input" value={logAdminFilter} onChange={e => setLogAdminFilter(e.target.value)}>
                  <option value="">All</option>
                  {team.map(m => <option key={m._id} value={String(m._id)}>{m.name}</option>)}
                </select>
              </div>
            )}
            {(logFrom || logTo || logAdminFilter) && (
              <button className="ops-btn ops-btn--ghost" style={{ alignSelf: 'flex-end' }} onClick={() => { setLogFrom(''); setLogTo(''); setLogAdminFilter(''); }}>Clear</button>
            )}
          </div>

          {allCheckins.length === 0 ? (
            <div className="ops-empty" style={{ padding: '1.5rem' }}>No attendance records found.</div>
          ) : (
            <div className="ops-ci-log-list">
              {allCheckins.map(ci => {
                const isOwn = ci.adminId === myId;
                return (
                  <div key={ci._id} className={`ops-ci-log-row${isOwn ? ' ops-ci-log-row--own' : ''}`}>
                    <div className="ops-ci-log-avatar">{(ci.adminName || 'A').charAt(0).toUpperCase()}</div>
                    <div className="ops-ci-log-body">
                      <div className="ops-ci-log-top">
                        <span className="ops-ci-log-name">{ci.adminName}{isOwn && <span className="ops-me-badge">You</span>}</span>
                        <span className="ops-ci-log-date">{ci.date}</span>
                      </div>
                      <div className="ops-ci-log-times">
                        <span className="ops-ci-in">In {ci.checkIn}</span>
                        {ci.checkOut ? (
                          <><span className="ops-ci-sep">→</span><span className="ops-ci-out">Out {ci.checkOut}</span>
                          {ci.duration != null && <span className="ops-ci-dur">{fmtDuration(ci.duration)}</span>}</>
                        ) : (
                          <span className="ops-ci-still-in">still checked in</span>
                        )}
                      </div>
                      {ci.note && <p className="ops-ci-log-note">{ci.note}</p>}
                    </div>
                    {isOwn && (
                      <button className="ops-icon-btn ops-icon-btn--del" onClick={() => deleteCheckin(ci._id)} title="Delete record">✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {profileModal && (
        <ProfileModal
          profile={myProfile}
          userName={currentUser?.name || 'Admin'}
          headers={headers}
          onClose={() => setProfileModal(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}

// ─── Section: Message Templates ───────────────────────────────────────────────
function TemplatesSection({ headers }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'General', content: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/scripts`, { headers });
      const d = await res.json();
      if (d.success) setTemplates(d.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError('Title and content required.'); return; }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? `${API}/admin/scripts` : `${API}/admin/scripts/${editing._id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers, body: JSON.stringify(form) });
      const d = await res.json();
      if (!d.success) throw new Error(d.message);
      await load(); setEditing(null); setError('');
    } catch (e) { setError(e.message || 'Save failed.'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await fetch(`${API}/admin/scripts/${id}`, { method: 'DELETE', headers });
    setTemplates(prev => prev.filter(t => t._id !== id));
  };

  const copy = (id, content) => {
    navigator.clipboard.writeText(content).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  const visible = templates.filter(t => {
    const s = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
    const c = !filterCat || t.category === filterCat;
    return s && c;
  });

  return (
    <div className="ops-section">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">◈ Message Templates</h2>
        <button className="ops-btn ops-btn--primary ops-btn--sm" onClick={() => { setForm({ title: '', category: 'General', content: '' }); setEditing('new'); setError(''); }}>+ New Template</button>
      </div>

      <div className="ops-toolbar">
        <input className="ops-search" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="ops-filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {TEMPLATE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {editing && (
        <div className="ops-inline-editor">
          <div className="ops-editor-row">
            <div className="ops-field">
              <label className="ops-label">Title *</label>
              <input className="ops-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Template title" />
            </div>
            <div className="ops-field">
              <label className="ops-label">Category</label>
              <select className="ops-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {TEMPLATE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="ops-field">
            <label className="ops-label">Message *</label>
            <textarea className="ops-textarea" rows={8} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Type your message template here…" />
          </div>
          {error && <p className="ops-error">{error}</p>}
          <div className="ops-actions">
            <button className="ops-btn ops-btn--ghost" onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
            <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          </div>
        </div>
      )}

      {loading ? <div className="ops-empty">Loading…</div> : visible.length === 0 ? (
        <div className="ops-empty">{templates.length === 0 ? 'No templates yet.' : 'Nothing matches your search.'}</div>
      ) : (
        <div className="ops-tpl-list">
          {visible.map(t => (
            <div key={t._id} className="ops-tpl-card">
              <div className="ops-tpl-head">
                <span className="ops-tpl-title">{t.title}</span>
                <span className="ops-cat-badge">{t.category}</span>
                <div className="ops-tpl-actions">
                  <button className={`ops-btn ops-btn--copy ops-btn--xs${copied === t._id ? ' copied' : ''}`} onClick={() => copy(t._id, t.content)}>{copied === t._id ? '✓ Copied' : 'Copy'}</button>
                  <button className="ops-btn ops-btn--ghost ops-btn--xs" onClick={() => { setForm({ title: t.title, category: t.category, content: t.content }); setEditing(t); setError(''); }}>Edit</button>
                  <button className="ops-btn ops-btn--danger ops-btn--xs" onClick={() => remove(t._id)}>✕</button>
                </div>
              </div>
              <pre className="ops-tpl-preview">{t.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Collaborative Tasks ─────────────────────────────────────────────
function TasksSection({ currentUser, headers }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedToName: '', priority: 'medium', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/admin/tasks?${params}`, { headers });
      const d = await res.json();
      if (d.success) setTasks(d.data || []);
    } catch (_) {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/tasks`, { method: 'POST', headers, body: JSON.stringify({ ...form, assignedTo: form.assignedToName || null }) });
      const d = await res.json();
      if (d.success) { setTasks(prev => [d.data, ...prev]); setForm({ title: '', description: '', assignedToName: '', priority: 'medium', dueDate: '' }); setCreating(false); }
    } catch (_) {}
    setSaving(false);
  };

  const setStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/admin/tasks/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (d.success) setTasks(prev => prev.map(t => t._id === id ? d.data : t));
    } catch (_) {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await fetch(`${API}/admin/tasks/${id}`, { method: 'DELETE', headers });
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const isOverdue = (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();

  const sorted = [...tasks].sort((a, b) => { const o = { open: 0, 'in-progress': 1, done: 2 }; return (o[a.status] ?? 9) - (o[b.status] ?? 9); });

  return (
    <div className="ops-section">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">◇ Collaborative Tasks</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="ops-filter-select ops-filter-select--sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button className="ops-btn ops-btn--primary ops-btn--sm" onClick={() => setCreating(p => !p)}>{creating ? 'Cancel' : '+ New Task'}</button>
        </div>
      </div>

      {creating && (
        <div className="ops-inline-editor">
          <div className="ops-field">
            <label className="ops-label">Task *</label>
            <input className="ops-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" />
          </div>
          <div className="ops-field">
            <label className="ops-label">Details</label>
            <textarea className="ops-textarea" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Context or instructions…" />
          </div>
          <div className="ops-editor-row">
            <div className="ops-field">
              <label className="ops-label">Assign to</label>
              <input className="ops-input" value={form.assignedToName} onChange={e => setForm(p => ({ ...p, assignedToName: e.target.value }))} placeholder="Admin name" />
            </div>
            <div className="ops-field">
              <label className="ops-label">Priority</label>
              <select className="ops-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="ops-field">
              <label className="ops-label">Due Date</label>
              <input className="ops-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="ops-actions">
            <button className="ops-btn ops-btn--ghost" onClick={() => setCreating(false)}>Cancel</button>
            <button className="ops-btn ops-btn--primary" onClick={submit} disabled={saving || !form.title.trim()}>{saving ? 'Creating…' : 'Create Task'}</button>
          </div>
        </div>
      )}

      {loading ? <div className="ops-empty">Loading tasks…</div> : sorted.length === 0 ? (
        <div className="ops-empty">No tasks{statusFilter ? ' matching filter' : ''}.</div>
      ) : (
        <div className="ops-task-list">
          {sorted.map(task => (
            <div key={task._id} className={`ops-task-card${task.status === 'done' ? ' done' : ''}${isOverdue(task) ? ' overdue' : ''}`}>
              <button
                className={`ops-task-check${task.status === 'done' ? ' checked' : ''}`}
                onClick={() => setStatus(task._id, task.status === 'done' ? 'open' : 'done')}
              >{task.status === 'done' ? '✓' : ''}</button>
              <div className="ops-task-body">
                <div className="ops-task-top">
                  <span className="ops-task-title">{task.title}</span>
                  <span className="ops-task-pri" style={{ color: PRIORITY_COLOR[task.priority] || '#8b949e' }}>{task.priority}</span>
                  <span className={`ops-task-badge ops-task-badge--${task.status}`}>
                    {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                {task.description && <p className="ops-task-desc">{task.description}</p>}
                <div className="ops-task-meta">
                  {task.assignedToName && <span>→ {task.assignedToName}</span>}
                  {task.dueDate && <span className={isOverdue(task) ? 'ops-overdue' : ''}>Due {fmtShortDate(task.dueDate)}{isOverdue(task) ? ' — Overdue' : ''}</span>}
                  <span className="ops-muted">by {task.createdByName} · {fmtShortDate(task.createdAt)}</span>
                  {task.status === 'done' && task.completedByName && <span className="ops-done-by">✓ {task.completedByName} · {fmtShortDate(task.completedAt)}</span>}
                </div>
              </div>
              <div className="ops-task-right">
                {task.status !== 'done' && (
                  <button
                    className={`ops-btn ops-btn--ghost ops-btn--xs${task.status === 'in-progress' ? ' ops-btn--active' : ''}`}
                    onClick={() => setStatus(task._id, task.status === 'in-progress' ? 'open' : 'in-progress')}
                  >{task.status === 'in-progress' ? 'Pause' : 'Start'}</button>
                )}
                <button className="ops-btn ops-btn--danger ops-btn--xs" onClick={() => remove(task._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Activity Log ────────────────────────────────────────────────────
function ActivityLogSection({ currentUser, headers }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [form, setForm] = useState({ category: 'Admin/Operations', summary: '', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const myId = String(currentUser?._id || currentUser?.id || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (adminFilter) params.set('adminId', adminFilter);
      const res = await fetch(`${API}/admin/activity-log?${params}`, { headers });
      const d = await res.json();
      if (d.success) setLogs(d.data || []);
    } catch (_) {}
    setLoading(false);
  }, [dateFrom, dateTo, adminFilter]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.summary.trim()) return;
    setSubmitting(true);
    const tasks = `[${form.category}] ${form.summary.trim()}${form.details.trim() ? '\n' + form.details.trim() : ''}`;
    try {
      const res = await fetch(`${API}/admin/activity-log`, { method: 'POST', headers, body: JSON.stringify({ tasks }) });
      const d = await res.json();
      if (d.success) { setForm({ category: 'Admin/Operations', summary: '', details: '' }); await load(); }
    } catch (_) {}
    setSubmitting(false);
  };

  const markReviewed = async (id) => {
    setReviewingId(id);
    try {
      const res = await fetch(`${API}/admin/activity-log/${id}/review`, { method: 'POST', headers });
      const d = await res.json();
      if (d.success) setLogs(prev => prev.map(l => l._id === id ? d.data : l));
    } catch (_) {}
    setReviewingId(null);
  };

  const alreadyReviewed = (log) => log.reviews?.some(r => r.adminId === myId);
  const isOwn = (log) => log.adminId === myId;

  const knownAdmins = [...new Map(logs.filter(l => l.adminId && l.adminName).map(l => [l.adminId, { id: l.adminId, name: l.adminName }])).values()];

  return (
    <div className="ops-section">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">✎ Daily Activity Log</h2>
      </div>

      {/* Submit form */}
      <div className="ops-log-form">
        <div className="ops-log-form-top">
          <select className="ops-input ops-input--cat" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {LOG_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="ops-input"
            value={form.summary}
            onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
            placeholder={`Summary — what did you do today? (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`}
            style={{ flex: 1 }}
          />
        </div>
        <textarea className="ops-textarea" rows={3} value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Details, specific actions, observations… (optional)" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="ops-btn ops-btn--primary" onClick={submit} disabled={submitting || !form.summary.trim()}>{submitting ? 'Submitting…' : 'Submit Log'}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="ops-log-filters">
        <div className="ops-filter-group">
          <label className="ops-label">From</label>
          <input className="ops-input ops-input--date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="ops-filter-group">
          <label className="ops-label">To</label>
          <input className="ops-input ops-input--date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {knownAdmins.length > 1 && (
          <div className="ops-filter-group">
            <label className="ops-label">Admin</label>
            <select className="ops-input" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}>
              <option value="">All Admins</option>
              {knownAdmins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {(dateFrom || dateTo || adminFilter) && (
          <button className="ops-btn ops-btn--ghost" style={{ alignSelf: 'flex-end' }} onClick={() => { setDateFrom(''); setDateTo(''); setAdminFilter(''); }}>Clear</button>
        )}
      </div>

      {loading ? <div className="ops-empty">Loading…</div> : logs.length === 0 ? (
        <div className="ops-empty">No entries found.</div>
      ) : (
        <div className="ops-log-list">
          {logs.map(log => {
            const own = isOwn(log);
            const reviewed = alreadyReviewed(log);
            return (
              <div key={log._id} className={`ops-log-card${own ? ' ops-log-card--own' : ''}`}>
                <div className="ops-log-head">
                  <div className="ops-log-author">
                    <div className="ops-log-avatar">{(log.adminName || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="ops-log-name">{log.adminName}{own && <span className="ops-me-badge">You</span>}</span>
                      <span className="ops-log-date">{fmtDate(log.createdAt)} at {fmtTime(log.createdAt)}</span>
                    </div>
                  </div>
                  <div className="ops-log-review-area">
                    {log.reviews?.length > 0 && (
                      <div className="ops-log-reviewers">
                        <span className="ops-reviewed-count">✓ {log.reviews.length} reviewed</span>
                        <div className="ops-reviewer-chips">
                          {log.reviews.map((r, i) => <span key={i} className="ops-reviewer-chip">{r.adminName}</span>)}
                        </div>
                      </div>
                    )}
                    {!own && (
                      <button
                        className={`ops-btn ops-btn--xs ${reviewed ? 'ops-btn--reviewed' : 'ops-btn--review'}`}
                        onClick={() => !reviewed && markReviewed(log._id)}
                        disabled={reviewed || reviewingId === log._id}
                      >{reviewingId === log._id ? '…' : reviewed ? '✓ Reviewed' : 'Mark Reviewed'}</button>
                    )}
                  </div>
                </div>
                <pre className="ops-log-tasks">{log.tasks}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminOps = () => {
  const { user } = useAuth();
  const { headers } = useToken();

  return (
    <div className="ops-page">
      <div className="ops-page-header">
        <h1 className="ops-page-title">Operations Centre</h1>
        <p className="ops-page-sub">Company direction, team structure, scripts and daily coordination — all in one place.</p>
      </div>

      <CompanySection headers={headers} />
      <TeamSection currentUser={user} headers={headers} />
      <TemplatesSection headers={headers} />
      <TasksSection currentUser={user} headers={headers} />
      <ActivityLogSection currentUser={user} headers={headers} />
    </div>
  );
};

export default AdminOps;
