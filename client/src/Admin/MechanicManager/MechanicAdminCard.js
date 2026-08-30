// src/Admin/MechanicManager/MechanicAdminCard.js
import React from 'react';
import './MechanicAdminCard.css';

const STATUS_LABELS = {
  approved: 'Approved',
  pending:  'Pending',
  rejected: 'Rejected',
  inactive: 'Inactive',
};

const MechanicAdminCard = ({ mechanic, onEdit, onDelete, onApprove, onReject }) => {
  const {
    workshopName, mechanicName, workshopType, city, locationsOfOperation,
    phone, email, status, mechanicSpecializations, brandSpecializations,
    mobileService, profileImage, yearsExperience, approvedAt, createdAt,
  } = mechanic;

  const imgUrl = profileImage && typeof profileImage === 'string' ? profileImage
    : profileImage?.url || null;

  const initials = (workshopName || mechanicName || 'M')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const location = [city, locationsOfOperation].filter(Boolean).join(' · ') || '—';
  const specs    = (mechanicSpecializations || []).slice(0, 3);
  const brands   = (brandSpecializations   || []).includes('all_brands')
    ? ['All brands']
    : (brandSpecializations || []).slice(0, 3);

  return (
    <div className="mm-card">
      {/* Banner / avatar area */}
      <div className="mm-card-banner">
        {imgUrl
          ? <img src={imgUrl} alt={workshopName} className="mm-card-avatar-img" />
          : <div className="mm-card-avatar-placeholder">{initials}</div>
        }
        <span className={`mm-card-status mm-status-${status || 'pending'}`}>
          {STATUS_LABELS[status] || status}
        </span>
        {mobileService && <span className="mm-card-mobile-badge">Mobile</span>}
      </div>

      {/* Body */}
      <div className="mm-card-body">
        <h3 className="mm-card-name">{workshopName || mechanicName || 'Unnamed'}</h3>
        {mechanicName && workshopName && (
          <p className="mm-card-sub">{mechanicName}</p>
        )}
        <p className="mm-card-type">{workshopType || 'General Workshop'}</p>
        <p className="mm-card-location">
          <span className="mm-icon">&#9679;</span> {location}
        </p>

        {yearsExperience ? (
          <p className="mm-card-exp">{yearsExperience} yr{yearsExperience === 1 ? '' : 's'} experience</p>
        ) : null}

        {specs.length > 0 && (
          <div className="mm-card-tags">
            {specs.map(s => <span key={s} className="mm-tag">{s}</span>)}
            {(mechanicSpecializations || []).length > 3 && (
              <span className="mm-tag mm-tag-more">+{mechanicSpecializations.length - 3}</span>
            )}
          </div>
        )}

        {brands.length > 0 && (
          <div className="mm-card-brands">
            {brands.map(b => <span key={b} className="mm-brand-tag">{b === 'all_brands' ? 'All brands' : b}</span>)}
            {!brands.includes('All brands') && (brandSpecializations || []).length > 3 && (
              <span className="mm-brand-tag">+{brandSpecializations.length - 3}</span>
            )}
          </div>
        )}

        <div className="mm-card-contact">
          {phone && <span>{phone}</span>}
          {email && <span>{email}</span>}
        </div>

        {approvedAt && (
          <p className="mm-card-date">
            Approved {new Date(approvedAt).toLocaleDateString()}
          </p>
        )}
        {!approvedAt && createdAt && (
          <p className="mm-card-date">
            Submitted {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mm-card-actions">
        <button className="mm-btn mm-btn-edit" onClick={() => onEdit(mechanic)}>Edit</button>

        {status !== 'approved' && (
          <button className="mm-btn mm-btn-approve" onClick={() => onApprove(mechanic._id)}>
            Approve
          </button>
        )}
        {status === 'approved' && (
          <button className="mm-btn mm-btn-reject" onClick={() => onReject(mechanic._id)}>
            Suspend
          </button>
        )}

        <button className="mm-btn mm-btn-delete" onClick={() => onDelete(mechanic)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default MechanicAdminCard;
