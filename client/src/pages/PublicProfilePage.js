import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarDays, Share2, UserPlus, UserCheck, BadgeCheck, Heart, MessageCircle } from 'lucide-react';
import axios from '../config/axios.js';
import { useAuth } from '../context/AuthContext.js';
import ProfilePhoto from '../components/profile/ProfilePhoto.js';
import { profileCoverSources, publicProfilePath } from '../utils/networkProfiles.js';
import './PublicProfilePage.css';

const memberDate = date => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en', { month: 'long', year: 'numeric' });
};
export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const viewerId = String(user?._id || user?.id || '');
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [failedCovers, setFailedCovers] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setMember(null); setNotice('');
    axios.get(`/api/users/${encodeURIComponent(userId)}/public`, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        if (!data.success) throw new Error('Profile unavailable');
        setMember(data.data); setFollowing(Boolean(data.data.isFollowedByCurrentUser));
      })
      .catch(err => {
        if (!controller.signal.aborted) setError((err.status || err.response?.status) === 404
          ? 'This profile is private or no longer available.' : 'Could not load this profile. Please try again.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId, viewerId, attempt]);

  const toggleFollow = async () => {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      const { data } = await axios.post(`/api/users/${member._id}/follow`);
      if (!data.success) throw new Error('Follow failed');
      const next = Boolean(data.following);
      setMember(previous => ({ ...previous, followerCount: Math.max(0, previous.followerCount + (next === following ? 0 : next ? 1 : -1)) }));
      setFollowing(next);
    } catch { setNotice('Could not update your follow. Please try again.'); }
    finally { setBusy(false); }
  };
  const share = async () => {
    const url = `${window.location.origin}${publicProfilePath(member)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${member.name} | BW Car Culture`, url });
      else { await navigator.clipboard.writeText(url); setNotice('Profile link copied.'); }
    } catch (err) { if (err.name !== 'AbortError') setNotice('Could not share the link. You can copy it from your address bar.'); }
  };
  if (loading) return <main className="public-profile-page"><p className="public-profile-state" role="status">Loading profile…</p></main>;
  if (error || !member) return <main className="public-profile-page"><div className="public-profile-state">
    <h1>Profile unavailable</h1><p>{error}</p>
    <button onClick={() => setAttempt(value => value + 1)}>Try again</button><Link to="/feed">Back to Feed</Link>
  </div></main>;
  const cover = profileCoverSources(member).find(url => !failedCovers.includes(url));
  const ownProfile = viewerId === String(member._id);
  return <main className="public-profile-page">
    <div className="public-profile-shell">
      <Link className="public-profile-back" to="/feed"><ArrowLeft size={16} /> Community Feed</Link>
      <section className="public-profile-hero" aria-label={`${member.name}'s profile`}>
        <div className="public-profile-cover">
          {cover && <img src={cover} alt="" decoding="async" fetchPriority="high" onError={() => setFailedCovers(previous => [...previous, cover])} />}
        </div>
        <div className="public-profile-identity">
          <ProfilePhoto member={member} className="public-profile-avatar" />
          <div className="public-profile-actions">
            {ownProfile ? <Link className="public-profile-primary" to="/profile?tab=settings">Edit profile</Link>
              : isAuthenticated ? <button className="public-profile-primary" onClick={toggleFollow} disabled={busy}>
                {following ? <UserCheck size={17} /> : <UserPlus size={17} />}{busy ? 'Updating…' : following ? 'Following' : 'Follow'}
              </button> : <Link className="public-profile-primary" to="/login" state={{ from: publicProfilePath(member) }}><UserPlus size={17} /> Follow</Link>}
            <button onClick={share} aria-label="Share profile"><Share2 size={17} /><span>Share</span></button>
          </div>
          <div className="public-profile-name"><h1>{member.name}</h1>{member.emailVerified && <BadgeCheck size={22} aria-label="Email verified" />}</div>
          <p className="public-profile-role">{!member.role || member.role === 'user' ? 'Community member' : member.role.replace(/_/g, ' ')}</p>
          <div className="public-profile-meta">
            {member.city && <span><MapPin size={15} />{member.city}</span>}
            {member.createdAt && <span><CalendarDays size={15} />Joined {memberDate(member.createdAt)}</span>}
          </div>
          <dl className="public-profile-stats">
            <div><dt>Followers</dt><dd>{member.followerCount}</dd></div>
            <div><dt>Following</dt><dd>{member.followingCount}</dd></div>
            <div><dt>Associates</dt><dd>{member.associateCount}</dd></div>
            <div><dt>Posts</dt><dd>{member.postCount}</dd></div>
          </dl>
          {notice && <p className="public-profile-notice" role="status">{notice}</p>}
        </div>
      </section>
      <div className="public-profile-columns">
        <aside className="public-profile-about"><h2>About</h2><p>{member.bio || 'This member hasn’t added a bio yet.'}</p></aside>
        <section className="public-profile-posts" aria-labelledby="public-posts-title">
          <div className="public-profile-posts-heading"><h2 id="public-posts-title">Recent posts</h2><Link to="/feed">View Feed</Link></div>
          {member.recentPosts?.length ? member.recentPosts.map(post => <article className="public-profile-post" key={post._id}>
            <div className="public-profile-post-author"><ProfilePhoto member={member} loading="lazy" /><div><strong>{member.name}</strong><time dateTime={post.createdAt}>{memberDate(post.createdAt)}</time></div></div>
            <p>{post.content}</p>
            <div className="public-profile-post-stats"><span><Heart size={15} />{post.likes || 0} likes</span><span><MessageCircle size={15} />{post.commentCount || 0} comments</span></div>
          </article>) : <div className="public-profile-empty"><MessageCircle size={28} /><h3>No posts yet</h3><p>When {member.name} shares with the community, their latest posts will appear here.</p></div>}
        </section>
      </div>
    </div>
  </main>;
}
