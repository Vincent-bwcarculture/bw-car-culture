import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Calendar, MapPin, Phone, Mail, Award, Heart,
  Settings, Car, Route, ChevronRight, Plus, Eye,
  ShoppingBag, Hash, Shield, Star, FileText, Wrench
} from 'lucide-react';
import './ProfileOverview.css';

const ROLE_LABELS = {
  admin: 'Administrator', provider: 'Service Provider', dealer: 'Dealer',
  dealership_admin: 'Dealership Admin', transport_admin: 'Transport Admin',
  rental_admin: 'Rental Admin', transport_coordinator: 'Transport Coordinator',
  taxi_driver: 'Taxi Driver', ministry_official: 'Ministry Official',
  journalist: 'Journalist', mechanic: 'Mechanic', business_owner: 'Business Owner',
  user: 'Member'
};

const ProfileOverview = ({ profileData, refreshProfile, onTabSwitch }) => {
  const navigate = useNavigate();
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // ── Profile strength ────────────────────────────────────────────────────────
  const profileStrength = (() => {
    let s = 0;
    if (profileData.name)                       s += 15;
    if (profileData.email)                      s += 10;
    if (profileData.avatar?.url)                s += 15;
    if (profileData.profile?.phone)             s += 10;
    if (profileData.profile?.bio)               s += 15;
    if (profileData.profile?.location)          s += 10;
    if (profileData.profile?.dateOfBirth)       s += 5;
    if (profileData.businessProfile?.services?.length > 0) s += 10;
    if (profileData.vehicles?.length > 0)       s += 10;
    return s;
  })();

  const strengthLabel = profileStrength >= 80 ? 'Excellent'
    : profileStrength >= 60 ? 'Good'
    : profileStrength >= 40 ? 'Fair' : 'Needs work';

  const strengthClass = profileStrength >= 80 ? 'excellent'
    : profileStrength >= 60 ? 'good'
    : profileStrength >= 40 ? 'fair' : 'poor';

  // ── Badges ─────────────────────────────────────────────────────────────────
  const badges = [];
  if (profileData.isVerified)                          badges.push({ label: 'Verified',         color: 'green' });
  if (profileData.role === 'admin')                    badges.push({ label: 'Admin',            color: 'red' });
  if (profileData.role === 'journalist')               badges.push({ label: 'Journalist',       color: 'blue' });
  if (profileData.role === 'mechanic')                 badges.push({ label: 'Mechanic',         color: 'orange' });
  if (profileData.role === 'ministry_official')        badges.push({ label: 'Ministry',         color: 'red' });
  if (profileData.role === 'transport_coordinator')    badges.push({ label: 'Coordinator',      color: 'green' });
  if (profileData.role === 'taxi_driver')              badges.push({ label: 'Taxi Driver',      color: 'yellow' });
  if (profileData.favorites?.length > 10)              badges.push({ label: 'Active Browser',   color: 'purple' });
  if (profileData.businessProfile?.services?.length)   badges.push({ label: 'Service Provider', color: 'orange' });
  if (profileData.vehicles?.length > 3)                badges.push({ label: 'Vehicle Owner',   color: 'blue' });

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions = [];
  if (!profileData.avatar?.url)          suggestions.push({ title: 'Add photo',     tab: 'settings', icon: User });
  if (!profileData.profile?.bio)         suggestions.push({ title: 'Write a bio',   tab: 'settings', icon: FileText });
  if (!profileData.profile?.phone)       suggestions.push({ title: 'Add phone',     tab: 'settings', icon: Phone });
  if (!profileData.profile?.location)    suggestions.push({ title: 'Add location',  tab: 'settings', icon: MapPin });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BW', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const infoItems = [
    { icon: Mail, label: 'Email',        value: profileData.email },
    { icon: Phone, label: 'Phone',       value: profileData.profile?.phone },
    { icon: MapPin, label: 'Location',   value: profileData.profile?.location },
    { icon: Calendar, label: 'Member since', value: fmtDate(profileData.createdAt) },
    { icon: User, label: 'Role',         value: ROLE_LABELS[profileData.role] || 'Member' },
    { icon: Calendar, label: 'Birthday', value: profileData.profile?.dateOfBirth ? fmtDate(profileData.profile.dateOfBirth) : null },
  ].filter(i => i.value);

  // Quick action tiles
  const quickActions = [
    { label: 'Feed',        icon: Hash,      tab: 'feed',     color: '#6c63ff' },
    { label: 'Car Sales',   icon: ShoppingBag, href: '/marketplace', color: '#ff3300' },
    { label: 'Roles',       icon: Shield,    tab: 'roles',    color: '#0078ff' },
    { label: 'Services',    icon: Wrench,    href: '/services', color: '#00c37c' },
  ];

  return (
    <div className="poverview-main-container">

      {/* ── Top bar: strength + badges ── */}
      <div className="poverview-topbar">
        {/* Strength */}
        <div className="poverview-strength-card">
          <div className="poverview-strength-head">
            <span className="poverview-strength-title">
              <Eye size={14} /> Profile strength
            </span>
            <span className={`poverview-strength-pill poverview-strength-${strengthClass}`}>
              {profileStrength}% · {strengthLabel}
            </span>
          </div>
          <div className="poverview-strength-track">
            <div
              className={`poverview-strength-fill poverview-strength-${strengthClass}`}
              style={{ width: `${profileStrength}%` }}
            />
          </div>
          {suggestions.length > 0 && (
            <p className="poverview-strength-hint">
              {suggestions.length} item{suggestions.length !== 1 ? 's' : ''} left —{' '}
              <button className="poverview-inline-link" onClick={() => onTabSwitch?.('settings')}>
                complete in Settings
              </button>
            </p>
          )}
        </div>

        {/* Badges (if any) */}
        {badges.length > 0 && (
          <div className="poverview-badges-compact">
            {badges.map((b, i) => (
              <span key={i} className={`poverview-badge-chip poverview-badge-${b.color}`}>{b.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── 2-column main area ── */}
      <div className="poverview-columns">

        {/* LEFT: Account info */}
        <div className="poverview-col">
          <div className="poverview-card">
            <h4 className="poverview-card-title"><User size={14} /> Account info</h4>

            {/* Bio block */}
            {profileData.profile?.bio ? (
              <p className="poverview-bio">{profileData.profile.bio}</p>
            ) : (
              <p className="poverview-bio poverview-bio--empty">
                No bio yet.{' '}
                <button className="poverview-inline-link" onClick={() => onTabSwitch?.('settings')}>
                  Add one →
                </button>
              </p>
            )}

            <div className="poverview-info-list">
              {infoItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="poverview-info-row">
                    <Icon size={14} className="poverview-info-icon" />
                    <span className="poverview-info-label">{item.label}</span>
                    <span className="poverview-info-value">{item.value}</span>
                  </div>
                );
              })}
            </div>

            <button
              className="poverview-edit-btn"
              onClick={() => onTabSwitch?.('settings')}
            >
              <Settings size={13} /> Edit profile
            </button>
          </div>
        </div>

        {/* RIGHT: Quick actions + Suggestions */}
        <div className="poverview-col">
          {/* Quick action tiles */}
          <div className="poverview-card">
            <h4 className="poverview-card-title"><Star size={14} /> Quick access</h4>
            <div className="poverview-actions-grid">
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                const inner = (
                  <>
                    <span className="poverview-action-icon" style={{ background: a.color }}><Icon size={18} /></span>
                    <span className="poverview-action-label">{a.label}</span>
                    <ChevronRight size={13} className="poverview-action-arrow" />
                  </>
                );
                return a.href
                  ? <Link key={i} to={a.href} className="poverview-action-tile">{inner}</Link>
                  : <button key={i} className="poverview-action-tile" onClick={() => onTabSwitch?.(a.tab)}>{inner}</button>;
              })}
            </div>
          </div>

          {/* Completion nudges */}
          {suggestions.length > 0 && (
            <div className="poverview-card">
              <div className="poverview-card-title-row">
                <h4 className="poverview-card-title"><Plus size={14} /> Complete your profile</h4>
                {suggestions.length > 3 && (
                  <button className="poverview-toggle-btn" onClick={() => setShowAllSuggestions(v => !v)}>
                    {showAllSuggestions ? 'Less' : `+${suggestions.length - 3} more`}
                  </button>
                )}
              </div>
              <div className="poverview-nudge-list">
                {(showAllSuggestions ? suggestions : suggestions.slice(0, 3)).map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      className="poverview-nudge-item"
                      onClick={() => onTabSwitch?.('settings')}
                    >
                      <span className="poverview-nudge-icon"><Icon size={14} /></span>
                      <span className="poverview-nudge-label">{s.title}</span>
                      <ChevronRight size={12} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>{/* end columns */}
    </div>
  );
};

export default ProfileOverview;
