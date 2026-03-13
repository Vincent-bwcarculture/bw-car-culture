// src/components/features/EVSection/EVSection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EVSection.css';

const evTypes = [
  {
    id: 'full-electric',
    title: 'Full Electric',
    subtitle: 'Zero emissions',
    description: 'Battery-only, zero tailpipe emissions.',
    search: 'electric',
    badge: 'BEV',
    badgeColor: '#00c37c'
  },
  {
    id: 'plug-in-hybrid',
    title: 'Plug-in Hybrid',
    subtitle: 'Best of both worlds',
    description: 'Electric + petrol for maximum range.',
    search: 'plug-in hybrid',
    badge: 'PHEV',
    badgeColor: '#0078ff'
  },
  {
    id: 'hybrid',
    icon: '♻️',
    title: 'Self-charging Hybrid',
    subtitle: 'No plug needed',
    description: 'Charges itself while driving.',
    search: 'hybrid',
    badge: 'HEV',
    badgeColor: '#ff8c00'
  }
];

const evBenefits = [
  { title: 'Lower Running Costs', desc: 'Electricity is cheaper than fuel' },
  { title: 'Eco-Friendly', desc: 'Reduce your carbon footprint' },
  { title: 'Less Maintenance', desc: 'Fewer moving parts to service' },
  { title: 'Instant Torque', desc: 'Smooth, powerful acceleration' }
];

const EVSection = () => {
  const navigate = useNavigate();

  return (
    <section className="ev-section">
      <div className="ev-section-inner">

        {/* Single slide: header left + cards right */}
        <div className="ev-slide">
          {/* Left: headline + subtitle + benefits + CTA */}
          <div className="ev-slide-left">
            <div className="ev-eyebrow">
              <span className="ev-eyebrow-dot" />
              The Future of Driving
            </div>
            <h2 className="ev-title">Go Electric</h2>
            <p className="ev-subtitle">
              Explore electric and hybrid vehicles in Botswana.
              Lower costs, cleaner driving, smarter tech.
            </p>

            <ul className="ev-benefits-list">
              {evBenefits.map((b) => (
                <li key={b.title} className="ev-benefit-item">
                  {b.icon
                    ? <span className="ev-benefit-icon">{b.icon}</span>
                    : <span className="ev-benefit-dot" />
                  }
                  <span className="ev-benefit-title">{b.title}</span>
                  <span className="ev-benefit-sep">—</span>
                  <span className="ev-benefit-desc">{b.desc}</span>
                </li>
              ))}
            </ul>

            <button
              className="ev-cta-btn"
              onClick={() => navigate('/marketplace?search=electric')}
            >
              Browse All EVs
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right: 3 cards */}
          <div className="ev-cards">
            {evTypes.map((type) => (
              <button
                key={type.id}
                className="ev-type-card"
                onClick={() => navigate(`/marketplace?search=${encodeURIComponent(type.search)}`)}
              >
                <div className="ev-type-card-top">
                  {type.icon && <span className="ev-type-icon">{type.icon}</span>}
                  <span className="ev-type-badge" style={{ background: type.badgeColor }}>
                    {type.badge}
                  </span>
                </div>
                <h3 className="ev-type-title">{type.title}</h3>
                <p className="ev-type-subtitle">{type.subtitle}</p>
                <p className="ev-type-desc">{type.description}</p>
                <span className="ev-type-browse">Browse →</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default EVSection;
