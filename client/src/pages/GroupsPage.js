import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import axios from '../config/axios.js';
import './GroupsPage.css';

export default function GroupsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});
  const [memberships, setMemberships] = useState({});

  useEffect(() => {
    axios.get('/api/groups').then(r => {
      setGroups(r.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !groups.length) return;
    groups.forEach(g => {
      axios.get(`/api/groups/${g.slug}/membership`).then(r => {
        setMemberships(m => ({ ...m, [g.slug]: r.data.isMember }));
      }).catch(() => {});
    });
  }, [isAuthenticated, groups]);

  const join = async (slug) => {
    if (!isAuthenticated) return navigate('/login');
    setJoining(j => ({ ...j, [slug]: true }));
    try {
      await axios.post(`/api/groups/${slug}/join`);
      setMemberships(m => ({ ...m, [slug]: true }));
      setGroups(gs => gs.map(g => g.slug === slug ? { ...g, memberCount: (g.memberCount || 0) + 1 } : g));
    } catch {}
    setJoining(j => ({ ...j, [slug]: false }));
  };

  const TYPE_ICON = { dealerships: '🏢', general: '💬', news: '📰', tech: '🔧' };

  return (
    <div className="gp-page">
      <div className="gp-container">
        <div className="gp-header">
          <h1 className="gp-title">Groups</h1>
          <p className="gp-subtitle">Connect with communities across the BW Car Culture platform</p>
        </div>

        {loading
          ? <div className="gp-loading">Loading groups…</div>
          : groups.length === 0
            ? <div className="gp-empty">No groups yet.</div>
            : <div className="gp-grid">
                {groups.map(g => (
                  <div className="gp-card" key={g._id}>
                    <div className="gp-card-icon">{g.icon || TYPE_ICON[g.type] || '◈'}</div>
                    <div className="gp-card-body">
                      <div className="gp-card-name">{g.name}</div>
                      <div className="gp-card-desc">{g.description}</div>
                      <div className="gp-card-meta">
                        <span>👥 {g.memberCount || 0} members</span>
                        <span>💬 {g.postCount || 0} posts</span>
                      </div>
                    </div>
                    <div className="gp-card-actions">
                      <button className="gp-view-btn" onClick={() => navigate(`/groups/${g.slug}`)}>
                        View Group →
                      </button>
                      {!memberships[g.slug] && (
                        <button className="gp-join-btn" onClick={() => join(g.slug)} disabled={joining[g.slug]}>
                          {joining[g.slug] ? 'Joining…' : 'Join'}
                        </button>
                      )}
                      {memberships[g.slug] && <span className="gp-member-badge">✓ Member</span>}
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  );
}
