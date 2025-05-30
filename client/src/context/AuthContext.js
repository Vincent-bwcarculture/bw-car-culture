// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios.js';
import { trackEvent, trackLogin } from '../config/analytics.js';

// Create the context
const AuthContext = createContext(null);

// Export the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logger for authentication state changes
  useEffect(() => {
    console.log('Auth effect running with token:', localStorage.getItem('token'));
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth State:', { 
        isAuthenticated, 
        loading, 
        user: user ? { ...user, id: user.id } : null,
        path: location.pathname
      });
    }
  }, [isAuthenticated, loading, user, location]);

  // Check auth status on mount and when token changes
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
    
        try {
          // Make sure the Authorization header is set correctly
          const response = await axios.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
    
          if (response.data.success) {
            console.log('Auth verification successful:', response.data.data);
            setUser(response.data.data);
            setIsAuthenticated(true);
            
            // Track authentication verification success
            trackEvent('User', 'Auth_Verified', response.data.data?.role || 'unknown');
            
            // Check if on admin path but not admin role
            const isAdminPath = window.location.pathname.startsWith('/admin');
            if (isAdminPath && response.data.data.role !== 'admin') {
              window.location.href = '/unauthorized';
            }
          } else {
            // Invalid token
            console.log('Auth verification failed: invalid token');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            
            // Track authentication verification failure
            trackEvent('User', 'Auth_Failed', 'Invalid token');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          // Clear token on verification failure
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          
          // Track authentication verification error
          trackEvent('User', 'Auth_Error', error.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Auth general error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        
        // Track successful login
        trackLogin('credentials');
        
        // Return user - let the component handle navigation
        return user;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      
      // Track failed login
      trackEvent('User', 'Login_Failed', errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        // Track successful registration
        trackEvent('User', 'Register', userData.role || 'user');
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      
      // Track failed registration
      trackEvent('User', 'Register_Failed', errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Track logout
      trackEvent('User', 'Logout', user?.role || 'unknown');
      
      // Attempt to hit the logout endpoint, but don't depend on its success
      await axios.post('/auth/logout').catch(err => console.error('Logout error:', err));
    } finally {
      // Always clear local state regardless of server response
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const toggleFavorite = async (listingId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return false;
    }

    try {
      const response = await axios.put(`/auth/favorites/${listingId}`);
      
      // Track favorite toggle
      if (response.data.success) {
        const action = response.data.isFavorited ? 'Add_Favorite' : 'Remove_Favorite';
        trackEvent('User', action, listingId);
      }
      
      return response.data.success;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return false;
    }
  };

  const getFavorites = async () => {
    if (!isAuthenticated) return [];

    try {
      const response = await axios.get('/auth/favorites');
      return response.data.data;
    } catch (error) {
      console.error('Get favorites error:', error);
      return [];
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await axios.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.data);
        
        // Track profile update
        trackEvent('User', 'Profile_Update', user?.role || 'unknown');
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update profile');
      
      // Track profile update error
      trackEvent('User', 'Profile_Update_Failed', error.message || 'Unknown error');
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkAdmin = () => {
    if (!isAuthenticated || !user) return false;
    return user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      toggleFavorite,
      getFavorites,
      updateProfile,
      checkAdmin,
      setError,
      setUser,
      setIsAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export for backwards compatibility
export default AuthContext;