// src/components/shared/BusinessCard/BusinessCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import BusinessGallery from './BusinessGallery.js';
import './BusinessCard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

const BusinessCard = ({ business, onAction, compact = false }) => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(business?.metrics?.totalListings || 0);
  const [imageError, setImageError] = useState({ banner: false, logo: false });
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reactingTo, setReactingTo] = useState(null);
  const navigate = useNavigate();
  
  // UPDATED: Better business type detection
  const getBusinessType = () => {
    if (!business) return 'unknown';
    
    // Check provider type first (for service providers)
    if (business.providerType) {
      if (business.providerType === 'car_rental') return 'car_rental';
      if (business.providerType === 'trailer_rental') return 'trailer_rental';
      if (business.providerType === 'public_transport') return 'public_transport';
      if (business.providerType === 'workshop') return 'workshop';
    }
    
    // Check business type for dealerships
    if (business.businessType) {
      const type = business.businessType.toLowerCase();
      if (['independent', 'franchise', 'certified'].includes(type)) {
        return 'dealer';
      }
    }
    
    return 'service'; // Default fallback
  };

  const businessType = getBusinessType();
  
  useEffect(() => {
    setImageError({ banner: false, logo: false });
  }, [business?.businessName]);

  if (!business) return null;

  const handleItemCountUpdate = (count) => {
    setItemCount(count);
  };

  const handleImageError = (type) => {
    setImageError(prev => ({ ...prev, [type]: true }));
  };

  const isVerified = business.verification?.status === 'verified';

  const getBusinessTypeClass = (type, providerType) => {
    // First check for dealership types
    if (['independent', 'franchise', 'certified'].includes(type?.toLowerCase())) {
      return `bcc-business-${type.toLowerCase()}`;
    }
    
    // Then check service types
    if (providerType === 'workshop') {
      return 'bcc-business-workshop';
    } else if (providerType === 'car_rental') {
      return 'bcc-business-car-rental';
    } else if (providerType === 'trailer_rental') {
      return 'bcc-business-trailer-rental';
    } else if (providerType === 'public_transport') {
      return 'bcc-business-transport';
    } else if (type?.toLowerCase() === 'authorized') {
      return 'bcc-business-authorized';
    }
    
    return 'bcc-business-other';
  };

  const getBusinessTypeLabel = (type, providerType) => {
    // Check for dealership types
    if (type?.toLowerCase() === 'independent' && !providerType) {
      return 'Independent Dealer';
    } else if (type?.toLowerCase() === 'franchise' && !providerType) {
      return 'Franchise Dealer';
    } else if (type?.toLowerCase() === 'certified' && !providerType) {
      return 'Certified Dealer';
    }
    
    // Check for service types
    if (providerType === 'workshop') {
      if (type?.toLowerCase() === 'authorized') {
        return 'Authorized Workshop';
      } else if (type?.toLowerCase() === 'independent') {
        return 'Independent Workshop';
      }
      return 'Workshop';
    } else if (providerType === 'car_rental') {
      return 'Car Rental';
    } else if (providerType === 'trailer_rental') {
      return 'Trailer Rental';
    } else if (providerType === 'public_transport') {
      return 'Transport Service';
    }
    
    // Default case
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Service Provider';
  };

  // UPDATED: Improved action click handler with correct navigation paths
  const handleActionClick = (e) => {
    e.preventDefault();
    
    // If onAction prop is provided, use that (for custom handling)
    if (onAction) {
      onAction(business);
      return;
    }
    
    // Make sure we have a business ID
    if (!business._id) {
      console.error('Cannot navigate: Business ID is missing');
      return;
    }
    
    // Use slug for clean URLs, fall back to _id
    const identifier = business.slug || business._id;

    // Determine the correct path based on business type
    let path;

    if (businessType === 'dealer') {
      path = `/dealerships/${identifier}`;
    } else if (businessType === 'car_rental') {
      path = `/services/${identifier}?type=car_rental`;
    } else if (businessType === 'trailer_rental') {
      path = `/services/${identifier}?type=trailer_rental`;
    } else if (businessType === 'public_transport') {
      path = `/services/${identifier}?type=public_transport`;
    } else if (businessType === 'workshop') {
      path = `/services/${identifier}?type=workshop`;
    } else {
      path = `/services/${identifier}`;
    }
    
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  const fetchReviews = async () => {
    if (!business._id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/business/${business._id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data?.reviews || []);
      } else {
        setReviewsError('Could not load reviews.');
      }
    } catch {
      setReviewsError('Could not load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim() || replyText.trim().length < 2) return;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) { setSubmitError('Please log in to reply.'); return; }
    setSubmittingReply(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/business/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: replyText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setReplyingTo(null);
        await fetchReviews();
      }
    } catch { }
    finally { setSubmittingReply(false); }
  };

  const handleReact = async (reviewId, type, replyId = null) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) { setSubmitError('Please log in to react.'); return; }
    const key = replyId ? `${reviewId}-${replyId}-${type}` : `${reviewId}-${type}`;
    if (reactingTo === key) return;
    setReactingTo(key);
    try {
      const url = replyId
        ? `${API_BASE}/reviews/business/${reviewId}/replies/${replyId}/react`
        : `${API_BASE}/reviews/business/${reviewId}/react`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type })
      });
      await fetchReviews();
    } catch { }
    finally { setReactingTo(null); }
  };

  const handleFlip = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isFlipped) fetchReviews();
    setIsFlipped(f => !f);
  };

  const handleSubmitReview = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!newRating || newComment.trim().length < 10) return;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      setSubmitError('Please log in to leave a review.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId: business._id, rating: newRating, review: newComment.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setNewRating(0);
        setNewComment('');
        await fetchReviews();
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setSubmitError(data.message || 'Failed to submit review.');
      }
    } catch {
      setSubmitError('Network error — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get the correct image URL for banner and logo
  const getImageUrl = (imagePath, type) => {
    if (!imagePath) return null;
    
    // If it already has http/https, it's a complete URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's already a path with /uploads
    if (imagePath.includes('/uploads/')) {
      return imagePath;
    }
    
    // Extract just the filename if it has path elements
    const filename = imagePath.split('/').pop();
    
    // Check if this is a dealer or a provider
    if (businessType === 'dealer') {
      return `/uploads/dealers/${filename}`;
    } else {
      return `/uploads/providers/${filename}`;
    }
  };

  return (
    <div className="bcc-card-wrapper">
    <div
      className={`bcc-business-card ${compact ? 'compact' : ''} ${isFlipped ? 'bcc-flipped' : ''}`}
      onClick={!isFlipped ? handleActionClick : undefined}
    >
      <div className="bcc-business-card-inner">

        {/* ── FRONT FACE ── */}
        <div className="bcc-card-face bcc-card-front">
          <div className="bcc-business-banner">
            {(!business.profile?.banner || imageError.banner) ? (
              <div className="bcc-business-banner-placeholder">
                <div className="bcc-banner-gradient"></div>
              </div>
            ) : (
              <img
                src={getImageUrl(business.profile.banner, 'banner')}
                alt={`${business.businessName} banner`}
                onError={(e) => {
                  console.log('Banner image failed to load:', e.target.src);
                  handleImageError('banner');
                }}
                loading="lazy"
              />
            )}
          </div>

          <div className="bcc-business-content">
            <div className="bcc-business-header">
              <div className="bcc-business-logo">
                {(!business.profile?.logo || imageError.logo) ? (
                  <div className="bcc-business-logo-placeholder">
                    {business.businessName.charAt(0)}
                  </div>
                ) : (
                  <img
                    src={getImageUrl(business.profile.logo, 'logo')}
                    alt={`${business.businessName} logo`}
                    onError={(e) => {
                      console.log('Logo image failed to load:', e.target.src);
                      handleImageError('logo');
                    }}
                    loading="lazy"
                  />
                )}
              </div>

              <div className="bcc-business-info">
                <div className="bcc-name-row">
                  <h3 title={business.businessName}>{business.businessName}</h3>
                  {isVerified && (
                    <span className="bcc-verified-inline" title="Verified Business">✓</span>
                  )}
                </div>

                <div className="bcc-business-details">
                  <span className={`bcc-business-badge ${getBusinessTypeClass(business.businessType, business.providerType)}`}>
                    {getBusinessTypeLabel(business.businessType, business.providerType)}
                  </span>
                </div>

                {business.location && (
                  <div className="bcc-business-location">
                    <span>
                      {business.location?.city || 'Unknown'}
                      {business.location?.country ? `, ${business.location.country}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!compact && business.profile?.description && (
              <div className="bcc-business-description">
                {business.profile.description.length > 150
                  ? `${business.profile.description.substring(0, 150)}...`
                  : business.profile.description}
              </div>
            )}

            {!compact && business.profile?.specialties && business.profile.specialties.length > 0 && (
              <div className="bcc-business-specialties">
                <span className="bcc-specialties-label">Specialties</span>
                <div className="bcc-specialty-tags">
                  {business.profile.specialties.slice(0, 3).map((specialty, index) => (
                    <span key={index} className="bcc-specialty-tag">
                      {specialty}
                    </span>
                  ))}
                  {business.profile.specialties.length > 3 && (
                    <span className="bcc-more-specialties">
                      +{business.profile.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {!compact && (
              <BusinessGallery
                businessId={business._id}
                businessType={businessType}
                onCountUpdate={handleItemCountUpdate}
              />
            )}
          </div>

          <div className="bcc-business-footer">
            <div className="bcc-business-metrics">
              <div className="bcc-business-metric">
                <span className="bcc-business-metric-value">{itemCount}</span>
                <span className="bcc-business-metric-label">
                  {businessType === 'dealer' ? 'Listings' :
                    businessType === 'car_rental' ? 'Rentals' :
                    businessType === 'trailer_rental' ? 'Trailers' :
                    businessType === 'public_transport' ? 'Routes' :
                    'Items'}
                </span>
              </div>

              {business.metrics?.totalReviews > 0 && (
                <div className="bcc-business-metric">
                  <span className="bcc-business-metric-value">
                    <span className="bcc-business-stars">
                      {'★'.repeat(Math.floor(business.metrics.averageRating || 0))}
                      {business.metrics.averageRating % 1 >= 0.5 ? '½' : ''}
                    </span>
                    <span className="bcc-business-rating-value">
                      {business.metrics.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </span>
                  <span className="bcc-business-metric-label">
                    {business.metrics.totalReviews} reviews
                  </span>
                </div>
              )}
            </div>

            <div className="bcc-business-actions">
              <button className="bcc-business-cta" onClick={handleActionClick}>
                {businessType === 'dealer' ? 'View Dealership' :
                  businessType === 'car_rental' ? 'View Car Rentals' :
                  businessType === 'trailer_rental' ? 'View Trailer Rentals' :
                  businessType === 'public_transport' ? 'View Transport' : 'View Details'}
              </button>
            </div>
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div className="bcc-card-face bcc-card-back" onClick={e => e.stopPropagation()}>
          <div className="bcc-back-top-bar">
            <button className="bcc-flip-back-btn" onClick={handleFlip}>← Back</button>
            <div className="bcc-back-title">
              <span>{business.businessName}</span>
              {business.metrics?.averageRating > 0 && (
                <span className="bcc-back-avg">
                  ★ {business.metrics.averageRating.toFixed(1)} · {business.metrics.totalReviews} review{business.metrics.totalReviews !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="bcc-reviews-scroll">
            {reviewsLoading && <div className="bcc-reviews-loading">Loading reviews…</div>}
            {reviewsError && <div className="bcc-reviews-error">{reviewsError}</div>}
            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <div className="bcc-no-reviews">No reviews yet — be the first!</div>
            )}
            {reviews.map((review, i) => {
              const reviewId = review._id;
              const userLiked = review.likes?.includes(user?._id);
              const userDisliked = review.dislikes?.includes(user?._id);
              return (
                <div key={i} className="bcc-review-item">
                  <div className="bcc-review-author-row">
                    <span className="bcc-review-author">{review.reviewer?.name || review.fromUserId?.name || 'Anonymous'}</span>
                    {review.isOwner && <span className="bcc-owner-badge">Owner</span>}
                    <span className="bcc-review-stars">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  {review.review && <p className="bcc-review-text">{review.review}</p>}
                  {review.date && (
                    <span className="bcc-review-date">{new Date(review.date).toLocaleDateString()}</span>
                  )}
                  <div className="bcc-review-actions">
                    <div className="bcc-react-group">
                      <button
                        className={`bcc-react-btn ${userLiked ? 'active-like' : ''}`}
                        onClick={e => { e.stopPropagation(); handleReact(reviewId, 'like'); }}
                      >👍 {review.likes?.length || 0}</button>
                      <button
                        className={`bcc-react-btn ${userDisliked ? 'active-dislike' : ''}`}
                        onClick={e => { e.stopPropagation(); handleReact(reviewId, 'dislike'); }}
                      >👎 {review.dislikes?.length || 0}</button>
                    </div>
                    <button className="bcc-reply-btn" onClick={e => { e.stopPropagation(); setReplyingTo(replyingTo === reviewId ? null : reviewId); setReplyText(''); }}>
                      Reply
                    </button>
                  </div>
                  {replyingTo === reviewId && (
                    <div className="bcc-reply-form" onClick={e => e.stopPropagation()}>
                      <textarea
                        className="bcc-review-textarea"
                        placeholder="Write a reply…"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={2}
                      />
                      <div className="bcc-reply-form-actions">
                        <button className="bcc-reply-cancel-btn" onClick={e => { e.stopPropagation(); setReplyingTo(null); }}>Cancel</button>
                        <button
                          className="bcc-reply-submit-btn"
                          onClick={e => { e.stopPropagation(); handleSubmitReply(reviewId); }}
                          disabled={submittingReply || replyText.trim().length < 2}
                        >{submittingReply ? 'Posting…' : 'Post Reply'}</button>
                      </div>
                    </div>
                  )}
                  {(review.replies || []).length > 0 && (
                    <div className="bcc-replies-list">
                      {review.replies.map((rep, ri) => {
                        const repLiked = rep.likes?.includes(user?._id);
                        const repDisliked = rep.dislikes?.includes(user?._id);
                        return (
                          <div key={ri} className={`bcc-reply-item${rep.isOwner ? ' bcc-reply-owner' : ''}`}>
                            <div className="bcc-review-author-row">
                              <span className="bcc-review-author">{rep.authorName || 'Anonymous'}</span>
                              {rep.isOwner && <span className="bcc-owner-badge">Owner</span>}
                            </div>
                            <p className="bcc-review-text">{rep.text}</p>
                            <div className="bcc-review-actions">
                              <div className="bcc-react-group">
                                <button
                                  className={`bcc-react-btn ${repLiked ? 'active-like' : ''}`}
                                  onClick={e => { e.stopPropagation(); handleReact(reviewId, 'like', rep._id); }}
                                >👍 {rep.likes?.length || 0}</button>
                                <button
                                  className={`bcc-react-btn ${repDisliked ? 'active-dislike' : ''}`}
                                  onClick={e => { e.stopPropagation(); handleReact(reviewId, 'dislike', rep._id); }}
                                >👎 {rep.dislikes?.length || 0}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bcc-review-form">
            <div className="bcc-star-picker">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className={`bcc-star-btn ${s <= newRating ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); setNewRating(s); }}
                  title={`${s} star${s !== 1 ? 's' : ''}`}
                >★</button>
              ))}
            </div>
            <textarea
              className="bcc-review-textarea"
              placeholder="Share your experience… (min 10 chars)"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={2}
              onClick={e => e.stopPropagation()}
            />
            {submitSuccess && <span className="bcc-submit-success">✓ Review submitted!</span>}
            {submitError && <span className="bcc-submit-error">{submitError}</span>}
            <button
              className="bcc-review-submit"
              onClick={handleSubmitReview}
              disabled={isSubmitting || !newRating || newComment.trim().length < 10}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>

      </div>

      <div className="bcc-card-hover-effect"></div>
    </div>

    {/* Vertical REVIEW tab — outside card so it can protrude without clipping */}
    <button
      className={`bcc-review-tab ${getBusinessTypeClass(business.businessType, business.providerType)}`}
      onClick={handleFlip}
      title="Reviews"
    >
      REVIEW
    </button>
    </div>
  );
};

export default BusinessCard;