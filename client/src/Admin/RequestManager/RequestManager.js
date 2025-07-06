// src/Admin/RequestManager/RequestManager.js
import React, { useState, useEffect } from 'react';
import { http } from '../../config/axios.js';
import Tabs from '../../components/shared/Tabs/Tabs.js';
import RequestList from './RequestList.js';
import RequestDetail from './RequestDetail.js';
import './RequestManager.css';

const RequestManager = () => {
  const [activeTab, setActiveTab] = useState('provider');
  const [loading, setLoading] = useState(true);
  const [providerRequests, setProviderRequests] = useState([]);
  const [ministryRequests, setMinistryRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(false);
  const [error, setError] = useState(null);

  const [roleRequests, setRoleRequests] = useState([]);
const [roleRequestsLoading, setRoleRequestsLoading] = useState(false);
  
  const tabs = [
    { id: 'provider', label: 'Service Provider Requests' },
    { id: 'ministry', label: 'Ministry Requests' }
  ];
  
  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  // Add to useEffect
useEffect(() => {
  fetchRoleRequests();
}, []);

  
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'provider') {
        const response = await http.get('/api/provider-requests');
        if (response.data.success) {
          setProviderRequests(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Failed to fetch provider requests');
        }
      } else {
        const response = await http.get('/api/ministry-requests');
        if (response.data.success) {
          setMinistryRequests(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Failed to fetch ministry requests');
        }
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} requests:`, error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
const fetchRoleRequests = async () => {
  setRoleRequestsLoading(true);
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/role-requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setRoleRequests(data.data || []);
    }
  } catch (error) {
    console.error('Error fetching role requests:', error);
  } finally {
    setRoleRequestsLoading(false);
  }
};

const handleRoleRequestAction = async (requestId, status, notes = '') => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/role-requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, notes })
    });
    
    if (response.ok) {
      fetchRoleRequests(); // Refresh list
      alert(`Request ${status} successfully`);
    }
  } catch (error) {
    console.error('Error updating request:', error);
    alert('Error updating request');
  }
};

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedRequest(null);
    setViewingDetail(false);
  };
  
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewingDetail(true);
  };
  
  const handleBackToList = () => {
    setViewingDetail(false);
    setSelectedRequest(null);
    fetchRequests(); // Refresh the list
  };
  
  const handleApproveRequest = async (id, notes) => {
    try {
      setLoading(true);
      
      const endpoint = activeTab === 'provider' 
        ? `/api/provider-requests/${id}/status`
        : `/api/ministry-requests/${id}/status`;
      
      const response = await http.put(endpoint, {
        status: 'approved',
        notes
      });
      
      if (response.data.success) {
        // Handle success
        fetchRequests();
        setViewingDetail(false);
        setSelectedRequest(null);
      } else {
        throw new Error(response.data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRejectRequest = async (id, notes) => {
    try {
      setLoading(true);
      
      const endpoint = activeTab === 'provider' 
        ? `/api/provider-requests/${id}/status`
        : `/api/ministry-requests/${id}/status`;
      
      const response = await http.put(endpoint, {
        status: 'rejected',
        notes
      });
      
      if (response.data.success) {
        // Handle success
        fetchRequests();
        setViewingDetail(false);
        setSelectedRequest(null);
      } else {
        throw new Error(response.data.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const endpoint = activeTab === 'provider' 
        ? `/api/provider-requests/${id}`
        : `/api/ministry-requests/${id}`;
      
      const response = await http.delete(endpoint);
      
      if (response.data.success) {
        // Handle success
        fetchRequests();
        setViewingDetail(false);
        setSelectedRequest(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="request-manager">
      <div className="request-manager-header">
        <h1>Verification Request Management</h1>
      </div>
      
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      // Add this to your JSX
<div className="role-requests-section">
  <h3>Role Requests</h3>
  {roleRequestsLoading ? (
    <div>Loading role requests...</div>
  ) : (
    <div className="requests-grid">
      {roleRequests.map(request => (
        <div key={request._id} className="request-card">
          <div className="request-header">
            <h4>{request.userName}</h4>
            <span className={`status-badge status-${request.status}`}>
              {request.status}
            </span>
          </div>
          <div className="request-details">
            <p><strong>Role:</strong> {request.requestType}</p>
            <p><strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
            {request.businessName && <p><strong>Business:</strong> {request.businessName}</p>}
            {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
          </div>
          {request.status === 'pending' && (
            <div className="request-actions">
              <button 
                className="approve-btn"
                onClick={() => handleRoleRequestAction(request._id, 'approved')}
              >
                Approve
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleRoleRequestAction(request._id, 'rejected')}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
      
      {error && (
        <div className="request-error-message">
          {error}
          <button onClick={fetchRequests} className="retry-button">
            Try Again
          </button>
        </div>
      )}
      
      {viewingDetail && selectedRequest ? (
        <RequestDetail 
          request={selectedRequest}
          requestType={activeTab}
          onBack={handleBackToList}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onDelete={handleDeleteRequest}
          loading={loading}
        />
      ) : (
        <RequestList 
          requests={activeTab === 'provider' ? providerRequests : ministryRequests}
          requestType={activeTab}
          onViewRequest={handleViewRequest}
          loading={loading}
        />
      )}
    </div>
  );
};

export default RequestManager;