// src/components/admin/layout/AdminLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar.js';
import AdminHeader from '../AdminHeader.js';
import { useAuth } from '../../context/AuthContext.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  // Check authentication on mount and when route changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
        return;
      }
      
      // Additional check for admin role if on admin route
      if (user && user.role !== 'admin') {
        navigate('/unauthorized', { replace: true });
      }
    };

    if (!loading) {
      checkAuth();
    }
  }, [isAuthenticated, loading, navigate, location.pathname, user]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        isMobile={isMobile}
        user={user}
      />
      <main className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AdminHeader 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
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