// client/src/components/profile/ServiceManagement.js
import React, { useState } from 'react';
import { 
  Settings, Plus, Edit2, X, MapPin, Check, 
  Upload, Eye, Star, Calendar, Phone
} from 'lucide-react';
import axios from '../../config/axios.js';

const ServiceManagement = ({ profileData, refreshProfile }) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Service Registration Functions
  const handleServiceRegistration = (serviceType, businessType) => {
    setSelectedServiceType({ serviceType, businessType });
    setServiceFormData({
      serviceType,
      businessType,
      serviceName: '',
      description: '',
      location: {
        city: '',
        address: '',
        coordinates: { lat: 0, lng: 0 }
      },
      operatingHours: {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '06:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '20:00', closed: false }
      },
      contactInfo: {
        phone: '',
        email: '',
        whatsapp: '',
        website: ''
      },
      // Transport specific fields
      routeCount: businessType === 'taxi' || businessType === 'combi' || businessType === 'bus' ? 1 : undefined,
      fleetSize: businessType === 'taxi' || businessType === 'combi' || businessType === 'bus' ? 1 : undefined,
      operationType: businessType === 'taxi' || businessType === 'combi' ? 'on_demand' : 'scheduled',
      // Workshop specific fields
      specializations: serviceType === 'workshop' ? [] : undefined,
      certifications: serviceType === 'workshop' ? [] : undefined
    });
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await axios.post('/user/profile/services', serviceFormData);
      
      if (response.data.success) {
        await refreshProfile(); // Refresh profile data
        setShowServiceModal(false);
        setSelectedServiceType(null);
        setServiceFormData({});
        alert('Service registered successfully! Please upload verification documents to activate it.');
      }
    } catch (error) {
      console.error('Error registering service:', error);
      alert('Failed to register service. Please try again.');
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
      const response = await axios.delete(`/user/profile/services/${serviceId}`);
      if (response.data.success) {
        await refreshProfile(); // Refresh profile data
        alert('Service deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const handleUploadVerification = (serviceId) => {
    // Create a file input element
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
          await refreshProfile(); // Refresh profile data
          alert('Verification document uploaded successfully!');
        }
      } catch (error) {
        console.error('Error uploading verification:', error);
        alert('Failed to upload verification document. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'public_transport': return '🚌';
      case 'car_rental': return '🚗';
      case 'trailer_rental': return '🚚';
      case 'workshop': return '🔧';
      default: return '🏢';
    }
  };

  const getServiceTypeName = (serviceType) => {
    switch (serviceType) {
      case 'public_transport': return 'Transport Service';
      case 'car_rental': return 'Car Rental';
      case 'trailer_rental': return 'Trailer Rental';
      case 'workshop': return 'Workshop';
      default: return 'Service';
    }
  };

  const getBusinessTypeName = (businessType, serviceType) => {
    if (serviceType === 'public_transport') {
      switch (businessType) {
        case 'taxi': return 'Taxi Service';
        case 'combi': return 'Combi Service';
        case 'bus': return 'Bus Service';
        case 'ride_share': return 'Ride Share';
        default: return 'Transport Service';
      }
    }
    return businessType;
  };

  const handleServiceFormChange = (field, value) => {
    setServiceFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFormChange = (parent, field, value) => {
    setServiceFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  return (
    <div className="services-tab">
      <div className="tab-header">
        <h2><Settings size={24} /> Service Management</h2>
        <p>Register and manage your business services</p>
      </div>

      {/* Service Registration Section */}
      <div className="service-registration-section">
        <h3>Register New Service</h3>
        <p>Choose the type of service you want to register with us:</p>
        
        <div className="service-type-grid">
          {/* Transport Services */}
          <div className="service-category">
            <h4>🚌 Transport Services</h4>
            <div className="service-options">
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'taxi')}
              >
                <div className="service-icon">🚕</div>
                <div className="service-info">
                  <h5>Taxi Service</h5>
                  <p>Private hire taxi service</p>
                </div>
              </button>
              
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'combi')}
              >
                <div className="service-icon">🚐</div>
                <div className="service-info">
                  <h5>Combi Service</h5>
                  <p>Shared taxi/combi routes</p>
                </div>
              </button>
              
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'bus')}
              >
                <div className="service-icon">🚌</div>
                <div className="service-info">
                  <h5>Bus Service</h5>
                  <p>Public bus transport</p>
                </div>
              </button>
              
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('public_transport', 'ride_share')}
              >
                <div className="service-icon">🚗</div>
                <div className="service-info">
                  <h5>Ride Share</h5>
                  <p>App-based ride sharing</p>
                </div>
              </button>
            </div>
          </div>

          {/* Vehicle Services */}
          <div className="service-category">
            <h4>🚗 Vehicle Services</h4>
            <div className="service-options">
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('car_rental', 'car_rental')}
              >
                <div className="service-icon">🚗</div>
                <div className="service-info">
                  <h5>Car Rental</h5>
                  <p>Vehicle rental service</p>
                </div>
              </button>
              
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('trailer_rental', 'trailer_rental')}
              >
                <div className="service-icon">🚚</div>
                <div className="service-info">
                  <h5>Trailer Rental</h5>
                  <p>Trailer & truck rental</p>
                </div>
              </button>
              
              <button 
                className="service-option-btn"
                onClick={() => handleServiceRegistration('workshop', 'repair')}
              >
                <div className="service-icon">🔧</div>
                <div className="service-info">
                  <h5>Workshop</h5>
                  <p>Vehicle repair service</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Services */}
      <div className="existing-services-section">
        <h3>Your Registered Services</h3>
        <div className="services-grid">
          {profileData.businessProfile?.services && profileData.businessProfile.services.length > 0 ? (
            profileData.businessProfile.services.map((service, index) => (
              <div key={service._id || index} className="service-card">
                <div className="service-header">
                  <div className="service-type-icon">
                    {getServiceIcon(service.serviceType)}
                  </div>
                  <div className="service-actions">
                    <button 
                      className="service-action-btn edit"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="service-action-btn delete"
                      onClick={() => handleDeleteService(service._id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="service-info">
                  <h4>{service.serviceName}</h4>
                  <p className="service-description">{service.description}</p>
                  <div className="service-meta">
                    <span className="service-type">
                      {getBusinessTypeName(service.businessType, service.serviceType)}
                    </span>
                    <span className={`service-status ${service.verificationStatus}`}>
                      {service.verificationStatus}
                    </span>
                  </div>
                  
                  {service.location?.city && (
                    <div className="service-location">
                      <MapPin size={14} />
                      <span>{service.location.city}</span>
                    </div>
                  )}

                  {service.contactInfo?.phone && (
                    <div className="service-contact">
                      <Phone size={14} />
                      <span>{service.contactInfo.phone}</span>
                    </div>
                  )}
                  
                  {service.isVerified && (
                    <div className="service-verification">
                      <Check size={14} />
                      <span>Verified Service</span>
                    </div>
                  )}
                  
                  {!service.isVerified && service.verificationStatus === 'pending' && (
                    <button 
                      className="upload-verification-btn"
                      onClick={() => handleUploadVerification(service._id)}
                    >
                      <Upload size={14} />
                      Upload Verification Documents
                    </button>
                  )}

                  {/* Service specific info */}
                  {service.serviceType === 'public_transport' && (
                    <div className="transport-details">
                      {service.routeCount && (
                        <div className="detail-item">
                          <span>Routes: {service.routeCount}</span>
                        </div>
                      )}
                      {service.fleetSize && (
                        <div className="detail-item">
                          <span>Fleet Size: {service.fleetSize}</span>
                        </div>
                      )}
                      {service.operationType && (
                        <div className="detail-item">
                          <span>Operation: {service.operationType.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Settings size={48} />
              <h3>No Services Registered</h3>
              <p>Choose a service type above to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Registration Modal */}
      {showServiceModal && (
        <div className="service-modal-overlay">
          <div className="service-modal">
            <div className="service-modal-header">
              <h3>Register {getServiceTypeName(selectedServiceType?.serviceType)}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowServiceModal(false);
                  setSelectedServiceType(null);
                  setServiceFormData({});
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="service-form">
              <div className="form-group">
                <label htmlFor="serviceName">Service Name *</label>
                <input
                  type="text"
                  id="serviceName"
                  value={serviceFormData.serviceName || ''}
                  onChange={(e) => handleServiceFormChange('serviceName', e.target.value)}
                  placeholder="e.g., City Express Taxi, Downtown Bus Service"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={serviceFormData.description || ''}
                  onChange={(e) => handleServiceFormChange('description', e.target.value)}
                  placeholder="Describe your service, routes, and what makes it unique"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City/Location *</label>
                  <input
                    type="text"
                    id="city"
                    value={serviceFormData.location?.city || ''}
                    onChange={(e) => handleNestedFormChange('location', 'city', e.target.value)}
                    placeholder="e.g., Gaborone, Francistown"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Contact Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={serviceFormData.contactInfo?.phone || ''}
                    onChange={(e) => handleNestedFormChange('contactInfo', 'phone', e.target.value)}
                    placeholder="+267 xxxxxxxx"
                  />
                </div>
              </div>

              {selectedServiceType?.serviceType === 'public_transport' && (
                <div className="transport-specific-fields">
                  <h4>Transport Service Details</h4>
                  
                  <div className="form-group">
                    <label>Service Type</label>
                    <div className="service-type-options">
                      {['taxi', 'combi', 'bus', 'ride_share'].map(type => (
                        <label key={type} className="radio-option">
                          <input
                            type="radio"
                            name="businessType"
                            value={type}
                            checked={serviceFormData.businessType === type}
                            onChange={(e) => handleServiceFormChange('businessType', e.target.value)}
                          />
                          <span className="radio-label">
                            {type === 'taxi' && '🚕 Taxi'}
                            {type === 'combi' && '🚐 Combi'}
                            {type === 'bus' && '🚌 Bus'}
                            {type === 'ride_share' && '🚗 Ride Share'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="routes">Number of Routes</label>
                      <input
                        type="number"
                        id="routes"
                        min="1"
                        value={serviceFormData.routeCount || ''}
                        onChange={(e) => handleServiceFormChange('routeCount', e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="vehicles">Fleet Size</label>
                      <input
                        type="number"
                        id="vehicles"
                        min="1"
                        value={serviceFormData.fleetSize || ''}
                        onChange={(e) => handleServiceFormChange('fleetSize', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Operation Type</label>
                    <select
                      value={serviceFormData.operationType || 'on_demand'}
                      onChange={(e) => handleServiceFormChange('operationType', e.target.value)}
                    >
                      <option value="on_demand">On Demand (Call/Text based)</option>
                      <option value="scheduled">Fixed Schedule</option>
                      <option value="hybrid">Hybrid (Both)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedServiceType?.serviceType === 'workshop' && (
                <div className="workshop-specific-fields">
                  <h4>Workshop Details</h4>
                  
                  <div className="form-group">
                    <label>Workshop Type</label>
                    <div className="service-type-options">
                      {['authorized', 'independent'].map(type => (
                        <label key={type} className="radio-option">
                          <input
                            type="radio"
                            name="businessType"
                            value={type}
                            checked={serviceFormData.businessType === type}
                            onChange={(e) => handleServiceFormChange('businessType', e.target.value)}
                          />
                          <span className="radio-label">
                            {type === 'authorized' && '🏢 Authorized Workshop'}
                            {type === 'independent' && '🔧 Independent Workshop'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedServiceType(null);
                    setServiceFormData({});
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
