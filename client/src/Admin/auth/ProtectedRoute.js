// src/Admin/auth/ProtectedRoute.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log the protection check for debugging
    console.log('ProtectedRoute check:', { 
      isAuthenticated, 
      userRole: user?.role,
      requiredRoles,
      path: location.pathname,
      token: !!localStorage.getItem('token')
    });
  }, [isAuthenticated, user, requiredRoles, location]);

  if (loading) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If role check is required and user doesn't have the required role
  if (requiredRoles.length > 0 && (!user || !requiredRoles.includes(user.role))) {
    console.log('User lacks required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;