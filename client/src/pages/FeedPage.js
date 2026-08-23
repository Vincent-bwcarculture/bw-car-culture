import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import axios from '../config/axios.js';
import './FeedPage.css';

const AVATAR_COLORS = ['#C9A94E','#1A6FA5','#E05C5C','#4CAF50','#9C27B0','#FF6F00'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ── Competition carousel ─────────────────────────────────────
function CompetitionCarousel({ user }) {
  const [competitions, setCompetitions] = useState([]);
  const [voting, setVoting] = useState({});
  const [voted, setVoted] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    axios.get('/api/competitions').then(r => {
      const active = (r.data.data || []).filter(c => c.status === 'active');
      setCompetitions(active);
    }).catch(() => {});
  }, []);

  if (!competitions.length) return null;
  const comp = competitions[0];

  const handleVote = async (carId) => {
    if (!user) return alert('Please log in to vote');
    if (voted[carId]) return;
    setVoting(v => ({ ...v, [carId]: true }));
    try {
      const r = await axios.post(`/api/competitions/${comp._id}/cars/${carId}/vote`);
      if (r.data.success) {
        setVoted(v => ({ ...v, [carId]: true }));
        setCompetitions(prev => prev.map(c => c._id === comp._id ? {
          ...c,
          cars: c.cars.map(car => car.carId === carId ? r.data.car : car)
        } : c));
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Vote failed';
      if (msg.includes('Already voted')) setVoted(v => ({ ...v, [carId]: true }));
    }
    setVoting(v => ({ ...v, [carId]: false }));
  };

  const shareUrl = (carId) => `${window.location.origin}/feed?vote=${comp._id}/${carId}`;

  return (
    <div className="fp-competition">
      <div className="fp-comp-header">
        <div className="fp-comp-title-row">
          <span className="fp-comp-badge">🏆 Show Car Competition</span>
          <span className="fp-comp-name">{comp.title}</span>
        </div>
        {comp.sponsor && <div className="fp-comp-sponsor">Sponsored by <strong>{comp.sponsor}</strong>{comp.prize ? ` · Prize: ${comp.prize}` : ''}</div>}
      </div>
      <div className="fp-comp-scroll" ref={scrollRef}>
        {(comp.cars || []).sort((a, b) => (b.points||0) - (a.points||0)).map((car, i) => (
          <div className="fp-car-card" key={car.carId}>
            <div className="fp-car-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
            {car.vehicleImage
              ? <img src={car.vehicleImage} alt={car.vehicleName} className="fp-car-img" />
              : <div className="fp-car-img fp-car-img-placeholder">🚗</div>
            }
            <div className="fp-car-info">
              <div className="fp-car-name">{car.vehicleName}</div>
              {car.vehicleDetails && <div className="fp-car-details">{car.vehicleDetails}</div>}
              <div className="fp-car-owner">Owner: {car.ownerName}</div>
              <div className="fp-car-points">{car.points || 0} pts · {(car.votes||[]).length} votes</div>
            </div>
            <div className="fp-car-actions">
              <button
                className={`fp-car-vote${voted[car.carId] ? ' voted' : ''}`}
                onClick={() => handleVote(car.carId)}
                disabled={voting[car.carId] || voted[car.carId]}
              >
                {voted[car.carId] ? '✓ Voted' : voting[car.carId] ? '…' : '👍 Vote (+2 pts)'}
              </button>
              <button className="fp-car-share" onClick={() => { navigator.clipboard.writeText(shareUrl(car.carId)); alert('Share link copied!'); }}>
                🔗 Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single post ──────────────────────────────────────────────
function FeedPost({ post: initialPost, user }) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const r = await axios.get(`/api/feed/${post._id}/comments`);
      setComments(r.data.data || []);
      setCommentsLoaded(true);
    } catch {}
  };

  const toggleComments = () => {
    setShowComments(s => !s);
    if (!commentsLoaded) loadComments();
  };

  const react = async (type) => {
    if (!user) return;
    try {
      const r = await axios.post(`/api/feed/${post._id}/react`, { type });
      setPost(p => ({ ...p, likes: r.data.likes, dislikes: r.data.dislikes, userReaction: r.data.userReaction }));
    } catch {}
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setSubmittingComment(true);
    try {
      const r = await axios.post(`/api/feed/${post._id}/comments`, { content: commentText });
      setComments(c => [...c, r.data.data]);
      setPost(p => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      setCommentText('');
    } catch {}
    setSubmittingComment(false);
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim() || !user) return;
    try {
      const r = await axios.post(`/api/feed/comments/${commentId}/replies`, { content: replyText });
      setComments(c => c.map(cm => cm._id === commentId ? { ...cm, replies: [...(cm.replies||[]), r.data.data] } : cm));
      setReplyText('');
      setReplyTo(null);
    } catch {}
  };

  return (
    <div className="fp-post">
      <div className="fp-post-header">
        <div className="fp-avatar" style={{ background: avatarColor(post.userName) }}>
          {initials(post.userName)}
        </div>
        <div className="fp-post-meta">
          <span className="fp-post-author">{post.userName}</span>
          <span className="fp-post-time">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <p className="fp-post-content">{post.content}</p>
      <div className="fp-post-actions">
        <button className={`fp-react-btn${post.userReaction === 'up' ? ' active-up' : ''}`} onClick={() => react('up')} disabled={!user} title={user ? '' : 'Log in to react'}>
          👍 <span>{post.likes || 0}</span>
        </button>
        <button className={`fp-react-btn${post.userReaction === 'down' ? ' active-down' : ''}`} onClick={() => react('down')} disabled={!user}>
          👎 <span>{post.dislikes || 0}</span>
        </button>
        <button className="fp-comment-toggle" onClick={toggleComments}>
          💬 {post.commentCount || 0} {post.commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {showComments && (
        <div className="fp-comments">
          {comments.map(cm => (
            <div className="fp-comment" key={cm._id}>
              <div className="fp-avatar fp-avatar-sm" style={{ background: avatarColor(cm.userName) }}>{initials(cm.userName)}</div>
              <div className="fp-comment-body">
                <div className="fp-comment-author">{cm.userName} <span className="fp-post-time">{timeAgo(cm.createdAt)}</span></div>
                <div className="fp-comment-text">{cm.content}</div>
                {(cm.replies || []).map(r => (
                  <div className="fp-reply" key={r._id}>
                    <div className="fp-avatar fp-avatar-xs" style={{ background: avatarColor(r.userName) }}>{initials(r.userName)}</div>
                    <div className="fp-comment-body">
                      <div className="fp-comment-author">{r.userName}</div>
                      <div className="fp-comment-text">{r.content}</div>
                    </div>
                  </div>
                ))}
                {user && (
                  replyTo === cm._id
                    ? <div className="fp-reply-form">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" className="fp-input" autoFocus />
                        <button onClick={() => submitReply(cm._id)} className="fp-btn-sm">Reply</button>
                        <button onClick={() => setReplyTo(null)} className="fp-btn-sm fp-btn-ghost">Cancel</button>
                      </div>
                    : <button className="fp-reply-toggle" onClick={() => { setReplyTo(cm._id); setReplyText(''); }}>Reply</button>
                )}
              </div>
            </div>
          ))}
          {user && (
            <form className="fp-comment-form" onSubmit={submitComment}>
              <div className="fp-avatar fp-avatar-sm" style={{ background: avatarColor(user.name) }}>{initials(user.name)}</div>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…" className="fp-input" />
              <button type="submit" disabled={submittingComment || !commentText.trim()} className="fp-btn-sm">
                {submittingComment ? '…' : 'Post'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main feed page ───────────────────────────────────────────
export default function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadFeed = useCallback(async (p = 1) => {
    try {
      const r = await axios.get(`/api/feed?page=${p}`);
      if (p === 1) setPosts(r.data.data || []);
      else setPosts(prev => [...prev, ...(r.data.data || [])]);
      setPages(r.data.pages || 1);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);

  const submitPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await axios.post('/api/feed', { content: postText });
      setPosts(prev => [r.data.data, ...prev]);
      setPostText('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to post');
    }
    setSubmitting(false);
  };

  const loadMore = () => { const next = page + 1; setPage(next); loadFeed(next); };

  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-header">
          <h1 className="fp-title">Feed</h1>
          <p className="fp-subtitle">Trending posts, community discussions, and show car competitions</p>
        </div>

        <CompetitionCarousel user={user} />

        {isAuthenticated && (
          <form className="fp-composer" onSubmit={submitPost}>
            <div className="fp-avatar" style={{ background: avatarColor(user?.name) }}>{initials(user?.name)}</div>
            <div className="fp-composer-right">
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="fp-composer-input"
                rows={3}
                maxLength={2000}
              />
              <div className="fp-composer-footer">
                <span className="fp-char-count">{postText.length}/2000</span>
                <button type="submit" disabled={submitting || !postText.trim()} className="fp-btn-primary">
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
              {error && <div className="fp-error">{error}</div>}
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="fp-login-prompt">
            <span>Join the conversation —</span>
            <a href="/login">Log in</a> or <a href="/register">Register</a> to post
          </div>
        )}

        {loading
          ? <div className="fp-loading">Loading feed…</div>
          : posts.length === 0
            ? <div className="fp-empty">No posts yet. Be the first to share something!</div>
            : posts.map(p => <FeedPost key={p._id} post={p} user={user} />)
        }

        {page < pages && (
          <button className="fp-load-more" onClick={loadMore}>Load more</button>
        )}
      </div>
    </div>
  );
}
