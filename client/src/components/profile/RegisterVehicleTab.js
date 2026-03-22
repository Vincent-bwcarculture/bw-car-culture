// client/src/components/profile/RegisterVehicleTab.js

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Car, Save, Info, CheckCircle } from 'lucide-react';
import axios from '../../config/axios.js';
import './RegisterVehicleTab.css';

// Model hosted on S3
const MODEL_URL = 'https://i3wcarculture-images.s3.amazonaws.com/models/golf_r_configurator.glb';
const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

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
  vehicleName: '',
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
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

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

    // Load model directly from jsDelivr CDN
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
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
                mat.color.set('#EBEBEB');
                mat.needsUpdate = true;
              }
            });
          }
        });

        setStatus('ready');
      },
      undefined,
      (err) => {
        console.error('GLTF load error:', err);
        setStatus('error');
      }
    );

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
          <span>Loading model...</span>
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
const RegisterVehicleTab = ({ profileData, refreshProfile }) => {
  const [form, setForm]   = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');
  const [registeredVehicles, setRegisteredVehicles] = useState([]);

  useEffect(() => {
    if (profileData?.registeredVehicles?.length) {
      setRegisteredVehicles(profileData.registeredVehicles);
    }
  }, [profileData]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleColorSwatch = (hex) => {
    setForm(prev => ({ ...prev, color: hex }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.vehicleName || !form.year || !form.regPlate) {
      setError('Vehicle name, year, and registration plate are required.');
      return;
    }
    try {
      setSaving(true);
      const response = await axios.post('/user/register-vehicle', { ...form });
      if (response.data.success) {
        setSaved(true);
        setRegisteredVehicles(prev => [...prev, response.data.data]);
        setForm(emptyForm);
        if (refreshProfile) refreshProfile();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(response.data.message || 'Failed to register vehicle.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasRegistered = registeredVehicles.length > 0;

  return (
    <div className="rvt-container">
      <div className="rvt-header">
        <div className="rvt-header-icon"><Car size={22} /></div>
        <div>
          <h2 className="rvt-title">Register Your Vehicle</h2>
          <p className="rvt-subtitle">Create a digital twin of your car — track service history and more.</p>
        </div>
      </div>

      <div className="rvt-body">
        {/* 3D Viewer */}
        <div className="rvt-viewer-panel">
          <div className="rvt-viewer-badge">
            {hasRegistered ? 'Your Digital Twin' : 'Demo — VW Golf R'}
          </div>
          <CarViewer color={form.color} />
          <div className="rvt-viewer-note">
            <Info size={13} />
            <span>
              {hasRegistered
                ? 'Your vehicle digital twin — track service history and more.'
                : 'Register your vehicle to order your digital twin or get personalised service tracking.'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="rvt-form-panel">
          {saved && <div className="rvt-success-banner"><CheckCircle size={16} /> Vehicle registered successfully!</div>}
          {error && <div className="rvt-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="rvt-form">
            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Vehicle Name *</label>
                <input className="rvt-input" name="vehicleName" value={form.vehicleName}
                  onChange={handleChange} placeholder="e.g. VW Golf R Mk7.5" />
              </div>
              <div className="rvt-field rvt-field-sm">
                <label className="rvt-label">Year *</label>
                <input className="rvt-input" name="year" type="number"
                  min="1980" max={CURRENT_YEAR + 1} value={form.year}
                  onChange={handleChange} placeholder={String(CURRENT_YEAR)} />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Registration Plate *</label>
                <input className="rvt-input rvt-input-plate" name="regPlate" value={form.regPlate}
                  onChange={e => setForm(prev => ({ ...prev, regPlate: e.target.value.toUpperCase() }))}
                  placeholder="B 123 ABC" maxLength={10} />
              </div>
              <div className="rvt-field">
                <label className="rvt-label">VIN</label>
                <input className="rvt-input" name="vin" value={form.vin}
                  onChange={handleChange} placeholder="17-character VIN (optional)" maxLength={17} />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Service Shop</label>
                <input className="rvt-input" name="serviceShop" value={form.serviceShop}
                  onChange={handleChange} placeholder="Where you service your vehicle" />
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
                      style={{ background: c.hex }} title={c.label}
                      onClick={() => handleColorSwatch(c.hex)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="rvt-field">
              <label className="rvt-label">Service Records</label>
              <textarea className="rvt-textarea" name="serviceRecords" value={form.serviceRecords}
                onChange={handleChange} placeholder="Paste any service history notes here (optional)" rows={3} />
            </div>

            <button type="submit" className="rvt-submit-btn" disabled={saving}>
              {saving ? <span className="rvt-spinner" /> : <Save size={16} />}
              {saving ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>

          {hasRegistered && (
            <div className="rvt-registered-list">
              <h4 className="rvt-registered-title">Your Registered Vehicles</h4>
              {registeredVehicles.map((v, i) => (
                <div key={i} className="rvt-registered-card">
                  <Car size={14} />
                  <span>{v.vehicleName} ({v.year})</span>
                  <span className="rvt-registered-plate">{v.regPlate}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RegisterVehicleTab;
