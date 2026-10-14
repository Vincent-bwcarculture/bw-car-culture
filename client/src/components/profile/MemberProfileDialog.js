import { useEffect, useRef } from 'react';
import { profileAvatar, profileCover } from '../../utils/networkProfiles.js';
import './MemberProfileDialog.css';

export default function MemberProfileDialog({ member, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (member) dialog.current?.showModal();
    else dialog.current?.close();
  }, [member]);
  return <dialog ref={dialog} className="member-profile-dialog" onClose={onClose}
    onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="member-profile-title">
    {member && <article>
      <button className="member-profile-close" onClick={() => dialog.current.close()} aria-label="Close profile">×</button>
      <div className="member-profile-cover">
        {profileCover(member) && <img src={profileCover(member)} alt="" onError={e => { e.currentTarget.hidden = true; }} />}
      </div>
      <div className="member-profile-body">
        {profileAvatar(member) && <img className="member-profile-avatar" src={profileAvatar(member)} alt="" onError={e => { e.currentTarget.hidden = true; }} />}
        <h2 id="member-profile-title">{member.name || 'Community member'}</h2>
        <p>{(member.role || 'Community member').replace(/_/g, ' ')}</p>
        {member.city && <p>{member.city}</p>}
        <p>{member.bio || 'This member hasn’t added a bio yet.'}</p>
        <p>{member.followerCount || 0} followers · {member.followingCount || 0} following</p>
      </div>
    </article>}
  </dialog>;
}
