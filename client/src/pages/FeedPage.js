import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import './FeedPage.css';

// ── Follow button ─────────────────────────────────────────────
function FollowButton({ targetUserId, currentUserId }) {
  const [following, setFollowing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    axios.get(`/api/users/${targetUserId}/follow-status`)
      .then(r => setFollowing(r.data.following))
      .catch(() => {});
  }, [targetUserId, currentUserId]);

  if (!currentUserId || currentUserId === targetUserId || following === null) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await axios.delete(`/api/users/${targetUserId}/follow`);
        setFollowing(false);
      } else {
        await axios.post(`/api/users/${targetUserId}/follow`);
        setFollowing(true);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <button className={`fp-follow-btn${following ? ' fp-follow-btn--following' : ''}`} onClick={toggle} disabled={loading}>
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}

const AVATAR_COLORS = ['#C9A94E','#1A6FA5','#E05C5C','#4CAF50','#9C27B0','#FF6F00'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const getAvatarUrl = (avatarData) => {
  if (!avatarData) return null;
  if (typeof avatarData === 'object' && avatarData.url) return avatarData.url;
  if (typeof avatarData === 'string' && avatarData.startsWith('http')) return avatarData;
  return null;
};
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ── Sponsor banner ───────────────────────────────────────────
function SponsorBanner({ comp }) {
  const hasSponsor = comp && comp.sponsor;
  const whatsappLink = comp?.sponsorWhatsapp
    ? `https://wa.me/${comp.sponsorWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I would like to become a sponsor for the BW Car Culture Show Car Competition.')}`
    : null;

  if (hasSponsor) {
    return (
      <div className="fp-sponsor-banner fp-sponsor-banner--active">
        {comp.sponsorBanner && (
          <img src={comp.sponsorBanner} alt={comp.sponsor} className="fp-sponsor-bg" />
        )}
        <div className="fp-sponsor-content">
          {comp.sponsorLogo && <img src={comp.sponsorLogo} alt={comp.sponsor} className="fp-sponsor-logo" />}
          <div className="fp-sponsor-text">
            <div className="fp-sponsor-label">Official Competition Sponsor</div>
            <div className="fp-sponsor-name">{comp.sponsor}</div>
            {comp.sponsorDescription && <div className="fp-sponsor-desc">{comp.sponsorDescription}</div>}
          </div>
          {comp.prize && <div className="fp-sponsor-prize">🏆 Prize: <strong>{comp.prize}</strong></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="fp-sponsor-banner fp-sponsor-banner--empty">
      <div className="fp-sponsor-empty-left">
        <span className="fp-sponsor-empty-icon">📢</span>
        <div>
          <div className="fp-sponsor-empty-title">No sponsor recorded for this competition</div>
          <div className="fp-sponsor-empty-sub">Be the first to support our show car community</div>
        </div>
      </div>
      {whatsappLink ? (
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="fp-sponsor-cta">
          💬 Become a Sponsor
        </a>
      ) : (
        <span className="fp-sponsor-empty-badge">Sponsorship open</span>
      )}
    </div>
  );
}

// ── Image comment section (for submission detail) ─────────────
function ImageComments({ submissionId, imageType, imageIdx, user }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    axios.get(`/api/competitions/submissions/${submissionId}/images/${imageType}/${imageIdx}/comments`)
      .then(r => { setComments(r.data.data || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [submissionId, imageType, imageIdx]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);
    try {
      const r = await axios.post(`/api/competitions/submissions/${submissionId}/images/${imageType}/${imageIdx}/comments`, { content: text });
      setComments(c => [...c, r.data.data]);
      setText('');
    } catch {}
    setSubmitting(false);
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim() || !user) return;
    try {
      const r = await axios.post(`/api/competitions/submissions/image-comments/${commentId}/replies`, { content: replyText });
      setComments(c => c.map(cm => cm._id === commentId ? { ...cm, replies: [...(cm.replies||[]), r.data.data] } : cm));
      setReplyText(''); setReplyTo(null);
    } catch {}
  };

  if (!loaded) return <div className="fp-loading" style={{ padding: '1rem', fontSize: '0.8rem' }}>Loading comments…</div>;

  return (
    <div className="fp-comments" style={{ marginTop: '0.5rem' }}>
      {comments.map(cm => (
        <div className="fp-comment" key={cm._id}>
          <div className="fp-avatar fp-avatar-sm" style={{ background: avatarColor(cm.userName) }}>
            {cm.userAvatar ? <img src={cm.userAvatar.url || cm.userAvatar} alt={cm.userName} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} /> : initials(cm.userName)}
          </div>
          <div className="fp-comment-body">
            <div className="fp-comment-header-row">
              <span className="fp-comment-author">{cm.userName} <span className="fp-post-time">{timeAgo(cm.createdAt)}</span></span>
            </div>
            <div className="fp-comment-text">{cm.content}</div>
            {(cm.replies||[]).map(r => (
              <div className="fp-reply" key={r._id}>
                <div className="fp-avatar fp-avatar-xs" style={{ background: avatarColor(r.userName) }}>{initials(r.userName)}</div>
                <div className="fp-comment-body">
                  <span className="fp-comment-author">{r.userName}</span>
                  <div className="fp-comment-text">{r.content}</div>
                </div>
              </div>
            ))}
            {user && (replyTo === cm._id
              ? <div className="fp-reply-form">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Reply…" className="fp-input" autoFocus />
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
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Comment on this image…" className="fp-input" />
          <button type="submit" disabled={submitting || !text.trim()} className="fp-btn-sm">{submitting ? '…' : 'Post'}</button>
        </form>
      )}
    </div>
  );
}

// ── Submission detail modal ────────────────────────────────────
function SubmissionDetailModal({ carId, car, user, onClose }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState({ type: 'main', idx: 0 });
  const [reacting, setReacting] = useState({});
  const [reactions, setReactions] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    axios.get(`/api/competitions/submissions/${carId}`)
      .then(r => setSub(r.data.data))
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  }, [carId]);

  const allImages = sub ? [
    ...(sub.mainImages || []).map((img, i) => ({ ...img, type: 'main', idx: i })),
    ...(sub.modImages || []).map((img, i) => ({ ...img, type: 'mod', idx: i })),
  ] : [];

  const curImg = allImages.find(img => img.type === activeImg.type && img.idx === activeImg.idx);
  const curKey = `${activeImg.type}-${activeImg.idx}`;

  const nav = (dir) => {
    const pos = allImages.findIndex(img => img.type === activeImg.type && img.idx === activeImg.idx);
    const next = (pos + dir + allImages.length) % allImages.length;
    setActiveImg({ type: allImages[next].type, idx: allImages[next].idx });
  };

  const getReaction = (type, idx) => reactions[`${type}-${idx}`] || { likes: 0, dislikes: 0, userReaction: null };

  const reactToImage = async (type, idx, reaction) => {
    if (!user) return alert('Log in to react');
    const key = `${type}-${idx}`;
    setReacting(r => ({ ...r, [key]: true }));
    try {
      const r = await axios.post(`/api/competitions/submissions/${carId}/images/${type}/${idx}/react`, { type: reaction });
      const imgData = type === 'main' ? sub.mainImages[idx] : sub.modImages[idx];
      setReactions(prev => ({ ...prev, [key]: { likes: r.data.likes, dislikes: r.data.dislikes, userReaction: r.data.userReaction } }));
    } catch {}
    setReacting(r => ({ ...r, [key]: false }));
  };

  const imgReact = (img) => {
    const saved = reactions[`${img.type}-${img.idx}`];
    return {
      likes: saved?.likes ?? img.likes ?? 0,
      dislikes: saved?.dislikes ?? img.dislikes ?? 0,
      userReaction: saved?.userReaction ?? null,
    };
  };

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal fp-modal--full" onClick={e => e.stopPropagation()}>
        <div className="fp-modal-header">
          <button className="fp-modal-back" onClick={onClose}>← Close</button>
          <h2 className="fp-modal-title">{car.vehicleName}</h2>
          <div className="fp-modal-sub">Owner: {car.ownerName} · {car.points || 0} pts · {(car.votes||[]).length} votes</div>
        </div>
        <div className="fp-modal-body">
          {loading && <div className="fp-loading">Loading details…</div>}
          {!loading && !sub && (
            <div className="fp-empty" style={{ padding: '1rem' }}>
              {car.vehicleImage && <img src={car.vehicleImage} alt={car.vehicleName} style={{ width:'100%',maxHeight:'220px',objectFit:'cover',borderRadius:'10px',marginBottom:'1rem' }} />}
              <p style={{ color: 'var(--text-muted)' }}>{car.vehicleDetails}</p>
            </div>
          )}
          {!loading && sub && allImages.length > 0 && (
            <>
              <div className="fp-detail-img-viewer">
                {curImg?.url && <img src={curImg.url} alt="Vehicle" />}
                {allImages.length > 1 && <>
                  <button className="fp-detail-img-nav fp-detail-img-nav--left" onClick={() => nav(-1)}>‹</button>
                  <button className="fp-detail-img-nav fp-detail-img-nav--right" onClick={() => nav(1)}>›</button>
                </>}
                {curImg?.type === 'main'
                  ? <div className="fp-detail-img-section-badge">Overview</div>
                  : <div className="fp-detail-img-section-badge fp-detail-img-section-badge--mod">Modification {curImg.idx + 1}</div>
                }
              </div>
              <div className="fp-detail-img-dots">
                {allImages.map((img, i) => (
                  <button key={i} className={`fp-detail-img-dot${img.type === activeImg.type && img.idx === activeImg.idx ? ' active' : ''}`} onClick={() => setActiveImg({ type: img.type, idx: img.idx })} />
                ))}
              </div>
              {curImg?.description && <p className="fp-detail-img-desc">{curImg.description}</p>}
              <div className="fp-detail-img-reactions">
                <button className={`fp-react-btn${imgReact(curImg).userReaction === 'up' ? ' active-up' : ''}`} onClick={() => reactToImage(curImg.type, curImg.idx, 'up')} disabled={reacting[curKey] || !user}>
                  👍 {imgReact(curImg).likes}
                </button>
                <button className={`fp-react-btn${imgReact(curImg).userReaction === 'down' ? ' active-down' : ''}`} onClick={() => reactToImage(curImg.type, curImg.idx, 'down')} disabled={reacting[curKey] || !user}>
                  👎 {imgReact(curImg).dislikes}
                </button>
                <button className="fp-comment-toggle" onClick={() => setShowComments(s => ({ ...s, [curKey]: !s[curKey] }))}>
                  💬 Comments
                </button>
              </div>
              {showComments[curKey] && (
                <ImageComments submissionId={carId} imageType={curImg.type} imageIdx={curImg.idx} user={user} />
              )}

              {sub.modImages?.length > 0 && (
                <>
                  <div className="fp-detail-section-title">Modifications ({sub.modImages.length})</div>
                  <div className="fp-mods-grid">
                    {sub.modImages.map((img, i) => {
                      const modKey = `mod-${i}`;
                      const r = imgReact({ ...img, type: 'mod', idx: i });
                      return (
                        <div key={i} className={`fp-mod-card${activeImg.type === 'mod' && activeImg.idx === i ? ' active' : ''}`} onClick={() => setActiveImg({ type: 'mod', idx: i })}>
                          {img.url && <img src={img.url} alt={`Mod ${i+1}`} />}
                          {img.description && <div className="fp-mod-card-desc">{img.description}</div>}
                          <div className="fp-mod-card-reactions">
                            <button className={`fp-react-btn${r.userReaction === 'up' ? ' active-up' : ''}`} onClick={e => { e.stopPropagation(); reactToImage('mod', i, 'up'); }} disabled={reacting[modKey] || !user} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>👍 {r.likes}</button>
                            <button className={`fp-react-btn${r.userReaction === 'down' ? ' active-down' : ''}`} onClick={e => { e.stopPropagation(); reactToImage('mod', i, 'down'); }} disabled={reacting[modKey] || !user} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>👎 {r.dislikes}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Showcase modal ────────────────────────────────────────────
function ShowcaseModal({ comp, user, onClose }) {
  const [form, setForm] = useState({
    vehicleName: '', vehicleDetails: '', ownerName: user?.name || '',
    mainImages: [{ url: '', description: '' }, { url: '', description: '' }, { url: '', description: '' }, { url: '', description: '' }],
    modImages: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateMain = (i, k, v) => setForm(f => { const a = [...f.mainImages]; a[i] = { ...a[i], [k]: v }; return { ...f, mainImages: a }; });
  const updateMod = (i, k, v) => setForm(f => { const a = [...f.modImages]; a[i] = { ...a[i], [k]: v }; return { ...f, modImages: a }; });
  const addMod = () => setForm(f => ({ ...f, modImages: [...f.modImages, { url: '', description: '' }] }));
  const removeMod = (i) => setForm(f => ({ ...f, modImages: f.modImages.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.vehicleName.trim()) return setError('Vehicle name required');
    if (!form.ownerName.trim()) return setError('Owner name required');
    if (!form.mainImages.some(img => img.url.trim())) return setError('At least one vehicle image required');
    setSubmitting(true); setError('');
    try {
      await axios.post(`/api/competitions/${comp._id}/submit`, {
        ...form,
        mainImages: form.mainImages.filter(img => img.url.trim()),
        modImages: form.modImages.filter(img => img.url.trim()),
      });
      setSubmitted(true);
    } catch (err) { setError(err?.response?.data?.error || 'Submission failed'); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal" onClick={e => e.stopPropagation()}>
        <div className="fp-modal-body fp-modal-success">
          <div style={{ fontSize: '3rem' }}>✨</div>
          <h2 style={{ color: 'var(--text-primary,#fff)', margin: 0 }}>Submitted!</h2>
          <p style={{ color: 'var(--text-muted,#888)', textAlign: 'center' }}>Your vehicle has been submitted for review. Once approved, it will appear in the showcase.</p>
          <button className="fp-btn-primary" onClick={onClose}>Back to Feed</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fp-modal-overlay">
      <div className="fp-modal fp-modal--full">
        <div className="fp-modal-header">
          <button className="fp-modal-back" onClick={onClose}>← Cancel</button>
          <h2 className="fp-modal-title">✨ Showcase Your Ride</h2>
          <div className="fp-modal-sub">{comp.title}</div>
        </div>
        <div className="fp-modal-body">
          {error && <div className="fp-error">{error}</div>}

          <div className="fp-form-section">
            <div className="fp-form-section-title">Vehicle Details</div>
            <input className="fp-composer-input fp-form-input" placeholder="Vehicle name *" value={form.vehicleName} onChange={e => setField('vehicleName', e.target.value)} />
            <input className="fp-composer-input fp-form-input" placeholder="Year, make & model (e.g. 2019 Toyota Supra)" value={form.vehicleDetails} onChange={e => setField('vehicleDetails', e.target.value)} />
            <input className="fp-composer-input fp-form-input" placeholder="Owner name *" value={form.ownerName} onChange={e => setField('ownerName', e.target.value)} />
          </div>

          <div className="fp-form-section">
            <div className="fp-form-section-title">Main Vehicle Photos <span className="fp-form-hint">up to 4 — each with a description</span></div>
            {form.mainImages.map((img, i) => (
              <div className="fp-img-slot" key={i}>
                <div className="fp-img-slot-label">Photo {i + 1}</div>
                <input className="fp-composer-input fp-form-input" placeholder="Paste image URL" value={img.url} onChange={e => updateMain(i, 'url', e.target.value)} />
                {img.url && <img src={img.url} alt="" className="fp-img-preview" onError={e => { e.target.style.display = 'none'; }} />}
                <input className="fp-composer-input fp-form-input" placeholder="Describe this view…" value={img.description} onChange={e => updateMain(i, 'description', e.target.value)} />
              </div>
            ))}
          </div>

          <div className="fp-form-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="fp-form-section-title">Modifications <span className="fp-form-hint">optional</span></div>
              <button className="fp-btn-sm" onClick={addMod}>+ Add</button>
            </div>
            {form.modImages.length === 0 && <div className="fp-empty-hint">No modifications added yet.</div>}
            {form.modImages.map((img, i) => (
              <div className="fp-img-slot" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="fp-img-slot-label">Mod {i + 1}</div>
                  <button className="fp-action-btn fp-action-btn--danger" onClick={() => removeMod(i)}>✕ Remove</button>
                </div>
                <input className="fp-composer-input fp-form-input" placeholder="Paste image URL" value={img.url} onChange={e => updateMod(i, 'url', e.target.value)} />
                {img.url && <img src={img.url} alt="" className="fp-img-preview" onError={e => { e.target.style.display = 'none'; }} />}
                <input className="fp-composer-input fp-form-input" placeholder="Describe this modification…" value={img.description} onChange={e => updateMod(i, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="fp-modal-footer">
          <button className="fp-btn-sm fp-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="fp-btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Competition carousel ─────────────────────────────────────
function CompetitionCarousel({ user }) {
  const [competitions, setCompetitions] = useState([]);
  const [voting, setVoting] = useState({});
  const [voted, setVoted] = useState({});
  const [showShowcase, setShowShowcase] = useState(false);
  const [detailCar, setDetailCar] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    axios.get('/api/competitions').then(r => {
      const active = (r.data.data || []).filter(c => c.status === 'active');
      setCompetitions(active);
    }).catch(() => {});
  }, []);

  if (!competitions.length) return null;
  const comp = competitions[0];

  const handleVote = async (carId, e) => {
    e.stopPropagation();
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
    <>
      <SponsorBanner comp={comp} />
      <div className="fp-competition">
        <div className="fp-comp-header">
          <div className="fp-comp-title-row">
            <span className="fp-comp-badge">✨ Car Showcase</span>
            <span className="fp-comp-name">{comp.title}</span>
          </div>
          <button className="fp-compete-btn" onClick={() => { if (!user) return alert('Log in to showcase your vehicle'); setShowShowcase(true); }}>
            ✨ Showcase
          </button>
        </div>
        <div className="fp-comp-scroll" ref={scrollRef}>
          {(comp.cars || []).sort((a, b) => (b.points||0) - (a.points||0)).map((car, i) => (
            <div className="fp-car-card" key={car.carId} onClick={() => setDetailCar(car)} style={{ cursor: 'pointer' }}>
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
                  onClick={(e) => handleVote(car.carId, e)}
                  disabled={voting[car.carId] || voted[car.carId]}
                >
                  {voted[car.carId] ? '✓ Voted' : voting[car.carId] ? '…' : '👍 Vote (+2 pts)'}
                </button>
                <button className="fp-car-share" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(shareUrl(car.carId)); alert('Share link copied!'); }}>
                  🔗 Share
                </button>
                <button className="fp-car-details-btn" onClick={e => { e.stopPropagation(); setDetailCar(car); }}>
                  View Details
                </button>
              </div>
            </div>
          ))}
          {!(comp.cars||[]).length && (
            <div className="fp-empty" style={{ padding: '1.5rem', width: '100%' }}>No showcases yet — be the first to showcase your ride!</div>
          )}
        </div>
      </div>
      {showShowcase && <ShowcaseModal comp={comp} user={user} onClose={() => setShowShowcase(false)} />}
      {detailCar && <SubmissionDetailModal carId={detailCar.carId} car={detailCar} user={user} onClose={() => setDetailCar(null)} />}
    </>
  );
}

// ── Single post ──────────────────────────────────────────────
function FeedPost({ post: initialPost, user, onDelete }) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const isOwner = user && post.userId === user.id;

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

  const startEdit = () => { setEditText(post.content); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      await axios.put(`/api/feed/${post._id}`, { content: editText });
      setPost(p => ({ ...p, content: editText.trim(), editedAt: new Date() }));
      setEditing(false);
    } catch {}
    setSavingEdit(false);
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`/api/feed/${post._id}`);
      onDelete(post._id);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete post. Please try again.');
    }
  };

  const report = async (targetType, targetId) => {
    const reason = window.prompt('Reason for reporting (optional):');
    if (reason === null) return;
    try {
      await axios.post('/api/feed/reports', { targetType, targetId, reason });
      alert('Report submitted. Thank you.');
    } catch {}
  };

  const postAvatarUrl = getAvatarUrl(post.userAvatar);
  const myAvatarUrl = user ? (getAvatarUrl(user.avatar) || getAvatarUrl(user.profilePicture)) : null;

  return (
    <div className="fp-post">
      <div className="fp-post-header">
        <div className="fp-avatar" style={postAvatarUrl ? {} : { background: avatarColor(post.userName) }}>
          {postAvatarUrl ? <img src={postAvatarUrl} alt={post.userName} /> : initials(post.userName)}
        </div>
        <div className="fp-post-meta">
          <div className="fp-post-author-row">
            <span className="fp-post-author">{post.userName}</span>
            {post.userPrimaryCar && (
              <span className="fp-car-badge" title={post.userPrimaryCar}>🚗 {post.userPrimaryCar}</span>
            )}
            <FollowButton targetUserId={post.userId} currentUserId={user?.id} />
          </div>
          <span className="fp-post-time">{timeAgo(post.createdAt)}{post.editedAt ? ' · edited' : ''}</span>
        </div>
        {isOwner && (
          <div className="fp-post-owner-actions">
            <button className="fp-action-btn" onClick={startEdit} title="Edit">✏️</button>
            <button className="fp-action-btn fp-action-btn--danger" onClick={deletePost} title="Delete">🗑️</button>
          </div>
        )}
        {user && !isOwner && (
          <button className="fp-action-btn fp-action-btn--report" onClick={() => report('post', post._id)} title="Report">⚑</button>
        )}
      </div>

      {editing ? (
        <div className="fp-edit-area">
          <textarea className="fp-composer-input" value={editText} onChange={e => setEditText(e.target.value)} rows={4} maxLength={2000} autoFocus />
          <div className="fp-edit-footer">
            <span className="fp-char-count">{editText.length}/2000</span>
            <button className="fp-btn-sm" onClick={cancelEdit}>Cancel</button>
            <button className="fp-btn-primary" onClick={saveEdit} disabled={savingEdit || !editText.trim()}>{savingEdit ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <p className="fp-post-content">{post.content}</p>
      )}

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
          {comments.map(cm => {
            const cmAv = getAvatarUrl(cm.userAvatar);
            return (
            <div className="fp-comment" key={cm._id}>
              <div className="fp-avatar fp-avatar-sm" style={cmAv ? {} : { background: avatarColor(cm.userName) }}>
                {cmAv ? <img src={cmAv} alt={cm.userName} /> : initials(cm.userName)}
              </div>
              <div className="fp-comment-body">
                <div className="fp-comment-header-row">
                  <span className="fp-comment-author">
                    {cm.userName}
                    <FollowButton targetUserId={cm.userId} currentUserId={user?.id} />
                    <span className="fp-post-time">{timeAgo(cm.createdAt)}</span>
                  </span>
                  {user && cm.userId !== user.id && (
                    <button className="fp-action-btn fp-action-btn--report fp-action-btn--xs" onClick={() => report('comment', cm._id)} title="Report">⚑</button>
                  )}
                </div>
                <div className="fp-comment-text">{cm.content}</div>
                {(cm.replies || []).map(r => {
                  const rAv = getAvatarUrl(r.userAvatar);
                  return (
                  <div className="fp-reply" key={r._id}>
                    <div className="fp-avatar fp-avatar-xs" style={rAv ? {} : { background: avatarColor(r.userName) }}>
                      {rAv ? <img src={rAv} alt={r.userName} /> : initials(r.userName)}
                    </div>
                    <div className="fp-comment-body">
                      <div className="fp-comment-header-row">
                        <span className="fp-comment-author">
                          {r.userName}
                          <FollowButton targetUserId={r.userId} currentUserId={user?.id} />
                        </span>
                        {user && r.userId !== user.id && (
                          <button className="fp-action-btn fp-action-btn--report fp-action-btn--xs" onClick={() => report('reply', r._id)} title="Report">⚑</button>
                        )}
                      </div>
                      <div className="fp-comment-text">{r.content}</div>
                    </div>
                  </div>
                  );
                })}
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
            );
          })}
          {user && (
            <form className="fp-comment-form" onSubmit={submitComment}>
              <div className="fp-avatar fp-avatar-sm" style={myAvatarUrl ? {} : { background: avatarColor(user.name) }}>
                {myAvatarUrl ? <img src={myAvatarUrl} alt={user.name} /> : initials(user.name)}
              </div>
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
  const navigate = useNavigate();
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
  const handleDeletePost = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-header">
          <h1 className="fp-title">Feed</h1>
          <p className="fp-subtitle">Trending posts, community discussions, and show car competitions</p>
        </div>

        <CompetitionCarousel user={user} />

        {isAuthenticated && (() => {
          const composerAv = user ? (getAvatarUrl(user.avatar) || getAvatarUrl(user.profilePicture)) : null;
          return (
          <form className="fp-composer" onSubmit={submitPost}>
            <div className="fp-avatar" style={composerAv ? {} : { background: avatarColor(user?.name) }}>
              {composerAv ? <img src={composerAv} alt={user?.name} /> : initials(user?.name)}
            </div>
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
                <button
                  type="button"
                  className="fp-btn-sell"
                  onClick={() => {
                    if (window.confirm('You\'re about to leave the feed to list your car for sale. Continue?')) {
                      navigate('/profile?tab=sell-car');
                    }
                  }}
                >
                  🚗 Sell My Car
                </button>
                <button type="submit" disabled={submitting || !postText.trim()} className="fp-btn-primary">
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
              {error && <div className="fp-error">{error}</div>}
            </div>
          </form>
          );
        })()}

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
            : posts.map(p => <FeedPost key={p._id} post={p} user={user} onDelete={handleDeletePost} />)
        }

        {page < pages && (
          <button className="fp-load-more" onClick={loadMore}>Load more</button>
        )}
      </div>
    </div>
  );
}
