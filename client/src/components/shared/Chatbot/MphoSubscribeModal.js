// MphoSubscribeModal.js — Mpho AI subscription payment proof flow
import { useState } from 'react';
import axios from '../../../config/axios.js';
import './MphoSubscribeModal.css';

const PAYMENT_DETAILS = [
  { label: 'FNB Paytocell', value: '+267 72 573 475', icon: '🏦' },
  { label: 'FNB Account',   value: '62918382300',     icon: '💳' },
  { label: 'Orange Money',  value: '+267 72 573 475', icon: '🟠' },
];

const MphoSubscribeModal = ({ isOpen, onClose }) => {
  const [proof, setProof] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState({});

  if (!isOpen) return null;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(c => ({ ...c, [key]: true }));
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000);
    } catch (_) {}
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) { setError('Please upload JPEG, PNG or PDF only'); return; }
    if (file.size > 5 * 1024 * 1024)  { setError('File must be under 5MB'); return; }
    setProof(file);
    setError('');
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = e => setPreview(e.target.result);
      r.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!proof) { setError('Please upload your proof of payment'); return; }
    try {
      setSubmitting(true);
      setError('');
      setProgress(20);

      // Upload to S3
      const fd = new FormData();
      fd.append('images', proof);
      fd.append('folder', 'mpho-proofs');
      const upload = await axios.post('/images/upload/multiple', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(20 + Math.round((e.loaded * 60) / e.total)),
      });

      if (!upload.data.success || !upload.data.urls?.length) throw new Error('Upload failed');
      setProgress(85);

      const token = localStorage.getItem('token');
      const res = await axios.post('/ai/subscription/submit-proof', {
        proofFile: {
          url: upload.data.urls[0],
          filename: proof.name,
          size: proof.size,
          mimetype: proof.type,
          uploadedAt: new Date().toISOString()
        },
        amount: 100
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

      setProgress(100);
      if (res.data.success) {
        setSubmitted(true);
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try WhatsApp instead.');
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mpm-overlay" onClick={onClose}>
        <div className="mpm-modal" onClick={e => e.stopPropagation()}>
          <div className="mpm-success">
            <div className="mpm-success-icon">✓</div>
            <h3>Proof Submitted!</h3>
            <p>We'll review your payment and activate your <strong>Mpho</strong> subscription within 24 hours. You'll receive a notification once approved.</p>
            <button className="mpm-btn-primary" onClick={onClose}>Got it</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mpm-overlay" onClick={onClose}>
      <div className="mpm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mpm-header">
          <div>
            <div className="mpm-title">✨ Subscribe to Mpho</div>
            <div className="mpm-subtitle">BWP 200 / month · 30 days access</div>
          </div>
          <button className="mpm-close" onClick={onClose}>✕</button>
        </div>

        {/* Benefits */}
        <div className="mpm-benefits">
          {['50 AI messages/day', 'AI-fills listing forms', 'Vehicle valuations', 'Market price insights', 'Priority admin review'].map((b, i) => (
            <div key={i} className="mpm-benefit"><span className="mpm-check">✓</span>{b}</div>
          ))}
        </div>

        {/* Payment instructions */}
        <div className="mpm-section-label">Pay BWP 200 to any of these:</div>
        <div className="mpm-accounts">
          {PAYMENT_DETAILS.map((d, i) => (
            <div key={i} className="mpm-account">
              <span className="mpm-account-icon">{d.icon}</span>
              <div className="mpm-account-info">
                <div className="mpm-account-label">{d.label}</div>
                <div className="mpm-account-value">{d.value}</div>
              </div>
              <button
                className={`mpm-copy ${copied[i] ? 'copied' : ''}`}
                onClick={() => copy(d.value, i)}
              >
                {copied[i] ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        {/* Proof upload */}
        <div className="mpm-section-label">Upload proof of payment</div>
        <label className="mpm-upload-area">
          <input type="file" accept="image/*,.pdf" onChange={handleFile} hidden />
          {preview ? (
            <img src={preview} alt="proof" className="mpm-preview-img" />
          ) : proof ? (
            <div className="mpm-file-name">📄 {proof.name}</div>
          ) : (
            <>
              <div className="mpm-upload-icon">📎</div>
              <div className="mpm-upload-hint">Tap to upload screenshot or PDF<br /><span>JPEG · PNG · PDF · max 5MB</span></div>
            </>
          )}
        </label>

        {error && <div className="mpm-error">{error}</div>}

        {submitting && (
          <div className="mpm-progress-wrap">
            <div className="mpm-progress-bar">
              <div className="mpm-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="mpm-progress-text">{progress < 85 ? 'Uploading…' : 'Submitting…'}</div>
          </div>
        )}

        <div className="mpm-footer-btns">
          <button className="mpm-btn-whatsapp"
            onClick={() => window.open('https://wa.me/26774122453?text=' + encodeURIComponent('Hi! I want to subscribe to Mpho (BWP 200). Please send payment details.'), '_blank')}>
            💬 Pay via WhatsApp
          </button>
          <button className="mpm-btn-primary" onClick={handleSubmit} disabled={!proof || submitting}>
            {submitting ? 'Submitting…' : 'Submit Proof'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MphoSubscribeModal;
