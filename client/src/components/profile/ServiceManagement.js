// client/src/components/profile/ServiceManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, Edit2, X, Upload, MapPin, Phone, Check, 
  AlertCircle, ExternalLink, Eye, Star, Users, Clock, 
  Car, Wrench, Truck, Bus, Save, Camera
} from 'lucide-react';
import axios from '../../config/axios.js';
import './ServiceManagement.css';

const ServiceManagement = ({ profileData, refreshProfile }) => {
  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'public_transport': return <Bus size={20} />;
      case 'car_rental': return <Car size={20} />;
      case 'trailer_rental': return <Truck size={20} />;
      case 'workshop': return <Wrench size={20} />;
      default: return <Settings size={20} />;
    }
  };

  const getBusinessTypeName = (businessType, serviceType) => {
    const names = {
      'public_transport': {
        'taxi': 'Taxi Service',
        'combi': 'Combi Service', 
        'bus': 'Bus Service',
        'shuttle': 'Shuttle Service'
      },
      'car_rental': {
        'car_rental': 'Car Rental'
      },
      'trailer_rental': {
        'trailer_rental': 'Trailer Rental'
      },
      'workshop': {
        'repair': 'Vehicle Repair',
        'maintenance': 'Vehicle Maintenance'
      }
    };
    return names[serviceType]?.[businessType] || 'Service';
  };

  const getServiceTypeName = (serviceType) => {
    const names = {
      'public_transport': 'Public Transport',
      'car_rental': 'Car Rental',
      'trailer_rental': 'Trailer Rental',
      'workshop': 'Workshop Service'
    };
    return names[serviceType] || 'Service';
  };

  const initializeServiceForm = (serviceType = null, businessType = null) => {
    setServiceFormData({
      serviceType: serviceType || '',
      businessType: businessType || '',
      serviceName: '',
      description: '',
      location: {
        city: '',
        address: '',
        coordinates: { lat: 0, lng: 0 }
      },
      contactInfo: {
        phone: '',
        email: profileData?.email || '',
        whatsapp: ''
      },
      operatingHours: {
        monday: { open: '06:00', close: '20:00', closed: false },
        tuesday: { open: '06:00', close: '20:00', closed: false },
        wednesday: { open: '06:00', close: '20:00', closed: false },
        thursday: { open: '06:00', close: '20:00', closed: false },
        friday: { open: '06:00', close: '20:00', closed: false },
        saturday: { open: '06:00', close: '20:00', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: false }
      },
      pricing: {
        currency: 'BWP',
        baseRate: '',
        rateType: 'per_trip' // per_trip, per_km, per_hour, per_day
      },
      capacity: '',
      features: [],
      isActive: true
    });
  };

  const handleServiceRegistration = (serviceType, businessType) => {
    setSelectedServiceType({ serviceType, businessType });
    initializeServiceForm(serviceType, businessType);
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    if (!serviceFormData.serviceName || !serviceFormData.description) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = serviceFormData._id 
        ? `/user/profile/services/${serviceFormData._id}`
        : '/user/profile/services';
      
      const method = serviceFormData._id ? 'put' : 'post';
      
      const response = await axios[method](endpoint, serviceFormData);
      
      if (response.data.success) {
        await refreshProfile();
        setShowServiceModal(false);
        setSelectedServiceType(null);
        setServiceFormData({});
        showMessage('success', serviceFormData._id ? 'Service updated successfully!' : 'Service registered successfully!');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service) => {
    setSelectedServiceType({
      serviceType: service.serviceType,
      businessType: service.businessType || 'independent'
    });
    setServiceFormData(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`/user/profile/services/${serviceId}`);
      if (response.data.success) {
        await refreshProfile();
        showMessage('success', 'Service deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showMessage('error', 'Failed to delete service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVerification = (serviceId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('document', file);

        const response = await axios.post(`/user/profile/services/${serviceId}/verify`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          await refreshProfile();
          showMessage('success', 'Verification document uploaded successfully!');
        }
      } catch (error) {
        console.error('Error uploading verification:', error);
        showMessage('error', 'Failed to upload verification document. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="smanage-main-container">
      {/* Message Display */}
      {message.text && (
        <div className={`smanage-message smanage-message-${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Service Registration Options */}
      <div className="smanage-registration-section">
        <h3 className="smanage-section-title">
          <Plus size={20} />
          Register New Service
        </h3>
        
        <div className="smanage-service-categories">
          {/* Public Transport Services */}
          <div className="smanage-service-category">
            <h4 className="smanage-category-title">🚌 Public Transport</h4>
            <div className="smanage-service-options">
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'taxi')}
              >
                <div className="smanage-service-icon">🚕</div>
                <div className="smanage-service-info">
                  <h5>Taxi Service</h5>
                  <p>Private taxi operations</p>
                </div>
              </button>
              
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'combi')}
              >
                <div className="smanage-service-icon">🚐</div>
                <div className="smanage-service-info">
                  <h5>Combi Service</h5>
                  <p>Shared transport routes</p>
                </div>
              </button>
              
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'bus')}
              >
                <div className="smanage-service-icon">🚌</div>
                <div className="smanage-service-info">
                  <h5>Bus Service</h5>
                  <p>Large capacity transport</p>
                </div>
              </button>
            </div>
          </div>

          {/* Vehicle Services */}
          <div className="smanage-service-category">
            <h4 className="smanage-category-title">🚗 Vehicle Services</h4>
            <div className="smanage-service-options">
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('car_rental', 'car_rental')}
              >
                <div className="smanage-service-icon">🚗</div>
                <div className="smanage-service-info">
                  <h5>Car Rental</h5>
                  <p>Vehicle rental service</p>
                </div>
              </button>
              
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('trailer_rental', 'trailer_rental')}
              >
                <div className="smanage-service-icon">🚚</div>
                <div className="smanage-service-info">
                  <h5>Trailer Rental</h5>
                  <p>Trailer & truck rental</p>
                </div>
              </button>
              
              <button 
                className="smanage-service-option-btn"
                onClick={() => handleServiceRegistration('workshop', 'repair')}
              >
                <div className="smanage-service-icon">🔧</div>
                <div className="smanage-service-info">
                  <h5>Workshop</h5>
                  <p>Vehicle repair service</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Services */}
      <div className="smanage-existing-services-section">
        <h3 className="smanage-section-title">
          <Settings size={20} />
          Your Registered Services
        </h3>
        
        <div className="smanage-services-grid">
          {profileData.businessProfile?.services && profileData.businessProfile.services.length > 0 ? (
            profileData.businessProfile.services.map((service, index) => (
              <div key={service._id || index} className="smanage-service-card">
                <div className="smanage-service-header">
                  <div className="smanage-service-type-icon">
                    {getServiceIcon(service.serviceType)}
                  </div>
                  <div className="smanage-service-actions">
                    <button 
                      className="smanage-service-action-btn smanage-edit-btn"
                      onClick={() => handleEditService(service)}
                      title="Edit Service"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="smanage-service-action-btn smanage-delete-btn"
                      onClick={() => handleDeleteService(service._id)}
                      title="Delete Service"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="smanage-service-content">
                  <h4 className="smanage-service-name">{service.serviceName}</h4>
                  <p className="smanage-service-description">{service.description}</p>
                  
                  <div className="smanage-service-meta">
                    <span className="smanage-service-type">
                      {getBusinessTypeName(service.businessType, service.serviceType)}
                    </span>
                    <span className={`smanage-service-status smanage-status-${service.verificationStatus || 'pending'}`}>
                      {service.verificationStatus || 'pending'}
                    </span>
                  </div>
                  
                  {service.location?.city && (
                    <div className="smanage-service-location">
                      <MapPin size={14} />
                      <span>{service.location.city}</span>
                    </div>
                  )}

                  {service.contactInfo?.phone && (
                    <div className="smanage-service-contact">
                      <Phone size={14} />
                      <span>{service.contactInfo.phone}</span>
                    </div>
                  )}
                  
                  {service.isVerified && (
                    <div className="smanage-service-verification">
                      <Check size={14} />
                      <span>Verified Service</span>
                    </div>
                  )}
                  
                  {!service.isVerified && service.verificationStatus === 'pending' && (
                    <button 
                      className="smanage-upload-verification-btn"
                      onClick={() => handleUploadVerification(service._id)}
                    >
                      <Upload size={14} />
                      Upload Verification Documents
                    </button>
                  )}

                  {/* Service Performance Metrics */}
                  {service.analytics && (
                    <div className="smanage-service-metrics">
                      <div className="smanage-metric-item">
                        <Eye size={12} />
                        <span>{service.analytics.views || 0} views</span>
                      </div>
                      <div className="smanage-metric-item">
                        <Star size={12} />
                        <span>{service.analytics.rating || 0}/5</span>
                      </div>
                      <div className="smanage-metric-item">
                        <Users size={12} />
                        <span>{service.analytics.bookings || 0} bookings</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="smanage-empty-state">
              <Settings size={48} />
              <h3>No Services Registered</h3>
              <p>Choose a service type above to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Registration Modal */}
      {showServiceModal && (
        <div className="smanage-modal-overlay">
          <div className="smanage-modal">
            <div className="smanage-modal-header">
              <h3>
                {serviceFormData._id ? 'Edit' : 'Register'} {getServiceTypeName(selectedServiceType?.serviceType)}
              </h3>
              <button 
                className="smanage-close-modal-btn"
                onClick={() => {
                  setShowServiceModal(false);
                  setSelectedServiceType(null);
                  setServiceFormData({});
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="smanage-modal-form">
              <div className="smanage-form-row">
                <div className="smanage-form-group">
                  <label className="smanage-form-label">Service Name *</label>
                  <input
                    type="text"
                    className="smanage-form-input"
                    value={serviceFormData.serviceName || ''}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                    placeholder="Enter your service name"
                    required
                  />
                </div>
              </div>

              <div className="smanage-form-row">
                <div className="smanage-form-group">
                  <label className="smanage-form-label">Description *</label>
                  <textarea
                    className="smanage-form-textarea"
                    value={serviceFormData.description || ''}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your service..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="smanage-form-row">
                <div className="smanage-form-group">
                  <label className="smanage-form-label">City</label>
                  <input
                    type="text"
                    className="smanage-form-input"
                    value={serviceFormData.location?.city || ''}
                    onChange={(e) => setServiceFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value } 
                    }))}
                    placeholder="City where you operate"
                  />
                </div>
                <div className="smanage-form-group">
                  <label className="smanage-form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="smanage-form-input"
                    value={serviceFormData.contactInfo?.phone || ''}
                    onChange={(e) => setServiceFormData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value } 
                    }))}
                    placeholder="+267 XX XXX XXX"
                  />
                </div>
              </div>

              <div className="smanage-form-actions">
                <button 
                  type="button"
                  className="smanage-btn smanage-btn-secondary"
                  onClick={() => setShowServiceModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="smanage-btn smanage-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : serviceFormData._id ? 'Update Service' : 'Register Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="smanage-loading-overlay">
          <div className="smanage-loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
