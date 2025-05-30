// src/components/auth/components/ProtectedRoute.js

import { Navigate } from 'react-router-dom';
import { ROLE_PERMISSIONS } from '../config/roles.js';

export const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [],
  redirectTo = '/login' 
}) => {
  const authToken = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  const hasRequiredPermissions = () => {
    if (!requiredPermissions.length) return true;
    
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  };

  if (!authToken) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!hasRequiredPermissions()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;