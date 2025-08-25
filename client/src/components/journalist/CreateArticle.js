// client/src/components/journalist/CreateArticle.js
// Placeholder component for journalist article creation

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, FileText, Settings } from 'lucide-react';
import './CreateArticle.css';

const CreateArticle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user has journalist access
  const hasJournalistAccess = user?.role === 'journalist' || 
                              (user?.additionalRoles && user.additionalRoles.includes('journalist'));

  if (!hasJournalistAccess) {
    return (
      <div className="create-article-unauthorized">
        <div className="unauthorized-content">
          <h2>Access Denied</h2>
          <p>You need journalist privileges to access this page.</p>
          <button onClick={() => navigate('/profile')} className="back-button">
            <ArrowLeft size={16} />
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-article-container">
      {/* Header */}
      <div className="create-article-header">
        <button 
          className="back-button"
          onClick={() => navigate('/profile')}
          title="Back to Profile"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="header-content">
          <div className="header-icon">
            <PenTool size={24} />
          </div>
          <div className="header-text">
            <h1>Create Article</h1>
            <p>Journalist Dashboard - Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Main Content - Placeholder */}
      <div className="create-article-content">
        <div className="placeholder-content">
          <div className="placeholder-icon">
            <FileText size={64} />
          </div>
          
          <h2>Article Creation Dashboard</h2>
          <p className="placeholder-description">
            The full journalist dashboard with article creation, editing, and publishing tools 
            is currently under development.
          </p>
          
          {/* Feature Preview */}
          <div className="feature-preview">
            <h3>Coming Soon:</h3>
            <div className="feature-list">
              <div className="feature-item">
                <PenTool size={20} />
                <span>Rich Text Editor</span>
              </div>
              <div className="feature-item">
                <FileText size={20} />
                <span>Article Management</span>
              </div>
              <div className="feature-item">
                <Settings size={20} />
                <span>Publishing Tools</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="user-info">
            <h4>Journalist Profile</h4>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Primary Role:</strong> {user?.role}</p>
            {user?.additionalRoles && user.additionalRoles.length > 0 && (
              <p><strong>Additional Roles:</strong> {user.additionalRoles.join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateArticle;
