import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import axios from '../config/axios.js';
import './GroupPage.css';

const AVATAR_COLORS = ['#C9A94E','#1A6FA5','#E05C5C','#4CAF50','#9C27B0','#FF6F00'];
const avatarColor = (n = '') => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function GroupPage() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          axios.get(`/api/groups/${slug}`),
          axios.get(`/api/groups/${slug}/posts`),
        ]);
        setGroup(gRes.data.data);
        setPosts(pRes.data.data || []);
      } catch { navigate('/groups'); }
      setLoading(false);
    };
    fetchAll();
  }, [slug, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    axios.get(`/api/groups/${slug}/membership`).then(r => setIsMember(r.data.isMember)).catch(() => {});
  }, [isAuthenticated, slug]);

  const join = async () => {
    if (!isAuthenticated) return navigate('/login');
    setJoining(true);
    try {
      await axios.post(`/api/groups/${slug}/join`);
      setIsMember(true);
      setGroup(g => ({ ...g, memberCount: (g.memberCount || 0) + 1 }));
    } catch {}
    setJoining(false);
  };

  const leave = async () => {
    setJoining(true);
    try {
      await axios.post(`/api/groups/${slug}/leave`);
      setIsMember(false);
      setGroup(g => ({ ...g, memberCount: Math.max(0, (g.memberCount || 0) - 1) }));
    } catch {}
    setJoining(false);
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await axios.post(`/api/groups/${slug}/posts`, { content: postText });
      setPosts(prev => [r.data.data, ...prev]);
      setPostText('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to post');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="grp-loading">Loading…</div>;
  if (!group) return null;

  return (
    <div className="grp-page">
      <div className="grp-container">
        {/* Header */}
        <div className="grp-header">
          <button className="grp-back" onClick={() => navigate('/groups')}>← Groups</button>
          <div className="grp-header-inner">
            <span className="grp-icon">{group.icon || '◈'}</span>
            <div>
              <h1 className="grp-name">{group.name}</h1>
              <p className="grp-desc">{group.description}</p>
              <div className="grp-meta">
                <span>👥 {group.memberCount || 0} members</span>
                <span>💬 {group.postCount || 0} posts</span>
              </div>
            </div>
          </div>
          <div className="grp-join-row">
            {isMember
              ? <button className="grp-leave-btn" onClick={leave} disabled={joining}>{joining ? '…' : 'Leave group'}</button>
              : <button className="grp-join-btn" onClick={join} disabled={joining}>{joining ? 'Joining…' : 'Join Group'}</button>
            }
          </div>
        </div>

        {/* Composer */}
        {isMember && (
          <form className="grp-composer" onSubmit={submitPost}>
            <div className="grp-avatar" style={{ background: avatarColor(user?.name) }}>{initials(user?.name)}</div>
            <div className="grp-composer-right">
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder={`Post to ${group.name}…`}
                className="grp-input"
                rows={3}
                maxLength={2000}
              />
              <div className="grp-composer-footer">
                <span className="grp-char">{postText.length}/2000</span>
                <button type="submit" disabled={submitting || !postText.trim()} className="grp-btn-primary">
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
              {error && <div className="grp-error">{error}</div>}
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="grp-prompt">
            <a href="/login">Log in</a> to join and post in this group
          </div>
        )}

        {isAuthenticated && !isMember && (
          <div className="grp-prompt">Join this group to start posting</div>
        )}

        {/* Posts */}
        <div className="grp-posts">
          {posts.length === 0
            ? <div className="grp-empty">No posts yet. Be the first to start a discussion!</div>
            : posts.map(p => (
                <div className="grp-post" key={p._id}>
                  <div className="grp-avatar" style={{ background: avatarColor(p.userName) }}>{initials(p.userName)}</div>
                  <div className="grp-post-body">
                    <div className="grp-post-header">
                      <span className="grp-post-author">{p.userName}</span>
                      <span className="grp-post-time">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="grp-post-content">{p.content}</p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
