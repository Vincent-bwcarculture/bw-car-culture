import React from 'react';
import { ADMIN_LISTING_STATUSES } from '../../utils/adminListingForm.js';

export default function ListingStatusControl({ listing, state = {}, onChange }) {
  const current = listing.status || 'draft';
  return <div className={`listing-status-control status-${current}`}>
    <select aria-label={`Status for ${listing.title}`} value={state.pending ? state.nextStatus : current} disabled={state.pending}
      onChange={event => onChange(listing._id, event.target.value)}>
      {!ADMIN_LISTING_STATUSES.some(item => item.value === current) && <option value={current}>{current}</option>}
      {ADMIN_LISTING_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    {state.pending && <small role="status">Saving status...</small>}
    {state.error && <small className="listing-status-error" role="alert">{state.error}</small>}
  </div>;
}
