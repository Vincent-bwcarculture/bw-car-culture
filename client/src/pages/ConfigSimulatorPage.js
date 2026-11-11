// 3D Config Simulator (admin preview). Entered from a 3D cube; the link says which vehicle
// to load and whether it can be purchased (hero / listing) or only customised (own car).
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ShoppingCart, Wrench, Plus, Check, PenTool, Truck } from 'lucide-react';
import axios from '../config/axios.js';
import { VEHICLE_MODELS, findVehicleModel, vehicleDisplayName } from '../utils/vehicleModels.js';
import { simulatorMode } from '../utils/simulator.js';
import { fetchPartsForModel, loadDraftBuild, saveDraftBuild, formatPrice } from '../utils/configuratorApi.js';
import ConfigSimulatorViewer from '../components/configurator/ConfigSimulatorViewer.js';
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
  throw new Error('This Config Simulator link is incomplete.');
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

  // Parts that fit this vehicle's model, and the user's draft build (kept on the device).
  const modelId = vehicle?.model?.id;
  const buildId = params.source === 'registered' ? `registered-${params.vehicle}` : modelId;
  const [parts, setParts] = useState({ loading: false, list: [] });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!modelId) { setParts({ loading: false, list: [] }); return; }
    let active = true;
    setParts({ loading: true, list: [] });
    fetchPartsForModel(modelId)
      .then(list => {
        if (!active) return;
        setParts({ loading: false, list });
        const draft = loadDraftBuild(buildId).filter(id => list.some(p => p.id === id));
        setSelected(draft);
      })
      .catch(err => active && setParts({ loading: false, list: [], error: err.response?.data?.message || err.message }));
    return () => { active = false; };
  }, [modelId, buildId]);

  // Camera focus: the part just added (or tapped) is turned towards; interior parts are shown
  // from inside the cabin. Product pictures are rendered from the model until real photos exist.
  const [focus, setFocus] = useState(null);
  const [pictures, setPictures] = useState({});
  const focusPart = part => setFocus(part ? {
    key: `${part.id}-${Date.now()}`,
    partId: part.id,
    meshMatch: part.meshMatch || [],
    view: part.view || (part.category === 'Interior' ? 'interior' : 'exterior'),
    viewFrom: part.viewFrom,
    reveal: part.reveal
  } : null);

  const togglePart = id => {
    const removing = selected.includes(id);
    const next = removing ? selected.filter(x => x !== id) : [...selected, id];
    setSelected(next);
    if (buildId) saveDraftBuild(buildId, next);
    if (!removing) focusPart(parts.list.find(p => p.id === id));
    else if (focus?.partId === id) focusPart(parts.list.find(p => p.id === next[next.length - 1]));
  };

  // On phones the parts are a sideways row: bring the shown part's card into view without
  // moving the page (block: 'nearest'), so the model stays on screen.
  useEffect(() => {
    if (!focus?.partId || !window.matchMedia?.('(max-width: 899px)').matches) return;
    document.getElementById(`cfs-part-${focus.partId}`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [focus]);

  const grouped = useMemo(() => parts.list.reduce((acc, part) => {
    (acc[part.category] = acc[part.category] || []).push(part);
    return acc;
  }, {}), [parts.list]);
  const chosen = parts.list.filter(p => selected.includes(p.id));
  const total = chosen.reduce((sum, p) => sum + p.price, 0);
  const longestLead = chosen.reduce((max, p) => Math.max(max, p.leadTimeDays || 0), 0);

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
          {vehicle && vehicle.model && (
            <ConfigSimulatorViewer color={vehicle.color || '#164b98'} parts={parts.list} fitted={selected}
              focus={focus} onThumbnails={setPictures} />
          )}
          {vehicle?.model && chosen.length > 0 && (
            <div className="cfs-stage-legend"><span className="cfs-legend-dot" /> {chosen.length} part{chosen.length > 1 ? 's' : ''} fitted</div>
          )}
          {vehicle?.model && focus && (
            <button type="button" className="cfs-stage-reset" onClick={() => setFocus(null)}>Full view</button>
          )}
          {vehicle && !vehicle.model && (
            <div className="cfs-stage-message cfs-twin-missing">
              <Box size={40} />
              <strong>Digital twin not available</strong>
              <span>{vehicle.name} doesn't have a 3D digital twin yet. We're adding more models.</span>
            </div>
          )}
        </section>

        <aside className="cfs-panel">
          <div className="cfs-panel-head">
            <h2>Parts that fit</h2>
            {parts.list.some(p => p.mock) && <span className="cfs-dev-chip">Development data</span>}
          </div>
          {parts.list.length > 1 && <span className="cfs-swipe-hint">Swipe for more parts →</span>}
          {!vehicle?.model && (
            <p className="cfs-muted">Parts that fit this vehicle will appear here once its digital twin and catalogue are ready.</p>
          )}
          {parts.loading && <div className="cfs-parts-empty"><span className="cfs-spinner" /> Loading parts…</div>}
          {parts.error && <div className="cfs-parts-empty cfs-parts-error">{parts.error}</div>}
          {vehicle?.model && !parts.loading && !parts.error && parts.list.length === 0 && (
            <div className="cfs-parts-empty">No parts listed for this vehicle yet</div>
          )}

          <div className="cfs-parts">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category} className="cfs-category">
                <h3>{category}</h3>
                {items.map(part => {
                  const isOn = selected.includes(part.id);
                  return (
                    <article key={part.id} id={`cfs-part-${part.id}`}
                      className={`cfs-part${isOn ? ' is-selected' : ''}${focus?.partId === part.id ? ' is-focused' : ''}`}>
                      <div className="cfs-part-picture" aria-hidden={!part.imageUrl}>
                        {part.imageUrl || pictures[part.id]
                          ? <img src={part.imageUrl || pictures[part.id]} alt={part.imageUrl ? part.name : ''} loading="lazy" />
                          : <span className="cfs-picture-placeholder" />}
                      </div>
                      <div className="cfs-part-main" role="button" tabIndex={0} title="Show this part on the car"
                        onClick={() => focusPart(part)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusPart(part); } }}>
                        <span className="cfs-part-category">{category}</span>
                        <span className="cfs-part-view">Show on car</span>
                        <h4>{part.name}</h4>
                        <p>{part.description}</p>
                        <div className="cfs-part-meta">
                          {part.source === 'designer'
                            ? <span className="cfs-chip cfs-chip--designer"><PenTool size={11} /> Designer · made to order</span>
                            : <span className="cfs-chip"><Truck size={11} /> Supplied</span>}
                          <span>~{part.leadTimeDays} days</span>
                        </div>
                      </div>
                      <div className="cfs-part-side">
                        <strong>{formatPrice(part.price, part.currency)}</strong>
                        <button type="button" className={`cfs-part-toggle${isOn ? ' is-on' : ''}`}
                          onClick={() => togglePart(part.id)} aria-pressed={isOn}
                          aria-label={`${isOn ? 'Remove' : 'Add'} ${part.name}`}>
                          {isOn ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add</>}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>

          <div className="cfs-total">
            <span>Build total{chosen.length ? ` · ${chosen.length} part${chosen.length > 1 ? 's' : ''}` : ''}</span>
            <strong>{chosen.length ? formatPrice(total, chosen[0].currency) : '—'}</strong>
          </div>
          {chosen.length > 0 && (
            <>
              <p className="cfs-muted cfs-small">Includes manufacturing or supply, delivery and fees. Estimated ready in ~{longestLead} days.</p>
              <button type="button" className="cfs-btn cfs-btn--ghost" disabled title="Ordering is being built (Phase 2)">
                Request these parts — coming soon
              </button>
            </>
          )}
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
