// src/Admin/layout/AdminLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar.js';
import AdminHeader from '../AdminHeader.js';
import { useAuth } from '../../context/AuthContext.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: location.pathname }, replace: true });
        return;
      }
      if (user && user.role !== 'admin') {
        navigate('/unauthorized', { replace: true });
      }
    };
    if (!loading) checkAuth();
  }, [isAuthenticated, loading, navigate, location.pathname, user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated || (user && user.role !== 'admin')) return null;

  return (
    <div className={`admin-layout ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
      {/* Mobile backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        user={user}
      />

      <main className={`admin-main ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
        <AdminHeader
          onToggleSidebar={handleToggleSidebar}
          isMobile={isMobile}
          user={user}
        />
        <div className="admin-content">
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
