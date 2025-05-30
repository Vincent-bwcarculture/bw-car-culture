// src/components/admin/TransportRouteManager/TransportRouteCard.js
import React from 'react';
import './TransportRouteCard.css';

const TransportRouteCard = ({ route, onEdit, onView, onDelete, onUpdateStatus }) => {
  if (!route) return null;

  // Find primary image or use first image or placeholder
  const getPrimaryImage = () => {
    if (!route.images || route.images.length === 0) {
      return '/images/placeholders/transport.jpg'; 
    }
    
    const primaryImage = route.images.find(img => img.isPrimary);
    return primaryImage ? primaryImage.url : route.images[0].url;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `P${amount.toLocaleString()}`;
  };

  // Format time (e.g., "08:00")
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
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
      case 'active': return 'status-active';
      case 'seasonal': return 'status-seasonal';
      case 'suspended': return 'status-suspended';
      case 'discontinued': return 'status-discontinued';
      default: return '';
    }
  };

  // Handle status change
  const handleStatusChange = (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    onUpdateStatus(newStatus);
  };

  // Get route title
  const getRouteTitle = () => {
    if (route.title) return route.title;
    if (route.routeNumber) {
      return `${route.routeNumber} - ${route.origin} to ${route.destination}`;
    }
    return `${route.origin} to ${route.destination}`;
  };

  // Get operating days as string
  const getOperatingDays = () => {
    if (!route.schedule || !route.schedule.operatingDays) return 'Not specified';
    
    const days = Object.entries(route.schedule.operatingDays)
      .filter(([_, isOperating]) => isOperating)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));
    
    if (days.length === 7) return 'Daily';
    if (days.length === 0) return 'None';
    
    return days.join(', ');
  };

  // Get first departure time or 'N/A'
  const getDepartureTime = () => {
    if (!route.schedule || !route.schedule.departureTimes || route.schedule.departureTimes.length === 0) {
      return 'N/A';
    }
    
    return formatTime(route.schedule.departureTimes[0]);
  };

  return (
    <div className="transport-route-card">
      <div className="route-card-image">
        <img 
          src={getPrimaryImage()} 
          alt={`${route.origin}-${route.destination}`}
          onError={(e) => {
            e.target.src = '/images/placeholders/transport.jpg';
          }}
        />
        <div className={`route-status ${getStatusClass(route.status)}`}>
          {route.status}
        </div>
        {route.featured && (
          <div className="featured-badge">Featured</div>
        )}
      </div>
      
      <div className="route-card-content">
        <h3 className="route-title">{getRouteTitle()}</h3>
        
        <div className="route-journey">
          <div className="journey-endpoint origin">
            <span className="endpoint-label">From:</span>
            <span className="endpoint-value">{route.origin}</span>
          </div>
          <div className="journey-arrow">→</div>
          <div className="journey-endpoint destination">
            <span className="endpoint-label">To:</span>
            <span className="endpoint-value">{route.destination}</span>
          </div>
        </div>
        
        <div className="route-info">
          <div className="route-specs">
            <div className="spec-item">
              <span className="spec-label">Type:</span>
              <span className="spec-value">{route.routeType || 'N/A'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Service:</span>
              <span className="spec-value">{route.serviceType || 'Regular'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Days:</span>
              <span className="spec-value">{getOperatingDays()}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Departure:</span>
              <span className="spec-value">{getDepartureTime()}</span>
            </div>
          </div>
          
          <div className="route-fare">
            <div className="fare-item">
              <span className="fare-label">Fare:</span>
              <span className="fare-value primary">{formatCurrency(route.fare)}</span>
            </div>
            {route.fareOptions?.childFare && (
              <div className="fare-item">
                <span className="fare-label">Child Fare:</span>
                <span className="fare-value">{formatCurrency(route.fareOptions.childFare)}</span>
              </div>
            )}
            {route.fareOptions?.roundTripDiscount && (
              <div className="fare-item">
                <span className="fare-label">Round Trip:</span>
                <span className="fare-value">{route.fareOptions.roundTripDiscount}% off</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="route-meta">
          <div className="provider-info">
            <div className="provider-label">Provider:</div>
            <div className="provider-name">{route.provider?.businessName || 'N/A'}</div>
          </div>
          <div className="rating-info">
            <div className="rating-label">Rating:</div>
            <div className="rating-value">
              {route.averageRating ? `${route.averageRating} ★` : 'No ratings'}
            </div>
          </div>
        </div>
        
        <div className="route-actions">
          <div className="route-status-update">
            <select 
              value={route.status} 
              onChange={handleStatusChange}
              className={`status-select ${getStatusClass(route.status)}`}
            >
              <option value="active">Active</option>
              <option value="seasonal">Seasonal</option>
              <option value="suspended">Suspended</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
          
          <div className="route-action-buttons">
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
              title="Edit route"
            >
              Edit
            </button>
            <button 
              className="action-btn delete" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete route"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportRouteCard;