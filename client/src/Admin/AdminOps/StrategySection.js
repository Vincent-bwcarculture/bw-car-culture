import React, { useState } from 'react';
import './StrategySection.css';

const CHAPTERS = [
  { id: 'north-star',  label: 'North Star' },
  { id: 'company',     label: 'Company' },
  { id: 'strategy',    label: 'Strategy' },
  { id: 'layers',      label: 'The Four Layers' },
  { id: 'revenue',     label: 'Revenue' },
  { id: 'execution',   label: 'Execution Map' },
  { id: 'priorities',  label: 'Priorities' },
  { id: 'philosophy',  label: 'Philosophy' },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ number, title }) {
  return (
    <div className="str-section-title">
      <span className="str-section-number">{String(number).padStart(2, '0')}</span>
      <h3>{title}</h3>
    </div>
  );
}

function FlowStep({ label, sub, last }) {
  return (
    <div className={`str-flow-step${last ? ' last' : ''}`}>
      <div className="str-flow-node">{label}</div>
      {sub && <div className="str-flow-sub">{sub}</div>}
      {!last && <div className="str-flow-arrow">↓</div>}
    </div>
  );
}

function FlowLoop({ steps }) {
  return (
    <div className="str-flow-col">
      {steps.map((s, i) => (
        <FlowStep key={i} label={s.label} sub={s.sub} last={i === steps.length - 1} />
      ))}
      <div className="str-flow-recycle">↺ repeats</div>
    </div>
  );
}

function BoxGrid({ items }) {
  return (
    <div className="str-box-grid">
      {items.map((item, i) => (
        <div key={i} className="str-box">
          {item.title && <div className="str-box-title">{item.title}</div>}
          {item.items && (
            <ul className="str-box-list">
              {item.items.map((x, j) => <li key={j}>{x}</li>)}
            </ul>
          )}
          {item.note && <div className="str-box-note">{item.note}</div>}
        </div>
      ))}
    </div>
  );
}

function Quote({ text }) {
  return <blockquote className="str-quote">{text}</blockquote>;
}

function Tag({ label, color }) {
  const colors = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e' };
  return <span className="str-tag" style={{ background: colors[color] || '#555' }}>{label}</span>;
}

// ─── North Star tab ───────────────────────────────────────────────────────────

function NorthStarTab() {
  const chain = [
    'ESTABLISH AUTHORITY',
    'MEDIA · EDUCATION · MARKET PRESENCE',
    'OWNED DIGITAL TRAFFIC',
    'MARKETPLACE LIQUIDITY',
    'TRANSACTIONS + DATA',
    'TRUST + INTELLIGENCE',
    'REVENUE',
    'REINVESTMENT',
    'DEEPER MARKET ROOTS',
    'REGIONAL EXPANSION',
  ];

  const execNow = ['Media (Reviews, Events, Journalism)', 'Website UX + SEO', 'Social → Website conversion', 'Marketplace listings + dealers', 'Revenue: media, listings, partnerships'];
  const execNext = ['Better vehicle presentation', 'Verification + Diagnostic reports', '360° imaging', 'Financing + Import facilitation'];
  const execThen = ['Mechanic network', 'Digital service records', 'Vehicle passports + history', 'Service-cost intelligence'];
  const execLater = ['Rentals + Public transport', 'Advanced mobility services', 'EV ecosystem', 'AI + Advanced intelligence'];
  const execScale = ['South Africa', 'Namibia · Zambia · Zimbabwe', 'Wider SADC'];

  return (
    <div className="str-chapter">
      {/* Mission card */}
      <div className="str-north-star-card">
        <div className="str-nsc-eyebrow">BW CAR CULTURE · Mission</div>
        <p className="str-nsc-mission">
          Making mobility and vehicle ownership seamless, stress-free, and trustworthy —
          delivering a premium experience throughout the entire journey.
        </p>
        <div className="str-nsc-tagline">DISCOVER · BUY · OWN · MAINTAIN · MOVE · SELL</div>
      </div>

      {/* Strategic chain */}
      <div className="str-ns-row">
        <div className="str-ns-chain">
          <div className="str-ns-chain-title">The Strategic Chain</div>
          {chain.map((step, i) => (
            <div key={i} className="str-chain-step">
              <div className="str-chain-node">{step}</div>
              {i < chain.length - 1 && <div className="str-chain-arrow">↓</div>}
            </div>
          ))}
          <div className="str-chain-recycle">↺ more authority</div>
        </div>

        {/* Execution map */}
        <div className="str-ns-exec">
          <div className="str-ns-chain-title">Execution Map</div>
          {[
            { label: 'NOW', items: execNow, color: 'red' },
            { label: 'NEXT', items: execNext, color: 'orange' },
            { label: 'THEN', items: execThen, color: 'yellow' },
            { label: 'LATER', items: execLater, color: 'green' },
            { label: 'SCALE', items: execScale, color: 'green' },
          ].map(({ label, items, color }) => (
            <div key={label} className="str-exec-block">
              <Tag label={label} color={color} />
              <ul className="str-exec-list">
                {items.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* One-line summary */}
      <Quote text="We establish authority through media, convert that authority into owned digital traffic, turn traffic into marketplace activity and transactions, turn activity into trusted data, and use revenue and data to build deeper roots in the automotive and mobility market." />
    </div>
  );
}

// ─── Company tab ──────────────────────────────────────────────────────────────

function CompanyTab() {
  return (
    <div className="str-chapter">
      <SectionTitle number={1} title="What is Bw Car Culture?" />
      <p className="str-body">
        Bw Car Culture is building a connected digital ecosystem for automotive and mobility in Botswana,
        beginning with media and community and progressively expanding into commerce, vehicle services,
        trust infrastructure, data and mobility solutions.
      </p>
      <p className="str-body">
        We use our existing media presence and automotive authority to establish demand, direct that demand
        into our owned digital platform, facilitate transactions, collect structured data, and progressively
        build deeper infrastructure around the automotive and mobility journey.
      </p>
      <div className="str-highlight-box">
        We are not building a collection of unrelated automotive businesses.<br />
        <strong>We are building one ecosystem.</strong>
      </div>

      <SectionTitle number={2} title="The Mission" />
      <Quote text="Making mobility and vehicle ownership seamless, stress-free, and trustworthy — delivering a premium experience throughout the entire journey." />
      <div className="str-tagline-row">
        {['DISCOVER', 'BUY', 'OWN', 'MAINTAIN', 'MOVE', 'SELL'].map((w, i) => (
          <span key={i} className="str-journey-word">{w}</span>
        ))}
      </div>
      <p className="str-body-muted">These are not separate businesses. They are different stages within the same consumer journey.</p>

      <SectionTitle number={3} title="The Big Idea" />
      <p className="str-body">The automotive industry is fragmented. A person looking for a vehicle may have to use:</p>
      <div className="str-frag-grid">
        {['Facebook', 'WhatsApp', 'Dealership websites', 'Classified platforms', 'Mechanics', 'Importers',
          'Banks', 'Insurance companies', 'Workshops', 'Transport operators', 'Rental companies', 'Event / community pages']
          .map((x, i) => <span key={i} className="str-frag-chip">{x}</span>)}
      </div>
      <p className="str-body">Information is scattered. Vehicle history is scattered. Transactions are scattered. Service records are scattered.</p>
      <div className="str-highlight-box">
        <strong>Bw Car Culture's opportunity:</strong> Connect these experiences progressively through one trusted digital ecosystem.
      </div>
    </div>
  );
}

// ─── Strategy tab ─────────────────────────────────────────────────────────────

function StrategyTab() {
  const thesis = [
    'ESTABLISH AUTHORITY', 'MEDIA + EDUCATION + MARKET PRESENCE', 'CONVERT AUTHORITY INTO OWNED TRAFFIC',
    'BUILD MARKETPLACE LIQUIDITY', 'FACILITATE TRANSACTIONS', 'COLLECT STRUCTURED DATA',
    'BUILD TRUST + INTELLIGENCE', 'GENERATE REVENUE', 'REINVEST INTO THE ECOSYSTEM',
    'DEEPEN MARKET POSITION', 'EXPAND',
  ];

  const flywheel = [
    'MEDIA', 'MARKET AUTHORITY', 'AUDIENCE', 'OWNED WEBSITE TRAFFIC', 'MARKETPLACE',
    'BUYERS ↔ SELLERS ↔ DEALERS', 'TRANSACTIONS + LEADS', 'DATA COLLECTION',
    'TRUST + BETTER INFORMATION', 'BETTER CUSTOMER EXPERIENCE', 'MORE VALUE',
    'REVENUE', 'REINVESTMENT', 'STRONGER MEDIA + PRODUCT', 'MORE AUDIENCE',
  ];

  return (
    <div className="str-chapter">
      <SectionTitle number={4} title="The Strategic Thesis" />
      <p className="str-body">Our strategy is based on a very simple sequence:</p>
      <div className="str-thesis-chain">
        {thesis.map((step, i) => (
          <div key={i} className="str-thesis-step">
            <div className="str-thesis-node">{step}</div>
            {i < thesis.length - 1 && <div className="str-thesis-arrow">↓</div>}
          </div>
        ))}
      </div>
      <Quote text="Use media to establish authority, use that authority to create digital demand, use the marketplace to capture transactions and data, and use the resulting revenue and intelligence to build deeper roots in the market." />

      <SectionTitle number={5} title="The Flywheel" />
      <p className="str-body-muted">Every major initiative should strengthen at least one part of this loop.</p>
      <div className="str-flywheel">
        {flywheel.map((step, i) => (
          <div key={i} className="str-fw-row">
            <div className="str-fw-node">{step}</div>
            {i < flywheel.length - 1 ? <div className="str-fw-arrow">↓</div> : <div className="str-fw-arrow recycle">↺</div>}
          </div>
        ))}
      </div>

      <SectionTitle number={6} title="The Four Core Layers" />
      <div className="str-layers-stack">
        {[
          { n: '1', label: 'MEDIA & AUTHORITY', color: '#ff3300' },
          { n: '2', label: 'COMMERCE & MARKETPLACE', color: '#f97316' },
          { n: '3', label: 'TRUST & VEHICLE INTELLIGENCE', color: '#eab308' },
          { n: '4', label: 'MOBILITY & AUTOMOTIVE SERVICES', color: '#22c55e' },
        ].map(({ n, label, color }) => (
          <div key={n} className="str-layer-row" style={{ borderLeftColor: color }}>
            <span className="str-layer-n" style={{ color }}>{n}</span>
            <span className="str-layer-label">{label}</span>
          </div>
        ))}
        <div className="str-layer-support">Supported by: Technology · Data · Partnerships · Revenue</div>
      </div>
    </div>
  );
}

// ─── The Four Layers tab ──────────────────────────────────────────────────────

function LayersTab() {
  const mediaActivities = [
    'Automotive journalism', 'Vehicle reviews', 'Dealership coverage', 'New vehicle launches',
    'Automotive news', 'Motorsport', 'Automotive events', 'Interviews', 'Car culture',
    'Educational content', 'Industry coverage', 'Product features', 'Brand campaigns',
  ];

  const consumerCan = [
    'Discover vehicles', 'Search & filter', 'Compare vehicles', 'Save listings',
    'Enquire & buy', 'Sell vehicles', 'Find dealers', 'Find services', 'Explore financing',
  ];

  const dealersCan = [
    'List inventory', 'Manage vehicles', 'Receive enquiries', 'Promote inventory',
    'Build dealership profiles', 'Access analytics', 'Reach the Bw Car Culture audience',
  ];

  const verificationLevels = [
    { level: '01', title: 'Listing Verification', items: ['Vehicle exists', 'Seller information', 'Basic documentation'] },
    { level: '02', title: 'Visual Verification', items: ['Professional photographs', 'Odometer photograph', 'Vehicle identification', 'Condition documentation'] },
    { level: '03', title: 'Physical Inspection', items: ['Exterior & interior', 'Mechanical observations', 'Tyres & suspension', 'Visible condition'] },
    { level: '04', title: 'Diagnostic Verification', items: ['ECU scan', 'Fault codes', 'Module status', 'Diagnostic observations'] },
    { level: '05', title: 'History Verification', items: ['Service records', 'Repair records', 'Mileage records', 'Previous inspections'] },
  ];

  const mobilityServices = ['Public transport', 'Transport operators', 'Carpool', 'Rentals', 'Transport booking'];
  const autoServices = ['Workshops & mechanics', 'Parts & tyres', 'Detailing', 'Insurance', 'Tracking', 'Towing', 'Roadside services', 'Financing'];

  return (
    <div className="str-chapter">

      {/* Layer 1 */}
      <div className="str-layer-section red">
        <SectionTitle number={7} title="Layer 1 — Media & Authority" />
        <p className="str-body">Establish Bw Car Culture as the authority and leading automotive media/community platform in Botswana. This is the top of the funnel.</p>
        <div className="str-activity-grid">
          {mediaActivities.map((a, i) => <span key={i} className="str-activity-chip">{a}</span>)}
        </div>
        <div className="str-media-jobs">
          <div className="str-mj-card">
            <div className="str-mj-n">1</div>
            <div className="str-mj-title">Audience Acquisition</div>
            <div className="str-mj-desc">Bring people into the ecosystem.</div>
          </div>
          <div className="str-mj-card">
            <div className="str-mj-n">2</div>
            <div className="str-mj-title">Authority</div>
            <div className="str-mj-desc">Make Bw Car Culture a trusted automotive source.</div>
          </div>
          <div className="str-mj-card">
            <div className="str-mj-n">3</div>
            <div className="str-mj-title">Distribution</div>
            <div className="str-mj-desc">Give the marketplace and products access to a large relevant audience.</div>
          </div>
        </div>

        <SectionTitle number={8} title="Media → Digital Conversion" />
        <div className="str-conversion-row">
          <div className="str-conv-col old">
            <div className="str-conv-label">Historically</div>
            {['CONTENT', 'FACEBOOK / INSTAGRAM / TIKTOK', 'USER LEAVES'].map((s, i, arr) => (
              <div key={i} className="str-conv-step">
                <div className="str-conv-node dim">{s}</div>
                {i < arr.length - 1 && <div className="str-conv-arrow dim">↓</div>}
              </div>
            ))}
          </div>
          <div className="str-conv-col new">
            <div className="str-conv-label accent">Objective</div>
            {['CONTENT', 'SOCIAL MEDIA', 'BW CAR CULTURE WEBSITE', 'VEHICLE / SERVICE / INFO', 'ACTION'].map((s, i, arr) => (
              <div key={i} className="str-conv-step">
                <div className="str-conv-node">{s}</div>
                {i < arr.length - 1 && <div className="str-conv-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
        <Quote text="Convert borrowed social-media attention into owned digital relationships." />
      </div>

      {/* Layer 2 */}
      <div className="str-layer-section orange">
        <SectionTitle number={9} title="Layer 2 — The Marketplace" />
        <p className="str-body">Create a digital place where automotive supply and demand meet.</p>
        <div className="str-marketplace-grid">
          <div className="str-mp-col">
            <div className="str-mp-col-title">Consumers</div>
            <ul className="str-mp-list">{consumerCan.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div className="str-mp-col">
            <div className="str-mp-col-title">Dealers</div>
            <ul className="str-mp-list">{dealersCan.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </div>

        <SectionTitle number={10} title="Marketplace Liquidity" />
        <div className="str-liquidity-chain">
          {[
            { label: 'Buyer growth', desc: 'creates demand' },
            { label: 'Demand', desc: 'attracts sellers' },
            { label: 'More inventory', desc: 'creates more value for buyers' },
            { label: 'More transactions', desc: 'creates trust and data' },
            { label: 'More data', desc: 'improves the marketplace' },
          ].map((s, i, arr) => (
            <div key={i} className="str-liq-step">
              <div className="str-liq-node">{s.label}</div>
              <div className="str-liq-desc">{s.desc}</div>
              {i < arr.length - 1 && <div className="str-liq-arrow">↓</div>}
            </div>
          ))}
        </div>
        <Quote text="Buyers consistently find useful inventory and sellers consistently find buyers." />

        <SectionTitle number={11} title="The Current Marketplace Problem" />
        <p className="str-body">The major bottleneck is not necessarily inventory. It is <strong>traffic and transaction density</strong>.</p>
        <div className="str-highlight-box red">
          <strong>Immediate strategic priority: Increase qualified traffic to BwCarCulture.com.</strong>
          <br /><br />
          We need: Vehicle searches · Vehicle views · Enquiries · Registrations · Repeat users · Transactions
        </div>
      </div>

      {/* Layer 3 */}
      <div className="str-layer-section yellow">
        <SectionTitle number={12} title="Layer 3 — Trust & Vehicle Intelligence" />
        <Quote text="Don't just tell consumers what a vehicle is. Give them evidence." />

        <SectionTitle number={13} title="Digital Vehicle Profile" />
        <div className="str-dvp-grid">
          <div className="str-dvp-col">
            <div className="str-dvp-title">Vehicle</div>
            {['VIN · Registration', 'Make · Model · Year', 'Specification · Mileage', 'Location · Ownership'].map((x, i) => <div key={i} className="str-dvp-item">{x}</div>)}
          </div>
          <div className="str-dvp-col">
            <div className="str-dvp-title">Evidence</div>
            {['Quality photographs', '360° visualization', 'Inspection records', 'Diagnostic scan', 'Service history', 'Repairs · Parts replaced', 'Import records', 'Price history'].map((x, i) => <div key={i} className="str-dvp-item">{x}</div>)}
          </div>
        </div>

        <SectionTitle number={14} title="Vehicle Passport" />
        <div className="str-passport-chain">
          {['PURCHASE', 'SERVICE', 'REPAIR', 'DIAGNOSTIC', 'INSPECTION', 'OWNERSHIP', 'RESALE', 'NEXT OWNER'].map((s, i, arr) => (
            <div key={i} className="str-pp-step">
              <div className="str-pp-node">{s}</div>
              {i < arr.length - 1 && <div className="str-pp-arrow">↓</div>}
            </div>
          ))}
          <p className="str-pp-note">History doesn't disappear every time the vehicle changes hands. It becomes progressively more valuable.</p>
        </div>

        <SectionTitle number={15} title="Verification Levels" />
        <div className="str-verification-levels">
          {verificationLevels.map(({ level, title, items }) => (
            <div key={level} className="str-vl-card">
              <div className="str-vl-level">Level {level}</div>
              <div className="str-vl-title">{title}</div>
              <ul className="str-vl-items">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
        <Quote text="Never claim more certainty than the evidence supports." />
      </div>

      {/* Layer 4 */}
      <div className="str-layer-section green">
        <SectionTitle number={16} title="Layer 4 — Mobility & Automotive Services" />
        <p className="str-body">Public transport and rentals are part of the broader mobility ecosystem — not separate random businesses.</p>
        <div className="str-mobility-grid">
          <div className="str-mob-col">
            <div className="str-mob-title">Mobility Services</div>
            <ul>{mobilityServices.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div className="str-mob-col">
            <div className="str-mob-title">Automotive Services</div>
            <ul>{autoServices.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </div>
        <p className="str-body-muted">The objective is not to build every service immediately — it is to allow the consumer to solve more mobility needs through the ecosystem over time.</p>
      </div>
    </div>
  );
}

// ─── Revenue tab ──────────────────────────────────────────────────────────────

function RevenueTab() {
  const streams = [
    {
      label: 'A. Media',
      color: 'red',
      items: ['Sponsored reviews', 'Sponsored content', 'Event coverage & partnerships', 'Brand campaigns & sponsorships', 'Automotive journalism partnerships'],
    },
    {
      label: 'B. Marketplace',
      color: 'orange',
      items: ['Individual listings', 'Dealer subscriptions', 'Featured listings', 'Premium placement', 'Lead generation', 'Consignment', 'Transaction facilitation'],
    },
    {
      label: 'C. Vehicle Trust',
      color: 'yellow',
      items: ['Diagnostic reports (P150/report)', 'Verification services', 'Premium inspections', 'Premium vehicle reports', '360° presentation'],
    },
    {
      label: 'D. Automotive Services',
      color: 'green',
      items: ['Leads', 'Advertising', 'Business subscriptions', 'Commissions', 'Featured placement'],
    },
    {
      label: 'E. Financial Services',
      color: 'green',
      items: ['Financing referral commissions', 'Insurance referrals', 'Tracking referrals'],
    },
    {
      label: 'F. Data (Long-term)',
      color: 'green',
      items: ['Dealer analytics', 'Market intelligence', 'Pricing intelligence', 'Maintenance-cost intelligence', 'Industry reports'],
    },
  ];

  return (
    <div className="str-chapter">
      <SectionTitle number={17} title="Revenue Model" />
      <div className="str-revenue-streams">
        {streams.map(({ label, color, items }) => (
          <div key={label} className="str-rev-card">
            <div className="str-rev-label"><Tag label={label} color={color} /></div>
            <ul className="str-rev-items">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        ))}
      </div>

      <SectionTitle number={18} title="Commercial Principle" />
      <Quote text="Maximize ecosystem value, not individual transaction fees. Some things should be free because they create traffic → data → trust → transactions. Other things should be paid because they create direct commercial value." />

      <SectionTitle number={19} title="Current Revenue Priority Stack" />
      <div className="str-rev-stack">
        <div className="str-rs-block">
          <Tag label="NOW" color="red" />
          <div className="str-rs-items">
            {['Media: Sponsored reviews, Events, Brand campaigns, Partnerships', 'Marketplace: Listings, Dealer subscriptions, Featured listings', 'Commercial partnerships: Banks, Dealerships, Automotive brands'].map((x, i) => <div key={i} className="str-rs-item">{x}</div>)}
          </div>
        </div>
        <div className="str-rs-block">
          <Tag label="NEXT" color="orange" />
          <div className="str-rs-items">
            {['Vehicle verification', 'Diagnostic reports', 'Import facilitation', 'Financing referrals'].map((x, i) => <div key={i} className="str-rs-item">{x}</div>)}
          </div>
        </div>
        <div className="str-rs-block">
          <Tag label="LATER" color="green" />
          <div className="str-rs-items">
            {['Vehicle intelligence', 'Service-data products', 'Dealer analytics', 'Market intelligence'].map((x, i) => <div key={i} className="str-rs-item">{x}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Execution Map tab ────────────────────────────────────────────────────────

function ExecutionTab() {
  const phases = [
    {
      n: 1, label: 'ESTABLISH & CONVERT', color: 'red',
      objective: 'Turn existing authority into owned digital activity.',
      items: ['Improve website UX', 'Improve vehicle listings', 'Improve SEO', 'Link social content to website', 'Build vehicle pages', 'Increase registrations', 'Improve analytics', 'Track social → website conversion'],
      metric: 'Qualified website traffic',
    },
    {
      n: 2, label: 'MARKETPLACE LIQUIDITY', color: 'red',
      objective: 'Make BwCarCulture.com genuinely useful for buying and selling.',
      items: ['More quality inventory', 'More serious dealerships', 'Better search + filters', 'Better enquiries', 'Dealer dashboards', 'Listing management', 'Featured listings', 'Lead tracking'],
      metric: 'Active listings · Active dealers · Enquiries · Returning users · Transactions',
    },
    {
      n: 3, label: 'MONETIZATION', color: 'orange',
      objective: 'Prove that the platform can sustain itself.',
      items: ['Dealer subscriptions', 'Paid listings', 'Featured placement', 'Sponsored reviews', 'Brand partnerships', 'Event partnerships', 'Financing partnerships'],
      metric: 'Monthly revenue · Recurring revenue · Revenue per dealer',
    },
    {
      n: 4, label: 'TRUST INFRASTRUCTURE', color: 'orange',
      objective: 'Make Bw Car Culture\'s marketplace meaningfully more trustworthy than generic classifieds.',
      items: ['Vehicle verification', 'Professional imaging', 'Diagnostic reports', 'Inspection records', 'Service history', 'Digital vehicle profiles', '360° presentation'],
      metric: 'Verified listings · Report volume · Trust signals',
    },
    {
      n: 5, label: 'VEHICLE DATA', color: 'yellow',
      objective: 'Turn activity into an information advantage.',
      items: ['Vehicle history', 'Pricing intelligence', 'Service-cost data', 'Dealer analytics', 'Market trends', 'Demand intelligence'],
      metric: 'Structured data records · Intelligence products',
    },
    {
      n: 6, label: 'MOBILITY ECOSYSTEM', color: 'yellow',
      objective: 'Increase the number of mobility problems the platform can solve.',
      items: ['Rentals', 'Public transport', 'Carpool', 'Financing & insurance', 'Workshops & parts'],
      metric: 'Mobility service usage',
    },
    {
      n: 7, label: 'REGIONAL EXPANSION', color: 'green',
      objective: 'Replicate the model beyond Botswana.',
      items: ['South Africa (media first)', 'Namibia · Zambia · Zimbabwe', 'Wider SADC'],
      metric: 'Regional active markets',
    },
  ];

  return (
    <div className="str-chapter">
      <SectionTitle number={20} title="Execution Phases" />
      <div className="str-phases">
        {phases.map(({ n, label, color, objective, items, metric }) => (
          <div key={n} className={`str-phase-card str-phase-${color}`}>
            <div className="str-phase-header">
              <div className="str-phase-num">Phase {n}</div>
              <div className="str-phase-label">{label}</div>
            </div>
            <div className="str-phase-obj">{objective}</div>
            <ul className="str-phase-items">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <div className="str-phase-metric"><span className="str-pm-label">Metric</span> {metric}</div>
          </div>
        ))}
      </div>

      <SectionTitle number={21} title="B2B2C Model" />
      <div className="str-b2b2c">
        <div className="str-b2c-row top">
          {['DEALERS', 'WORKSHOPS', 'BRANDS'].map(x => <div key={x} className="str-b2c-node biz">{x}</div>)}
        </div>
        <div className="str-b2c-center">BW CAR CULTURE</div>
        <div className="str-b2c-row bottom">
          {['BUYERS', 'OWNERS', 'USERS'].map(x => <div key={x} className="str-b2c-node consumer">{x}</div>)}
        </div>
        <div className="str-b2c-legend">
          <span>Businesses provide: <strong>Supply · Services · Capital</strong></span>
          <span>Platform provides: <strong>Distribution · Technology · Demand · Data</strong></span>
          <span>Consumers provide: <strong>Transactions · Engagement · Data</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── Priorities tab ───────────────────────────────────────────────────────────

function PrioritiesTab() {
  const priorities = [
    { n: 1, color: 'red',    label: 'Website Traffic',       desc: 'Get the existing audience onto BwCarCulture.com.' },
    { n: 2, color: 'red',    label: 'Marketplace Liquidity', desc: 'Get useful inventory and buyers interacting.' },
    { n: 3, color: 'red',    label: 'Monetization',          desc: 'Prove recurring revenue.' },
    { n: 4, color: 'orange', label: 'Dealer Relationships',  desc: 'Convert dealerships from social-media relationships into platform relationships.' },
    { n: 5, color: 'orange', label: 'Trust',                 desc: 'Begin structured verification and vehicle data.' },
    { n: 6, color: 'yellow', label: 'Service Network',       desc: 'Begin building mechanic/workshop relationships and service records.' },
    { n: 7, color: 'yellow', label: 'Mobility Services',     desc: 'Develop rentals/public transport progressively.' },
    { n: 8, color: 'green',  label: 'Intelligence',          desc: 'Use accumulated data to build higher-value products.' },
    { n: 9, color: 'green',  label: 'Regional Expansion',    desc: 'Replicate the model outside Botswana.' },
  ];

  const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e' };

  return (
    <div className="str-chapter">
      <SectionTitle number={22} title="Current Priority Stack" />
      <div className="str-priority-stack">
        {priorities.map(({ n, color, label, desc }) => (
          <div key={n} className="str-priority-row" style={{ borderLeftColor: colorMap[color] }}>
            <div className="str-pri-indicator" style={{ background: colorMap[color] }} />
            <div className="str-pri-n">{n}</div>
            <div className="str-pri-body">
              <div className="str-pri-label">{label}</div>
              <div className="str-pri-desc">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle number={23} title="The 90-Day Question" />
      <Quote text="What can we do in the next 90 days that materially increases traffic, transactions, revenue or trust? Every sprint should be traceable to that question." />

      <SectionTitle number={24} title="12-Month Objectives" />
      <div className="str-objectives-grid">
        {[
          { title: 'Audience',     desc: 'Strong and engaged automotive audience.' },
          { title: 'Platform',     desc: 'Functioning, useful automotive marketplace.' },
          { title: 'Traffic',      desc: 'Consistent organic and media-driven website traffic.' },
          { title: 'Supply',       desc: 'Growing dealership and private inventory.' },
          { title: 'Demand',       desc: 'Growing vehicle enquiries.' },
          { title: 'Revenue',      desc: 'Multiple proven revenue streams.' },
          { title: 'Trust',        desc: 'Initial verified vehicle infrastructure.' },
          { title: 'Data',         desc: 'Meaningful structured automotive data.' },
          { title: 'Partnerships', desc: 'Banks, dealerships, brands, workshops, mobility operators.' },
          { title: 'Foundation',   desc: 'A platform capable of expanding beyond Botswana.' },
        ].map(({ title, desc }) => (
          <div key={title} className="str-obj-card">
            <div className="str-obj-title">{title}</div>
            <div className="str-obj-desc">{desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle number={25} title="Decision Filter" />
      <p className="str-body">Before building anything, ask:</p>
      <div className="str-filter-grid">
        {['Authority', 'Traffic', 'Transactions', 'Trust', 'Data', 'Revenue', 'Customer experience', 'Market position'].map((x, i) => (
          <div key={i} className="str-filter-chip">Does it improve <strong>{x}?</strong></div>
        ))}
      </div>
      <p className="str-body-muted">If the answer is no to all of them, don't build it. If it supports several simultaneously, it deserves serious consideration.</p>
    </div>
  );
}

// ─── Philosophy tab ───────────────────────────────────────────────────────────

function PhilosophyTab() {
  return (
    <div className="str-chapter">
      <SectionTitle number={26} title="The Trust Philosophy" />
      <p className="str-body">Bw Car Culture operates on evidence over claims.</p>
      <div className="str-evidence-grid">
        {[
          { claim: '"Excellent condition."',    evidence: 'Inspection completed.' },
          { claim: '"Full service history."',   evidence: '12 documented service records.' },
          { claim: '"No faults."',              evidence: 'Diagnostic scan performed on [date].' },
        ].map(({ claim, evidence }, i) => (
          <div key={i} className="str-ev-row">
            <div className="str-ev-claim"><span className="str-ev-x">Instead of</span> {claim}</div>
            <div className="str-ev-arrow">→</div>
            <div className="str-ev-evidence"><span className="str-ev-check">We provide</span> {evidence}</div>
          </div>
        ))}
      </div>
      <Quote text="Trust is created through evidence and provenance, not marketing language." />

      <SectionTitle number={27} title="The Premium Experience" />
      <p className="str-body">Premium doesn't mean simply expensive design. It means reducing friction.</p>
      <p className="str-body">A premium experience means the user doesn't have to:</p>
      <div className="str-friction-list">
        {[
          'Chase information across platforms', 'Call five people to get basic specs',
          'Search ten platforms for a service', 'Wonder whether a listing is real',
          'Manually compare vehicles', 'Hunt for service records',
          'Repeatedly provide the same information',
        ].map((x, i) => <div key={i} className="str-friction-item">{x}</div>)}
      </div>
      <p className="str-body-muted">The platform progressively handles more of the journey.</p>

      <SectionTitle number={28} title="What Creates the Moat?" />
      <div className="str-moat-stack">
        {['AUDIENCE', 'BRAND AUTHORITY', 'MARKETPLACE', 'DEALER NETWORK', 'WORKSHOP NETWORK',
          'VEHICLE DATA', 'SERVICE HISTORY', 'DIAGNOSTIC DATA', 'TRANSACTION DATA', 'MEDIA DISTRIBUTION'].map((x, i) => (
          <div key={i} className="str-moat-layer">{x}</div>
        ))}
      </div>
      <p className="str-body-muted">Each layer makes the others more valuable. Someone can copy a website. It is much harder to copy years of relationships, vehicle records, transaction history and market data.</p>

      <SectionTitle number={29} title="The One-Line Company Model" />
      <Quote text="We establish authority through media, convert that authority into owned digital traffic, turn traffic into marketplace activity and transactions, turn activity into trusted data, and use revenue and data to build deeper roots in the automotive and mobility market." />

      <div className="str-highlight-box center">
        <strong>The ultimate ambition:</strong><br /><br />
        Become the digital layer through which consumers discover, buy, own, maintain, move and sell vehicles —
        while making the entire experience increasingly seamless, trustworthy and premium.
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TAB_COMPONENTS = {
  'north-star': NorthStarTab,
  'company':    CompanyTab,
  'strategy':   StrategyTab,
  'layers':     LayersTab,
  'revenue':    RevenueTab,
  'execution':  ExecutionTab,
  'priorities': PrioritiesTab,
  'philosophy': PhilosophyTab,
};

export default function StrategySection() {
  const [activeChapter, setActiveChapter] = useState('north-star');
  const ActiveComponent = TAB_COMPONENTS[activeChapter];

  return (
    <div className="ops-section str-root">
      <div className="ops-section-title-row">
        <h2 className="ops-section-title">◈ Company Strategy</h2>
        <span className="str-doc-label">Internal Strategic Document</span>
      </div>

      {/* Chapter navigation */}
      <div className="str-chapter-nav">
        {CHAPTERS.map(({ id, label }) => (
          <button
            key={id}
            className={`str-chapter-btn${activeChapter === id ? ' active' : ''}`}
            onClick={() => setActiveChapter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chapter content */}
      <ActiveComponent />
    </div>
  );
}
