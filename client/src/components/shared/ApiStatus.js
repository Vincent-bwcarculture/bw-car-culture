// src/components/shared/ApiStatus.js
import React, { useState, useEffect } from 'react';
import './ApiStatus.css';

const ApiStatus = () => {
  const [status, setStatus] = useState({
    api: false,
    db: false,
    storage: false
  });

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const [apiStatus, dbStatus, storageStatus] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/health/db'),
          fetch('/api/health/storage')
        ]);

        setStatus({
          api: apiStatus.ok,
          db: dbStatus.ok,
          storage: storageStatus.ok
        });
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="api-status">
      <div className={`status-indicator ${status.api ? 'active' : 'inactive'}`}>
        API
      </div>
      <div className={`status-indicator ${status.db ? 'active' : 'inactive'}`}>
        Database
      </div>
      <div className={`status-indicator ${status.storage ? 'active' : 'inactive'}`}>
        Storage
      </div>
    </div>
  );
};

export default ApiStatus;