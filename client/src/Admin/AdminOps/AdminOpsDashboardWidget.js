// AdminOpsDashboardWidget.js — dashboard strip: mission/vision, team with live check-in status, stats
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminOpsDashboardWidget.css';

const API = process.env.REACT_APP_API_URL || '/api';

const AdminOpsDashboardWidget = () => {
  const [mv, setMv] = useState({ mission: '', vision: '' });
  const [team, setTeam] = useState([]);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [taskCount, setTaskCount] = useState(null);
  const [logCount, setLogCount] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/ops/mission`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setMv({ mission: d.data?.mission || '', vision: d.data?.vision || '' }); })
      .catch(() => {});

    fetch(`${API}/admin/team`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTeam(d.data || []); })
      .catch(() => {});

    fetch(`${API}/admin/checkins/today`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTodayCheckins(d.data || []); })
      .catch(() => {});

    fetch(`${API}/admin/tasks?status=open`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTaskCount(d.data?.length ?? 0); })
      .catch(() => {});

    const today = new Date().toISOString().split('T')[0];
    fetch(`${API}/admin/activity-log?from=${today}&to=${today}`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setLogCount(d.data?.length ?? 0); })
      .catch(() => {});
  }, []);

  const getCheckin = (memberId) => todayCheckins.find(c => c.adminId === String(memberId));

  const checkedInCount = team.filter(m => !!getCheckin(m._id)).length;
  const activeCount = team.filter(m => { const ci = getCheckin(m._id); return ci && !ci.checkOut && ci.status !== 'paused'; }).length;
  const pausedCount = team.filter(m => { const ci = getCheckin(m._id); return ci && ci.status === 'paused'; }).length;

  const fmtDur = (mins) => {
    if (!mins && mins !== 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const hasMv = mv.mission || mv.vision;

  return (
    <div className="ops-widget">
      <div className="ops-widget-header">
        <div className="ops-widget-title-row">
          <span className="ops-widget-icon">◆</span>
          <span className="ops-widget-title">Operations Centre</span>
          {team.length > 0 && (
            <span className="ops-widget-attendance">
              {activeCount > 0 && <span className="ops-widget-active">{activeCount} active</span>}
              {pausedCount > 0 && <span className="ops-widget-paused-dot">{pausedCount} on break</span>}
              {checkedInCount > activeCount + pausedCount && <span className="ops-widget-done-dot">{checkedInCount - activeCount - pausedCount} done today</span>}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="ops-widget-collapse-btn" onClick={() => setCollapsed(p => !p)}>{collapsed ? '▼' : '▲'}</button>
          <Link to="/admin/ops" className="ops-widget-open-btn">Full View →</Link>
        </div>
      </div>

      {!collapsed && (
        <div className="ops-widget-body">
          {/* Mission & Vision */}
          {hasMv && (
            <div className="ops-widget-mv">
              {mv.mission && (
                <div className="ops-widget-mv-block">
                  <span className="ops-widget-section-label">Mission</span>
                  <p className="ops-widget-mv-text">{mv.mission}</p>
                </div>
              )}
              {mv.vision && (
                <div className="ops-widget-mv-block">
                  <span className="ops-widget-section-label">Vision</span>
                  <p className="ops-widget-mv-text">{mv.vision}</p>
                </div>
              )}
            </div>
          )}

          {/* Team with today's check-in status */}
          {team.length > 0 && (
            <div className="ops-widget-team">
              <span className="ops-widget-section-label">Team Today</span>
              <div className="ops-widget-members">
                {team.map(m => {
                  const ci = getCheckin(m._id);
                  const checkedIn = !!ci;
                  const checkedOut = !!ci?.checkOut;
                  const isPaused = ci?.status === 'paused';
                  const dotClass = checkedOut ? ' done' : isPaused ? ' paused' : checkedIn ? ' online' : '';
                  const dotTitle = checkedOut ? `Checked out ${ci.checkOut}` : isPaused ? `Paused · ${ci.pauses?.slice(-1)[0]?.reason || ci.pauses?.slice(-1)[0]?.start || ''}` : checkedIn ? `Checked in ${ci.checkIn}` : 'Not in today';
                  const pos = m.opsProfile?.position;
                  return (
                    <div key={m._id} className="ops-widget-member">
                      <div className="ops-widget-avatar-wrap">
                        <div className="ops-widget-avatar">{(m.name || 'A').charAt(0).toUpperCase()}</div>
                        <span className={`ops-widget-dot${dotClass}`} title={dotTitle}></span>
                      </div>
                      <div className="ops-widget-member-info">
                        <span className="ops-widget-member-name">{m.name}</span>
                        {pos && <span className="ops-widget-member-pos">{pos}</span>}
                        {ci ? (
                          <span className="ops-widget-ci-times">
                            {ci.checkIn}{ci.checkOut ? ` → ${ci.checkOut}` : ' → ?'}
                            {ci.duration != null && ` · ${fmtDur(ci.duration)}`}
                          </span>
                        ) : (
                          <span className="ops-widget-ci-absent">Not in today</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="ops-widget-stats">
            {taskCount !== null && (
              <Link to="/admin/ops" className="ops-widget-stat">
                <span className="ops-widget-stat-num">{taskCount}</span>
                <span className="ops-widget-stat-label">Open Tasks</span>
              </Link>
            )}
            {logCount !== null && (
              <Link to="/admin/ops" className="ops-widget-stat">
                <span className="ops-widget-stat-num">{logCount}</span>
                <span className="ops-widget-stat-label">Logs Today</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOpsDashboardWidget;
