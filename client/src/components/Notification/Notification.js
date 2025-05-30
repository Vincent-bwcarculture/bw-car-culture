// src/components/Notification/Notification.js
import React from 'react';
import './Notification.css';

const Notification = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
      {onClose && <button onClick={onClose}>&times;</button>}
    </div>
  );
};

export default Notification;