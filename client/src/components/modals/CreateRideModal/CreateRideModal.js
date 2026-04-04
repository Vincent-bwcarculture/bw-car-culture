import React, { useState, useRef } from 'react';
import './CreateRideModal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.i3wcarculture.com/api';

const BW_CITIES = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye', 'Mahalapye',
  'Serowe', 'Molepolole', 'Kanye', 'Lobatse', 'Jwaneng', 'Orapa',
  'Selebi-Phikwe', 'Tutume', 'Nata', 'Gweta', 'Rakops', 'Letlhakane',
  'Bobonong', 'Thamaga', 'Mochudi', 'Ramotswa', 'Tlokweng', 'Mogoditshane',
  'Gabane', 'Mmopane', 'Bokaa', 'Odi', 'Artesia', 'Kopong',
];

const RECURRENCE_OPTIONS = [
  { value: 'once',     label: 'One-time trip' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekends', label: 'Weekends (Sat–Sun)' },
  { value: 'weekly',   label: 'Weekly' },
];

const EMPTY = {
  origin: '', destination: '', departureTime: '', recurrence: 'once',
  seatsTotal: '1', pricePerSeat: '',
  driverName: '', driverPhone: '',
  vehicleMake: '', vehicleModel: '', vehicleColor: '',
  notes: '',
};

const CreateRideModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm]       = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.origin)        errs.origin        = 'Required';
    if (!form.destination)   errs.destination   = 'Required';
    if (form.origin === form.destination) errs.destination = 'Must differ from origin';
    if (!form.departureTime) errs.departureTime = 'Required';
    if (!form.pricePerSeat)  errs.pricePerSeat  = 'Required';
    if (!form.driverName)    errs.driverName    = 'Required';
    if (!form.driverPhone)   errs.driverPhone   = 'Required';
    return errs;
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/images/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      const data = await res.json();
      return data.url || data.imageUrl || null;
    } catch {
      return null;
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setErrors({ _: 'Please log in to post a ride.' }); setLoading(false); return; }

      const vehicleImage = await uploadImage();

      const payload = {
        origin:        form.origin,
        destination:   form.destination,
        departureTime: new Date(form.departureTime).toISOString(),
        recurrence:    form.recurrence,
        seatsTotal:    parseInt(form.seatsTotal) || 1,
        pricePerSeat:  parseFloat(form.pricePerSeat) || 0,
        driverName:    form.driverName,
        driverPhone:   form.driverPhone,
        vehicle: { make: form.vehicleMake, model: form.vehicleModel, color: form.vehicleColor },
        vehicleImage:  vehicleImage || '',
        notes:         form.notes,
      };

      const res = await fetch(`${API_BASE}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (onCreated) onCreated(data.data);
        setForm(EMPTY);
        setImageFile(null);
        setImagePreview(null);
        onClose();
      } else {
        setErrors({ _: data.message || 'Could not post ride. Try again.' });
      }
    } catch {
      setErrors({ _: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, error, children }) => (
    <div className="crm-field">
      <label className="crm-label">{label}</label>
      {children}
      {error && <span className="crm-field-error">{error}</span>}
    </div>
  );

  return (
    <div className="crm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="crm-modal">
        <div className="crm-header">
          <h2 className="crm-title">Post a Ride</h2>
          <button className="crm-close" onClick={onClose}>✕</button>
        </div>

        <form className="crm-form" onSubmit={handleSubmit}>
          {errors._ && <div className="crm-error-banner">{errors._}</div>}

          {/* Vehicle photo */}
          <div className="crm-photo-section">
            <div className="crm-photo-preview" onClick={() => fileRef.current?.click()}>
              {imagePreview
                ? <img src={imagePreview} alt="Vehicle" className="crm-photo-img" />
                : <div className="crm-photo-placeholder"><span>📷</span><span>Add vehicle photo</span></div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            {imagePreview && (
              <button type="button" className="crm-photo-remove" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Remove photo
              </button>
            )}
          </div>

          {/* Route */}
          <div className="crm-row">
            <Field label="From *" error={errors.origin}>
              <select className={`crm-select${errors.origin ? ' crm-input--err' : ''}`} value={form.origin} onChange={e => set('origin', e.target.value)}>
                <option value="">Select city…</option>
                {BW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="To *" error={errors.destination}>
              <select className={`crm-select${errors.destination ? ' crm-input--err' : ''}`} value={form.destination} onChange={e => set('destination', e.target.value)}>
                <option value="">Select city…</option>
                {BW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Time + Recurrence */}
          <div className="crm-row">
            <Field label="Departure date & time *" error={errors.departureTime}>
              <input
                type="datetime-local"
                className={`crm-input${errors.departureTime ? ' crm-input--err' : ''}`}
                value={form.departureTime}
                onChange={e => set('departureTime', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </Field>
            <Field label="Trip frequency">
              <select className="crm-select" value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
                {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Seats + Price */}
          <div className="crm-row">
            <Field label="Seats available *">
              <select className="crm-select" value={form.seatsTotal} onChange={e => set('seatsTotal', e.target.value)}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Price per seat (BWP) *" error={errors.pricePerSeat}>
              <input
                type="number" min="0" placeholder="e.g. 50"
                className={`crm-input${errors.pricePerSeat ? ' crm-input--err' : ''}`}
                value={form.pricePerSeat}
                onChange={e => set('pricePerSeat', e.target.value)}
              />
            </Field>
          </div>

          {/* Driver info */}
          <div className="crm-section-label">Your details</div>
          <div className="crm-row">
            <Field label="Your name *" error={errors.driverName}>
              <input
                type="text" placeholder="Full name"
                className={`crm-input${errors.driverName ? ' crm-input--err' : ''}`}
                value={form.driverName}
                onChange={e => set('driverName', e.target.value)}
              />
            </Field>
            <Field label="WhatsApp number *" error={errors.driverPhone}>
              <input
                type="tel" placeholder="e.g. 71234567"
                className={`crm-input${errors.driverPhone ? ' crm-input--err' : ''}`}
                value={form.driverPhone}
                onChange={e => set('driverPhone', e.target.value)}
              />
            </Field>
          </div>

          {/* Vehicle */}
          <div className="crm-section-label">Vehicle (optional)</div>
          <div className="crm-row crm-row--3">
            <Field label="Make">
              <input type="text" placeholder="Toyota" className="crm-input" value={form.vehicleMake} onChange={e => set('vehicleMake', e.target.value)} />
            </Field>
            <Field label="Model">
              <input type="text" placeholder="Hilux" className="crm-input" value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} />
            </Field>
            <Field label="Colour">
              <input type="text" placeholder="White" className="crm-input" value={form.vehicleColor} onChange={e => set('vehicleColor', e.target.value)} />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Additional notes">
            <textarea
              className="crm-input crm-textarea"
              placeholder="Luggage allowed, no smoking, pets OK…"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </Field>

          <div className="crm-footer">
            <button type="button" className="crm-btn crm-btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn--primary" disabled={loading || uploadingImg}>
              {uploadingImg ? 'Uploading photo…' : loading ? 'Posting…' : 'Post Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRideModal;
