import React from 'react';
import './ThreeDBadge.css';

// Marks content that has an interactive 3D model.
const ThreeDBadge = ({ className = '', label = 'Interactive 3D model', compact = false }) => (
  <span className={`bcc-3d-badge${compact ? ' bcc-3d-badge--compact' : ''} ${className}`.trim()} title={label} aria-label={label} role="img">
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
    {!compact && <span className="bcc-3d-badge-text">3D</span>}
  </span>
);

export default ThreeDBadge;
