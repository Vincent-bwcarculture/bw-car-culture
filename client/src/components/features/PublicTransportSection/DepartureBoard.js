// DepartureBoard.js — live scheduled departure board computed from route data
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './DepartureBoard.css';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const getOriginStr = (origin) =>
  typeof origin === 'object' && origin ? origin.name || '' : origin || '';

const getDestStr = (dest) =>
  typeof dest === 'object' && dest ? dest.name || '' : dest || '';

// Compute the next occurrence of a HH:MM departure after `now`
const nextOccurrence = (timeStr, now) => {
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1); // push to tomorrow if already passed
  return d;
};

const formatCountdown = (ms) => {
  if (ms <= 0) return 'Now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rm = mins % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
};

const operatesToday = (route, dayName) => {
  const days = route.schedule?.operatingDays || route.operatingDays;
  if (!days) return true; // assume always if not set
  if (Array.isArray(days)) return days.some(d => d.toLowerCase() === dayName);
  if (typeof days === 'object') return !!days[dayName];
  return true;
};

const DepartureBoard = ({ routes }) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [originFilter, setOriginFilter] = useState('');
  const [userCity, setUserCity] = useState(null);
  const [locationAsked, setLocationAsked] = useState(false);

  // Tick every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Attempt geolocation once to suggest a default origin
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocationAsked(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Simple bounding-box city lookup for Botswana cities
        const CITIES = [
          { name: 'Gaborone',     lat: -24.628, lng: 25.923, radius: 0.3 },
          { name: 'Francistown',  lat: -21.166, lng: 27.514, radius: 0.3 },
          { name: 'Maun',         lat: -19.983, lng: 23.417, radius: 0.3 },
          { name: 'Kasane',       lat: -17.796, lng: 25.157, radius: 0.3 },
          { name: 'Palapye',      lat: -22.551, lng: 27.145, radius: 0.3 },
          { name: 'Serowe',       lat: -22.381, lng: 26.717, radius: 0.3 },
          { name: 'Lobatse',      lat: -25.224, lng: 25.678, radius: 0.3 },
          { name: 'Jwaneng',      lat: -24.603, lng: 24.730, radius: 0.3 },
          { name: 'Selebi-Phikwe', lat: -21.975, lng: 27.835, radius: 0.3 },
          { name: 'Johannesburg', lat: -26.204, lng: 28.047, radius: 0.5 },
        ];
        const match = CITIES.find(c =>
          Math.abs(c.lat - latitude) < c.radius && Math.abs(c.lng - longitude) < c.radius
        );
        if (match) {
          setUserCity(match.name);
          setOriginFilter(match.name);
        }
      },
      () => {} // silently ignore denied
    );
  };

  const todayName = DAY_NAMES[now.getDay()];

  const departures = useMemo(() => {
    const results = [];
    const WINDOW_MS = 12 * 60 * 60 * 1000; // show up to 12 h ahead

    for (const route of routes) {
      if (!operatesToday(route, todayName)) continue;

      const origin = getOriginStr(route.origin);
      const dest   = getDestStr(route.destination);

      if (
        originFilter &&
        !origin.toLowerCase().includes(originFilter.toLowerCase())
      ) continue;

      const times = [
        ...(route.schedule?.departureTimes || []),
        route.schedule?.startTime,
        route.schedule?.departure,
      ].filter(Boolean);

      for (const t of times) {
        const timeStr = typeof t === 'string' ? t : (t?.time || t?.departure);
        if (!timeStr || !/^\d{1,2}:\d{2}/.test(timeStr)) continue;

        const dep = nextOccurrence(timeStr, now);
        if (!dep) continue;
        const msUntil = dep - now;
        if (msUntil > WINDOW_MS || msUntil < -2 * 60000) continue;

        results.push({
          key:       `${route._id || route.id}-${timeStr}`,
          routeId:   route._id || route.id,
          time:      timeStr,
          dep,
          msUntil,
          origin,
          dest,
          operator:  route.provider?.businessName || route.provider?.name ||
                     route.operatorName || (typeof route.provider === 'string' ? route.provider : '—'),
          type:      route.routeType || 'Bus',
          fare:      route.fare || route.pricing?.baseFare,
          status:    route.operationalStatus === 'active' ? 'On time' :
                     (route.status || 'On time'),
        });
      }
    }

    return results
      .sort((a, b) => a.msUntil - b.msUntil)
      .slice(0, 20);
  }, [routes, now, todayName, originFilter]);

  const uniqueOrigins = useMemo(() => {
    const s = new Set(routes.map(r => getOriginStr(r.origin)).filter(Boolean));
    return Array.from(s).sort();
  }, [routes]);

  const clockStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const dateStr  = now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  const statusClass = (s) => {
    if (!s) return 'on-time';
    const l = s.toLowerCase();
    if (l.includes('delay') || l.includes('late')) return 'delayed';
    if (l.includes('cancel')) return 'cancelled';
    return 'on-time';
  };

  return (
    <div className="db-wrap">
      {/* Header bar */}
      <div className="db-header">
        <div className="db-title-group">
          <span className="db-dot db-dot--live" title="Updates every minute" />
          <h3 className="db-title">Departures</h3>
          <span className="db-date">{dateStr}</span>
        </div>
        <div className="db-clock">{clockStr}</div>
      </div>

      {/* Origin filter row */}
      <div className="db-controls">
        <div className="db-select-wrap">
          <label className="db-label">Departing from</label>
          <select
            className="db-select"
            value={originFilter}
            onChange={e => setOriginFilter(e.target.value)}
          >
            <option value="">All origins</option>
            {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {!locationAsked && (
          <button className="db-locate-btn" onClick={requestLocation}>
            Use my location
          </button>
        )}
        {userCity && (
          <span className="db-city-pill">{userCity}</span>
        )}
      </div>

      {/* Board */}
      {departures.length === 0 ? (
        <div className="db-empty">
          {routes.length === 0
            ? 'Loading routes…'
            : `No departures found${originFilter ? ` from ${originFilter}` : ''} in the next 12 hours.`}
        </div>
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Departs</th>
                <th>To</th>
                <th>From</th>
                <th>Operator</th>
                <th>Type</th>
                <th>Fare</th>
                <th>Status</th>
                <th>In</th>
              </tr>
            </thead>
            <tbody>
              {departures.map(dep => (
                <tr
                  key={dep.key}
                  className={`db-row ${dep.msUntil < 5 * 60000 ? 'db-row--soon' : ''}`}
                  onClick={() => dep.routeId && navigate(`/transport-routes/${dep.routeId}`)}
                  style={{ cursor: dep.routeId ? 'pointer' : 'default' }}
                >
                  <td className="db-cell db-cell--time">{dep.time}</td>
                  <td className="db-cell db-cell--dest">{dep.dest}</td>
                  <td className="db-cell db-cell--origin">{dep.origin}</td>
                  <td className="db-cell db-cell--op">{dep.operator}</td>
                  <td className="db-cell db-cell--type">
                    <span className="db-type-badge">{dep.type}</span>
                  </td>
                  <td className="db-cell db-cell--fare">
                    {dep.fare ? `P ${Number(dep.fare).toLocaleString()}` : '—'}
                  </td>
                  <td className="db-cell">
                    <span className={`db-status db-status--${statusClass(dep.status)}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td className="db-cell db-cell--countdown">
                    {formatCountdown(dep.msUntil)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartureBoard;
