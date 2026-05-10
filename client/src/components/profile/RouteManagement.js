// client/src/components/profile/RouteManagement.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Route, Plus, Edit2, Trash2, MapPin, Clock, Settings, Car,
  DollarSign, Users, Phone, Check, X, Navigation,
  Calendar, Star, Eye, Save, AlertCircle, Activity,
  ArrowRight, Map, Zap, Image, Upload, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api as axios } from '../../config/axios.js';
import './RouteManagement.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ROUTE_TYPES = ['Bus', 'Taxi', 'Shuttle', 'Minibus', 'Combi', 'Train', 'Ferry', 'Other'];
const SERVICE_TYPES = ['Regular', 'Express', 'Premium', 'Economy'];

const emptyForm = () => ({
  routeName: '',
  routeNumber: '',
  routeType: 'Taxi',
  serviceType: 'Regular',
  description: '',
  origin: { name: '', address: '' },
  destination: { name: '', address: '' },
  schedule: {
    startTime: '05:00',
    endTime: '22:00',
    frequency: 'On demand',
    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    departureTimes: []
  },
  pricing: { baseFare: '', currency: 'BWP' },
  vehicleType: '',
  capacity: '',
  estimatedDuration: '',
  distance: '',
  contact: { phone: '', whatsapp: '', email: '' },
  status: 'active'
});

const RouteManagement = ({ profileData, refreshProfile, setActiveTab }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const userId = profileData?._id;

  const transportServices = profileData?.businessProfile?.services?.filter(
    s => s.serviceType === 'public_transport'
  ) || [];

  useEffect(() => {
    if (userId) fetchRoutes();
  }, [userId]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/transport/my-routes?userId=${userId}`);
      if (res.data.success) setRoutes(res.data.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      // Fallback: try provider endpoint
      try {
        const res2 = await axios.get(`/transport/provider/${userId}`);
        if (res2.data.success) setRoutes(res2.data.data || []);
      } catch (err2) {
        console.error('Fallback fetch also failed:', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRoute(null);
    setFormData(emptyForm());
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setShowModal(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    const days = route.schedule?.operatingDays;
    const daysArray = Array.isArray(days)
      ? days
      : days ? Object.entries(days).filter(([, v]) => v).map(([d]) => d) : DAYS.slice(0, 6);

    setFormData({
      routeName: route.routeName || route.title || '',
      routeNumber: route.routeNumber || '',
      routeType: route.routeType || 'Taxi',
      serviceType: route.serviceType || 'Regular',
      description: route.description || '',
      origin: { name: typeof route.origin === 'string' ? route.origin : (route.origin?.name || ''), address: route.origin?.address || '' },
      destination: { name: typeof route.destination === 'string' ? route.destination : (route.destination?.name || ''), address: route.destination?.address || '' },
      schedule: {
        startTime: route.schedule?.startTime || '05:00',
        endTime: route.schedule?.endTime || '22:00',
        frequency: route.schedule?.frequency || 'On demand',
        operatingDays: daysArray,
        departureTimes: route.schedule?.departureTimes || []
      },
      pricing: { baseFare: route.fare || route.pricing?.baseFare || '', currency: route.currency || route.pricing?.currency || 'BWP' },
      vehicleType: route.vehicleType || '',
      capacity: route.capacity || '',
      estimatedDuration: route.estimatedDuration || '',
      distance: route.distance || '',
      contact: { phone: route.contact?.phone || '', whatsapp: route.contact?.whatsapp || '', email: route.contact?.email || '' },
      status: route.status || route.operationalStatus || 'active'
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages(route.images || []);
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.origin.name || !formData.destination.name) {
      showMsg('error', 'Origin and destination are required');
      return;
    }
    if (!formData.pricing.baseFare) {
      showMsg('error', 'Base fare is required');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const fd = new FormData();

      // Attach images with numbered field names to avoid collision
      imageFiles.forEach((file, i) => fd.append(`image_${i}`, file));

      // Build route data object
      const routeData = {
        routeName: formData.routeName || `${formData.origin.name} to ${formData.destination.name}`,
        routeNumber: formData.routeNumber,
        routeType: formData.routeType,
        serviceType: formData.serviceType,
        description: formData.description,
        origin: formData.origin,
        destination: formData.destination,
        schedule: formData.schedule,
        fare: Number(formData.pricing.baseFare) || 0,
        pricing: { baseFare: Number(formData.pricing.baseFare) || 0, currency: formData.pricing.currency },
        vehicleType: formData.vehicleType,
        capacity: formData.capacity,
        estimatedDuration: formData.estimatedDuration,
        distance: formData.distance,
        contact: formData.contact,
        status: formData.status,
        operationalStatus: formData.status,
        providerId: userId,
        operatorName: profileData?.name || profileData?.businessProfile?.businessName || ''
      };

      // Append all route data fields individually (for multipart compatibility)
      Object.entries(routeData).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          fd.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        }
      });

      let res;
      if (editingRoute) {
        // PUT with multipart to support image re-upload
        res = await axios.put(`/transport/${editingRoute._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round(e.loaded * 100 / e.total))
        });
      } else {
        res = await axios.post('/transport', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round(e.loaded * 100 / e.total))
        });
      }

      if (res.data.success) {
        showMsg('success', editingRoute ? 'Route updated!' : 'Route created!');
        setShowModal(false);
        setEditingRoute(null);
        await fetchRoutes();
        if (refreshProfile) refreshProfile();
      } else {
        showMsg('error', res.data.message || 'Failed to save route');
      }
    } catch (err) {
      console.error('Error saving route:', err);
      showMsg('error', err.response?.data?.message || err.message || 'Error saving route');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (routeId) => {
    try {
      setLoading(true);
      const res = await axios.delete(`/transport/${routeId}`);
      if (res.data.success) {
        showMsg('success', 'Route deleted');
        setDeleteConfirm(null);
        await fetchRoutes();
        if (refreshProfile) refreshProfile();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showMsg('error', 'Failed to delete route');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (route) => {
    const newStatus = (route.status === 'active' || route.operationalStatus === 'active') ? 'inactive' : 'active';
    try {
      await axios.patch(`/transport/${route._id}/status`, { status: newStatus });
      showMsg('success', `Route ${newStatus}`);
      await fetchRoutes();
    } catch (err) {
      showMsg('error', 'Failed to update status');
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.schedule.operatingDays;
      const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
      return { ...prev, schedule: { ...prev.schedule, operatingDays: updated } };
    });
  };

  const getImageSrc = (route) => {
    const imgs = route.images || [];
    if (!imgs.length) return null;
    const primary = imgs.find(i => i.isPrimary) || imgs[0];
    return primary?.url || null;
  };

  // No transport services registered
  if (transportServices.length === 0) {
    return (
      <div className="rmanage-main-container">
        <div className="rmanage-no-service-state">
          <Settings size={48} />
          <h3>No Transport Service Registered</h3>
          <p>Register a transport service under Services tab first.</p>
          <button className="rmanage-register-service-btn" onClick={() => setActiveTab?.('services')}>
            <Plus size={16} /> Register Transport Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rmanage-main-container">
      {message.text && (
        <div className={`rmanage-message rmanage-message-${message.type}`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="rmanage-header-section">
        <div className="rmanage-section-header">
          <h2 className="rmanage-section-title"><Route size={24} /> Route Management</h2>
          <button className="rmanage-add-route-btn" onClick={openCreate}>
            <Plus size={16} /> Add New Route
          </button>
        </div>
        <div className="rmanage-service-info">
          <p>Managing routes for your transport service</p>
          <div className="rmanage-service-badges">
            {transportServices.map((s, i) => (
              <div key={i} className="rmanage-service-badge"><Car size={12} />{s.businessType || 'Transport'}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Routes list */}
      <div className="rmanage-routes-section">
        <div className="rmanage-section-header">
          <h3 className="rmanage-section-title"><Map size={20} /> Your Routes ({routes.length})</h3>
        </div>

        {routes.length === 0 ? (
          <div className="rmanage-empty-state">
            <Route size={48} />
            <h3>No Routes Yet</h3>
            <p>Add your first route so passengers can find your service.</p>
            <button className="rmanage-add-first-route-btn" onClick={openCreate}><Plus size={16} /> Add First Route</button>
          </div>
        ) : (
          <div className="rmanage-routes-grid">
            {routes.map(route => {
              const imgSrc = getImageSrc(route);
              const isActive = route.status === 'active' || route.operationalStatus === 'active';
              const origin = typeof route.origin === 'string' ? route.origin : route.origin?.name || '—';
              const dest = typeof route.destination === 'string' ? route.destination : route.destination?.name || '—';
              return (
                <div key={route._id} className="rmanage-route-card">
                  {/* Card image */}
                  <div className="rmanage-route-img-wrap">
                    {imgSrc
                      ? <img src={imgSrc} alt={route.routeName} className="rmanage-route-img" />
                      : <div className="rmanage-route-img-placeholder"><Map size={32} /></div>
                    }
                    <div className="rmanage-route-img-badges">
                      <span className={`rmanage-status-badge ${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>
                      {route.routeType && <span className="rmanage-type-badge">{route.routeType}</span>}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="rmanage-route-content">
                    <div className="rmanage-route-title-row">
                      <h4 className="rmanage-route-title">
                        {route.routeName || `${origin} → ${dest}`}
                        {route.routeNumber && <span className="rmanage-route-number"> #{route.routeNumber}</span>}
                      </h4>
                    </div>

                    <div className="rmanage-route-path">
                      <MapPin size={14} className="rmanage-origin-icon" />
                      <span>{origin}</span>
                      <ArrowRight size={14} />
                      <MapPin size={14} className="rmanage-destination-icon" />
                      <span>{dest}</span>
                    </div>

                    <div className="rmanage-route-meta">
                      {(route.fare || route.pricing?.baseFare) && (
                        <span><DollarSign size={12} /> P{route.fare || route.pricing?.baseFare}</span>
                      )}
                      {route.estimatedDuration && (
                        <span><Clock size={12} /> {route.estimatedDuration}</span>
                      )}
                      {route.images?.length > 0 && (
                        <span><Image size={12} /> {route.images.length} photo{route.images.length > 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {route.operatorName && (
                      <div className="rmanage-route-provider">
                        <Users size={12} /> {route.operatorName}
                      </div>
                    )}

                    <div className="rmanage-route-actions-row">
                      <button className="rmanage-route-action-btn rmanage-edit-btn" onClick={() => openEdit(route)} title="Edit">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className={`rmanage-route-action-btn ${isActive ? 'rmanage-deactivate-btn' : 'rmanage-activate-btn'}`}
                        onClick={() => toggleStatus(route)}
                      >
                        <Zap size={14} /> {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="rmanage-route-action-btn rmanage-delete-btn" onClick={() => setDeleteConfirm(route._id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="rmanage-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="rmanage-confirm-dialog" onClick={e => e.stopPropagation()}>
            <h4>Delete Route?</h4>
            <p>This action cannot be undone.</p>
            <div className="rmanage-confirm-actions">
              <button className="rmanage-btn rmanage-btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Delete
              </button>
              <button className="rmanage-btn rmanage-btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="rmanage-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rmanage-modal rmanage-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="rmanage-modal-header">
              <h3>{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
              <button className="rmanage-close-modal-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="rmanage-modal-form">

              {/* Images section */}
              <div className="rmanage-form-section">
                <h4><Image size={16} /> Route Photos</h4>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div className="rmanage-existing-images">
                    <p className="rmanage-form-hint">Current photos ({existingImages.length}) — uploading new photos will replace these</p>
                    <div className="rmanage-image-grid">
                      {existingImages.map((img, i) => (
                        <div key={i} className="rmanage-image-thumb">
                          <img src={img.url || img} alt={`Route ${i + 1}`} />
                          {img.isPrimary && <span className="rmanage-primary-badge">Primary</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New image previews */}
                {imagePreviews.length > 0 && (
                  <div className="rmanage-image-grid">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="rmanage-image-thumb rmanage-image-thumb-new">
                        <img src={src} alt={`New ${i + 1}`} />
                        <button type="button" className="rmanage-remove-img-btn" onClick={() => removeNewImage(i)}>
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="rmanage-primary-badge">Primary</span>}
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" className="rmanage-upload-btn" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> {imageFiles.length ? `${imageFiles.length} selected — add more` : 'Select Photos'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
              </div>

              {/* Basic info */}
              <div className="rmanage-form-section">
                <h4>Basic Information</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Route Name</label>
                    <input className="rmanage-form-input" value={formData.routeName} onChange={e => setFormData(p => ({ ...p, routeName: e.target.value }))} placeholder="e.g. Gaborone to Molepolole" />
                  </div>
                  <div className="rmanage-form-group rmanage-form-group-sm">
                    <label>Route Number</label>
                    <input className="rmanage-form-input" value={formData.routeNumber} onChange={e => setFormData(p => ({ ...p, routeNumber: e.target.value }))} placeholder="e.g. R001" />
                  </div>
                </div>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Route Type</label>
                    <select className="rmanage-form-select" value={formData.routeType} onChange={e => setFormData(p => ({ ...p, routeType: e.target.value }))}>
                      {ROUTE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="rmanage-form-group">
                    <label>Service Type</label>
                    <select className="rmanage-form-select" value={formData.serviceType} onChange={e => setFormData(p => ({ ...p, serviceType: e.target.value }))}>
                      {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="rmanage-form-group">
                  <label>Description</label>
                  <textarea className="rmanage-form-input rmanage-form-textarea" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief route description, stops, service notes..." rows={3} />
                </div>
              </div>

              {/* Route path */}
              <div className="rmanage-form-section">
                <h4>Route Path</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Origin *</label>
                    <input className="rmanage-form-input" value={formData.origin.name} onChange={e => setFormData(p => ({ ...p, origin: { ...p.origin, name: e.target.value } }))} placeholder="Starting point" required />
                    <input className="rmanage-form-input rmanage-form-input-sub" value={formData.origin.address} onChange={e => setFormData(p => ({ ...p, origin: { ...p.origin, address: e.target.value } }))} placeholder="Address / rank (optional)" />
                  </div>
                  <div className="rmanage-form-group">
                    <label>Destination *</label>
                    <input className="rmanage-form-input" value={formData.destination.name} onChange={e => setFormData(p => ({ ...p, destination: { ...p.destination, name: e.target.value } }))} placeholder="End point" required />
                    <input className="rmanage-form-input rmanage-form-input-sub" value={formData.destination.address} onChange={e => setFormData(p => ({ ...p, destination: { ...p.destination, address: e.target.value } }))} placeholder="Address / rank (optional)" />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="rmanage-form-section">
                <h4>Schedule</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Start Time</label>
                    <input type="time" className="rmanage-form-input" value={formData.schedule.startTime} onChange={e => setFormData(p => ({ ...p, schedule: { ...p.schedule, startTime: e.target.value } }))} />
                  </div>
                  <div className="rmanage-form-group">
                    <label>End Time</label>
                    <input type="time" className="rmanage-form-input" value={formData.schedule.endTime} onChange={e => setFormData(p => ({ ...p, schedule: { ...p.schedule, endTime: e.target.value } }))} />
                  </div>
                  <div className="rmanage-form-group">
                    <label>Frequency</label>
                    <input className="rmanage-form-input" value={formData.schedule.frequency} onChange={e => setFormData(p => ({ ...p, schedule: { ...p.schedule, frequency: e.target.value } }))} placeholder="e.g. On demand, Every 30 min" />
                  </div>
                </div>
                <div className="rmanage-form-group">
                  <label>Operating Days</label>
                  <div className="rmanage-days-grid">
                    {DAYS.map(day => (
                      <button type="button" key={day} className={`rmanage-day-btn ${formData.schedule.operatingDays.includes(day) ? 'active' : ''}`} onClick={() => toggleDay(day)}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & Vehicle */}
              <div className="rmanage-form-section">
                <h4>Pricing & Vehicle</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Base Fare (BWP) *</label>
                    <input type="number" className="rmanage-form-input" value={formData.pricing.baseFare} onChange={e => setFormData(p => ({ ...p, pricing: { ...p.pricing, baseFare: e.target.value } }))} placeholder="0.00" step="0.50" min="0" required />
                  </div>
                  <div className="rmanage-form-group">
                    <label>Vehicle Type</label>
                    <input className="rmanage-form-input" value={formData.vehicleType} onChange={e => setFormData(p => ({ ...p, vehicleType: e.target.value }))} placeholder="e.g. Combi, Bus, Sedan" />
                  </div>
                  <div className="rmanage-form-group rmanage-form-group-sm">
                    <label>Capacity</label>
                    <input type="number" className="rmanage-form-input" value={formData.capacity} onChange={e => setFormData(p => ({ ...p, capacity: e.target.value }))} placeholder="Seats" min="1" />
                  </div>
                </div>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Estimated Duration</label>
                    <input className="rmanage-form-input" value={formData.estimatedDuration} onChange={e => setFormData(p => ({ ...p, estimatedDuration: e.target.value }))} placeholder="e.g. 45 min, 2h" />
                  </div>
                  <div className="rmanage-form-group">
                    <label>Distance</label>
                    <input className="rmanage-form-input" value={formData.distance} onChange={e => setFormData(p => ({ ...p, distance: e.target.value }))} placeholder="e.g. 45 km" />
                  </div>
                  <div className="rmanage-form-group">
                    <label>Status</label>
                    <select className="rmanage-form-select" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rmanage-form-section">
                <h4>Contact</h4>
                <div className="rmanage-form-row">
                  <div className="rmanage-form-group">
                    <label>Phone</label>
                    <input className="rmanage-form-input" value={formData.contact.phone} onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))} placeholder="+267 7x xxx xxx" />
                  </div>
                  <div className="rmanage-form-group">
                    <label>WhatsApp</label>
                    <input className="rmanage-form-input" value={formData.contact.whatsapp} onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, whatsapp: e.target.value } }))} placeholder="+267 7x xxx xxx" />
                  </div>
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="rmanage-upload-progress">
                  <div className="rmanage-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <div className="rmanage-form-actions">
                <button type="button" className="rmanage-btn rmanage-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="rmanage-btn rmanage-btn-primary" disabled={loading}>
                  <Save size={16} /> {loading ? 'Saving...' : editingRoute ? 'Update Route' : 'Add Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="rmanage-loading-overlay">
          <div className="rmanage-loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
