import { useState, useEffect, useCallback } from 'react';
import { http } from '../../../config/axios.js';
import './MechanicCard.css';

const BRAND_DISPLAY = {
  all_brands: 'All Brands',
  Toyota: 'Toyota', Volkswagen: 'VW', BMW: 'BMW', 'Mercedes-Benz': 'Mercedes',
  Ford: 'Ford', Hyundai: 'Hyundai', Kia: 'Kia', Nissan: 'Nissan', Mazda: 'Mazda',
  Isuzu: 'Isuzu', Mitsubishi: 'Mitsubishi', 'Land Rover': 'Land Rover',
  'Range Rover': 'Range Rover', Audi: 'Audi', Renault: 'Renault', Peugeot: 'Peugeot',
  Chevrolet: 'Chevrolet', Opel: 'Opel', Lexus: 'Lexus', Honda: 'Honda',
  Subaru: 'Subaru', Volvo: 'Volvo', Jeep: 'Jeep', Suzuki: 'Suzuki',
};

const TYPE_COLORS = {
  'General Workshop': '#0078ff',
  'Specialist': '#9b59b6',
  'Mobile Mechanic': '#e67e22',
  'Dealership Workshop': '#00c37c',
  'Home Workshop': '#f1c40f',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderStars = (rating, editable = false, onRate = null) => {
  const full = Math.floor(rating);
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < full;
    const half = !filled && rating - i >= 0.5;
    return (
      <span
        key={i}
        className={`mc-star${filled ? ' mc-star--filled' : half ? ' mc-star--half' : ''}`}
        onClick={editable && onRate ? () => onRate(i + 1) : undefined}
        style={editable ? { cursor: 'pointer' } : {}}
      >
        {filled ? '★' : half ? '⯨' : '☆'}
      </span>
    );
  });
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BW', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const buildBookingMsg = (m, form) => {
  const name = m.workshopName || m.mechanicName || 'Mechanic';
  return [
    `Hello *${name}*! I'd like to book an appointment.`,
    '',
    form.issue ? `*Issue / What's needed:*\n${form.issue}` : '',
    '',
    `*Vehicle:* ${[form.year, form.make, form.model].filter(Boolean).join(' ')}${form.plate ? ` (Reg: ${form.plate})` : ''}`,
    form.date ? `*Preferred Date:* ${form.date}` : '',
    `*My Name:* ${form.customerName || '—'}`,
    `*My Phone:* ${form.customerPhone || '—'}`,
    '',
    'Please let me know your availability. Thank you!',
  ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');
};

// ── Reviews sub-component ─────────────────────────────────────────────────────

function ReviewsSection({ mechanicUserId }) {
  const [reviews, setReviews]           = useState([]);
  const [stats, setStats]               = useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [newRating, setNewRating]       = useState(0);
  const [hoverRating, setHoverRating]   = useState(0);
  const [newText, setNewText]           = useState('');
  const [serviceType, setServiceType]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitMsg, setSubmitMsg]       = useState('');
  const [submitError, setSubmitError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get(`/reviews/mechanic/${mechanicUserId}`);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        setStats(res.data.data.stats || { totalReviews: 0, averageRating: 0 });
      }
    } catch (_) {}
    setLoading(false);
  }, [mechanicUserId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!newRating) { setSubmitError('Please select a star rating.'); return; }
    if (newText.trim().length < 5) { setSubmitError('Review must be at least 5 characters.'); return; }
    setSubmitting(true); setSubmitError('');
    try {
      const token = localStorage.getItem('token');
      const res = await http.post('/reviews/mechanic', {
        mechanicUserId, rating: newRating, review: newText.trim(), serviceType
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setSubmitMsg('Review submitted! Thank you.');
        setNewRating(0); setNewText(''); setServiceType(''); setShowForm(false);
        await load();
      } else {
        setSubmitError(res.data?.message || 'Failed to submit.');
      }
    } catch (e) {
      setSubmitError(e.response?.data?.message || 'Failed to submit. Please sign in.');
    } finally { setSubmitting(false); }
  };

  const displayRating = hoverRating || newRating;

  return (
    <div className="mc-reviews">
      {/* Summary bar */}
      <div className="mc-reviews-summary">
        <div className="mc-reviews-avg">
          <span className="mc-reviews-avg-num">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}</span>
          <div className="mc-reviews-stars-row">
            {renderStars(stats.averageRating)}
          </div>
          <span className="mc-reviews-count">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</span>
        </div>
        {!showForm && !submitMsg && (
          <button className="mc-btn mc-btn-review-open" onClick={() => setShowForm(true)}>
            ✍️ Write a Review
          </button>
        )}
      </div>

      {submitMsg && <div className="mc-review-success">{submitMsg}</div>}

      {/* Review form */}
      {showForm && (
        <div className="mc-review-form">
          <div className="mc-review-form-stars">
            <span className="mc-review-form-label">Your rating:</span>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`mc-star mc-star-input${i < displayRating ? ' mc-star--filled' : ''}`}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setNewRating(i + 1)}
              >
                {i < displayRating ? '★' : '☆'}
              </span>
            ))}
            {displayRating > 0 && (
              <span className="mc-review-rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][displayRating]}
              </span>
            )}
          </div>
          <select
            className="mc-review-select"
            value={serviceType}
            onChange={e => setServiceType(e.target.value)}
          >
            <option value="">Service type (optional)</option>
            {['Engine Repair','Transmission','Electrical','Brakes','Suspension','Air Conditioning','Diagnostics','Body Work','Tyres & Alignment','Service / Oil Change','Clutch','4×4 / Off-road','Detailing','Other'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <textarea
            className="mc-review-textarea"
            rows={3}
            placeholder="Share your experience with this mechanic…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
          />
          {submitError && <div className="mc-review-error">{submitError}</div>}
          <div className="mc-review-form-actions">
            <button className="mc-btn mc-btn-secondary" onClick={() => { setShowForm(false); setSubmitError(''); }}>Cancel</button>
            <button className="mc-btn mc-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="mc-reviews-loading"><div className="mc-mini-spinner" /></div>
      ) : reviews.length === 0 ? (
        <div className="mc-reviews-empty">No reviews yet — be the first!</div>
      ) : (
        <div className="mc-review-list">
          {reviews.slice(0, 5).map((r, i) => (
            <div key={i} className="mc-review-item">
              <div className="mc-review-item-header">
                <div className="mc-review-avatar">{(r.reviewer?.name || 'A')[0].toUpperCase()}</div>
                <div className="mc-review-item-meta">
                  <span className="mc-review-name">{r.reviewer?.name || 'Anonymous'}</span>
                  <div className="mc-review-item-stars">
                    {renderStars(r.rating)}
                    {r.serviceType && <span className="mc-review-service-tag">{r.serviceType}</span>}
                  </div>
                </div>
                <span className="mc-review-date">{fmtDate(r.date)}</span>
              </div>
              <p className="mc-review-text">{r.review}</p>
            </div>
          ))}
          {reviews.length > 5 && (
            <p className="mc-reviews-more-note">{reviews.length - 5} more review{reviews.length - 5 !== 1 ? 's' : ''} not shown</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function MechanicCard({ mechanic: m }) {
  const [showModal, setShowModal]   = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [issueInput, setIssueInput] = useState('');
  const [form, setForm] = useState({
    customerName: '', customerPhone: '',
    make: '', model: '', year: '', plate: '',
    issue: '', date: '',
  });

  const brands    = m.brandSpecializations || [];
  const allBrands = brands.includes('all_brands');
  const specs     = (m.mechanicSpecializations || []).slice(0, 3);
  const extraSpecs = (m.mechanicSpecializations || []).length - 3;
  const locations = (m.locationsOfOperation || m.city || '')
    .split(/[,;|\n]/).map(l => l.trim()).filter(Boolean).slice(0, 3);
  const initial   = (m.workshopName || m.mechanicName || 'M')[0].toUpperCase();
  const typeColor = TYPE_COLORS[m.workshopType] || '#888';
  const phone     = m.phone || m.whatsapp || '';

  const openModal = () => {
    setForm(p => ({ ...p, issue: issueInput }));
    setShowModal(true);
  };

  const handleModalSend = () => {
    if (!phone) {
      if (m.email) {
        window.location.href = `mailto:${m.email}?subject=Booking Request&body=${encodeURIComponent(buildBookingMsg(m, form))}`;
      } else {
        alert('No contact info available for this mechanic.');
      }
      return;
    }
    const num = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(buildBookingMsg(m, form))}`, '_blank');
    setShowModal(false);
  };

  return (
    <>
      <div className="mc-card">
        {/* Header */}
        <div className="mc-header">
          <div className="mc-avatar" style={{ background: typeColor }}>
            {m.profileImage
              ? <img src={m.profileImage} alt={m.workshopName} className="mc-avatar-img" />
              : initial}
          </div>
          <div className="mc-header-info">
            <h3 className="mc-name">{m.workshopName || m.mechanicName || 'Mechanic'}</h3>
            {m.mechanicName && m.workshopName && m.mechanicName !== m.workshopName && (
              <div className="mc-mechanic-name">{m.mechanicName}</div>
            )}
            <div className="mc-meta-row">
              <span className="mc-type-badge" style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}>
                {m.workshopType || 'Workshop'}
              </span>
              {m.mobileService && <span className="mc-mobile-badge">📍 Mobile</span>}
              {m.yearsExperience && <span className="mc-exp">{m.yearsExperience}+ yrs exp</span>}
            </div>
          </div>
        </div>

        {/* Location chips */}
        {locations.length > 0 && (
          <div className="mc-locations">
            <span className="mc-section-icon">📌</span>
            {locations.map((loc, i) => <span key={i} className="mc-location-chip">{loc}</span>)}
          </div>
        )}

        {/* Brand chips */}
        <div className="mc-brands">
          <span className="mc-section-label">Brands:</span>
          {allBrands
            ? <span className="mc-brand-chip mc-brand-all">All Brands</span>
            : brands.slice(0, 5).map((b, i) => (
              <span key={i} className="mc-brand-chip">{BRAND_DISPLAY[b] || b}</span>
            ))
          }
          {!allBrands && brands.length > 5 && <span className="mc-more">+{brands.length - 5}</span>}
        </div>

        {/* Service type chips */}
        {specs.length > 0 && (
          <div className="mc-specs">
            {specs.map((s, i) => <span key={i} className="mc-spec-chip">{s}</span>)}
            {extraSpecs > 0 && <span className="mc-more">+{extraSpecs} more</span>}
          </div>
        )}

        {/* Description */}
        {m.description && <p className="mc-description">{m.description}</p>}

        {/* ── Quick issue field ── */}
        <div className="mc-issue-wrap">
          <label className="mc-issue-label">What does your car need?</label>
          <textarea
            className="mc-issue-input"
            rows={2}
            placeholder="Briefly describe the problem or service needed… (e.g. 'engine knocking', 'brake service', 'A/C not cooling')"
            value={issueInput}
            onChange={e => setIssueInput(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mc-actions">
          <button className="mc-btn mc-btn-book" onClick={openModal}>
            📅 Book Appointment
          </button>
          {phone && (
            <a className="mc-btn mc-btn-wa" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              📱 WhatsApp
            </a>
          )}
          {m.email && !phone && (
            <a className="mc-btn mc-btn-email" href={`mailto:${m.email}`}>✉️ Email</a>
          )}
        </div>

        {/* Reviews toggle */}
        <button
          className="mc-reviews-toggle"
          onClick={() => setShowReviews(v => !v)}
        >
          <span className="mc-reviews-toggle-label">
            {showReviews ? '▲ Hide Reviews' : '★ Reviews'}
          </span>
        </button>

        {/* Reviews panel */}
        {showReviews && <ReviewsSection mechanicUserId={m.userId || String(m._id)} />}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="mc-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="mc-modal">
            <button className="mc-modal-close" onClick={() => setShowModal(false)}>✕</button>

            <div className="mc-modal-header">
              <div className="mc-modal-avatar" style={{ background: typeColor }}>{initial}</div>
              <div>
                <h3 className="mc-modal-title">Book with {m.workshopName || m.mechanicName}</h3>
                {locations[0] && <p className="mc-modal-sub">📌 {locations[0]}</p>}
              </div>
            </div>

            <div className="mc-modal-body">
              {/* Issue field — prominently at the top, pre-filled from card */}
              <div className="mc-modal-issue-block">
                <label className="mc-modal-issue-label">What does your car need? *</label>
                <textarea
                  className="mc-modal-issue-textarea"
                  rows={3}
                  placeholder="Describe the problem or service in detail — the more you share, the better the mechanic can prepare…"
                  value={form.issue}
                  onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                />
              </div>

              <div className="mc-modal-grid">
                <div className="mc-modal-field">
                  <label>Your Name *</label>
                  <input type="text" placeholder="Full name" value={form.customerName}
                    onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Your Phone *</label>
                  <input type="tel" placeholder="+267 XX XXX XXX" value={form.customerPhone}
                    onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Vehicle Make</label>
                  <input type="text" placeholder="e.g. Toyota" value={form.make}
                    onChange={e => setForm(p => ({ ...p, make: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Model</label>
                  <input type="text" placeholder="e.g. Hilux" value={form.model}
                    onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Year</label>
                  <input type="number" placeholder={String(new Date().getFullYear())} value={form.year}
                    onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Registration Plate</label>
                  <input type="text" placeholder="e.g. B 1234 XXX" value={form.plate}
                    onChange={e => setForm(p => ({ ...p, plate: e.target.value }))} />
                </div>
                <div className="mc-modal-field mc-modal-field--full">
                  <label>Preferred Date</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mc-modal-actions">
              <button className="mc-btn mc-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              {phone
                ? <button className="mc-btn mc-btn-wa mc-btn-lg" onClick={handleModalSend}>
                    📱 Send Booking via WhatsApp
                  </button>
                : <a
                    className="mc-btn mc-btn-email mc-btn-lg"
                    href={`mailto:${m.email}?subject=Booking Request&body=${encodeURIComponent(buildBookingMsg(m, form))}`}
                  >
                    ✉️ Send Booking via Email
                  </a>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
