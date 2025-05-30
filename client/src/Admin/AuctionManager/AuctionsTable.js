// src/components/admin/AuctionManager/AuctionsTable.js
import React from 'react';
import './AuctionManager.css';

const AuctionsTable = ({ auctions, loading, onEdit, onDelete, actionLoading }) => {
  if (loading) {
    return (
      <div className="auctions-loading">
        <div className="auctions-loader"></div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="no-auctions">
        <p>No auctions found</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      active: 'status-active',
      pending: 'status-pending',
      ended: 'status-ended',
      sold: 'status-sold',
      unsold: 'status-unsold',
      draft: 'status-draft'
    };
    return `status-badge ${statusClasses[status] || ''}`;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  return (
    <div className="auctions-table-container">
      <table className="auctions-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Starting Bid</th>
            <th>Current Bid</th>
            <th>Status</th>
            <th>Bids</th>
            <th>End Date</th>
            <th>Time Left</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map(auction => (
            <tr key={auction.id}>
              <td>
                <div className="auction-image">
                  <img 
                    src={auction.mainImage} 
                    alt={auction.title}
                    loading="lazy"
                  />
                </div>
              </td>
              <td>
                <div className="auction-title">
                  <h4>{auction.title}</h4>
                  <span className="auction-id">ID: {auction.id}</span>
                </div>
              </td>
              <td>
                <div className="auction-price">
                  ${auction.startingBid.toLocaleString()}
                </div>
              </td>
              <td>
                <div className="auction-price">
                  ${auction.currentBid > 0 ? auction.currentBid.toLocaleString() : auction.startingBid.toLocaleString()}
                </div>
              </td>
              <td>
                <span className={getStatusClass(auction.status)}>
                  {auction.status}
                </span>
              </td>
              <td>
                <div className="bid-count">
                  {auction.bidCount || 0}
                </div>
              </td>
              <td>{formatDate(auction.endDate)}</td>
              <td>
                <div className="time-remaining">
                  {auction.status === 'active' ? getTimeRemaining(auction.endDate) : '-'}
                </div>
              </td>
              <td>
                <div className="auction-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(auction)}
                    title="Edit auction"
                  >
                    ✎
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(auction.id)}
                    disabled={actionLoading.delete && actionLoading.id === auction.id}
                    title="Delete auction"
                  >
                    {actionLoading.delete && actionLoading.id === auction.id ? '...' : '×'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuctionsTable;