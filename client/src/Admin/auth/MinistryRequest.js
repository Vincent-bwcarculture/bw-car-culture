// src/components/auth/MinistryRequest.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './ServiceRequest.css';

const MinistryRequest = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    ministryName: '',
    department: '',
    role: '',
    contactDetails: {
      phone: '',
      email: '',
      officeAddress: ''
    },
    reason: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState([]);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/ministry-request' } });
    }
    
    // Pre-fill email if user is logged in
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        contactDetails: {
          ...prev.contactDetails,
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
      const response = await http.post('/api/ministry-requests', requestData, {
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
          <p>Thank you for your interest in registering as a ministry representative.</p>
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
        <h2>Ministry Representative Application</h2>
        <p className="request-intro">
          Complete this form to register as an official ministry representative.
          Our team will verify your credentials and grant appropriate access.
        </p>
        
        {error && <div className="request-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="service-request-form">
          <div className="form-section">
            <h3>Ministry Information</h3>
            
            <div className="form-group">
              <label htmlFor="ministryName">Ministry Name *</label>
              <input
                type="text"
                id="ministryName"
                name="ministryName"
                value={formData.ministryName}
                onChange={handleChange}
                required
                placeholder="e.g. Ministry of Transport"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="department">Department/Division *</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="e.g. Road Transport Safety"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Your Position/Role *</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                placeholder="e.g. Director of Public Transportation"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactDetails.phone">Office Phone *</label>
                <input
                  type="tel"
                  id="contactDetails.phone"
                  name="contactDetails.phone"
                  value={formData.contactDetails.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contactDetails.email">Official Email *</label>
                <input
                  type="email"
                  id="contactDetails.email"
                  name="contactDetails.email"
                  value={formData.contactDetails.email}
                  onChange={handleChange}
                  required
                />
                <small>Preferably use your official government email</small>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="contactDetails.officeAddress">Office Address *</label>
              <input
                type="text"
                id="contactDetails.officeAddress"
                name="contactDetails.officeAddress"
                value={formData.contactDetails.officeAddress}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Purpose</h3>
            
            <div className="form-group">
              <label htmlFor="reason">Reason for Access Request *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4"
                required
                placeholder="Please explain why you need access to the ministry dashboard and how you plan to use it."
              ></textarea>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Verification Documents</h3>
            <p className="document-instructions">
              Please upload documents to verify your identity and position. This may include your 
              government ID, appointment letter, or other official documents.
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
                <li>Government-issued ID</li>
                <li>Official Appointment Letter</li>
                <li>Ministry ID Card</li>
                <li>Letter from Department Head</li>
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
              I confirm that all information provided is accurate and I am authorized to represent the ministry.
              I understand that this access is for official purposes only and may be revoked at any time.
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

export default MinistryRequest;