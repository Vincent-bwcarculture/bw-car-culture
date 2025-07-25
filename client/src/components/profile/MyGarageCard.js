// client/src/components/profile/MyGarageCard.js
// Component for displaying user's actual live listings from the listings database

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image, 
  ExternalLink, 
  Edit, 
  Eye,
  TrendingUp,
  Heart,
  MessageCircle,
  Calendar,
  DollarSign,
  Settings,
  MoreVertical,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import './MyGarageCard.css';

const MyGarageCard = ({ 
  listing, 
  formatDate, 
  showMessage,
  onUpdateListing,
  onToggleStatus,
  onDeleteListing 
}) => {
  const navigate = useNavigate();

  // Get primary image from listing
  const getPrimaryImage = () => {
    if (!listing.images || listing.images.length === 0) {
      return null;
    }
    
    // Find primary image or use first one
    const primaryImg = listing.images.find(img => img.isPrimary) || listing.images[0];
    
    if (typeof primaryImg === 'string') {
      return primaryImg;
    }
    
    return primaryImg?.url || primaryImg?.thumbnail || null;
  };

  // Handle viewing the live listing
  const handleViewListing = () => {
    console.log('🔍 Viewing live listing:', listing._id);
    const listingUrl = `/listing/${listing._id}`;
    navigate(listingUrl);
    showMessage('success', 'Opening your live listing...');
  };

  // Handle updating the listing
  const handleUpdateListing = () => {
    console.log('✏️ Updating listing:', listing._id);
    if (onUpdateListing) {
      onUpdateListing(listing);
    } else {
      // Default: navigate to edit page
      const editUrl = `/listings/edit/${listing._id}`;
      navigate(editUrl);
      showMessage('info', 'Opening listing editor...');
    }
  };

  // Get status color and label
  const getStatusInfo = (status) => {
    const statusMap = {
      active: { color: '#10b981', label: 'Active', icon: '🟢' },
      inactive: { color: '#6b7280', label: 'Inactive', icon: '⚫' },
      paused: { color: '#f59e0b', label: 'Paused', icon: '⏸️' },
      sold: { color: '#3b82f6', label: 'Sold', icon: '✅' },
      expired: { color: '#ef4444', label: 'Expired', icon: '⏰' }
    };
    
    return statusMap[status] || statusMap.active;
  };

  const statusInfo = getStatusInfo(listing.status);
  const primaryImage = getPrimaryImage();

  return (
    <div className="mgc-garage-card">
      {/* Image Section */}
      <div className="mgc-image-container">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={listing.title}
            className="mgc-vehicle-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`mgc-image-placeholder ${primaryImage ? 'mgc-hidden' : ''}`}>
          <Image size={32} />
          <span>No Image</span>
        </div>
        
        {/* Status Badge */}
        <div className="mgc-status-badge" style={{ backgroundColor: statusInfo.color }}>
          <span>{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
        </div>

        {/* Featured Badge */}
        {listing.featured && (
          <div className="mgc-featured-badge">
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="mgc-content">
        {/* Header */}
        <div className="mgc-header">
          <h3 className="mgc-title">{listing.title}</h3>
          <div className="mgc-actions-menu">
            <button className="mgc-menu-btn" title="More actions">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="mgc-details">
          <div className="mgc-detail-row">
            <span className="mgc-detail-label">Vehicle:</span>
            <span className="mgc-detail-value">
              {listing.specifications?.year} {listing.specifications?.make} {listing.specifications?.model}
            </span>
          </div>
          
          <div className="mgc-detail-row">
            <span className="mgc-detail-label">Price:</span>
            <span className="mgc-detail-value mgc-price">
              P{Number(listing.price || 0).toLocaleString()}
            </span>
          </div>
          
          {listing.location?.city && (
            <div className="mgc-detail-row">
              <span className="mgc-detail-label">Location:</span>
              <span className="mgc-detail-value">{listing.location.city}</span>
            </div>
          )}
          
          <div className="mgc-detail-row">
            <span className="mgc-detail-label">Listed:</span>
            <span className="mgc-detail-value">
              {formatDate(listing.createdAt)}
            </span>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mgc-analytics">
          <div className="mgc-stat">
            <Eye size={14} />
            <span>{listing.views || 0} views</span>
          </div>
          <div className="mgc-stat">
            <Heart size={14} />
            <span>{listing.saves || 0} saves</span>
          </div>
          <div className="mgc-stat">
            <MessageCircle size={14} />
            <span>{listing.inquiries || 0} inquiries</span>
          </div>
        </div>

        {/* Subscription Info */}
        {listing.subscription && (
          <div className="mgc-subscription">
            <div className="mgc-subscription-badge">
              {listing.subscription.tier?.toUpperCase() || 'BASIC'}
            </div>
            {listing.subscription.expiresAt && (
              <div className="mgc-expiry">
                <Calendar size={12} />
                <span>Expires: {formatDate(listing.subscription.expiresAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mgc-actions">
          <button
            className="mgc-btn mgc-btn-primary"
            onClick={handleViewListing}
            title="View live listing"
          >
            <ExternalLink size={14} />
            View Live
          </button>
          
          <button
            className="mgc-btn mgc-btn-secondary"
            onClick={handleUpdateListing}
            title="Edit listing"
          >
            <Edit size={14} />
            Edit
          </button>
          
          {/* Status Toggle */}
          {listing.status === 'active' ? (
            <button
              className="mgc-btn mgc-btn-warning"
              onClick={() => onToggleStatus && onToggleStatus(listing._id, 'paused')}
              title="Pause listing"
            >
              <Pause size={14} />
              Pause
            </button>
          ) : (
            <button
              className="mgc-btn mgc-btn-success"
              onClick={() => onToggleStatus && onToggleStatus(listing._id, 'active')}
              title="Activate listing"
            >
              <Play size={14} />
              Activate
            </button>
          )}
        </div>

        {/* Performance Insights */}
        {(listing.views > 0 || listing.inquiries > 0) && (
          <div className="mgc-insights">
            <div className="mgc-insights-header">
              <TrendingUp size={14} />
              <span>Performance</span>
            </div>
            <div className="mgc-insights-content">
              {listing.views > 50 && (
                <div className="mgc-insight mgc-insight-positive">
                  🔥 High visibility - {listing.views} views
                </div>
              )}
              {listing.inquiries > 5 && (
                <div className="mgc-insight mgc-insight-positive">
                  💬 Strong interest - {listing.inquiries} inquiries
                </div>
              )}
              {listing.views > 0 && listing.inquiries === 0 && listing.views > 20 && (
                <div className="mgc-insight mgc-insight-neutral">
                  👁️ Good views but no inquiries - consider updating price or description
                </div>
              )}
              {listing.subscription?.tier === 'basic' && listing.views > 100 && (
                <div className="mgc-insight mgc-insight-suggestion">
                  ⭐ Consider upgrading to featured for more visibility
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGarageCard;
