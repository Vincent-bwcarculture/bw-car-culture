// src/components/auth/UnauthorizedPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './Auth.css';

const UnauthorizedPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src="/images/BCC Logo.png" 
            alt="I3w Car Culture Logo" 
            className="auth-logo"
          />
          <h2>Access Denied</h2>
        </div>

        <div className="unauthorized-message">
          <p>
            Sorry, you don't have the necessary permissions to access this page.
          </p>
          <p>
            Your current role: <span className="user-role">{user?.role || 'Unknown'}</span>
          </p>
        </div>

        <div className="auth-actions">
          <Link to="/" className="auth-button secondary">
            Return to Home
          </Link>
          <button 
            className="auth-button" 
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;