// client/src/components/profile/AddonBookingModal.js
// Modal for booking add-ons that require scheduling or additional details

import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Phone, User, MapPin, 
  Camera, Shield, Award, Info, Check, AlertCircle 
} from 'lucide-react';
import './AddonBookingModal.css';

const AddonBookingModal = ({ 
  isOpen, 
  onClose, 
  addon, 
  onBookingConfirm,
  loading = false 
}) => {
  const [bookingData, setBookingData] = useState({
    preferredDate: '',
    preferredTime: '',
    alternativeDate: '',
    alternativeTime: '',
    contactPhone: '',
    specificRequests: '',
    vehicleLocation: '',
    accessInstructions: '',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !addon) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateBooking = () => {
    const newErrors = {};

    if (!bookingData.preferredDate) {
      newErrors.preferredDate = 'Preferred date is required';
    }

    if (!bookingData.preferredTime) {
      newErrors.preferredTime = 'Preferred time is required';
    }

    if (!bookingData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    }

    if (addon.id === 'photography' || addon.id === 'full_assistance') {
      if (!bookingData.vehicleLocation.trim()) {
        newErrors.vehicleLocation = 'Vehicle location is required for photography services';
      }
    }

    if (!bookingData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and conditions';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateBooking();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onBookingConfirm(bookingData);
  };

  const getAddonIcon = () => {
    switch(addon.id) {
      case 'photography': return <Camera size={32} />;
      case 'listing_assistance': return <Shield size={32} />;
      case 'full_assistance': return <Award size={32} />;
      default: return <Info size={32} />;
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="addon-booking-overlay">
      <div className="addon-booking-modal">
        {/* Header */}
        <div className="booking-header">
          <div className="booking-title">
            <div className="addon-icon">
              {getAddonIcon()}
            </div>
            <div>
              <h3>Book {addon.name}</h3>
              <p>P{addon.price} • {addon.duration}</p>
            </div>
          </div>
          <button 
            className="close-booking-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <div className="booking-description">
          <p>{addon.description}</p>
          
          {addon.id === 'photography' && (
            <div className="service-details">
              <h4>What's included:</h4>
              <ul>
                <li>Professional photographer visit</li>
                <li>Up to 20 high-quality images</li>
                <li>Multiple angles and lighting setups</li>
                <li>Interior and exterior shots</li>
                <li>Engine bay and detail photos</li>
                <li>Photo editing and enhancement</li>
                <li>2-3 business day delivery</li>
              </ul>
            </div>
          )}

          {addon.id === 'listing_assistance' && (
            <div className="service-details">
              <h4>What's included:</h4>
              <ul>
                <li>Professional listing creation</li>
                <li>Market analysis and pricing advice</li>
                <li>SEO-optimized description writing</li>
                <li>Feature highlighting and presentation</li>
                <li>Ongoing performance monitoring</li>
                <li>Buyer inquiry management</li>
                <li>Monthly performance reports</li>
              </ul>
            </div>
          )}

          {addon.id === 'full_assistance' && (
            <div className="service-details">
              <h4>Complete service includes:</h4>
              <ul>
                <li>Professional photography session</li>
                <li>Expert listing creation and optimization</li>
                <li>Market analysis and strategic pricing</li>
                <li>SEO-optimized content writing</li>
                <li>Social media promotion setup</li>
                <li>Lead management and follow-up</li>
                <li>Performance tracking and optimization</li>
                <li>Dedicated account manager</li>
              </ul>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <h4>
              <Calendar size={18} />
              Scheduling Details
            </h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="preferredDate">Preferred Date*</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={bookingData.preferredDate}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className={errors.preferredDate ? 'error' : ''}
                  required
                />
                {errors.preferredDate && <span className="error-message">{errors.preferredDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="preferredTime">Preferred Time*</label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={bookingData.preferredTime}
                  onChange={handleInputChange}
                  className={errors.preferredTime ? 'error' : ''}
                  required
                >
                  <option value="">Select Time</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
                {errors.preferredTime && <span className="error-message">{errors.preferredTime}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="alternativeDate">Alternative Date</label>
                <input
                  type="date"
                  id="alternativeDate"
                  name="alternativeDate"
                  value={bookingData.alternativeDate}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>

              <div className="form-group">
                <label htmlFor="alternativeTime">Alternative Time</label>
                <select
                  id="alternativeTime"
                  name="alternativeTime"
                  value={bookingData.alternativeTime}
                  onChange={handleInputChange}
                >
                  <option value="">Select Time</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>
              <User size={18} />
              Contact Information
            </h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone*</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={bookingData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="e.g., +26771234567"
                  className={errors.contactPhone ? 'error' : ''}
                  required
                />
                {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
              </div>
            </div>
          </div>

          {(addon.id === 'photography' || addon.id === 'full_assistance') && (
            <div className="form-section">
              <h4>
                <MapPin size={18} />
                Vehicle Location
              </h4>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="vehicleLocation">Vehicle Location*</label>
                  <input
                    type="text"
                    id="vehicleLocation"
                    name="vehicleLocation"
                    value={bookingData.vehicleLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Main Street, Gaborone"
                    className={errors.vehicleLocation ? 'error' : ''}
                    required
                  />
                  {errors.vehicleLocation && <span className="error-message">{errors.vehicleLocation}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="accessInstructions">Access Instructions</label>
                  <textarea
                    id="accessInstructions"
                    name="accessInstructions"
                    value={bookingData.accessInstructions}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for accessing the vehicle location..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h4>
              <Info size={18} />
              Additional Details
            </h4>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="specificRequests">Specific Requests</label>
                <textarea
                  id="specificRequests"
                  name="specificRequests"
                  value={bookingData.specificRequests}
                  onChange={handleInputChange}
                  placeholder="Any specific requirements or requests for this service..."
                  rows="4"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="form-section">
            <div className="terms-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={bookingData.agreedToTerms}
                  onChange={handleInputChange}
                  className={errors.agreedToTerms ? 'error' : ''}
                />
                <span>
                  I agree to the terms and conditions for this service
                </span>
              </label>
              {errors.agreedToTerms && <span className="error-message">{errors.agreedToTerms}</span>}
              
              <div className="terms-details">
                <h5>Terms & Conditions:</h5>
                <ul>
                  <li>Service will be provided within the specified timeframe</li>
                  <li>Rescheduling must be done at least 24 hours in advance</li>
                  <li>Payment is required before service delivery</li>
                  <li>Cancellation after service completion incurs full charges</li>
                  <li>Additional charges may apply for travel outside Gaborone area</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="booking-actions">
            <button 
              type="button" 
              className="cancel-booking-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="confirm-booking-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirm Booking & Pay P{addon.price}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddonBookingModal;
