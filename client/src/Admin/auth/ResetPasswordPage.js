// src/components/auth/ResetPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios.js';
import './Auth.css';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(`/api/auth/reset-password/${token}/validate`);
        setTokenValid(response.data.success);
      } catch (err) {
        setError('This password reset link is invalid or has expired.');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
      
      if (response.data.success) {
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img 
              src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" 
              alt="I3w Car Culture Logo" 
              className="auth-logo"
            />
            <h2>Reset Password</h2>
          </div>
          <div className="auth-loading">
            <div className="spinner"></div>
            <p>Validating your request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img 
              src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" 
              alt="I3w Car Culture Logo" 
              className="auth-logo"
            />
            <h2>Reset Password</h2>
          </div>
          <div className="auth-error">
            {error || 'This password reset link is invalid or has expired.'}
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
            <p>
              Remember your password? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" 
            alt="I3w Car Culture Logo" 
            className="auth-logo"
          />
          <h2>Reset Password</h2>
        </div>

        {success ? (
          <div className="auth-success">
            <p>
              Your password has been successfully reset.
            </p>
            <p>
              You will be redirected to the login page in a few seconds...
            </p>
            <div className="auth-success-action">
              <Link to="/login" className="auth-link">
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;