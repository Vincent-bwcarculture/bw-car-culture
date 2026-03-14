import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './DriveMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API_BASE = 'https://bw-car-culture-api.vercel.app/api';

const createIcon = (color, letter) => L.divIcon({
  className: '',
  html: `<div class="dm-marker dm-marker--${color}"><span>${letter}</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const icons = {
  charging: createIcon('green', 'EV'),
  camera: createIcon('orange', 'TC'),
  hazard: createIcon('red', 'RH'),
};

const HAZARD_TYPES = ['Pothole', 'Flooding', 'Roadworks', 'Accident', 'Debris', 'Poor Visibility', 'Other'];

const LAYERS = [
  { key: 'charging', label: 'EV Charging', color: '#2ed573' },
  { key: 'cameras', label: 'Traffic Cameras', color: '#ffa502' },
  { key: 'hazards', label: 'Road Hazards', color: '#ff4757' },
];

function MapClickHandler({ active, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (active) onMapClick(e.latlng);
    },
  });
  return null;
}

const PANEL_NONE = null;
const PANEL_CAMERA = 'camera';
const PANEL_HAZARD = 'hazard';

export default function DriveMap() {
  const [activeLayers, setActiveLayers] = useState({ charging: true, cameras: true, hazards: true });
  const [chargingStations, setChargingStations] = useState([]);
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [roadHazards, setRoadHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contribution state
  const [placingType, setPlacingType] = useState(null); // 'camera' | 'hazard' | null
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [activePanel, setActivePanel] = useState(PANEL_NONE);

  const [cameraForm, setCameraForm] = useState({ description: '', road: '', direction: '' });
  const [hazardForm, setHazardForm] = useState({ type: 'Pothole', description: '', road: '' });

  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const mapCenter = [-22.0, 24.0];
  const mapZoom = 6;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [csRes, tcRes, rhRes] = await Promise.all([
          fetch(`${API_BASE}/drive-map/charging-stations`),
          fetch(`${API_BASE}/drive-map/traffic-cameras`),
          fetch(`${API_BASE}/drive-map/road-hazards`),
        ]);
        const csData = await csRes.json();
        const tcData = await tcRes.json();
        const rhData = await rhRes.json();
        if (csData.success) setChargingStations(csData.data);
        if (tcData.success) setTrafficCameras(tcData.data);
        if (rhData.success) setRoadHazards(rhData.data);
      } catch (err) {
        setError('Failed to load map data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const toggleLayer = (key) => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const startPlacing = (type) => {
    setPlacingType(type);
    setActivePanel(PANEL_NONE);
    setNewMarkerPos(null);
    setSubmitStatus(null);
  };

  const cancelPlacing = () => {
    setPlacingType(null);
    setNewMarkerPos(null);
    setActivePanel(PANEL_NONE);
  };

  const handleMapClick = useCallback((latlng) => {
    setNewMarkerPos(latlng);
    setActivePanel(placingType);
    setPlacingType(null);
    setSubmitStatus(null);
  }, [placingType]);

  const handleCameraSubmit = async (e) => {
    e.preventDefault();
    if (!newMarkerPos) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/drive-map/traffic-cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lat: newMarkerPos.lat, lng: newMarkerPos.lng, ...cameraForm }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message });
        setCameraForm({ description: '', road: '', direction: '' });
        setNewMarkerPos(null);
        setTimeout(() => setActivePanel(PANEL_NONE), 2500);
      } else {
        setSubmitStatus({ type: 'error', message: data.message });
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHazardSubmit = async (e) => {
    e.preventDefault();
    if (!newMarkerPos) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/drive-map/road-hazards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lat: newMarkerPos.lat, lng: newMarkerPos.lng, ...hazardForm }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message });
        setHazardForm({ type: 'Pothole', description: '', road: '' });
        setNewMarkerPos(null);
        setTimeout(() => setActivePanel(PANEL_NONE), 2500);
      } else {
        setSubmitStatus({ type: 'error', message: data.message });
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dm-page">
      <div className="dm-header">
        <div className="dm-header-inner">
          <div className="dm-title-row">
            <h1 className="dm-title">Drive Map</h1>
            <p className="dm-subtitle">Explore Botswana's EV charging network, traffic cameras, and road hazards</p>
          </div>
          <div className="dm-layer-toggles">
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                className={`dm-layer-btn ${activeLayers[layer.key] ? 'dm-layer-btn--active' : ''}`}
                style={activeLayers[layer.key] ? { borderColor: layer.color, color: layer.color } : {}}
                onClick={() => toggleLayer(layer.key)}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dm-map-wrapper">
        {loading && (
          <div className="dm-loading-overlay">
            <div className="dm-spinner"></div>
            <p>Loading map data...</p>
          </div>
        )}
        {error && <div className="dm-error-banner">{error}</div>}

        {placingType && (
          <div className="dm-placing-hint">
            Click on the map to mark the {placingType === 'camera' ? 'camera' : 'hazard'} location
            <button onClick={cancelPlacing}>Cancel</button>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={mapZoom} className="dm-leaflet-map" zoomControl={false}>
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler active={!!placingType} onMapClick={handleMapClick} />

          {activeLayers.charging && chargingStations.map((s, i) => (
            <Marker key={`cs-${i}`} position={[s.lat, s.lng]} icon={icons.charging}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className="dm-popup-badge dm-popup-badge--green">EV Charging</div>
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

          {activeLayers.cameras && trafficCameras.map((c, i) => (
            <Marker key={`tc-${i}`} position={[c.lat, c.lng]} icon={icons.camera}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className="dm-popup-badge dm-popup-badge--orange">Traffic Camera</div>
                  <h3>{c.description}</h3>
                  {c.road && <p className="dm-popup-addr">{c.road}{c.direction && ` — ${c.direction}`}</p>}
                  <p className="dm-popup-meta">Contributed by: {c.contributorName}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {activeLayers.hazards && roadHazards.map((h, i) => (
            <Marker key={`rh-${i}`} position={[h.lat, h.lng]} icon={icons.hazard}>
              <Popup className="dm-popup">
                <div className="dm-popup-inner">
                  <div className="dm-popup-badge dm-popup-badge--red">Road Hazard</div>
                  <h3>{h.type}</h3>
                  <p>{h.description}</p>
                  {h.road && <p className="dm-popup-addr">{h.road}</p>}
                  <p className="dm-popup-meta">Reported by: {h.contributorName}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {newMarkerPos && (
            <Marker position={newMarkerPos} icon={activePanel === PANEL_HAZARD ? icons.hazard : icons.camera}>
              <Popup>Pending location</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* FAB buttons */}
        {isLoggedIn && !placingType && (
          <div className="dm-fab-group">
            <button className="dm-fab-btn dm-fab-btn--orange" onClick={() => startPlacing('camera')}>
              + Traffic Camera
            </button>
            <button className="dm-fab-btn dm-fab-btn--red" onClick={() => startPlacing('hazard')}>
              + Road Hazard
            </button>
          </div>
        )}
        {!isLoggedIn && (
          <div className="dm-login-hint">Sign in to contribute traffic cameras and road hazards</div>
        )}

        {/* Camera contribution panel */}
        {activePanel === PANEL_CAMERA && newMarkerPos && (
          <div className="dm-contrib-panel">
            <div className="dm-contrib-header">
              <h3>Report Traffic Camera</h3>
              <button className="dm-contrib-close" onClick={() => { setActivePanel(PANEL_NONE); setNewMarkerPos(null); }}>✕</button>
            </div>
            <p className="dm-contrib-coords">Location: {newMarkerPos.lat.toFixed(5)}, {newMarkerPos.lng.toFixed(5)}</p>
            {submitStatus ? (
              <div className={`dm-submit-status dm-submit-status--${submitStatus.type}`}>{submitStatus.message}</div>
            ) : (
              <form onSubmit={handleCameraSubmit} className="dm-contrib-form">
                <label>Description <input type="text" placeholder="e.g. Speed camera on A1 northbound" value={cameraForm.description} onChange={e => setCameraForm(p => ({ ...p, description: e.target.value }))} required /></label>
                <label>Road / Street <input type="text" placeholder="e.g. A1 Highway" value={cameraForm.road} onChange={e => setCameraForm(p => ({ ...p, road: e.target.value }))} /></label>
                <label>Direction <input type="text" placeholder="e.g. Northbound" value={cameraForm.direction} onChange={e => setCameraForm(p => ({ ...p, direction: e.target.value }))} /></label>
                <button type="submit" className="dm-submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Review'}</button>
              </form>
            )}
          </div>
        )}

        {/* Hazard contribution panel */}
        {activePanel === PANEL_HAZARD && newMarkerPos && (
          <div className="dm-contrib-panel">
            <div className="dm-contrib-header">
              <h3>Report Road Hazard</h3>
              <button className="dm-contrib-close" onClick={() => { setActivePanel(PANEL_NONE); setNewMarkerPos(null); }}>✕</button>
            </div>
            <p className="dm-contrib-coords">Location: {newMarkerPos.lat.toFixed(5)}, {newMarkerPos.lng.toFixed(5)}</p>
            {submitStatus ? (
              <div className={`dm-submit-status dm-submit-status--${submitStatus.type}`}>{submitStatus.message}</div>
            ) : (
              <form onSubmit={handleHazardSubmit} className="dm-contrib-form">
                <label>
                  Hazard Type
                  <select value={hazardForm.type} onChange={e => setHazardForm(p => ({ ...p, type: e.target.value }))}>
                    {HAZARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>Description <input type="text" placeholder="e.g. Large pothole near turnoff" value={hazardForm.description} onChange={e => setHazardForm(p => ({ ...p, description: e.target.value }))} required /></label>
                <label>Road / Street <input type="text" placeholder="e.g. A1 Highway" value={hazardForm.road} onChange={e => setHazardForm(p => ({ ...p, road: e.target.value }))} /></label>
                <button type="submit" className="dm-submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Review'}</button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="dm-stats-bar">
        <div className="dm-stat">
          <span className="dm-stat-count">{chargingStations.length}</span>
          <span className="dm-stat-label">Charging Stations</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-count">{trafficCameras.length}</span>
          <span className="dm-stat-label">Traffic Cameras</span>
        </div>
        <div className="dm-stat">
          <span className="dm-stat-count">{roadHazards.length}</span>
          <span className="dm-stat-label">Road Hazards</span>
        </div>
      </div>

      <div className="dm-data-note">
        Map data includes verified EV charging locations and user-contributed traffic camera and road hazard reports pending review. All contributions are reviewed before appearing on the map.
      </div>
    </div>
  );
}
