import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DriveMap.css';

// Fix default leaflet icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const API_BASE = 'https://bw-car-culture-api.vercel.app/api';

// Custom marker icons
const createIcon = (color, symbol) => L.divIcon({
  className: '',
  html: `<div class="dm-marker dm-marker--${color}"><span>${symbol}</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const icons = {
  charging: createIcon('green', '⚡'),
  camera: createIcon('orange', '📷'),
  national_park: createIcon('teal', '🌿'),
  solar: createIcon('yellow', '☀️'),
  recycling: createIcon('blue', '♻️'),
};

const LAYERS = [
  { key: 'charging', label: 'EV Charging', icon: '⚡', color: '#2ed573' },
  { key: 'cameras', label: 'Traffic Cameras', icon: '📷', color: '#ffa502' },
  { key: 'parks', label: 'National Parks', icon: '🌿', color: '#26de81' },
  { key: 'solar', label: 'Solar Facilities', icon: '☀️', color: '#ffd32a' },
  { key: 'recycling', label: 'Recycling Centres', icon: '♻️', color: '#45aaf2' },
];

// Component that handles map click for camera placement
function MapClickHandler({ active, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (active) onMapClick(e.latlng);
    },
  });
  return null;
}

export default function DriveMap() {
  const [activeLayers, setActiveLayers] = useState({ charging: true, cameras: true, parks: true, solar: true, recycling: true });
  const [chargingStations, setChargingStations] = useState([]);
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [ecoSpots, setEcoSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Camera contribution state
  const [placingCamera, setPlacingCamera] = useState(false);
  const [newCameraPos, setNewCameraPos] = useState(null);
  const [cameraForm, setCameraForm] = useState({ description: '', road: '', direction: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showContribPanel, setShowContribPanel] = useState(false);

  // Auth check (look for token in localStorage)
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const mapCenter = [-22.0, 24.0]; // center of Botswana
  const mapZoom = 6;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [csRes, tcRes, ecoRes] = await Promise.all([
          fetch(`${API_BASE}/drive-map/charging-stations`),
          fetch(`${API_BASE}/drive-map/traffic-cameras`),
          fetch(`${API_BASE}/drive-map/eco-spots`),
        ]);
        const csData = await csRes.json();
        const tcData = await tcRes.json();
        const ecoData = await ecoRes.json();
        if (csData.success) setChargingStations(csData.data);
        if (tcData.success) setTrafficCameras(tcData.data);
        if (ecoData.success) setEcoSpots(ecoData.data);
      } catch (err) {
        setError('Failed to load map data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const toggleLayer = (key) => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const handleMapClick = useCallback((latlng) => {
    setNewCameraPos(latlng);
    setShowContribPanel(true);
    setPlacingCamera(false);
    setSubmitStatus(null);
  }, []);

  const handleCameraSubmit = async (e) => {
    e.preventDefault();
    if (!newCameraPos) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/drive-map/traffic-cameras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lat: newCameraPos.lat,
          lng: newCameraPos.lng,
          ...cameraForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message });
        setCameraForm({ description: '', road: '', direction: '' });
        setNewCameraPos(null);
        setTimeout(() => setShowContribPanel(false), 2500);
      } else {
        setSubmitStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setSubmitStatus({ type: 'error', message: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getEcoIcon = (type) => {
    if (type === 'national_park') return icons.national_park;
    if (type === 'solar') return icons.solar;
    if (type === 'recycling') return icons.recycling;
    return icons.national_park;
  };

  const getEcoLayerKey = (type) => {
    if (type === 'national_park') return 'parks';
    if (type === 'solar') return 'solar';
    if (type === 'recycling') return 'recycling';
    return 'parks';
  };

  return (
    <div className="dm-page">
      {/* Header */}
      <div className="dm-header">
        <div className="dm-header-inner">
          <div className="dm-title-row">
            <h1 className="dm-title">Drive Map</h1>
            <p className="dm-subtitle">Explore Botswana's EV charging network, traffic cameras, and eco-friendly destinations</p>
          </div>
          {/* Layer toggles */}
          <div className="dm-layer-toggles">
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                className={`dm-layer-btn ${activeLayers[layer.key] ? 'dm-layer-btn--active' : ''}`}
                style={activeLayers[layer.key] ? { borderColor: layer.color, color: layer.color } : {}}
                onClick={() => toggleLayer(layer.key)}
              >
                <span>{layer.icon}</span>
                <span>{layer.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="dm-map-wrapper">
        {loading && (
          <div className="dm-loading-overlay">
            <div className="dm-spinner"></div>
            <p>Loading map data...</p>
          </div>
        )}
        {error && <div className="dm-error-banner">{error}</div>}

        {/* Placing camera hint */}
        {placingCamera && (
          <div className="dm-placing-hint">
            Click anywhere on the map to place the camera location
            <button onClick={() => setPlacingCamera(false)}>Cancel</button>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="dm-leaflet-map"
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler active={placingCamera} onMapClick={handleMapClick} />

          {/* EV Charging Stations */}
          {activeLayers.charging && chargingStations.map((s, i) => (
            <Marker key={`cs-${i}`} position={[s.lat, s.lng]} icon={icons.charging}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className="dm-popup-badge dm-popup-badge--green">⚡ EV Charging</div>
                  <h3>{s.name}</h3>
                  <p className="dm-popup-addr">{s.address}</p>
                  <div className="dm-popup-details">
                    <span><strong>Connector:</strong> {s.type}</span>
                    <span><strong>Speed:</strong> {s.speed}</span>
                    <span className={`dm-popup-status dm-popup-status--${s.status}`}>{s.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Traffic Cameras */}
          {activeLayers.cameras && trafficCameras.map((c, i) => (
            <Marker key={`tc-${i}`} position={[c.lat, c.lng]} icon={icons.camera}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className="dm-popup-badge dm-popup-badge--orange">📷 Traffic Camera</div>
                  <h3>{c.description}</h3>
                  {c.road && <p className="dm-popup-addr">{c.road} {c.direction && `— ${c.direction}`}</p>}
                  <p className="dm-popup-meta">Contributed by: {c.contributorName}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Eco Spots (parks, solar, recycling) */}
          {ecoSpots.filter(s => activeLayers[getEcoLayerKey(s.type)]).map((s, i) => (
            <Marker key={`eco-${i}`} position={[s.lat, s.lng]} icon={getEcoIcon(s.type)}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className={`dm-popup-badge dm-popup-badge--${s.type === 'solar' ? 'yellow' : s.type === 'recycling' ? 'blue' : 'teal'}`}>
                    {s.type === 'national_park' ? '🌿 National Park' : s.type === 'solar' ? '☀️ Solar Facility' : '♻️ Recycling Centre'}
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* New camera placement marker */}
          {newCameraPos && (
            <Marker position={newCameraPos} icon={icons.camera}>
              <Popup>New camera location</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Contribute camera button */}
        {isLoggedIn && !placingCamera && (
          <button className="dm-fab-btn" title="Contribute a traffic camera location" onClick={() => { setPlacingCamera(true); setShowContribPanel(false); setNewCameraPos(null); }}>
            <span>📷</span>
            <span>Add Camera</span>
          </button>
        )}
        {!isLoggedIn && (
          <div className="dm-login-hint">
            <span>📷</span>
            <span>Sign in to contribute traffic camera locations</span>
          </div>
        )}

        {/* Camera contribution form panel */}
        {showContribPanel && newCameraPos && (
          <div className="dm-contrib-panel">
            <div className="dm-contrib-header">
              <h3>Report Traffic Camera</h3>
              <button className="dm-contrib-close" onClick={() => { setShowContribPanel(false); setNewCameraPos(null); }}>✕</button>
            </div>
            <p className="dm-contrib-coords">
              Location: {newCameraPos.lat.toFixed(5)}, {newCameraPos.lng.toFixed(5)}
            </p>
            {submitStatus ? (
              <div className={`dm-submit-status dm-submit-status--${submitStatus.type}`}>{submitStatus.message}</div>
            ) : (
              <form onSubmit={handleCameraSubmit} className="dm-contrib-form">
                <label>
                  Description
                  <input
                    type="text"
                    placeholder="e.g. Speed camera on A1 northbound"
                    value={cameraForm.description}
                    onChange={e => setCameraForm(p => ({ ...p, description: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Road / Street
                  <input
                    type="text"
                    placeholder="e.g. A1 Highway"
                    value={cameraForm.road}
                    onChange={e => setCameraForm(p => ({ ...p, road: e.target.value }))}
                  />
                </label>
                <label>
                  Direction
                  <input
                    type="text"
                    placeholder="e.g. Northbound, Towards Gaborone"
                    value={cameraForm.direction}
                    onChange={e => setCameraForm(p => ({ ...p, direction: e.target.value }))}
                  />
                </label>
                <button type="submit" className="dm-submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="dm-stats-bar">
        <div className="dm-stat">
          <span className="dm-stat-icon">⚡</span>
          <span className="dm-stat-count">{chargingStations.length}</span>
          <span className="dm-stat-label">Charging Stations</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-icon">📷</span>
          <span className="dm-stat-count">{trafficCameras.length}</span>
          <span className="dm-stat-label">Traffic Cameras</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-icon">🌿</span>
          <span className="dm-stat-count">{ecoSpots.filter(s => s.type === 'national_park').length}</span>
          <span className="dm-stat-label">National Parks</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-icon">☀️</span>
          <span className="dm-stat-count">{ecoSpots.filter(s => s.type === 'solar').length}</span>
          <span className="dm-stat-label">Solar Facilities</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-icon">♻️</span>
          <span className="dm-stat-count">{ecoSpots.filter(s => s.type === 'recycling').length}</span>
          <span className="dm-stat-label">Recycling Centres</span>
        </div>
      </div>

      <div className="dm-data-note">
        Map data includes verified EV charging locations, user-contributed traffic camera reports (pending review), and eco-friendly points of interest sourced from public data. Camera contributions are reviewed before appearing on the map.
      </div>
    </div>
  );
}
