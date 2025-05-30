// components/GION/pages/GIONActivityPage.js
import React from 'react';
import { ArrowLeft, Star, Clock, MapPin } from 'lucide-react';
import './GIONActivityPage.css';

const GIONActivityPage = ({ onBack }) => {
  const activities = [
    {
      id: 'a1',
      type: 'review',
      serviceName: 'SafeRide Taxi',
      serviceId: 'T1234',
      rating: 5,
      date: 'Today, 9:15 AM',
      points: 50
    },
    {
      id: 'a2',
      type: 'points',
      amount: 50,
      reason: 'For your review',
      date: 'Today, 9:15 AM'
    },
    {
      id: 'a3',
      type: 'review',
      serviceName: 'City Bistro',
      serviceId: 'R421',
      rating: 4,
      date: 'Yesterday, 2:30 PM',
      points: 40
    },
    {
      id: 'a4',
      type: 'reward',
      rewardName: '50% Off Car Wash',
      date: 'Yesterday, 2:31 PM'
    },
    {
      id: 'a5',
      type: 'review',
      serviceName: 'Quick Shop Retail',
      serviceId: 'S432',
      rating: 3,
      date: 'May 1, 2025',
      points: 30
    }
  ];
  
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Activity</h2>
        <div className="header-spacer"></div>
      </div>
      
      <div className="gion-page-content">
        <div className="gion-filter-tabs">
          <button className="filter-tab active">All</button>
          <button className="filter-tab">Reviews</button>
          <button className="filter-tab">Points</button>
          <button className="filter-tab">Rewards</button>
        </div>
        
        <div className="gion-activity-list">
          {activities.map(activity => (
            <div key={activity.id} className="activity-item">
              {activity.type === 'review' && (
                <div className="activity-card">
                  <div className="activity-icon review-icon">⭐</div>
                  <div className="activity-details">
                    <h4>You reviewed {activity.serviceName}</h4>
                    <div className="activity-rating">
                      {'★'.repeat(activity.rating)}{'☆'.repeat(5-activity.rating)}
                    </div>
                    <div className="activity-meta">
                      <Clock size={14} />
                      <span>{activity.date}</span>
                      <span className="points-indicator">+{activity.points} points</span>
                    </div>
                  </div>
                </div>
              )}
              
              {activity.type === 'points' && (
                <div className="activity-card">
                  <div className="activity-icon points-icon">🏆</div>
                  <div className="activity-details">
                    <h4>You earned {activity.amount} points</h4>
                    <p>{activity.reason}</p>
                    <div className="activity-meta">
                      <Clock size={14} />
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {activity.type === 'reward' && (
                <div className="activity-card">
                  <div className="activity-icon reward-icon">🎁</div>
                  <div className="activity-details">
                    <h4>You earned a reward</h4>
                    <p>{activity.rewardName}</p>
                    <div className="activity-meta">
                      <Clock size={14} />
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GIONActivityPage;