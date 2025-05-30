// src/components/admin/RentalVehicleManager/RentalVehicleCard.js
import React from 'react';
import './RentalVehicleCard.css';

const RentalVehicleCard = ({ rental, onEdit, onView, onDelete, onUpdateStatus }) => {
  if (!rental) return null;

// Add at the beginning of the RentalVehicleCard component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedRentalImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedRentalImages') || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem('failedRentalImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

  // Find primary image or use first image or placeholder
// Enhanced function to get the primary image with S3 support
const getPrimaryImage = () => {
  try {
    if (!rental.images || rental.images.length === 0) {
      return '/images/placeholders/rental.jpg'; 
    }
    
    // Find primary image or use first image
    const primaryImage = rental.images.find(img => img.isPrimary) || rental.images[0];
    
    // Handle string format
    if (typeof primaryImage === 'string') {
      return primaryImage;
    }
    
    // Handle object format with url property
    if (primaryImage && typeof primaryImage === 'object') {
      // For S3 objects, prefer url over thumbnail
      const imageUrl = primaryImage.url || primaryImage.thumbnail || '';
      
      // If we have an S3 key but no URL, create proxy URL
      if (!imageUrl && primaryImage.key) {
        return `/api/images/s3-proxy/${primaryImage.key}`;
      }
      
      if (imageUrl) {
        // Fix problematic S3 URLs with duplicate paths
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
    }
    
    // Fallback to placeholder
    return '/images/placeholders/rental.jpg';
  } catch (error) {
    console.error('Error getting primary rental image:', error);
    return '/images/placeholders/rental.jpg';
  }
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
    <div className="rental-vehicle-card">
      <div className="rental-card-image">
       <img 
  src={getPrimaryImage()} 
  alt={rental.name}
  onError={(e) => {
    const originalSrc = e.target.src;
    console.error(`Rental image failed to load: ${originalSrc}`);
    
    // Mark this image as failed
    markFailedImage(originalSrc);
    
    // For S3 URLs, try the proxy endpoint
    if (originalSrc.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        // Normalize the key to prevent duplicate segments
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // For local paths, try direct path if not already a placeholder
    if (!originalSrc.includes('/images/placeholders/')) {
      const filename = originalSrc.split('/').pop();
      if (filename) {
        e.target.src = `/uploads/rentals/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/rental.jpg';
  }}
/>
        <div className={`rental-status ${getStatusClass(rental.status)}`}>
          {rental.status}
        </div>
        {rental.featured && (
          <div className="featured-badge">Featured</div>
        )}
      </div>
      
      <div className="rental-card-content">
        <h3 className="rental-name">{rental.name}</h3>
        
        <div className="rental-info">
          <div className="rental-specs">
            <div className="spec-item">
              <span className="spec-label">Make:</span>
              <span className="spec-value">{rental.specifications?.make || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Model:</span>
              <span className="spec-value">{rental.specifications?.model || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Year:</span>
              <span className="spec-value">{rental.specifications?.year || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Category:</span>
              <span className="spec-value">{rental.category || 'N/A'}</span>
            </div>
          </div>
          
          <div className="rental-rates">
            <div className="rate-item">
              <span className="rate-label">Daily Rate:</span>
              <span className="rate-value primary">{formatCurrency(rental.rates?.daily)}</span>
            </div>
            {rental.rates?.weekly && (
              <div className="rate-item">
                <span className="rate-label">Weekly Rate:</span>
                <span className="rate-value">{formatCurrency(rental.rates.weekly)}</span>
              </div>
            )}
            {rental.rates?.monthly && (
              <div className="rate-item">
                <span className="rate-label">Monthly Rate:</span>
                <span className="rate-value">{formatCurrency(rental.rates.monthly)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="rental-meta">
          <div className="provider-info">
            <div className="provider-label">Provider:</div>
            <div className="provider-name">{rental.provider?.businessName || 'N/A'}</div>
          </div>
          <div className="availability-info">
            <div className="availability-label">Availability:</div>
            <div className="availability-value">{rental.availability || 'N/A'}</div>
          </div>
        </div>
        
        <div className="rental-actions">
          <div className="rental-status-update">
            <select 
              value={rental.status} 
              onChange={handleStatusChange}
              className={`status-select ${getStatusClass(rental.status)}`}
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="rental-action-buttons">
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
              title="Edit rental"
            >
              Edit
            </button>
            <button 
              className="action-btn delete" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete rental"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalVehicleCard;