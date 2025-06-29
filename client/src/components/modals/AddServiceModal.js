// client/src/components/modals/AddServiceModal.js
import React, { useState } from 'react';
import { 
  X, Car, Truck, Bus, Wrench, Droplets, 
  Zap, Shield, DollarSign, Clock, MapPin,
  Phone, Mail, Globe, AlertTriangle
} from 'lucide-react';
import axios from '../../config/axios';
import './AddServiceModal.css';

const AddServiceModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [serviceData, setServiceData] = useState({
    serviceType: '',
    serviceName: '',
    description: '',
    location: {
      address: '',
      city: '',
      coordinates: { coordinates: [0, 0] }
    },
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '17:00', closed: false },
      sunday: { open: '08:00', close: '17:00', closed: true }
    },
    contactInfo: {
      phone: '',
      email: '',
      whatsapp: ''
    }
  });

  const serviceTypes = [
    {
      value: 'car_dealership',
      label: 'Car Dealership',
      icon: Car,
      description: 'Buy and sell vehicles'
    },
    {
      value: 'car_rental',
      label: 'Car Rental',
      icon: Car,
      description: 'Rent vehicles to customers'
    },
    {
      value: 'trailer_rental',
      label: 'Trailer Rental',
      icon: Truck,
      description: 'Rent trailers and transport equipment'
    },
    {
      value: 'public_transport',
      label: 'Public Transport',
      icon: Bus,
      description: 'Taxi, bus, or transport services'
    },
    {
      value: 'workshop',
      label: 'Auto Workshop',
      icon: Wrench,
      description: 'Vehicle repair and maintenance'
    },
    {
      value: 'car_wash',
      label: 'Car Wash',
      icon: Droplets,
      description: 'Vehicle cleaning services'
    },
    {
      value: 'towing',
      label: 'Towing Service',
      icon: Truck,
      description: 'Vehicle towing and recovery'
    },
    {
      value: 'tire_service',
      label: 'Tire Service',
      icon: Shield,
      description: 'Tire sales, repair, and replacement'
    },
    {
      value: 'electrical_repair',
      label: 'Auto Electrical',
      icon: Zap,
      description: 'Vehicle electrical repairs'
    }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setServiceData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setServiceData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setServiceData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!serviceData.serviceType) {
        newErrors.serviceType = 'Please select a service type';
      }
      if (!serviceData.serviceName.trim()) {
        newErrors.serviceName = 'Service name is required';
      }
      if (!serviceData.description.trim() || serviceData.description.length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      }
    }

    if (stepNumber === 2) {
      if (!serviceData.location.address.trim()) {
        newErrors['location.address'] = 'Address is required';
      }
      if (!serviceData.location.city.trim()) {
        newErrors['location.city'] = 'City is required';
      }
    }

    if (stepNumber === 3) {
      if (!serviceData.contactInfo.phone.trim()) {
        newErrors['contactInfo.phone'] = 'Phone number is required';
      }
      if (serviceData.contactInfo.email && !isValidEmail(serviceData.contactInfo.email)) {
        newErrors['contactInfo.email'] = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);
      
      const response = await axios.post('/user/profile/services', serviceData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Failed to add service'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="modal-step">
      <h3>Service Type & Details</h3>
      
      {/* Service Type Selection */}
      <div className="form-group">
        <label>Service Type *</label>
        <div className="service-type-grid">
          {serviceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                className={`service-type-card ${serviceData.serviceType === type.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('serviceType', type.value)}
              >
                <Icon size={24} />
                <h4>{type.label}</h4>
                <p>{type.description}</p>
              </div>
            );
          })}
        </div>
        {errors.serviceType && <span className="error-message">{errors.serviceType}</span>}
      </div>

      {/* Service Name */}
      <div className="form-group">
        <label htmlFor="serviceName">Service Name *</label>
        <input
          type="text"
          id="serviceName"
          value={serviceData.serviceName}
          onChange={(e) => handleInputChange('serviceName', e.target.value)}
          placeholder="e.g., ABC Auto Repair"
          className={errors.serviceName ? 'error' : ''}
        />
        {errors.serviceName && <span className="error-message">{errors.serviceName}</span>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">Service Description *</label>
        <textarea
          id="description"
          value={serviceData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your service in detail (minimum 20 characters)"
          rows={4}
          className={errors.description ? 'error' : ''}
        />
        <div className="character-count">
          {serviceData.description.length}/20 characters minimum
        </div>
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="modal-step">
      <h3>Location & Operating Hours</h3>
      
      {/* Location */}
      <div className="form-group">
        <label htmlFor="address">Business Address *</label>
        <input
          type="text"
          id="address"
          value={serviceData.location.address}
          onChange={(e) => handleInputChange('location.address', e.target.value)}
          placeholder="Street address"
          className={errors['location.address'] ? 'error' : ''}
        />
        {errors['location.address'] && <span className="error-message">{errors['location.address']}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="city">City *</label>
        <input
          type="text"
          id="city"
          value={serviceData.location.city}
          onChange={(e) => handleInputChange('location.city', e.target.value)}
          placeholder="City"
          className={errors['location.city'] ? 'error' : ''}
        />
        {errors['location.city'] && <span className="error-message">{errors['location.city']}</span>}
      </div>

      {/* Operating Hours */}
      <div className="form-group">
        <label>Operating Hours</label>
        <div className="operating-hours">
          {Object.keys(serviceData.operatingHours).map(day => (
            <div key={day} className="day-hours">
              <div className="day-name">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </div>
              <div className="hours-controls">
                <label className="closed-checkbox">
                  <input
                    type="checkbox"
                    checked={serviceData.operatingHours[day].closed}
                    onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                  />
                  Closed
                </label>
                {!serviceData.operatingHours[day].closed && (
                  <>
                    <input
                      type="time"
                      value={serviceData.operatingHours[day].open}
                      onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={serviceData.operatingHours[day].close}
                      onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="modal-step">
      <h3>Contact Information</h3>
      
      <div className="form-group">
        <label htmlFor="phone">Phone Number *</label>
        <div className="input-with-icon">
          <Phone size={16} />
          <input
            type="tel"
            id="phone"
            value={serviceData.contactInfo.phone}
            onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
            placeholder="+267 XX XXX XXX"
            className={errors['contactInfo.phone'] ? 'error' : ''}
          />
        </div>
        {errors['contactInfo.phone'] && <span className="error-message">{errors['contactInfo.phone']}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <div className="input-with-icon">
          <Mail size={16} />
          <input
            type="email"
            id="email"
            value={serviceData.contactInfo.email}
            onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
            placeholder="business@example.com"
            className={errors['contactInfo.email'] ? 'error' : ''}
          />
        </div>
        {errors['contactInfo.email'] && <span className="error-message">{errors['contactInfo.email']}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="whatsapp">WhatsApp Number</label>
        <div className="input-with-icon">
          <Phone size={16} />
          <input
            type="tel"
            id="whatsapp"
            value={serviceData.contactInfo.whatsapp}
            onChange={(e) => handleInputChange('contactInfo.whatsapp', e.target.value)}
            placeholder="+267 XX XXX XXX"
          />
        </div>
      </div>

      <div className="verification-notice">
        <AlertTriangle size={20} />
        <div>
          <h4>Verification Required</h4>
          <p>After adding your service, you'll need to upload verification documents to activate it. This includes business license, tax certificates, or relevant permits.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-service-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Add New Service</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span>1</span>
            <label>Service Details</label>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span>2</span>
            <label>Location & Hours</label>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span>3</span>
            <label>Contact Info</label>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="error-message submit-error">
            {errors.submit}
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-footer">
          {step > 1 && (
            <button 
              className="secondary-button" 
              onClick={handlePrevious}
              disabled={loading}
            >
              Previous
            </button>
          )}
          
          <div className="button-spacer"></div>
          
          {step < 3 ? (
            <button 
              className="primary-button" 
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </button>
          ) : (
            <button 
              className="primary-button" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Adding Service...' : 'Add Service'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;
