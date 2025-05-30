// src/components/GION/GIONAdminDashboard/components/UserManagement.js
import React, { useState } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'provider', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'ministry', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'provider', status: 'pending' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'provider', status: 'active' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'ministry', status: 'suspended' }
  ]);
  
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };
  
  const filteredUsers = users.filter(user => {
    // Apply role filter
    if (filter !== 'all' && user.role !== filter) return false;
    
    // Apply search
    if (search && !user.name.toLowerCase().includes(search.toLowerCase()) && 
        !user.email.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });
  
  return (
    <div className="user-management">
      <div className="user-filters">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="user-search"
          />
        </div>
        
        <div className="filter-container">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="user-filter"
          >
            <option value="all">All Users</option>
            <option value="provider">Service Providers</option>
            <option value="ministry">Ministry Users</option>
          </select>
        </div>
      </div>
      
      <div className="users-table">
        <div className="table-header">
          <div className="header-name">Name</div>
          <div className="header-email">Email</div>
          <div className="header-role">Role</div>
          <div className="header-status">Status</div>
          <div className="header-actions">Actions</div>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="table-body">
            {filteredUsers.map(user => (
              <div key={user.id} className="table-row">
                <div className="cell-name">{user.name}</div>
                <div className="cell-email">{user.email}</div>
                <div className="cell-role">
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'provider' ? 'Service Provider' : 'Ministry User'}
                  </span>
                </div>
                <div className="cell-status">
                  <span className={`status-badge ${user.status}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
                <div className="cell-actions">
                  {user.status === 'active' && (
                    <button 
                      className="action-button suspend"
                      onClick={() => handleStatusChange(user.id, 'suspended')}
                    >
                      Suspend
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button 
                      className="action-button activate"
                      onClick={() => handleStatusChange(user.id, 'active')}
                    >
                      Activate
                    </button>
                  )}
                  {user.status === 'pending' && (
                    <button 
                      className="action-button approve"
                      onClick={() => handleStatusChange(user.id, 'active')}
                    >
                      Approve
                    </button>
                  )}
                  <button className="action-button view">View</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No users found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;