// client/src/components/profile/RegisterVehicleTab.js

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Car, Save, Info, CheckCircle, Trash2, Upload, FileCheck } from 'lucide-react';
import axios from '../../config/axios.js';
import { loadCarModel } from '../../utils/modelCache.js';
import { findVehicleModel, vehicleDisplayName, HERO_VEHICLE } from '../../utils/vehicleModels.js';
import ThreeDBadge from '../shared/ThreeDBadge/ThreeDBadge.js';
import './RegisterVehicleTab.css';

const DEMO_COLORS = [
  { label: 'Pearl White',   hex: '#EBEBEB' },
  { label: 'Deep Blue',     hex: '#1a3a6b' },
  { label: 'Phantom Black', hex: '#1a1a1a' },
  { label: 'Tornado Red',   hex: '#c0392b' },
  { label: 'Lapiz Blue',    hex: '#1e4d8c' },
  { label: 'Reflex Silver', hex: '#b0b0b0' },
];

const CURRENT_YEAR = new Date().getFullYear();

const emptyForm = {
  make: '',
  model: '',
  year: '',
  regPlate: '',
  vin: '',
  color: '#EBEBEB',
  serviceShop: '',
  serviceRecords: '',
};

// ── Three.js Viewer ──────────────────────────────────────────────────────────
const CarViewer = ({ color }) => {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const colorRef = useRef(color);
  colorRef.current = color;
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const [status, setStatus]   = useState('loading'); // 'loading' | 'ready' | 'error'
  const [progress, setProgress] = useState(0); // 0–100

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width  = container.clientWidth  || 400;
    const height = container.clientHeight || 380;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene & Camera
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color('#0d0d0d');
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 1.5, 4);
    camera.lookAt(0, 0.4, 0);

    // Lights (from handoff doc)
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xfff5e0, 4);
    key.position.set(4, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe0eeff, 1.5);
    fill.position.set(-5, 3, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 2);
    rim.position.set(0, 4, -5);
    scene.add(rim);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.4, 0);
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    // Load model (uses in-memory cache if already fetched)
    loadCarModel(({ percent }) => setProgress(percent))
      .then((gltf) => {
        const car = gltf.scene;
        modelRef.current = car;
        scene.add(car);

        // Safe keyword/substring list — non-car-part identifiers
        const HIDE_KEYWORDS = [
          'turntable', 'platform', 'ground', 'floor', 'shadow', 'spoon',
          'highpoly', 'lowpoly',
          '2262a6d3f82749',
          'wheel.obj.cleaner.materialmerger.gles',
        ];
        // Object_2 … Object_10 (BBS mesh parts)
        const HIDE_OBJECT_RE = /^object_([2-9]|10)$/i;
        // RootNode.001 and beyond (download artifacts)
        const HIDE_ROOTNODE_RE = /^rootnode\.\d{3,}$/i;

        // Measure the overall car bounding box so we can detect oversized flat meshes
        const carBox = new THREE.Box3().setFromObject(car);
        const carSize = new THREE.Vector3();
        carBox.getSize(carSize);

        car.traverse((node) => {
          if (node.isMesh) {
            const nameLower = node.name.toLowerCase();
            const matName = (Array.isArray(node.material) ? node.material[0]?.name : node.material?.name) || '';
            console.log('[3D] mesh:', node.name, '| mat:', matName);
            const matLower = matName.toLowerCase();

            // Hide by safe keyword / regex match
            if (
              HIDE_KEYWORDS.some(k => nameLower.includes(k) || matLower.includes(k)) ||
              HIDE_OBJECT_RE.test(node.name) ||
              HIDE_ROOTNODE_RE.test(node.name)
            ) {
              node.visible = false;
              return;
            }

            // Hide any large flat disc near ground level (turntable not caught by name)
            const meshBox = new THREE.Box3().setFromObject(node);
            const meshSize = new THREE.Vector3();
            const meshCenter = new THREE.Vector3();
            meshBox.getSize(meshSize);
            meshBox.getCenter(meshCenter);
            const isWide  = meshSize.x > carSize.x * 0.7 || meshSize.z > carSize.z * 0.7;
            const isFlat  = meshSize.y < 0.25;
            const isLow   = meshCenter.y < 0.15;
            if (isWide && isFlat && isLow) {
              node.visible = false;
              return;
            }

            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach(mat => {
              if (mat.name === 'MAT_Body_Paint' || mat.name === 'CarPaint') {
                mat.color.set(colorRef.current || '#EBEBEB');
                mat.needsUpdate = true;
              }
            });
          }
        });

        setStatus('ready');
      })
      .catch((err) => {
        console.error('GLTF load error:', err);
        setStatus('error');
      });

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Live paint color update
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.traverse((node) => {
      if (node.isMesh) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach(mat => {
          if (mat.name === 'MAT_Body_Paint' || mat.name === 'CarPaint') {
            mat.color.set(color);
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [color]);

  return (
    <div className="rvt-viewer-wrapper" ref={mountRef}>
      {status === 'loading' && (
        <div className="rvt-model-overlay">
          <span className="rvt-spinner" />
          <span>{progress > 0 ? `Loading model… ${progress}%` : 'Loading model…'}</span>
          {progress > 0 && (
            <div className="rvt-progress-bar">
              <div className="rvt-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      {status === 'error' && (
        <div className="rvt-model-overlay">
          <span style={{ color: '#555', fontSize: '0.85rem' }}>Could not load 3D model</span>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const STATUS_LABELS = { pending: 'Pending review', approved: 'Verified', rejected: 'Not approved' };

// Downscale and re-encode so proof photos stay well under the API's request size limit.
const compressProofImage = (file, maxSide = 1600, quality = 0.82) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image (photo or scan) of your ownership document.')); return; }
  if (file.size > 15 * 1024 * 1024) { reject(new Error('That image is too large — please use one under 15MB.')); return; }
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  img.onload = () => {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image. Try a JPEG or PNG.')); };
  img.src = url;
});

const uploadProof = (vehicleId, image) => axios.post(`/user/register-vehicle/${vehicleId}/proof`, { image });

const ModelComingSoon = ({ name }) => (
  <div className="rvt-viewer-wrapper rvt-model-soon">
    <Car size={40} />
    <strong>{name} digital model will be available soon.</strong>
    <span>We're adding more 3D models on our side — your vehicle is saved and we'll let you know.</span>
  </div>
);

const RegisterVehicleTab = ({ profileData, refreshProfile }) => {
  const [form, setForm]   = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState('');
  const [error, setError]   = useState('');
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [proofImage, setProofImage] = useState('');
  const [proofUploadingId, setProofUploadingId] = useState(null);
  const proofInputRef = useRef(null);

  const handleProofPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try { setProofImage(await compressProofImage(file)); }
    catch (err) { setError(err.message); }
  };

  const markProofUploaded = (vehicleId, data) => {
    setRegisteredVehicles(prev => prev.map(v => String(v._id) === String(vehicleId)
      ? { ...v, ownershipProof: data.ownershipProof, status: data.status || v.status } : v));
  };

  const handleCardProof = async (vehicle, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setProofUploadingId(vehicle._id);
    try {
      const image = await compressProofImage(file);
      const response = await uploadProof(vehicle._id, image);
      if (!response.data.success) throw new Error(response.data.message);
      markProofUploaded(vehicle._id, response.data.data);
      setSaved(`Proof of ownership sent for ${vehicleDisplayName(vehicle)}.`);
      setTimeout(() => setSaved(''), 6000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload proof of ownership.');
    } finally {
      setProofUploadingId(null);
    }
  };

  useEffect(() => {
    if (Array.isArray(profileData?.registeredVehicles)) {
      setRegisteredVehicles(profileData.registeredVehicles);
    }
  }, [profileData]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleColorSwatch = (hex) => {
    setForm(prev => ({ ...prev, color: hex }));
  };

  // What the viewer shows: the car being typed, else the selected/latest registration, else the demo.
  const typing = form.make.trim() && form.model.trim();
  const selected = registeredVehicles.find(v => String(v._id) === String(selectedId)) ||
    registeredVehicles[registeredVehicles.length - 1];
  const subject = typing ? form : selected;
  const subjectModel = subject ? findVehicleModel(subject) : HERO_VEHICLE;
  const subjectName = subject ? `${subject.year ? `${subject.year} ` : ''}${vehicleDisplayName(subject)}` : HERO_VEHICLE.name;
  const viewerColor = typing || !subject ? form.color : (subject.color || '#EBEBEB');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const year = Number(form.year);
    if (!form.make.trim() || !form.model.trim() || !form.year || !form.regPlate.trim()) {
      setError('Make, model, year and registration plate are required.');
      return;
    }
    if (!Number.isInteger(year) || year < 1950 || year > CURRENT_YEAR + 1) {
      setError(`Enter a year between 1950 and ${CURRENT_YEAR + 1}.`);
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form, vehicleName: vehicleDisplayName(form) };
      const response = await axios.post('/user/register-vehicle', payload);
      if (response.data.success) {
        const vehicle = response.data.data;
        const model = findVehicleModel(vehicle);
        setRegisteredVehicles(prev => [...prev, vehicle]);
        setSelectedId(vehicle._id);
        setSaved(model
          ? `${vehicleDisplayName(vehicle)} registered — its 3D digital model is ready below.`
          : `${vehicleDisplayName(vehicle)} registered. Its digital model will be available soon.`);
        if (proofImage) {
          try {
            const proofResponse = await uploadProof(vehicle._id, proofImage);
            if (!proofResponse.data.success) throw new Error(proofResponse.data.message);
            markProofUploaded(vehicle._id, proofResponse.data.data);
          } catch (proofErr) {
            setError(`Vehicle registered, but the proof of ownership didn't upload (${proofErr.response?.data?.message || proofErr.message}). Use "Upload proof" on the vehicle below to try again.`);
          }
        }
        setProofImage('');
        setForm(emptyForm);
        if (refreshProfile) refreshProfile();
        setTimeout(() => setSaved(''), 6000);
      } else {
        setError(response.data.message || 'Failed to register vehicle.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (vehicle) => {
    if (!window.confirm(`Remove ${vehicleDisplayName(vehicle)} (${vehicle.regPlate}) from your registered vehicles?`)) return;
    setRemovingId(vehicle._id);
    setError('');
    try {
      const response = await axios.delete(`/user/register-vehicle/${vehicle._id}`);
      if (!response.data.success) throw new Error(response.data.message);
      setRegisteredVehicles(prev => prev.filter(v => String(v._id) !== String(vehicle._id)));
      if (refreshProfile) refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove vehicle.');
    } finally {
      setRemovingId(null);
    }
  };

  const hasRegistered = registeredVehicles.length > 0;
  const isDemo = !subject;

  return (
    <div className="rvt-container">
      <div className="rvt-header">
        <h2 className="rvt-title">Register Your Vehicle</h2>
        <p className="rvt-subtitle">Create a digital twin of your car — track service history and more.</p>
      </div>

      <div className="rvt-body">
        {/* 3D Viewer */}
        <div className="rvt-viewer-panel">
          <div className="rvt-viewer-badge">
            {isDemo ? `Demo — ${HERO_VEHICLE.name}` : subjectName}
          </div>
          {subjectModel && <ThreeDBadge className="rvt-3d-badge" />}
          {subjectModel ? <CarViewer color={viewerColor} /> : <ModelComingSoon name={subjectName} />}
          <div className="rvt-viewer-note">
            <Info size={13} />
            <span>
              {isDemo
                ? 'Enter your make and model — we\'ll check whether a 3D digital model is available for it.'
                : subjectModel
                  ? `3D digital model available for ${vehicleDisplayName(subject)}.`
                  : 'No 3D model yet for this vehicle — more models are being added.'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="rvt-form-panel">
          {saved && <div className="rvt-success-banner"><CheckCircle size={16} /> {saved}</div>}
          {error && <div className="rvt-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="rvt-form">
            <div className="rvt-field-row rvt-field-row--three">
              <div className="rvt-field">
                <label className="rvt-label" htmlFor="rvt-make">Make *</label>
                <input id="rvt-make" className="rvt-input" name="make" value={form.make}
                  onChange={handleChange} placeholder="e.g. Volkswagen" maxLength={40} />
              </div>
              <div className="rvt-field">
                <label className="rvt-label" htmlFor="rvt-model">Model *</label>
                <input id="rvt-model" className="rvt-input" name="model" value={form.model}
                  onChange={handleChange} placeholder="e.g. Golf 8.5 R" maxLength={60} />
              </div>
              <div className="rvt-field rvt-field-sm">
                <label className="rvt-label" htmlFor="rvt-year">Year *</label>
                <input id="rvt-year" className="rvt-input" name="year" type="number"
                  min="1950" max={CURRENT_YEAR + 1} value={form.year}
                  onChange={handleChange} placeholder={String(CURRENT_YEAR)} />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label" htmlFor="rvt-plate">Registration Plate *</label>
                <input id="rvt-plate" className="rvt-input rvt-input-plate" name="regPlate" value={form.regPlate}
                  onChange={e => setForm(prev => ({ ...prev, regPlate: e.target.value.toUpperCase() }))}
                  placeholder="B 123 ABC" maxLength={12} />
              </div>
              <div className="rvt-field">
                <label className="rvt-label" htmlFor="rvt-vin">VIN</label>
                <input id="rvt-vin" className="rvt-input" name="vin" value={form.vin}
                  onChange={e => setForm(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                  placeholder="17-character VIN (optional)" maxLength={17} />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label" htmlFor="rvt-shop">Service Shop</label>
                <input id="rvt-shop" className="rvt-input" name="serviceShop" value={form.serviceShop}
                  onChange={handleChange} placeholder="Where you service your vehicle" maxLength={80} />
              </div>
            </div>

            <div className="rvt-field">
              <label className="rvt-label">Vehicle Color</label>
              <div className="rvt-color-row">
                <input type="color" className="rvt-color-picker" name="color"
                  value={form.color} onChange={handleChange} title="Pick a custom color" />
                <div className="rvt-color-swatches">
                  {DEMO_COLORS.map(c => (
                    <button key={c.hex} type="button"
                      className={`rvt-swatch ${form.color === c.hex ? 'rvt-swatch-active' : ''}`}
                      style={{ background: c.hex }} title={c.label} aria-label={c.label}
                      onClick={() => handleColorSwatch(c.hex)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="rvt-field">
              <label className="rvt-label" htmlFor="rvt-records">Service Records</label>
              <textarea id="rvt-records" className="rvt-textarea" name="serviceRecords" value={form.serviceRecords}
                onChange={handleChange} placeholder="Paste any service history notes here (optional)" rows={3} maxLength={2000} />
            </div>

            <div className="rvt-field">
              <span className="rvt-label">Proof of Ownership</span>
              <p className="rvt-help">A clear photo or scan of your registration certificate (blue book) or purchase document. Only you and our verification team can see it.</p>
              <input ref={proofInputRef} id="rvt-proof" type="file" accept="image/*" className="rvt-file-input" onChange={handleProofPick} />
              {proofImage ? (
                <div className="rvt-proof-preview">
                  <img src={proofImage} alt="Proof of ownership preview" />
                  <div className="rvt-proof-preview-actions">
                    <button type="button" onClick={() => proofInputRef.current?.click()}>Replace</button>
                    <button type="button" onClick={() => setProofImage('')}>Remove</button>
                  </div>
                </div>
              ) : (
                <label htmlFor="rvt-proof" className="rvt-proof-drop">
                  <Upload size={18} />
                  <span>Upload image</span>
                  <small>JPEG, PNG or WebP — you can also add it later</small>
                </label>
              )}
            </div>

            <button type="submit" className="rvt-submit-btn" disabled={saving}>
              {saving ? <span className="rvt-spinner" /> : <Save size={16} />}
              {saving ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>

          {hasRegistered && (
            <div className="rvt-registered-list">
              <h4 className="rvt-registered-title">Your Registered Vehicles</h4>
              {registeredVehicles.map((v) => {
                const hasModel = !!findVehicleModel(v);
                const isSelected = !typing && selected && String(selected._id) === String(v._id);
                return (
                  <div key={v._id || v.regPlate} className={`rvt-registered-card${isSelected ? ' rvt-registered-card--active' : ''}`}>
                    <button type="button" className="rvt-registered-main" onClick={() => setSelectedId(v._id)}
                      title="Preview this vehicle">
                      <Car size={14} />
                      <span>{vehicleDisplayName(v)} ({v.year})</span>
                      <span className="rvt-registered-plate">{v.regPlate}</span>
                    </button>
                    <span className={`rvt-reg-status rvt-reg-status--${v.status || 'pending'}`}>
                      {STATUS_LABELS[v.status] || STATUS_LABELS.pending}
                    </span>
                    {hasModel
                      ? <ThreeDBadge compact label="3D digital model available" />
                      : <span className="rvt-model-pending">Model soon</span>}
                    {v._id && (v.ownershipProof ? (
                      <span className="rvt-proof-ok" title={`Proof sent ${new Date(v.ownershipProof.uploadedAt).toLocaleDateString()}`}>
                        <FileCheck size={13} /> Proof sent
                      </span>
                    ) : (
                      <label className={`rvt-proof-btn${proofUploadingId === v._id ? ' is-busy' : ''}`}>
                        <Upload size={13} /> {proofUploadingId === v._id ? 'Uploading…' : 'Upload proof'}
                        <input type="file" accept="image/*" className="rvt-file-input"
                          disabled={proofUploadingId === v._id} onChange={e => handleCardProof(v, e)} />
                      </label>
                    ))}
                    {v._id && (
                      <button type="button" className="rvt-remove-btn" disabled={removingId === v._id}
                        onClick={() => handleRemove(v)} aria-label={`Remove ${vehicleDisplayName(v)}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RegisterVehicleTab;
