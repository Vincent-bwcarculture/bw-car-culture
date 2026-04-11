// AdminSidebar.js
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const menuItems = [
  { title: 'Dashboard',       icon: '▦',  path: '/admin' },
  { title: 'Analytics',       icon: '↑',  path: '/admin/analytics' },
  { title: 'Market Overview', icon: '≈',  path: '/admin/market-overview' },
  { title: 'Feedback',        icon: '✉',  path: '/admin/feedback' },
  {
    title: 'Marketplace', icon: '◈',
    submenu: [
      { title: 'Listings',              path: '/admin/listings' },
      { title: 'User Submissions',      path: '/admin/user-submissions' },
      { title: 'Vehicle Registrations', path: '/admin/vehicle-registrations' },
      { title: 'Requests',              path: '/admin/requests' },
      { title: 'Auctions',              path: '/admin/auctions' },
      { title: 'Inventory',             path: '/admin/inventory' },
    ]
  },
  {
    title: 'Content', icon: '◉',
    submenu: [
      { title: 'Articles', path: '/admin/articles' },
      { title: 'News',     path: '/admin/news' },
      { title: 'Editor',   path: '/admin/editor' },
      { title: 'Videos',   path: '/admin/videos' },
    ]
  },
  {
    title: 'Services', icon: '◎',
    submenu: [
      { title: 'Rentals',           path: '/admin/rentals' },
      { title: 'Trailers',          path: '/admin/trailers' },
      { title: 'Transport Routes',  path: '/admin/transport' },
      { title: 'Service Providers', path: '/admin/service-providers' },
    ]
  },
  { title: 'Dealers',   icon: '◇', path: '/admin/dealer' },
  { title: 'Business',  icon: '◆', path: '/admin/business' },
  {
    title: 'Payments', icon: '◆',
    submenu: [
      { title: 'Overview',         path: '/admin/payments' },
      { title: 'Manual Approvals', path: '/admin/payments/manual' },
      { title: 'History',          path: '/admin/payments/history' },
    ]
  },
  {
    title: 'Roles', icon: '◐',
    submenu: [
      { title: 'All Requests',    path: '/admin/roles' },
      { title: 'Pending Reviews', path: '/admin/role-requests' },
    ]
  },
  { title: 'Operations', icon: '✎', path: '/admin/ops' },
  { title: 'GION',     icon: '◉', path: '/admin/gion' },
  { title: 'Settings', icon: '◌', path: '/admin/settings' },
];

const AdminSidebar = ({ collapsed, isMobile, mobileOpen, onClose, user }) => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (item) => {
    if (item.path) return isActive(item.path);
    if (item.submenu) return item.submenu.some(s => isActive(s.path));
    return false;
  };

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  const showFull = isMobile ? true : !collapsed;

  return (
    <aside className={`admin-sidebar${collapsed && !isMobile ? ' collapsed' : ''}${isMobile && mobileOpen ? ' mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <img
          src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png"
          alt="BCC Admin"
          className="admin-logo"
        />
        {showFull && <span className="sidebar-title">Admin Panel</span>}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Morasimo Simulation - pinned at top */}
        <div className="nav-item-container morasimo-container">
          <a
            href="/morasimo"
            className="nav-item morasimo-btn"
            title={!showFull ? 'Morasimo' : undefined}
            onClick={handleNavClick}
          >
            <span className="nav-icon">⬡</span>
            {showFull && <span className="nav-title">Morasimo</span>}
          </a>
        </div>

        {menuItems.map((item, index) => (
          <div key={index} className="nav-item-container">
            {item.path && !item.submenu ? (
              <Link
                to={item.path}
                className={`nav-item${isGroupActive(item) ? ' active' : ''}`}
                onClick={handleNavClick}
                title={!showFull ? item.title : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {showFull && <span className="nav-title">{item.title}</span>}
              </Link>
            ) : (
              <>
                <button
                  className={`nav-item nav-item-btn${isGroupActive(item) ? ' active' : ''}`}
                  onClick={() => setExpandedMenu(expandedMenu === index ? null : index)}
                  title={!showFull ? item.title : undefined}
                  type="button"
                >
                  <span className="nav-icon">{item.icon}</span>
                  {showFull && (
                    <>
                      <span className="nav-title">{item.title}</span>
                      <span className={`submenu-arrow${expandedMenu === index ? ' expanded' : ''}`}>›</span>
                    </>
                  )}
                </button>

                {showFull && expandedMenu === index && (
                  <div className="submenu">
                    {item.submenu.map((sub, si) => (
                      <Link
                        key={si}
                        to={sub.path}
                        className={`submenu-item${isActive(sub.path) ? ' active' : ''}`}
                        onClick={handleNavClick}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {showFull ? (
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-name">{user?.name || 'Admin'}</span>
              <span className="admin-user-role">{user?.role || 'Administrator'}</span>
            </div>
          </div>
        ) : (
          <div className="admin-user-avatar admin-user-avatar--sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
