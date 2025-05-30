import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ activeItem, userType }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  // Define menu items based on user type
  const getMenuItems = () => {
    switch(userType) {
      case 'ministry':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'providers', label: 'Service Providers', icon: '🏢' },
          { id: 'compliance', label: 'Compliance', icon: '✓' },
          { id: 'reports', label: 'Reports', icon: '📄' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ];
      case 'provider':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'reviews', label: 'Reviews', icon: '⭐' },
          { id: 'compliance', label: 'Compliance', icon: '✓' },
          { id: 'reports', label: 'Reports', icon: '📄' },
          { id: 'profile', label: 'Business Profile', icon: '🏢' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'users', label: 'User Management', icon: '👥' },
          { id: 'providers', label: 'Service Providers', icon: '🏢' },
          { id: 'verifications', label: 'Verifications', icon: '✓' },
          { id: 'moderation', label: 'Content Moderation', icon: '🛡️' },
          { id: 'settings', label: 'System Settings', icon: '⚙️' },
          { id: 'logs', label: 'System Logs', icon: '📝' }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img 
            src="/images/gion-logo.png" 
            alt="GION" 
            className="sidebar-logo"
          />
          {!collapsed && <span className="sidebar-title">GION</span>}
        </div>
        <button className="collapse-button" onClick={toggleSidebar}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <div className="sidebar-content">
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <Link 
              key={item.id}
              to={`/${userType}/${item.id}`}
              className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && <span className="menu-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {userType === 'ministry' ? 'M' : userType === 'provider' ? 'P' : 'A'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <div className="user-name">
                {userType === 'ministry' ? 'Ministry' : 
                 userType === 'provider' ? 'Provider' : 'Admin'}
              </div>
              <div className="user-role">
                {userType === 'ministry' ? 'Transport Authority' : 
                 userType === 'provider' ? 'Service Provider' : 'System Admin'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;