// src/components/auth/LoginPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import axios from '../../config/axios.js';
import './Auth.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setUser, setIsAuthenticated } = useAuth();

  // Get message from location state (if any)
  const message = location.state?.message;

  useEffect(() => {
    // Only redirect if already authenticated
    if (isAuthenticated && user) {
      console.log("Authenticated user in LoginPage:", user);
      console.log("User role:", user.role);
      console.log("User object keys:", Object.keys(user));
      console.log("Token saved:", localStorage.getItem('token'));
      
      // If user is admin, force redirect to admin dashboard
      if (user.role === 'admin') {
        console.log("Redirecting admin to dashboard");
        navigate('/admin/dashboard', { replace: true });
      } else {
        // For regular users, redirect to home or intended destination
        const intendedDestination = location.state?.from || '/';
        console.log("Redirecting to:", intendedDestination);
        navigate(intendedDestination, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      console.log('Login attempt for email:', formData.email);
      
      // Make the direct API call to the login endpoint
      const response = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        rememberMe
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Save token and update auth state
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Set user in auth context
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        console.log('Login successful:', response.data.user);
        
        // Redirect based on role
        if (response.data.user.role === 'admin') {
          console.log('Redirecting admin to dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Regular users go to home or intended destination
          const redirectPath = location.state?.from || '/';
          navigate(redirectPath, { replace: true });
        }
      } else {
        console.error('Login failed:', response.data);
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Failed to login. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src="/images/BCC Logo.png" 
            alt="I3w Car Culture Logo" 
            className="auth-logo"
          />
          <h2>Login</h2>
        </div>

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                disabled={loading}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="button-content">
                <span className="spinner"></span>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;