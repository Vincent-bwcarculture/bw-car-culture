// src/hooks/useUnreadNotifCount.js
import { useState, useEffect, useRef } from 'react';

const useUnreadNotifCount = (isAuthenticated) => {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchCount = async () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/user/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch {
      // silently fail — non-critical
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 60000); // poll every 60s
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return count;
};

export default useUnreadNotifCount;
