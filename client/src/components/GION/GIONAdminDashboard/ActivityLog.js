import React from 'react';
import './ActivityLog.css';

const ActivityLog = ({ activities, showViewAll = false, onViewAll }) => {
  // Function to format dates in a more readable way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHr > 0) {
      return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get appropriate icon class based on action type
  const getIconClass = (action) => {
    if (action.includes('Verified')) return 'verified';
    if (action.includes('Moderated')) return 'moderated';
    if (action.includes('Suspended')) return 'suspended';
    if (action.includes('System') || action.includes('Update')) return 'system';
    return '';
  };

  // Get icon symbol based on action
  const getActionIcon = (action) => {
    if (action.includes('Verified')) return '✓';
    if (action.includes('Moderated')) return '🛡️';
    if (action.includes('Suspended')) return '⚠️';
    if (action.includes('Update')) return '⚙️';
    return '📝';
  };

  return (
    <div className="gion-activity-log">
      {activities.length > 0 ? (
        <>
          <div className="gion-activity-list">
            {activities.map(activity => (
              <div key={activity.id} className="gion-activity-item">
                <div className={`gion-activity-icon ${getIconClass(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="gion-activity-details">
                  <div className="gion-activity-content">
                    <span className="gion-activity-action">{activity.action}</span>
                    <span className="gion-activity-subject">{activity.subject}</span>
                  </div>
                  <div className="gion-activity-meta">
                    <span className="gion-activity-user">{activity.performer}</span>
                    <span className="gion-activity-time">{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {showViewAll && (
            <div className="gion-view-all-container">
              <button 
                className="gion-view-all-button" 
                onClick={onViewAll || (() => {})}
              >
                View All Activity
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="gion-no-activity">
          <p>No recent activity to display</p>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;