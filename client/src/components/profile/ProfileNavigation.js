// client/src/components/profile/ProfileNavigation.js
import React from 'react';

const ProfileNavigation = ({ activeTab, setActiveTab, availableTabs }) => {
  return (
    <div className="profile-navigation">
      {availableTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button 
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProfileNavigation;
