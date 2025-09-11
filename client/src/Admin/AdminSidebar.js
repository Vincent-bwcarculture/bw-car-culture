// AdminSidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ collapsed }) => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/admin'
    },
      {
    title: 'Analytics', // NEW ITEM
    icon: '📈',
    path: '/admin/analytics',
    roles: ['admin']
  },
  {
    title: 'Feedback Management', // NEW ITEM
    icon: '💬',
    path: '/admin/feedback',
    roles: ['admin'],
    badge: 'new' // Optional badge for new feedback
  },
  {
  title: 'Article Management',
  icon: '📝',
  path: '/admin/articles',
  roles: ['admin'],
  submenu: [
    { title: 'Pending Review', path: '/admin/articles?tab=pending' },
    { title: 'All Articles', path: '/admin/articles?tab=all' },
    { title: 'Published', path: '/admin/articles?status=published' },
    { title: 'Rejected', path: '/admin/articles?status=rejected' }
  ]
},
     {
      title: 'Payments', // NEW PAYMENTS SECTION
      icon: '💳',
      path: '/admin/payments',
      roles: ['admin'],
      submenu: [
        { title: 'Payment Dashboard', path: '/admin/payments' },
        { title: 'Manual Approvals', path: '/admin/payments/manual' },
        { title: 'Payment History', path: '/admin/payments/history' }
      ]
    },
    {
      path: '/admin/listings', // NEW
      title: 'Listings',
      label: 'Listings',
      icon: '🚗'
    },
    {
      title: 'Content',
      icon: '📝',
      submenu: [
        { title: 'Car Reviews', path: '/news' },
        { title: 'Featured Articles', path: '/admin/featured' },
        { title: 'News', path: '/news' }
      ]
    },
    {
      title: 'Inventory',
      icon: '📦', // Use an appropriate icon
      path: '/admin/inventory',
      roles: ['admin', 'provider', 'dealer'] // Allow admin, provider, and dealer roles
    },
    {
      title: 'YouTube Videos',
      icon: '📺',
      path: '/admin/videos'
    },
    {
      title: 'Marketplace',
      icon: '🚗',
      submenu: [
        { title: 'Vehicle Listings', path: '/admin/listings' },
        { title: 'User Submissions', path: '/admin/user-submissions' },
        { title: 'Pending Listings', path: '/admin/pending-listings' },
        { title: 'Featured Listings', path: '/admin/featured-listings' }
      ]
    },
    {
      title: 'Rental Services',
      icon: '🚙',
      submenu: [
        { title: 'Rental Vehicles', path: '/admin/rental-vehicles' },
        { title: 'Trailer Listings', path: '/admin/trailers' },
        { title: 'Transport Routes', path: '/admin/transport-routes' }
      ]
    },
    {
      title: 'Service Providers',
      icon: '🏢',
      path: '/admin/service-providers'
    },
    {
      title: 'Dealers',
      icon: '🏪',
      submenu: [
        { title: 'Dealer Profiles', path: '/admin/dealerships' },
        { title: 'Verification Requests', path: '/admin/dealer-verification' },
        { title: 'Dealer Analytics', path: '/admin/dealer-analytics' }
      ]
    },
    {
      title: 'Users',
      icon: '👥',
      path: '/admin/users'
    },
    {
    title: 'Role Management',
    icon: '🔐',
    path: '/admin/roles',
    roles: ['admin'],
    submenu: [
      { title: 'All Requests', path: '/admin/roles' },
      { title: 'Pending Reviews', path: '/admin/role-requests' },
      { title: 'User Roles', path: '/admin/users' }
    ]
    },
    {
      title: 'Analytics',
      icon: '📈',
      path: '/admin/analytics'
    },
    {
      title: 'Settings',
      icon: '⚙️',
      path: '/admin/settings'
    },
  ];


  const handleMenuClick = (index) => {
    setExpandedMenu(expandedMenu === index ? null : index);
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img 
          src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" 
          alt="Admin Logo" 
          className="admin-logo"
        />
        {!collapsed && <h2>Admin Panel</h2>}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <div key={index} className="nav-item-container">
            {item.path ? (
              <Link to={item.path} className="nav-link">
                <div 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => item.submenu && handleMenuClick(index)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="nav-title">{item.title}</span>
                      {item.submenu && (
                        <span className={`submenu-arrow ${expandedMenu === index ? 'expanded' : ''}`}>
                          ▾
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            ) : (
              <div 
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => item.submenu && handleMenuClick(index)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-title">{item.title}</span>
                    {item.submenu && (
                      <span className={`submenu-arrow ${expandedMenu === index ? 'expanded' : ''}`}>
                        ▾
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {!collapsed && item.submenu && expandedMenu === index && (
              <div className="submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.path}
                    className={`submenu-item ${location.pathname === subItem.path ? 'active' : ''}`}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="admin-info">
            <img 
              src="/images/admin-avatar.jpg" 
              alt="Admin" 
              className="admin-avatar"
            />
            <div className="admin-details">
              <span className="admin-name">Admin Name</span>
              <span className="admin-role">Super Admin</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;