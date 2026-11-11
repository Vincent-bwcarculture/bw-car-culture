// 3D Config Simulator (admin preview). Entered from a 3D cube; the link says which vehicle
// to load and whether it can be purchased (hero / listing) or only customised (own car).
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ShoppingCart, Wrench } from 'lucide-react';
import axios from '../config/axios.js';
import { VEHICLE_MODELS, findVehicleModel, vehicleDisplayName } from '../utils/vehicleModels.js';
import { simulatorMode } from '../utils/simulator.js';
import { CarViewer } from '../components/profile/RegisterVehicleTab.js';
import './ConfigSimulatorPage.css';

const resolveVehicle = async ({ source, model, vehicle, listing }) => {
  if (source === 'hero' || (!source && model)) {
    const entry = VEHICLE_MODELS.find(m => m.id === model);
    if (!entry) throw new Error('This vehicle is no longer on display.');
    return { name: entry.name, model: entry, purchaseLink: `/marketplace?${entry.marketplaceQuery}` };
  }
  if (source === 'registered' && vehicle) {
    const res = await axios.get('/user/profile');
    const found = (res.data?.data?.registeredVehicles || []).find(v => String(v._id) === String(vehicle));
    if (!found) throw new Error('This registered vehicle was not found on your profile.');
    return {
      name: `${found.year ? `${found.year} ` : ''}${vehicleDisplayName(found)}`,
      model: findVehicleModel(found),
      color: found.color,
      plate: found.regPlate
    };
  }
  if (source === 'listing' && listing) {
    const res = await axios.get(`/listings/${listing}`);
    const item = res.data?.data || res.data;
    if (!item?._id) throw new Error('This listing is no longer available.');
    const specs = item.specifications || {};
    return {
      name: item.title || vehicleDisplayName(specs),
      model: findVehicleModel({ make: specs.make, model: specs.model, year: specs.year }),
      purchaseLink: `/marketplace/${item._id}`
    };
  }
  throw new Error('This simulator link is incomplete.');
};

const ConfigSimulatorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = Object.fromEntries(new URLSearchParams(location.search));
  const mode = simulatorMode(params.source);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let active = true;
    setState({ loading: true });
    resolveVehicle(params)
      .then(vehicle => active && setState({ vehicle }))
      .catch(err => active && setState({ error: err.response?.data?.message || err.message }));
    return () => { active = false; };
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loading, error, vehicle } = state;
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <div className="cfs-page">
      <header className="cfs-header">
        <button type="button" className="cfs-back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <div className="cfs-heading">
          <span className="cfs-eyebrow"><Box size={13} /> 3D Config Simulator · admin preview</span>
          <h1>{vehicle?.name || (loading ? 'Loading vehicle…' : 'Vehicle unavailable')}</h1>
          {vehicle?.plate && <span className="cfs-plate">{vehicle.plate}</span>}
        </div>
        <span className={`cfs-mode cfs-mode--${mode}`}>
          {mode === 'purchase' ? <><ShoppingCart size={13} /> Purchase &amp; customise</> : <><Wrench size={13} /> Customise only</>}
        </span>
      </header>

      <div className="cfs-body">
        <section className="cfs-stage" aria-label="Vehicle preview">
          {loading && <div className="cfs-stage-message"><span className="cfs-spinner" /> Loading…</div>}
          {error && (
            <div className="cfs-stage-message">
              <strong>{error}</strong>
              <Link to="/" className="cfs-link">Back to home</Link>
            </div>
          )}
          {vehicle && vehicle.model && <CarViewer color={vehicle.color || '#164b98'} />}
          {vehicle && !vehicle.model && (
            <div className="cfs-stage-message cfs-twin-missing">
              <Box size={40} />
              <strong>Digital twin not available</strong>
              <span>{vehicle.name} doesn't have a 3D digital twin yet. We're adding more models.</span>
            </div>
          )}
        </section>

        <aside className="cfs-panel">
          <h2>Parts that fit</h2>
          <p className="cfs-muted">
            {vehicle?.model
              ? 'Parts for this vehicle will appear here — choose them to see them fitted in 3D.'
              : 'Parts that fit this vehicle will appear here once its catalogue is ready.'}
          </p>
          <div className="cfs-parts-empty">Parts catalogue coming soon</div>
          <div className="cfs-total">
            <span>Build total</span>
            <strong>—</strong>
          </div>
          {mode === 'purchase' && vehicle?.purchaseLink && (
            <Link to={vehicle.purchaseLink} className="cfs-btn cfs-btn--primary">
              <ShoppingCart size={15} /> View this vehicle for sale
            </Link>
          )}
          {mode === 'customize' && (
            <p className="cfs-note">Customising your own vehicle — parts are ordered for fitment, the car itself is not for sale.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ConfigSimulatorPage;
