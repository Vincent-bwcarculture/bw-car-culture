// src/components/admin/TrailerListingManager/TrailerListingCard.js
import React from 'react';
import './TrailerListingCard.css';

const TrailerListingCard = ({ trailer, onEdit, onView, onDelete, onUpdateStatus }) => {
  if (!trailer) return null;

  // Find primary image or use first image or placeholder
  const getPrimaryImage = () => {
    if (!trailer.images || trailer.images.length === 0) {
      return '/images/placeholders/trailer.jpg'; 
    }
    
    const primaryImage = trailer.images.find(img => img.isPrimary);
    return primaryImage ? primaryImage.url : trailer.images[0].url;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `P${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'booked': return 'status-booked';
      case 'maintenance': return 'status-maintenance';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  // Handle status change
  const handleStatusChange = (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    onUpdateStatus(newStatus);
  };

  return (
    <div className="trailer-listing-card">
      <div className="trailer-card-image">
        <img 
          src={getPrimaryImage()} 
          alt={trailer.title}
          onError={(e) => {
            e.target.src = '/images/placeholders/trailer.jpg';
          }}
        />
        <div className={`trailer-status ${getStatusClass(trailer.status)}`}>
          {trailer.status}
        </div>
        {trailer.featured && (
          <div className="featured-badge">Featured</div>
        )}
      </div>
      
      <div className="trailer-card-content">
        <h3 className="trailer-title">{trailer.title}</h3>
        
        <div className="trailer-info">
          <div className="trailer-specs">
            <div className="spec-item">
              <span className="spec-label">Type:</span>
              <span className="spec-value">{trailer.trailerType || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Length:</span>
              <span className="spec-value">
                {trailer.specifications?.size?.length ? `${trailer.specifications.size.length} ft` : 'N/A'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Capacity:</span>
              <span className="spec-value">
                {trailer.specifications?.capacity?.weight ? `${trailer.specifications.capacity.weight} kg` : 'N/A'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Axles:</span>
              <span className="spec-value">{trailer.specifications?.axles || 'N/A'}</span>
            </div>
          </div>
          
          <div className="trailer-rates">
            <div className="rate-item">
              <span className="rate-label">Daily Rate:</span>
              <span className="rate-value primary">{formatCurrency(trailer.rates?.daily)}</span>
            </div>
            {trailer.rates?.weekly && (
              <div className="rate-item">
                <span className="rate-label">Weekly Rate:</span>
                <span className="rate-value">{formatCurrency(trailer.rates.weekly)}</span>
              </div>
            )}
            {trailer.rates?.deliveryAvailable && (
              <div className="rate-item">
                <span className="rate-label">Delivery:</span>
                <span className="rate-value">{trailer.rates.deliveryFee ? formatCurrency(trailer.rates.deliveryFee) : 'Available'}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="trailer-meta">
          <div className="provider-info">
            <div className="provider-label">Provider:</div>
            <div className="provider-name">{trailer.provider?.businessName || 'N/A'}</div>
          </div>
          <div className="availability-info">
            <div className="availability-label">Availability:</div>
            <div className="availability-value">{trailer.availability || 'N/A'}</div>
          </div>
        </div>
        
        <div className="trailer-actions">
          <div className="trailer-status-update">
            <select 
              value={trailer.status} 
              onChange={handleStatusChange}
              className={`status-select ${getStatusClass(trailer.status)}`}
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="trailer-action-buttons">
            <button 
              className="action-btn view" 
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              title="View details"
            >
              View
            </button>
            <button 
              className="action-btn edit" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit trailer"
            >
              Edit
            </button>
            <button 
              className="action-btn delete" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete trailer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerListingCard;