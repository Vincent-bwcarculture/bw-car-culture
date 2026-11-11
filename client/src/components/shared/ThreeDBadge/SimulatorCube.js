import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import { canUseSimulator, simulatorUrl } from '../../../utils/simulator.js';
import ThreeDBadge from './ThreeDBadge.js';

// The 3D cube as the Config Simulator entry point. Clickable only for users allowed into the
// simulator; others see a plain indicator when showToEveryone is set, otherwise nothing.
const SimulatorCube = ({ link, className = '', compact = false, showToEveryone = false, label }) => {
  const { user } = useAuth();
  if (!canUseSimulator(user)) {
    return showToEveryone ? <ThreeDBadge className={className} compact={compact} label={label} /> : null;
  }
  return (
    <Link to={simulatorUrl(link)} className={`bcc-3d-link ${className}`.trim()}
      aria-label="Open in 3D Config Simulator" title="Open in 3D Config Simulator"
      onClick={e => e.stopPropagation()}>
      <ThreeDBadge compact={compact} label="Open in 3D Config Simulator" />
    </Link>
  );
};

export default SimulatorCube;
