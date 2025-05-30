// src/components/auth/ServiceProviderRequest.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './ServiceRequest.css';

const ServiceProviderRequest = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    businessName: '',
    providerType: 'dealership',
    businessType: 'independent',
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    location: {
      address: '',
      city: '',
      state: '',
      country: ''
    },
    verificationDocuments: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState([]);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/service-request' } });
    }
    
    // Pre-fill email if user is logged in
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          email: user.email
        }
      }));
    }
  }, [isAuthenticated, user, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create form data for file upload
      const requestData = new FormData();
      
      // Add JSON data
      requestData.append('requestData', JSON.stringify(formData));
      
      // Add verification documents
      files.forEach(file => {
        requestData.append('documents', file);
      });
      
      // Submit request
      const response = await http.post('/api/provider-requests', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="service-request-container">
        <div className="service-request-success">
          <h2>Request Submitted Successfully!</h2>
          <p>Thank you for your interest in becoming a verified service provider.</p>
          <p>Your request has been submitted and is pending review by our administrators.</p>
          <p>You will be notified via email once your request has been processed.</p>
          <button onClick={() => navigate('/')} className="return-home-btn">
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="service-request-container">
      <div className="service-request-card">
        <h2>Service Provider Application</h2>
        <p className="request-intro">
          Complete this form to apply for a verified service provider account. 
          Our team will review your application and contact you for verification.
        </p>
        
        {error && <div className="request-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="service-request-form">
          <div className="form-section">
            <h3>Business Information</h3>
            
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="providerType">Provider Type *</label>
                <select
                  id="providerType"
                  name="providerType"
                  value={formData.providerType}
                  onChange={handleChange}
                  required
                >
                  <option value="dealership">Car Dealership</option>
                  <option value="car_rental">Car Rental</option>
                  <option value="trailer_rental">Trailer Rental</option>
                  <option value="public_transport">Public Transport</option>
                  <option value="workshop">Workshop/Service Center</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="businessType">Business Type *</label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                >
                  <option value="independent">Independent</option>
                  <option value="franchise">Franchise</option>
                  <option value="certified">Certified</option>
                  <option value="authorized">Authorized</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact.phone">Phone Number *</label>
                <input
                  type="tel"
                  id="contact.phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact.email">Email Address *</label>
                <input
                  type="email"
                  id="contact.email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="contact.website">Website (optional)</label>
              <input
                type="url"
                id="contact.website"
                name="contact.website"
                value={formData.contact.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Business Location</h3>
            
            <div className="form-group">
              <label htmlFor="location.address">Street Address *</label>
              <input
                type="text"
                id="location.address"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location.city">City *</label>
                <input
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location.state">State/Province</label>
                <input
                  type="text"
                  id="location.state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="location.country">Country *</label>
              <input
                type="text"
                id="location.country"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Verification Documents</h3>
            <p className="document-instructions">
              Please upload documents to verify your business. This may include business registration, licenses, 
              certificates, or other official documents that prove you are the owner or authorized representative.
            </p>
            
            <div className="document-upload">
              <input
                type="file"
                id="documents"
                multiple
                onChange={handleFileChange}
                className="file-input"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="documents" className="file-input-label">
                Choose Files
              </label>
              <span className="selected-files">
                {files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}
              </span>
            </div>
            
            <div className="document-types">
              <p>Recommended documents:</p>
              <ul>
                <li>Business Registration Certificate</li>
                <li>Tax Identification Certificate</li>
                <li>Professional License</li>
                <li>Business Owner ID</li>
              </ul>
            </div>
          </div>
          
          <div className="form-agreement">
            <input
              type="checkbox"
              id="agreement"
              required
            />
            <label htmlFor="agreement">
              I confirm that all information provided is accurate and I am authorized to register this business.
              I understand that false information may result in rejection of my application.
            </label>
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              className="submit-request-btn"
              disabled={loading || files.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceProviderRequest;