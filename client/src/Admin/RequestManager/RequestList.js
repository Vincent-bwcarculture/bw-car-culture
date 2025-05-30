// src/Admin/RequestManager/RequestList.js
import React, { useState } from 'react';
import './RequestManager.css';

const RequestList = ({ requests, requestType, onViewRequest, loading }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter requests based on status
  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(request => request.status === statusFilter);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };
  
  // Get request type display name
  const getRequestTypeLabel = (type) => {
    if (requestType === 'provider') {
      switch (type) {
        case 'dealership':
          return 'Car Dealership';
        case 'car_rental':
          return 'Car Rental';
        case 'trailer_rental':
          return 'Trailer Rental';
        case 'public_transport':
          return 'Public Transport';
        case 'workshop':
          return 'Workshop/Service';
        default:
          return type.charAt(0).toUpperCase() + type.slice(1);
      }
    } else {
      return 'Ministry';
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!requests || requests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3 className="empty-state-title">No Requests Found</h3>
        <p className="empty-state-message">
          {requestType === 'provider'
            ? 'There are no service provider registration requests at this time.'
            : 'There are no ministry registration requests at this time.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="request-list">
      <div className="request-list-header">
        <div className="request-count">
          {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
        </div>
        
        <div className="request-filters">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <table className="request-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Business/Ministry</th>
            <th>{requestType === 'provider' ? 'Type' : 'Department'}</th>
            <th>Submitted By</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map(request => (
            <tr key={request._id}>
              <td className="request-id">{request._id.substring(request._id.length - 8)}</td>
              <td className="request-name">
                {requestType === 'provider' ? request.businessName : request.ministryName}
              </td>
              <td>
                {requestType === 'provider' 
                  ? getRequestTypeLabel(request.providerType)
                  : request.department}
              </td>
              <td>
                {request.user?.name || 'Unknown User'}
                <div className="request-date">
                  {request.user?.email || 'No email'}
                </div>
              </td>
              <td className="request-date">
                {formatDate(request.createdAt)}
              </td>
              <td>
                <span className={`request-status ${getStatusClass(request.status)}`}>
                  {request.status}
                </span>
              </td>
              <td>
                <button 
                  className="action-button view"
                  onClick={() => onViewRequest(request)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestList;