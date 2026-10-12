import React from 'react';

export function SubmissionEditNotice({ submission, showChanges = false }) {
  const history = submission.editHistory || [];
  if (!history.length || submission.status !== 'pending_review') return null;
  const latest = history[history.length - 1];
  return (
    <div className="review-detail-section" aria-label="Edit awaiting review">
      <strong>{submission.listingId ? 'Live listing edit awaiting review' : 'Edited submission awaiting review'}</strong>
      {latest.editNote && <p>Edit note: {latest.editNote}</p>}
      {submission.listingId && <p>The currently approved listing stays live until these changes are approved.</p>}
      {showChanges && submission.reviewChanges?.length > 0 && (
        <table className="review-changes-table">
          <thead><tr><th>Field</th><th>Published</th><th>Submitted edit</th></tr></thead>
          <tbody>{submission.reviewChanges.map(change => (
            <tr key={change.field}><th>{change.field}</th><td>{change.before || '—'}</td><td>{change.after || '—'}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export function SubmissionListingStats({ submission }) {
  const stats = submission.listingStats;
  if (!stats?.available) return submission.listingId ? <p>Listing statistics unavailable.</p> : null;
  return (
    <div className="admin-submissions-detail-row" aria-label="Listing statistics">
      <span>{Number(stats.views || 0).toLocaleString()} views · {Number(stats.saves || 0).toLocaleString()} saves · {Number(stats.inquiries || 0).toLocaleString()} inquiries</span>
    </div>
  );
}

export function PaymentProofPreview({ url }) {
  const pdf = /\.pdf(?:[?#]|$)/i.test(url);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {pdf ? <span>Open payment proof (PDF)</span> : <img src={url} alt="Boost payment proof" className="review-boost-img" />}
    </a>
  );
}

export function SubmissionBoostProof({ submission }) {
  const boost = submission.listingData?.featuredBoost;
  if (!boost?.requested && !boost?.proofUrl && !submission.paymentProof?.submitted) return null;
  const verified = !!boost?.proofUrl && submission.paymentProof?.status === 'approved' &&
    submission.paymentProof.proofUrl === boost.proofUrl;
  return (
    <div className={`admin-submissions-payment-status ${verified ? 'approved' : 'pending'}`}>
      <span>{verified ? 'Boost payment verified' : boost?.proofUrl ? 'Boost proof submitted — awaiting verification' : 'Boost requested — proof missing'}</span>
      {boost?.proofUrl && <a href={boost.proofUrl} target="_blank" rel="noopener noreferrer">Open payment proof</a>}
    </div>
  );
}
