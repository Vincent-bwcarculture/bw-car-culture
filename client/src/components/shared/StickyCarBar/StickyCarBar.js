// src/components/shared/StickyCarBar/StickyCarBar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Tag } from 'lucide-react';
import { http } from '../../../config/axios.js';
import './StickyCarBar.css';

/**
 * StickyCarBar
 *
 * A sliding bar that appears at the bottom of the viewport after the user
 * scrolls past a threshold. Shows a horizontal strip of vehicle cards.
 *
 * Props:
 *  - vehicles: array (optional) — pass pre-fetched vehicles; if omitted the
 *    component fetches on its own using fetchParams
 *  - fetchParams: object — query params forwarded to GET /api/listings
 *    e.g. { sort: '-views', limit: 10 }
 *  - label: string — section label, default "Vehicles For Sale"
 *  - sessionKey: string — used to remember dismiss per-session
 */
const StickyCarBar = ({
  vehicles: propVehicles,
  fetchParams = {},
  label = 'Vehicles For Sale',
  sessionKey = 'stickyCarBar'
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [vehicles, setVehicles] = useState(propVehicles || []);
  const [loading, setLoading] = useState(!propVehicles);
  const scrollRef = useRef(null);
  const hasShown = useRef(false);

  // Respect session-level dismiss
  useEffect(() => {
    if (sessionStorage.getItem(`${sessionKey}_dismissed`) === '1') {
      setDismissed(true);
    }
  }, [sessionKey]);

  // Fetch vehicles if not provided via props
  useEffect(() => {
    if (propVehicles) {
      setVehicles(propVehicles);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const params = new URLSearchParams({ limit: 10, ...fetchParams }).toString();
        const res = await http.get(`/api/listings?${params}`);
        if (res.data?.data?.length) setVehicles(res.data.data);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [propVehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show bar after scrolling 400px (only once per mount)
  useEffect(() => {
    const onScroll = () => {
      if (hasShown.current) return;
      if (window.scrollY > 400) {
        hasShown.current = true;
        setVisible(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`${sessionKey}_dismissed`, '1');
  };

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  if (dismissed || loading || !vehicles.length) return null;

  return (
    <div className={`scb-bar ${visible ? 'scb-visible' : ''}`}>
      <div className="scb-inner">
        {/* Header */}
        <div className="scb-header">
          <Tag size={13} />
          <span className="scb-label">{label}</span>
          <Link to="/marketplace" className="scb-view-all">
            View All <ChevronRight size={13} />
          </Link>
          <button className="scb-dismiss" onClick={dismiss} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>

        {/* Scroll strip */}
        <div className="scb-strip-wrap">
          <button className="scb-arrow left" onClick={scrollLeft} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>

          <div className="scb-strip" ref={scrollRef}>
            {vehicles.map((car) => {
              const id = car._id || car.id;
              const imgSrc = car.featuredImage?.url
                || (typeof car.featuredImage === 'string' ? car.featuredImage : null)
                || car.images?.[0]?.url
                || (typeof car.images?.[0] === 'string' ? car.images[0] : null)
                || '/images/placeholders/default.jpg';
              const title = [car.year, car.make, car.model].filter(Boolean).join(' ')
                || car.title
                || 'Vehicle';
              const price = car.price
                ? `P ${Number(car.price).toLocaleString()}`
                : car.priceOptions?.listPrice
                  ? `P ${Number(car.priceOptions.listPrice).toLocaleString()}`
                  : null;

              return (
                <Link key={id} to={`/marketplace/listing/${id}`} className="scb-card">
                  <div className="scb-card-img">
                    <img
                      src={imgSrc}
                      alt={title}
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholders/default.jpg'; }}
                    />
                    {car.featured && <span className="scb-featured-badge">Featured</span>}
                  </div>
                  <div className="scb-card-body">
                    <p className="scb-card-title">{title}</p>
                    {price && <p className="scb-card-price">{price}</p>}
                    {car.mileage && <p className="scb-card-meta">{Number(car.mileage).toLocaleString()} km</p>}
                  </div>
                </Link>
              );
            })}
          </div>

          <button className="scb-arrow right" onClick={scrollRight} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCarBar;
