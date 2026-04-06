import React, { useState, useRef } from 'react';
import { imageService } from '../../services/imageService.js';
import './AssistedListingModal.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const INITIAL_SELLER = {
  name: '',
  email: '',
  phone: '',
  password: '',
  profileImage: null,
  profileImagePreview: null,
};

const INITIAL_VEHICLE = {
  title: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  price: '',
  mileage: '',
  condition: 'used',
  transmission: 'automatic',
  fuelType: 'petrol',
  engineSize: '',
  exteriorColor: '',
  interiorColor: '',
  city: '',
  description: '',
  features: '',
  images: [],
  imagePreviews: [],
};

const AssistedListingModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1 = seller, 2 = vehicle, 3 = success
  const [seller, setSeller] = useState(INITIAL_SELLER);
  const [vehicle, setVehicle] = useState(INITIAL_VEHICLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const profileInputRef = useRef();
  const vehicleImagesInputRef = useRef();

  if (!isOpen) return null;

  // ── Seller handlers ──────────────────────────────────────────────────────

  const handleSellerChange = (e) => {
    setSeller(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setSeller(prev => ({ ...prev, profileImage: file, profileImagePreview: preview }));
  };

  // ── Vehicle handlers ─────────────────────────────────────────────────────

  const handleVehicleChange = (e) => {
    setVehicle(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVehicleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    setVehicle(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...previews],
    }));
  };

  const removeVehicleImage = (idx) => {
    setVehicle(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== idx),
    }));
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!seller.name.trim()) return 'Seller name is required.';
    if (!seller.email.trim()) return 'Seller email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email)) return 'Invalid email address.';
    if (!seller.phone.trim()) return 'Seller phone is required.';
    if (!seller.password.trim() || seller.password.length < 6)
      return 'Password must be at least 6 characters.';
    return '';
  };

  const validateStep2 = () => {
    if (!vehicle.make.trim()) return 'Make is required.';
    if (!vehicle.model.trim()) return 'Model is required.';
    if (!vehicle.price) return 'Price is required.';
    if (!vehicle.city.trim()) return 'City is required.';
    return '';
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      // Upload profile image if provided
      let profileImageUrl = '';
      if (seller.profileImage) {
        const uploaded = await imageService.uploadImage(seller.profileImage, 'profiles');
        profileImageUrl = uploaded.url || uploaded.secure_url || uploaded.location || '';
      }

      // Upload vehicle images
      let vehicleImageUrls = [];
      for (const img of vehicle.images) {
        const uploaded = await imageService.uploadImage(img, 'listings');
        vehicleImageUrls.push(uploaded.url || uploaded.secure_url || uploaded.location || '');
      }

      const payload = {
        sellerName: seller.name.trim(),
        sellerEmail: seller.email.trim().toLowerCase(),
        sellerPhone: seller.phone.trim(),
        sellerPassword: seller.password,
        sellerProfileImage: profileImageUrl,
        title: vehicle.title.trim() || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: parseInt(vehicle.year, 10),
        price: parseFloat(vehicle.price),
        mileage: vehicle.mileage ? parseInt(vehicle.mileage, 10) : 0,
        condition: vehicle.condition,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize.trim(),
        exteriorColor: vehicle.exteriorColor.trim(),
        interiorColor: vehicle.interiorColor.trim(),
        city: vehicle.city.trim(),
        description: vehicle.description.trim(),
        features: vehicle.features
          ? vehicle.features.split(',').map(f => f.trim()).filter(Boolean)
          : [],
        images: vehicleImageUrls,
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/listings/assisted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create listing.');

      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copy credentials ──────────────────────────────────────────────────────

  const handleCopyCredentials = () => {
    if (!result?.seller?.credentials) return;
    const text =
      `Seller Login Credentials\n` +
      `Email: ${result.seller.credentials.email}\n` +
      `Password: ${result.seller.credentials.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleClose = () => {
    setSeller(INITIAL_SELLER);
    setVehicle(INITIAL_VEHICLE);
    setStep(1);
    setError('');
    setResult(null);
    setCopied(false);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="alm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="alm-modal">
        {/* Header */}
        <div className="alm-header">
          <div className="alm-header-left">
            <span className="alm-header-icon">👤</span>
            <h2 className="alm-title">List Vehicle for Seller</h2>
          </div>
          <button className="alm-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="alm-steps">
            <div className={`alm-step ${step >= 1 ? 'alm-step--active' : ''}`}>
              <span className="alm-step-num">1</span>
              <span className="alm-step-label">Seller Info</span>
            </div>
            <div className="alm-step-divider" />
            <div className={`alm-step ${step >= 2 ? 'alm-step--active' : ''}`}>
              <span className="alm-step-num">2</span>
              <span className="alm-step-label">Vehicle Details</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="alm-body">
          {/* ── Step 1: Seller Info ── */}
          {step === 1 && (
            <div className="alm-section">
              <p className="alm-section-desc">
                Enter the seller's details. A new account will be created if no existing user matches the email.
              </p>

              {/* Profile picture */}
              <div className="alm-profile-upload" onClick={() => profileInputRef.current?.click()}>
                {seller.profileImagePreview ? (
                  <img src={seller.profileImagePreview} alt="Profile" className="alm-profile-preview" />
                ) : (
                  <div className="alm-profile-placeholder">
                    <span>📷</span>
                    <span>Upload Profile Photo</span>
                  </div>
                )}
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleProfileImageChange}
                />
              </div>

              <div className="alm-grid-2">
                <div className="alm-field">
                  <label className="alm-label">Full Name *</label>
                  <input
                    className="alm-input"
                    name="name"
                    value={seller.name}
                    onChange={handleSellerChange}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Phone Number *</label>
                  <input
                    className="alm-input"
                    name="phone"
                    value={seller.phone}
                    onChange={handleSellerChange}
                    placeholder="e.g. +267 71 234 567"
                  />
                </div>
              </div>

              <div className="alm-field">
                <label className="alm-label">Email Address *</label>
                <input
                  className="alm-input"
                  name="email"
                  type="email"
                  value={seller.email}
                  onChange={handleSellerChange}
                  placeholder="seller@example.com"
                />
              </div>

              <div className="alm-field">
                <label className="alm-label">Account Password * <span className="alm-label-hint">(share this with the seller)</span></label>
                <input
                  className="alm-input"
                  name="password"
                  type="text"
                  value={seller.password}
                  onChange={handleSellerChange}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Vehicle Details ── */}
          {step === 2 && (
            <div className="alm-section">
              <div className="alm-grid-2">
                <div className="alm-field">
                  <label className="alm-label">Make *</label>
                  <input
                    className="alm-input"
                    name="make"
                    value={vehicle.make}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Model *</label>
                  <input
                    className="alm-input"
                    name="model"
                    value={vehicle.model}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Hilux"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Year</label>
                  <input
                    className="alm-input"
                    name="year"
                    type="number"
                    min="1970"
                    max={new Date().getFullYear() + 1}
                    value={vehicle.year}
                    onChange={handleVehicleChange}
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Price (BWP) *</label>
                  <input
                    className="alm-input"
                    name="price"
                    type="number"
                    min="0"
                    value={vehicle.price}
                    onChange={handleVehicleChange}
                    placeholder="e.g. 85000"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Mileage (km)</label>
                  <input
                    className="alm-input"
                    name="mileage"
                    type="number"
                    min="0"
                    value={vehicle.mileage}
                    onChange={handleVehicleChange}
                    placeholder="e.g. 45000"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Condition</label>
                  <select className="alm-input" name="condition" value={vehicle.condition} onChange={handleVehicleChange}>
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                <div className="alm-field">
                  <label className="alm-label">Transmission</label>
                  <select className="alm-input" name="transmission" value={vehicle.transmission} onChange={handleVehicleChange}>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="alm-field">
                  <label className="alm-label">Fuel Type</label>
                  <select className="alm-input" name="fuelType" value={vehicle.fuelType} onChange={handleVehicleChange}>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="alm-field">
                  <label className="alm-label">Engine Size</label>
                  <input
                    className="alm-input"
                    name="engineSize"
                    value={vehicle.engineSize}
                    onChange={handleVehicleChange}
                    placeholder="e.g. 2.0L"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">City *</label>
                  <input
                    className="alm-input"
                    name="city"
                    value={vehicle.city}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Gaborone"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Exterior Color</label>
                  <input
                    className="alm-input"
                    name="exteriorColor"
                    value={vehicle.exteriorColor}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Pearl White"
                  />
                </div>
                <div className="alm-field">
                  <label className="alm-label">Interior Color</label>
                  <input
                    className="alm-input"
                    name="interiorColor"
                    value={vehicle.interiorColor}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Black Leather"
                  />
                </div>
              </div>

              <div className="alm-field">
                <label className="alm-label">Custom Title <span className="alm-label-hint">(optional — auto-generated if blank)</span></label>
                <input
                  className="alm-input"
                  name="title"
                  value={vehicle.title}
                  onChange={handleVehicleChange}
                  placeholder="e.g. 2020 Toyota Hilux GD-6 4x4 Double Cab"
                />
              </div>

              <div className="alm-field">
                <label className="alm-label">Description</label>
                <textarea
                  className="alm-input alm-textarea"
                  name="description"
                  value={vehicle.description}
                  onChange={handleVehicleChange}
                  rows={4}
                  placeholder="Describe the vehicle's condition, service history, extras, etc."
                />
              </div>

              <div className="alm-field">
                <label className="alm-label">Features <span className="alm-label-hint">(comma-separated)</span></label>
                <input
                  className="alm-input"
                  name="features"
                  value={vehicle.features}
                  onChange={handleVehicleChange}
                  placeholder="e.g. Sunroof, Reverse Camera, Heated Seats"
                />
              </div>

              {/* Vehicle images */}
              <div className="alm-field">
                <label className="alm-label">Vehicle Photos</label>
                <div
                  className="alm-images-drop"
                  onClick={() => vehicleImagesInputRef.current?.click()}
                >
                  <span className="alm-images-drop-icon">📸</span>
                  <span>Click to add photos</span>
                  <input
                    ref={vehicleImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleVehicleImagesChange}
                  />
                </div>
                {vehicle.imagePreviews.length > 0 && (
                  <div className="alm-images-grid">
                    {vehicle.imagePreviews.map((src, i) => (
                      <div key={i} className="alm-image-thumb">
                        <img src={src} alt={`Vehicle ${i + 1}`} />
                        <button
                          className="alm-image-remove"
                          onClick={() => removeVehicleImage(i)}
                          type="button"
                          aria-label="Remove"
                        >✕</button>
                        {i === 0 && <span className="alm-image-badge">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && result && (
            <div className="alm-success">
              <div className="alm-success-icon">✓</div>
              <h3 className="alm-success-title">Listing Created!</h3>
              <p className="alm-success-desc">
                The vehicle <strong>{result.listing?.title}</strong> has been listed successfully
                {result.seller?.isNewUser ? ' and a new account has been created for the seller.' : '.'}
              </p>

              {result.seller?.credentials && (
                <div className="alm-credentials">
                  <p className="alm-credentials-title">Seller Login Credentials</p>
                  <div className="alm-credentials-row">
                    <span className="alm-credentials-label">Email</span>
                    <span className="alm-credentials-value">{result.seller.credentials.email}</span>
                  </div>
                  <div className="alm-credentials-row">
                    <span className="alm-credentials-label">Password</span>
                    <span className="alm-credentials-value">{result.seller.credentials.password}</span>
                  </div>
                  <button className="alm-copy-btn" onClick={handleCopyCredentials}>
                    {copied ? '✓ Copied!' : '📋 Copy Credentials'}
                  </button>
                  <p className="alm-credentials-note">
                    Share these credentials with the seller so they can log in and manage their listing.
                  </p>
                </div>
              )}

              {!result.seller?.credentials && (
                <p className="alm-existing-user-note">
                  This seller already has an account — their existing credentials remain unchanged.
                </p>
              )}

              <button className="alm-done-btn" onClick={handleClose}>Done</button>
            </div>
          )}

          {/* Error */}
          {error && <p className="alm-error">{error}</p>}
        </div>

        {/* Footer actions */}
        {step < 3 && (
          <div className="alm-footer">
            {step === 1 && (
              <>
                <button className="alm-btn alm-btn--ghost" onClick={handleClose}>Cancel</button>
                <button className="alm-btn alm-btn--primary" onClick={handleNext}>Next: Vehicle Details →</button>
              </>
            )}
            {step === 2 && (
              <>
                <button className="alm-btn alm-btn--ghost" onClick={handleBack}>← Back</button>
                <button
                  className="alm-btn alm-btn--primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating Listing…' : 'Create Listing'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistedListingModal;
