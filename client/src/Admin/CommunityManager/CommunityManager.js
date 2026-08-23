import { useState, useEffect } from 'react';
import axios from '../../config/axios.js';
import './CommunityManager.css';

// ── Groups tab ────────────────────────────────────────────────
function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '◈', type: 'general' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [members, setMembers] = useState(null);
  const [membersGroupId, setMembersGroupId] = useState(null);

  const load = async () => {
    try {
      const r = await axios.get('/api/admin/groups');
      setGroups(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', description: '', icon: '◈', type: 'general' }); setEditId(null); setShowForm(true); };
  const openEdit = (g) => { setForm({ name: g.name, description: g.description, icon: g.icon, type: g.type }); setEditId(g._id); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) await axios.put(`/api/admin/groups/${editId}`, form);
      else await axios.post('/api/admin/groups', form);
      setShowForm(false);
      load();
    } catch (err) { alert(err?.response?.data?.error || 'Save failed'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this group and all its posts?')) return;
    await axios.delete(`/api/admin/groups/${id}`);
    load();
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const r = await axios.post('/api/admin/groups/seed');
      alert(r.data.message || 'Seeded!');
      load();
    } catch (err) { alert(err?.response?.data?.error || 'Seed failed'); }
    setSeeding(false);
  };

  const viewMembers = async (g) => {
    setMembersGroupId(g._id);
    const r = await axios.get(`/api/admin/groups/${g._id}/members`);
    setMembers(r.data.data || []);
  };

  const removeMember = async (groupId, userId) => {
    await axios.delete(`/api/admin/groups/${groupId}/members/${userId}`);
    setMembers(m => m.filter(mb => mb.userId !== userId));
  };

  return (
    <div className="cm-tab">
      <div className="cm-tab-actions">
        <button className="cm-btn-gold" onClick={openNew}>+ New Group</button>
        <button className="cm-btn-blue" onClick={seed} disabled={seeding}>
          {seeding ? 'Seeding…' : '⬡ Seed Dealership Network'}
        </button>
      </div>

      {showForm && (
        <form className="cm-form" onSubmit={save}>
          <h3 className="cm-form-title">{editId ? 'Edit Group' : 'Create Group'}</h3>
          <div className="cm-field-row">
            <div className="cm-field">
              <label>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Group name" />
            </div>
            <div className="cm-field cm-field-sm">
              <label>Icon</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🏢" />
            </div>
          </div>
          <div className="cm-field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What is this group about?" />
          </div>
          <div className="cm-field">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="general">General</option>
              <option value="dealerships">Dealerships</option>
              <option value="tech">Tech / Builds</option>
              <option value="news">News & Events</option>
            </select>
          </div>
          <div className="cm-form-footer">
            <button type="submit" className="cm-btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="cm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {members !== null && (
        <div className="cm-members-panel">
          <div className="cm-members-header">
            <h3>Members</h3>
            <button className="cm-btn-ghost" onClick={() => setMembers(null)}>✕ Close</button>
          </div>
          {members.length === 0
            ? <p className="cm-empty">No members yet.</p>
            : <div className="cm-members-list">
                {members.map(m => (
                  <div className="cm-member-row" key={m.userId}>
                    <div className="cm-member-name">{m.userName}</div>
                    <div className="cm-member-meta">{m.role} · Joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                    <button className="cm-btn-danger-sm" onClick={() => removeMember(membersGroupId, m.userId)}>Remove</button>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {loading
        ? <div className="cm-loading">Loading…</div>
        : groups.length === 0
          ? <div className="cm-empty">No groups yet. Create one or seed the Dealership Network.</div>
          : <div className="cm-table">
              <div className="cm-table-head">
                <span>Group</span>
                <span>Members</span>
                <span>Posts</span>
                <span>Actions</span>
              </div>
              {groups.map(g => (
                <div className="cm-table-row" key={g._id}>
                  <div className="cm-row-name">
                    <span className="cm-row-icon">{g.icon}</span>
                    <div>
                      <div className="cm-row-title">{g.name}</div>
                      <div className="cm-row-slug">/groups/{g.slug}</div>
                    </div>
                  </div>
                  <span>{g.memberCount || 0}</span>
                  <span>{g.postCount || 0}</span>
                  <div className="cm-row-actions">
                    <button className="cm-btn-sm" onClick={() => viewMembers(g)}>Members</button>
                    <button className="cm-btn-sm" onClick={() => openEdit(g)}>Edit</button>
                    <button className="cm-btn-danger-sm" onClick={() => remove(g._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  );
}

// ── Competitions tab ─────────────────────────────────────────
function CompetitionsTab() {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompForm, setShowCompForm] = useState(false);
  const [compForm, setCompForm] = useState({ title: '', description: '', sponsor: '', sponsorLogo: '', sponsorBanner: '', sponsorDescription: '', sponsorWhatsapp: '', prize: '', endDate: '', status: 'draft' });
  const [editCompId, setEditCompId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeComp, setActiveComp] = useState(null);
  const [carForm, setCarForm] = useState({ vehicleImage: '', vehicleName: '', vehicleDetails: '', ownerName: '' });
  const [addingCar, setAddingCar] = useState(false);

  const load = async () => {
    try { const r = await axios.get('/api/admin/competitions'); setComps(r.data.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewComp = () => { setCompForm({ title: '', description: '', sponsor: '', sponsorLogo: '', prize: '', endDate: '', status: 'draft' }); setEditCompId(null); setShowCompForm(true); };
  const openEditComp = (c) => { setCompForm({ title: c.title, description: c.description || '', sponsor: c.sponsor || '', sponsorLogo: c.sponsorLogo || '', sponsorBanner: c.sponsorBanner || '', sponsorDescription: c.sponsorDescription || '', sponsorWhatsapp: c.sponsorWhatsapp || '', prize: c.prize || '', endDate: c.endDate ? c.endDate.slice(0, 10) : '', status: c.status }); setEditCompId(c._id); setShowCompForm(true); };

  const saveComp = async (e) => {
    e.preventDefault();
    if (!compForm.title.trim()) return;
    setSaving(true);
    try {
      if (editCompId) await axios.put(`/api/admin/competitions/${editCompId}`, compForm);
      else await axios.post('/api/admin/competitions', compForm);
      setShowCompForm(false);
      load();
    } catch (err) { alert(err?.response?.data?.error || 'Save failed'); }
    setSaving(false);
  };

  const removeComp = async (id) => {
    if (!window.confirm('Delete this competition?')) return;
    await axios.delete(`/api/admin/competitions/${id}`);
    load();
    if (activeComp?._id === id) setActiveComp(null);
  };

  const addCar = async (e) => {
    e.preventDefault();
    if (!carForm.vehicleName.trim()) return;
    setAddingCar(true);
    try {
      const r = await axios.post(`/api/admin/competitions/${activeComp._id}/cars`, carForm);
      setActiveComp(c => ({ ...c, cars: [...(c.cars || []), r.data.data] }));
      setComps(prev => prev.map(c => c._id === activeComp._id ? { ...c, cars: [...(c.cars || []), r.data.data] } : c));
      setCarForm({ vehicleImage: '', vehicleName: '', vehicleDetails: '', ownerName: '' });
    } catch (err) { alert(err?.response?.data?.error || 'Failed to add car'); }
    setAddingCar(false);
  };

  const removeCar = async (carId) => {
    await axios.delete(`/api/admin/competitions/${activeComp._id}/cars/${carId}`);
    setActiveComp(c => ({ ...c, cars: (c.cars || []).filter(car => car.carId !== carId) }));
    setComps(prev => prev.map(c => c._id === activeComp._id ? { ...c, cars: (c.cars || []).filter(car => car.carId !== carId) } : c));
  };

  const STATUS_COLORS = { active: '#4CAF50', draft: '#888', ended: '#C9A94E' };

  return (
    <div className="cm-tab">
      <div className="cm-tab-actions">
        <button className="cm-btn-gold" onClick={openNewComp}>+ New Competition</button>
      </div>

      {showCompForm && (
        <form className="cm-form" onSubmit={saveComp}>
          <h3 className="cm-form-title">{editCompId ? 'Edit Competition' : 'Create Competition'}</h3>
          <div className="cm-field-row">
            <div className="cm-field">
              <label>Title *</label>
              <input value={compForm.title} onChange={e => setCompForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. March Show Car Competition" />
            </div>
            <div className="cm-field cm-field-sm">
              <label>Status</label>
              <select value={compForm.status} onChange={e => setCompForm(f => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
          <div className="cm-field">
            <label>Description</label>
            <textarea value={compForm.description} onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="cm-field-row">
            <div className="cm-field">
              <label>Sponsor Name</label>
              <input value={compForm.sponsor} onChange={e => setCompForm(f => ({ ...f, sponsor: e.target.value }))} placeholder="XYZ Motors" />
            </div>
            <div className="cm-field">
              <label>Prize Description</label>
              <input value={compForm.prize} onChange={e => setCompForm(f => ({ ...f, prize: e.target.value }))} placeholder="R10,000 in upgrades" />
            </div>
          </div>
          <div className="cm-field">
            <label>End Date</label>
            <input type="date" value={compForm.endDate} onChange={e => setCompForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>

          <div className="cm-form-section-label">Sponsor Details (shown as banner in the Feed)</div>
          <div className="cm-field-row">
            <div className="cm-field">
              <label>Sponsor Name</label>
              <input value={compForm.sponsor} onChange={e => setCompForm(f => ({ ...f, sponsor: e.target.value }))} placeholder="e.g. XYZ Motors" />
            </div>
            <div className="cm-field">
              <label>Sponsor WhatsApp (for "Become a Sponsor" btn)</label>
              <input value={compForm.sponsorWhatsapp} onChange={e => setCompForm(f => ({ ...f, sponsorWhatsapp: e.target.value }))} placeholder="+267 7X XXX XXX" />
            </div>
          </div>
          <div className="cm-field-row">
            <div className="cm-field">
              <label>Sponsor Logo URL</label>
              <input value={compForm.sponsorLogo} onChange={e => setCompForm(f => ({ ...f, sponsorLogo: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="cm-field">
              <label>Sponsor Banner Image URL</label>
              <input value={compForm.sponsorBanner} onChange={e => setCompForm(f => ({ ...f, sponsorBanner: e.target.value }))} placeholder="https://… (background image)" />
            </div>
          </div>
          <div className="cm-field">
            <label>Sponsor Description / Services</label>
            <textarea value={compForm.sponsorDescription} onChange={e => setCompForm(f => ({ ...f, sponsorDescription: e.target.value }))} rows={2} placeholder="What does the sponsor offer? e.g. Premium car audio, tinting, custom wraps…" />
          </div>

          <div className="cm-form-footer">
            <button type="submit" className="cm-btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="cm-btn-ghost" onClick={() => setShowCompForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Competition list */}
      {loading
        ? <div className="cm-loading">Loading…</div>
        : comps.length === 0
          ? <div className="cm-empty">No competitions yet.</div>
          : comps.map(c => (
              <div className="cm-comp-card" key={c._id}>
                <div className="cm-comp-header">
                  <div>
                    <span className="cm-comp-status" style={{ color: STATUS_COLORS[c.status] || '#888' }}>● {c.status}</span>
                    <span className="cm-comp-title">{c.title}</span>
                    {c.sponsor && <span className="cm-comp-sponsor">· {c.sponsor}</span>}
                  </div>
                  <div className="cm-row-actions">
                    <button className="cm-btn-sm" onClick={() => setActiveComp(activeComp?._id === c._id ? null : c)}>
                      {activeComp?._id === c._id ? 'Hide Cars' : `Cars (${(c.cars||[]).length})`}
                    </button>
                    <button className="cm-btn-sm" onClick={() => openEditComp(c)}>Edit</button>
                    <button className="cm-btn-danger-sm" onClick={() => removeComp(c._id)}>Delete</button>
                  </div>
                </div>

                {activeComp?._id === c._id && (
                  <div className="cm-cars-panel">
                    {/* Add car form */}
                    <form className="cm-car-form" onSubmit={addCar}>
                      <h4>Add Show Car</h4>
                      <div className="cm-field-row">
                        <div className="cm-field">
                          <label>Vehicle Name *</label>
                          <input value={carForm.vehicleName} onChange={e => setCarForm(f => ({ ...f, vehicleName: e.target.value }))} placeholder="2023 BMW M4" />
                        </div>
                        <div className="cm-field">
                          <label>Owner Name</label>
                          <input value={carForm.ownerName} onChange={e => setCarForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="Lerato M." />
                        </div>
                      </div>
                      <div className="cm-field">
                        <label>Vehicle Image URL</label>
                        <input value={carForm.vehicleImage} onChange={e => setCarForm(f => ({ ...f, vehicleImage: e.target.value }))} placeholder="https://…" />
                      </div>
                      <div className="cm-field">
                        <label>Details / Mods</label>
                        <input value={carForm.vehicleDetails} onChange={e => setCarForm(f => ({ ...f, vehicleDetails: e.target.value }))} placeholder="Competition grade, stage 2 tune…" />
                      </div>
                      <button type="submit" className="cm-btn-blue" disabled={addingCar}>{addingCar ? 'Adding…' : 'Add Car'}</button>
                    </form>

                    {/* Car list */}
                    {(activeComp.cars || []).length === 0
                      ? <p className="cm-empty">No cars yet.</p>
                      : <div className="cm-cars-list">
                          {(activeComp.cars || []).sort((a, b) => (b.points||0) - (a.points||0)).map((car, i) => (
                            <div className="cm-car-row" key={car.carId}>
                              <span className="cm-car-rank">#{i+1}</span>
                              {car.vehicleImage && <img src={car.vehicleImage} alt={car.vehicleName} className="cm-car-thumb" />}
                              <div className="cm-car-info">
                                <div className="cm-car-name">{car.vehicleName}</div>
                                <div className="cm-car-sub">{car.ownerName} · {car.points || 0} pts · {(car.votes||[]).length} votes</div>
                              </div>
                              <button className="cm-btn-danger-sm" onClick={() => removeCar(car.carId)}>Remove</button>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}
              </div>
            ))
      }
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────
const REPORT_STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'];
const STATUS_COLORS = { pending: '#ff9800', reviewed: '#4aa8e8', actioned: '#E05C5C', dismissed: '#888' };

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState({});

  const load = async (s) => {
    setLoading(true);
    try {
      const r = await axios.get(`/api/admin/feed/reports?status=${s || filter}`);
      setReports(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line

  const updateStatus = async (id, status) => {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await axios.patch(`/api/admin/feed/reports/${id}`, { status });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } catch (err) { alert(err?.response?.data?.error || 'Update failed'); }
    setUpdating(u => ({ ...u, [id]: false }));
  };

  return (
    <div className="cm-tab">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {REPORT_STATUSES.map(s => (
          <button key={s} className={`cm-btn-ghost${filter === s ? ' active' : ''}`} style={filter === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <div className="cm-loading">Loading…</div> : reports.length === 0 ? <div className="cm-empty">No {filter} reports</div> : (
        <div className="cm-table">
          <div className="cm-table-head" style={{ gridTemplateColumns: '80px 80px 1fr 1fr 180px' }}>
            <span>Type</span><span>Status</span><span>Target ID</span><span>Reason / Reporter</span><span>Actions</span>
          </div>
          {reports.map(r => (
            <div className="cm-table-row" key={r._id} style={{ gridTemplateColumns: '80px 80px 1fr 1fr 180px' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{r.targetType}</span>
              <span style={{ color: STATUS_COLORS[r.status] || '#888', fontSize: '0.78rem', fontWeight: 600 }}>{r.status}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.73rem', wordBreak: 'break-all' }}>{r.targetId}</span>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #bbb)' }}>{r.reason || <em>No reason given</em>}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted, #666)', marginTop: '0.1rem' }}>by {r.reporterName} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="cm-row-actions">
                {r.status === 'pending' && <>
                  <button className="cm-btn-sm" disabled={updating[r._id]} onClick={() => updateStatus(r._id, 'reviewed')}>Review</button>
                  <button className="cm-btn-danger-sm" disabled={updating[r._id]} onClick={() => updateStatus(r._id, 'actioned')}>Action</button>
                  <button className="cm-btn-ghost" style={{ fontSize: '0.73rem', padding: '0.25rem 0.5rem' }} disabled={updating[r._id]} onClick={() => updateStatus(r._id, 'dismissed')}>Dismiss</button>
                </>}
                {r.status !== 'pending' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #666)' }}>Reviewed {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Showcase submissions review tab ───────────────────────────
const SUB_STATUSES = ['pending', 'approved', 'rejected'];
const SUB_STATUS_COLORS = { pending: '#ff9800', approved: '#4CAF50', rejected: '#E05C5C' };

function ShowcaseSubmissionsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [rejectNote, setRejectNote] = useState({});

  const load = async (s) => {
    setLoading(true);
    try {
      const r = await axios.get(`/api/admin/competitions/submissions?status=${s || filter}`);
      setSubs(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]); // eslint-disable-line

  const updateSub = async (id, status) => {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await axios.patch(`/api/admin/competitions/submissions/${id}`, { status, rejectionReason: rejectNote[id] || '' });
      setSubs(prev => prev.map(s => s._id === id ? { ...s, status } : s));
      if (expanded === id) setExpanded(null);
    } catch (err) { alert(err?.response?.data?.error || 'Update failed'); }
    setUpdating(u => ({ ...u, [id]: false }));
  };

  return (
    <div className="cm-tab">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {SUB_STATUSES.map(s => (
          <button key={s} className={`cm-btn-ghost${filter === s ? ' active' : ''}`}
            style={filter === s ? { borderColor: SUB_STATUS_COLORS[s], color: SUB_STATUS_COLORS[s] } : {}}
            onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <div className="cm-loading">Loading…</div> : subs.length === 0 ? <div className="cm-empty">No {filter} submissions</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subs.map(sub => (
            <div key={sub._id} className="cm-table-row" style={{ display: 'block', padding: '1rem', background: 'var(--card-bg, #1a1a1a)', borderRadius: '10px', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {(sub.mainImages||[])[0]?.url && (
                  <img src={sub.mainImages[0].url} alt={sub.vehicleName} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #fff)', fontSize: '0.95rem' }}>{sub.vehicleName}</div>
                  {sub.vehicleDetails && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', marginTop: '0.1rem' }}>{sub.vehicleDetails}</div>}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #666)', marginTop: '0.2rem' }}>
                    Owner: {sub.ownerName} · Submitted by: {sub.userName} · {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ color: SUB_STATUS_COLORS[sub.status], fontSize: '0.75rem', fontWeight: 700 }}>{sub.status.toUpperCase()}</span>
                    <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.75rem' }}>{(sub.mainImages||[]).length} photos · {(sub.modImages||[]).length} mods</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button className="cm-btn-sm" onClick={() => setExpanded(e => e === sub._id ? null : sub._id)}>
                    {expanded === sub._id ? 'Collapse' : 'View'}
                  </button>
                  {sub.status === 'pending' && <>
                    <button className="cm-btn-sm" style={{ background: 'rgba(76,175,80,0.15)', borderColor: 'rgba(76,175,80,0.3)', color: '#4CAF50' }}
                      disabled={updating[sub._id]} onClick={() => updateSub(sub._id, 'approved')}>
                      Approve
                    </button>
                    <button className="cm-btn-danger-sm" disabled={updating[sub._id]} onClick={() => updateSub(sub._id, 'rejected')}>
                      Reject
                    </button>
                  </>}
                </div>
              </div>

              {expanded === sub._id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))', paddingTop: '0.75rem' }}>
                  {(sub.mainImages||[]).length > 0 && (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #aaa)', marginBottom: '0.4rem' }}>OVERVIEW PHOTOS</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.mainImages.map((img, i) => (
                          <div key={i} style={{ width: 110 }}>
                            <img src={img.url} alt="" style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 6 }} />
                            {img.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888)', marginTop: '0.2rem' }}>{img.description}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {(sub.modImages||[]).length > 0 && (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #aaa)', marginTop: '0.75rem', marginBottom: '0.4rem' }}>MODIFICATIONS</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.modImages.map((img, i) => (
                          <div key={i} style={{ width: 110 }}>
                            <img src={img.url} alt="" style={{ width: '100%', height: 75, objectFit: 'cover', borderRadius: 6 }} />
                            {img.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888)', marginTop: '0.2rem' }}>{img.description}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {sub.status === 'pending' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        placeholder="Rejection reason (optional)"
                        value={rejectNote[sub._id] || ''}
                        onChange={e => setRejectNote(n => ({ ...n, [sub._id]: e.target.value }))}
                        style={{ background: 'var(--input-bg, #111)', border: '1px solid var(--input-border, rgba(255,255,255,0.1))', borderRadius: 6, padding: '0.35rem 0.6rem', color: 'var(--text-primary, #fff)', fontSize: '0.82rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="cm-btn-sm" style={{ background: 'rgba(76,175,80,0.15)', borderColor: 'rgba(76,175,80,0.3)', color: '#4CAF50' }}
                          disabled={updating[sub._id]} onClick={() => updateSub(sub._id, 'approved')}>
                          ✓ Approve
                        </button>
                        <button className="cm-btn-danger-sm" disabled={updating[sub._id]} onClick={() => updateSub(sub._id, 'rejected')}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {sub.rejectionReason && <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#E05C5C' }}>Rejected: {sub.rejectionReason}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CommunityManager() {
  const [tab, setTab] = useState('groups');

  return (
    <div className="cm-page">
      <div className="cm-header">
        <h1>Community</h1>
        <p>Manage groups, showcases, submissions, and the social feed</p>
      </div>

      <div className="cm-tabs">
        <button className={`cm-tab-btn${tab === 'groups' ? ' active' : ''}`} onClick={() => setTab('groups')}>◈ Groups</button>
        <button className={`cm-tab-btn${tab === 'competitions' ? ' active' : ''}`} onClick={() => setTab('competitions')}>✨ Showcases</button>
        <button className={`cm-tab-btn${tab === 'submissions' ? ' active' : ''}`} onClick={() => setTab('submissions')}>📋 Submissions</button>
        <button className={`cm-tab-btn${tab === 'reports' ? ' active' : ''}`} onClick={() => setTab('reports')}>⚑ Reports</button>
      </div>

      {tab === 'groups' && <GroupsTab />}
      {tab === 'competitions' && <CompetitionsTab />}
      {tab === 'submissions' && <ShowcaseSubmissionsTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}
