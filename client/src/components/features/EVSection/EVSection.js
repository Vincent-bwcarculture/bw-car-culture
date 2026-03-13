// src/components/features/EVSection/EVSection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EVSection.css';

const evTypes = [
  {
    id: 'full-electric',
    icon: '⚡',
    title: 'Full Electric',
    subtitle: 'Zero emissions',
    description: 'Battery-only vehicles with zero tailpipe emissions.',
    search: 'electric',
    badge: 'BEV',
    badgeColor: '#00c37c'
  },
  {
    id: 'plug-in-hybrid',
    icon: '🔋',
    title: 'Plug-in Hybrid',
    subtitle: 'Best of both worlds',
    description: 'Electric + petrol engine for maximum range flexibility.',
    search: 'plug-in hybrid',
    badge: 'PHEV',
    badgeColor: '#0078ff'
  },
  {
    id: 'hybrid',
    icon: '♻️',
    title: 'Self-charging Hybrid',
    subtitle: 'No plug needed',
    description: 'Charges itself while driving — no plug required.',
    search: 'hybrid',
    badge: 'HEV',
    badgeColor: '#ff8c00'
  }
];

const evBenefits = [
  { icon: '💸', title: 'Lower Running Costs', desc: 'Electricity is cheaper than fuel' },
  { icon: '🌱', title: 'Eco-Friendly', desc: 'Reduce your carbon footprint' },
  { icon: '🔧', title: 'Less Maintenance', desc: 'Fewer moving parts to service' },
  { icon: '🚀', title: 'Instant Torque', desc: 'Smooth, powerful acceleration' }
];

const EVSection = () => {
  const navigate = useNavigate();

  const handleTypeClick = (search) => {
    navigate(`/marketplace?search=${encodeURIComponent(search)}`);
  };

  return (
    <section className="ev-section">
      <div className="ev-section-inner">
        {/* Header */}
        <div className="ev-header">
          <div className="ev-header-left">
            <div className="ev-eyebrow">
              <span className="ev-eyebrow-dot" />
              The Future of Driving
            </div>
            <h2 className="ev-title">Go Electric</h2>
            <p className="ev-subtitle">
              Explore electric and hybrid vehicles available in Botswana.
              Lower costs, cleaner driving, smarter tech.
            </p>
          </div>
          <button
            className="ev-cta-btn"
            onClick={() => navigate('/marketplace?search=electric')}
          >
            Browse All EVs
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* EV Type Cards */}
        <div className="ev-type-grid">
          {evTypes.map((type) => (
            <button
              key={type.id}
              className="ev-type-card"
              onClick={() => handleTypeClick(type.search)}
            >
              <div className="ev-type-card-top">
                <span className="ev-type-icon">{type.icon}</span>
                <span className="ev-type-badge" style={{ background: type.badgeColor }}>
                  {type.badge}
                </span>
              </div>
              <div className="ev-type-card-body">
                <h3 className="ev-type-title">{type.title}</h3>
                <p className="ev-type-subtitle">{type.subtitle}</p>
                <p className="ev-type-desc">{type.description}</p>
              </div>
              <div className="ev-type-card-footer">
                <span className="ev-type-browse">Browse {type.title} →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Benefits Row */}
        <div className="ev-benefits">
          {evBenefits.map((b) => (
            <div key={b.title} className="ev-benefit-item">
              <span className="ev-benefit-icon">{b.icon}</span>
              <div>
                <div className="ev-benefit-title">{b.title}</div>
                <div className="ev-benefit-desc">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EVSection;
