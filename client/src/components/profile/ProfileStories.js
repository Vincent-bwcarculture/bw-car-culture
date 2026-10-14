import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../config/axios.js';
import { useAuth } from '../../context/AuthContext.js';
import { publicProfilePath, prioritizeProfiles } from '../../utils/networkProfiles.js';
import ProfilePhoto from './ProfilePhoto.js';
import './ProfileStories.css';

export default function ProfileStories() {
  const { user } = useAuth();
  const currentId = String(user?._id || user?.id || '');
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    axios.get('/api/users/network?limit=20', { signal: controller.signal })
      .then(({ data }) => {
        if (!data.success) throw new Error('Network unavailable');
        setMembers(prioritizeProfiles((data.data || []).filter(member =>
          String(member._id || member.id) !== currentId && member.profileVisibility !== 'private')));
        setStatus('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [currentId, attempt]);
  return (
    <section className="profile-stories" aria-label="Discover community profiles">
      <div className="profile-stories-heading">
        <h2>Meet the community</h2>
        <Link to="/profile?tab=network">View network</Link>
      </div>
      {status === 'loading' && <p role="status">Loading profiles…</p>}
      {status === 'error' && <p>Profiles are unavailable. <button onClick={() => setAttempt(n => n + 1)}>Try again</button></p>}
      {status === 'ready' && !members.length && <p>Community profiles will appear here.</p>}
      <div className="profile-stories-track" tabIndex={0} aria-label="Community profiles, scroll horizontally">
        {members.map((member, index) => (
          <Link className="profile-story" key={member._id || member.id}
            to={publicProfilePath(member)}>
            <ProfilePhoto member={member} className="profile-story-ring" loading={index < 6 ? 'eager' : 'lazy'} />
            <span className="profile-story-name">{member.name || 'Community member'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
