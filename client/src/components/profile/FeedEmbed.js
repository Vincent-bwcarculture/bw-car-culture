import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../config/axios.js';
import { useAuth } from '../../context/AuthContext.js';
import './FeedEmbed.css';

// ── Small helpers ─────────────────────────────────────────────────────────────

const COLORS = ['#C9A94E','#1A6FA5','#E05C5C','#4CAF50','#9C27B0','#FF6F00'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const avatarUrl = (av) => {
  if (!av) return null;
  if (typeof av === 'object' && av.url) return av.url;
  if (typeof av === 'string' && av.startsWith('http')) return av;
  return null;
};
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Compact post card ─────────────────────────────────────────────────────────

function MiniPost({ post: init, user, onDelete }) {
  const [post, setPost]           = useState(init);
  const [expanded, setExpanded]   = useState(false);
  const [showCmt, setShowCmt]     = useState(false);
  const [comments, setComments]   = useState([]);
  const [cmtLoaded, setCmtLoaded] = useState(false);
  const [cmtText, setCmtText]     = useState('');
  const [posting, setPosting]     = useState(false);

  const av = avatarUrl(post.userAvatar);
  const isLong = post.content.length > 200;
  const displayed = isLong && !expanded ? post.content.slice(0, 200) + '…' : post.content;
  const isOwner = user && post.userId === user.id;

  const react = async (type) => {
    if (!user) return;
    try {
      const r = await axios.post(`/api/feed/${post._id}/react`, { type });
      setPost(p => ({ ...p, likes: r.data.likes, dislikes: r.data.dislikes, userReaction: r.data.userReaction }));
    } catch {}
  };

  const toggleComments = async () => {
    setShowCmt(v => !v);
    if (!cmtLoaded) {
      try {
        const r = await axios.get(`/api/feed/${post._id}/comments`);
        setComments(r.data.data || []);
        setCmtLoaded(true);
      } catch {}
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!cmtText.trim() || !user) return;
    setPosting(true);
    try {
      const r = await axios.post(`/api/feed/${post._id}/comments`, { content: cmtText });
      setComments(c => [...c, r.data.data]);
      setPost(p => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      setCmtText('');
    } catch {}
    setPosting(false);
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try { await axios.delete(`/api/feed/${post._id}`); onDelete(post._id); } catch {}
  };

  const liked = post.userReaction === 'like';
  const disliked = post.userReaction === 'dislike';

  return (
    <div className="fe-post">
      {/* Header */}
      <div className="fe-post-header">
        <div className="fe-avatar" style={av ? {} : { background: avatarColor(post.userName) }}>
          {av ? <img src={av} alt={post.userName} /> : initials(post.userName)}
        </div>
        <div className="fe-post-meta">
          <span className="fe-post-author">{post.userName}</span>
          <span className="fe-post-time">{timeAgo(post.createdAt)}{post.editedAt ? ' · edited' : ''}</span>
        </div>
        {isOwner && (
          <button className="fe-delete-btn" onClick={deletePost} title="Delete post">✕</button>
        )}
      </div>

      {/* Content */}
      <div className="fe-post-content">
        {displayed}
        {isLong && (
          <button className="fe-expand-text" onClick={() => setExpanded(v => !v)}>
            {expanded ? ' Less' : ' More'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="fe-post-actions">
        <button
          className={`fe-action-btn${liked ? ' fe-action-btn--active' : ''}`}
          onClick={() => react('like')}
        >
          👍 {(post.likes || []).length || ''}
        </button>
        <button
          className={`fe-action-btn${disliked ? ' fe-action-btn--active fe-action-btn--dislike' : ''}`}
          onClick={() => react('dislike')}
        >
          👎 {(post.dislikes || []).length || ''}
        </button>
        <button className="fe-action-btn" onClick={toggleComments}>
          💬 {post.commentCount || 0}
        </button>
      </div>

      {/* Comments (collapsed by default) */}
      {showCmt && (
        <div className="fe-comments">
          {comments.map(cm => (
            <div key={cm._id} className="fe-comment">
              <div className="fe-avatar fe-avatar-sm" style={{ background: avatarColor(cm.userName) }}>
                {initials(cm.userName)}
              </div>
              <div className="fe-comment-body">
                <span className="fe-comment-author">{cm.userName}</span>
                <span className="fe-comment-text">{cm.content}</span>
              </div>
            </div>
          ))}
          {!cmtLoaded && <div className="fe-loading-inline">Loading…</div>}
          {user && (
            <form className="fe-comment-form" onSubmit={submitComment}>
              <div className="fe-avatar fe-avatar-sm" style={{ background: avatarColor(user.name) }}>
                {initials(user.name)}
              </div>
              <input
                className="fe-comment-input"
                value={cmtText}
                onChange={e => setCmtText(e.target.value)}
                placeholder="Add a comment…"
              />
              <button type="submit" className="fe-comment-submit" disabled={posting || !cmtText.trim()}>
                {posting ? '…' : '→'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main embed ────────────────────────────────────────────────────────────────

export default function FeedEmbed() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [postText, setPostText]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(async (p = 1) => {
    try {
      const r = await axios.get(`/api/feed?page=${p}`);
      if (p === 1) setPosts(r.data.data || []);
      else setPosts(prev => [...prev, ...(r.data.data || [])]);
      setPages(r.data.pages || 1);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);

  const submitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setSubmitting(true);
    try {
      const r = await axios.post('/api/feed', { content: postText });
      setPosts(prev => [r.data.data, ...prev]);
      setPostText('');
    } catch {}
    setSubmitting(false);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    loadFeed(next);
  };

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  const myAv = user ? (avatarUrl(user.avatar) || avatarUrl(user.profilePicture)) : null;

  return (
    <div className="fe-embed">
      {/* Top bar */}
      <div className="fe-embed-topbar">
        <span className="fe-embed-title">Community Feed</span>
        <Link to="/feed" className="fe-expand-link" target="_blank" rel="noreferrer">
          Open full feed ↗
        </Link>
      </div>

      {/* Composer */}
      {isAuthenticated ? (
        <form className="fe-composer" onSubmit={submitPost}>
          <div className="fe-avatar" style={myAv ? {} : { background: avatarColor(user?.name) }}>
            {myAv ? <img src={myAv} alt={user?.name} /> : initials(user?.name)}
          </div>
          <div className="fe-composer-right">
            <textarea
              className="fe-composer-input"
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              rows={2}
              maxLength={2000}
            />
            <div className="fe-composer-footer">
              <span className="fe-char-count">{postText.length}/2000</span>
              <button
                type="submit"
                className="fe-post-btn"
                disabled={submitting || !postText.trim()}
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="fe-login-prompt">
          <Link to="/login">Log in</Link> to post and interact with the feed
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="fe-loading">Loading feed…</div>
      ) : posts.length === 0 ? (
        <div className="fe-empty">No posts yet — be the first to share something!</div>
      ) : (
        <div className="fe-post-list">
          {posts.map(p => (
            <MiniPost key={p._id} post={p} user={user} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && page < pages && (
        <button className="fe-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more posts'}
        </button>
      )}
    </div>
  );
}
