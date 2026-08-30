import { useState } from 'react';
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

const buildBookingMsg = (m, form) => {
  const name = m.workshopName || m.mechanicName || 'Mechanic';
  return [
    `Hello *${name}*! I'd like to book an appointment.`,
    '',
    `*Vehicle:* ${[form.year, form.make, form.model].filter(Boolean).join(' ')}${form.plate ? ` (Reg: ${form.plate})` : ''}`,
    `*Issue:* ${form.issue || 'General service'}`,
    form.date ? `*Preferred Date:* ${form.date}` : '',
    `*My Name:* ${form.customerName || '—'}`,
    `*My Phone:* ${form.customerPhone || '—'}`,
    '',
    'Please let me know your availability. Thank you!'
  ].filter(l => l !== undefined).join('\n');
};

export default function MechanicCard({ mechanic: m }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', make: '', model: '', year: '', plate: '', issue: '', date: '' });

  const brands = (m.brandSpecializations || []);
  const allBrands = brands.includes('all_brands');
  const specs = (m.mechanicSpecializations || []).slice(0, 3);
  const extraSpecs = (m.mechanicSpecializations || []).length - 3;
  const locations = (m.locationsOfOperation || m.city || '').split(/[,;|\n]/).map(l => l.trim()).filter(Boolean).slice(0, 3);
  const initial = (m.workshopName || m.mechanicName || 'M')[0].toUpperCase();
  const typeColor = TYPE_COLORS[m.workshopType] || '#888';
  const phone = m.phone || m.whatsapp || '';

  const handleBook = () => {
    if (!phone) { setShowModal(true); return; }
    const num = phone.replace(/\D/g, '');
    const text = buildBookingMsg(m, form);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleModalSend = () => {
    if (!phone) {
      alert(`Contact: ${m.email || 'No contact info available'}`);
      return;
    }
    const num = phone.replace(/\D/g, '');
    const text = buildBookingMsg(m, form);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
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
              {m.yearsExperience && <span className="mc-exp">{m.yearsExperience}+ yrs</span>}
            </div>
          </div>
        </div>

        {/* Locations */}
        {locations.length > 0 && (
          <div className="mc-locations">
            <span className="mc-section-icon">📌</span>
            {locations.map((loc, i) => <span key={i} className="mc-location-chip">{loc}</span>)}
          </div>
        )}

        {/* Brands */}
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

        {/* Specializations */}
        {specs.length > 0 && (
          <div className="mc-specs">
            {specs.map((s, i) => <span key={i} className="mc-spec-chip">{s}</span>)}
            {extraSpecs > 0 && <span className="mc-more">+{extraSpecs} more</span>}
          </div>
        )}

        {/* Description */}
        {m.description && (
          <p className="mc-description">{m.description}</p>
        )}

        {/* Actions */}
        <div className="mc-actions">
          <button className="mc-btn mc-btn-book" onClick={() => setShowModal(true)}>
            📅 Book Appointment
          </button>
          {phone && (
            <a className="mc-btn mc-btn-wa" href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">
              📱 WhatsApp
            </a>
          )}
          {m.email && !phone && (
            <a className="mc-btn mc-btn-email" href={`mailto:${m.email}`}>✉️ Email</a>
          )}
        </div>
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
                  <input type="number" placeholder="e.g. 2020" value={form.year}
                    onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
                  <label>Registration Plate</label>
                  <input type="text" placeholder="e.g. B 1234 XXX" value={form.plate}
                    onChange={e => setForm(p => ({ ...p, plate: e.target.value }))} />
                </div>
                <div className="mc-modal-field mc-modal-field--full">
                  <label>What needs fixing? *</label>
                  <textarea rows={3} placeholder="Describe the issue or service needed…" value={form.issue}
                    onChange={e => setForm(p => ({ ...p, issue: e.target.value }))} />
                </div>
                <div className="mc-modal-field">
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
                : <a className="mc-btn mc-btn-email mc-btn-lg" href={`mailto:${m.email}?subject=Booking Request&body=${encodeURIComponent(buildBookingMsg(m, form))}`}>
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
