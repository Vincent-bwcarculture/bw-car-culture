// AdminOpsDashboardWidget.js — compact read-only strip for the dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminOpsDashboardWidget.css';

const API = process.env.REACT_APP_API_URL || '/api';

const AdminOpsDashboardWidget = () => {
  const [mission, setMission] = useState('');
  const [team, setTeam] = useState([]);
  const [taskCount, setTaskCount] = useState(null);
  const [logCount, setLogCount] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/ops/mission`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setMission(d.data?.mission || ''); })
      .catch(() => {});

    fetch(`${API}/admin/team`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTeam(d.data || []); })
      .catch(() => {});

    fetch(`${API}/admin/tasks?status=open`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTaskCount(d.data?.length ?? 0); })
      .catch(() => {});

    // Get today's logs
    const today = new Date().toISOString().split('T')[0];
    fetch(`${API}/admin/activity-log?from=${today}&to=${today}`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setLogCount(d.data?.length ?? 0); })
      .catch(() => {});
  }, []);

  const isOnline = (member) => {
    const p = member.opsProfile;
    if (!p?.schedule) return false;
    const { checkIn, checkOut, days } = p.schedule;
    if (!checkIn || !checkOut) return false;
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
    if (days?.length && !days.includes(dayName)) return false;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= inH * 60 + inM && nowMins <= outH * 60 + outM;
  };

  const onlineCount = team.filter(isOnline).length;

  return (
    <div className="ops-widget">
      <div className="ops-widget-header">
        <div className="ops-widget-title-row">
          <span className="ops-widget-icon">◆</span>
          <span className="ops-widget-title">Operations Centre</span>
        </div>
        <Link to="/admin/ops" className="ops-widget-open-btn">Open Full View →</Link>
      </div>

      <div className="ops-widget-body">
        {/* Mission snippet */}
        {mission && (
          <div className="ops-widget-mission">
            <span className="ops-widget-section-label">Mission</span>
            <p className="ops-widget-mission-text">{mission}</p>
          </div>
        )}

        {/* Team status */}
        {team.length > 0 && (
          <div className="ops-widget-team">
            <span className="ops-widget-section-label">
              Team
              {onlineCount > 0 && <span className="ops-widget-online-count"> — {onlineCount} active now</span>}
            </span>
            <div className="ops-widget-members">
              {team.map(m => {
                const online = isOnline(m);
                const pos = m.opsProfile?.position;
                const schedule = m.opsProfile?.schedule;
                return (
                  <div key={m._id} className="ops-widget-member" title={`${m.name}${pos ? ' · ' + pos : ''}${schedule ? ` · ${schedule.checkIn}–${schedule.checkOut}` : ''}`}>
                    <div className="ops-widget-avatar-wrap">
                      <div className="ops-widget-avatar">{(m.name || 'A').charAt(0).toUpperCase()}</div>
                      <span className={`ops-widget-dot${online ? ' online' : ''}`}></span>
                    </div>
                    <div className="ops-widget-member-info">
                      <span className="ops-widget-member-name">{m.name}</span>
                      {pos && <span className="ops-widget-member-pos">{pos}</span>}
                      {schedule && (
                        <span className="ops-widget-member-schedule">{schedule.checkIn} – {schedule.checkOut}</span>
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
    </div>
  );
};

export default AdminOpsDashboardWidget;
