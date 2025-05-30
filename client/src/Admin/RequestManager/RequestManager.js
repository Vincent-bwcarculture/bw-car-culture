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
  
  const tabs = [
    { id: 'provider', label: 'Service Provider Requests' },
    { id: 'ministry', label: 'Ministry Requests' }
  ];
  
  useEffect(() => {
    fetchRequests();
  }, [activeTab]);
  
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