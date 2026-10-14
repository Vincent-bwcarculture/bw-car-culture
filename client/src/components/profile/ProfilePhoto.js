import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { profilePhotoSources } from '../../utils/networkProfiles.js';
import './ProfilePhoto.css';

export default function ProfilePhoto({ member, className = '', loading = 'eager' }) {
  const [failed, setFailed] = useState([]);
  const source = profilePhotoSources(member).find(url => !failed.includes(url));
  return <span className={`profile-photo ${className}`}>
    {source ? <img key={source} src={source} alt={`${member.name || 'Member'}'s profile photo`}
      loading={loading} decoding="async" onError={() => setFailed(previous => [...previous, source])} />
      : <UserRound aria-label="No profile photo" size={30} />}
  </span>;
}
