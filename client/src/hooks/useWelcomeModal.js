// src/hooks/useWelcomeModal.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'bw_car_culture_welcome_shown';
const MODAL_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const useWelcomeModal = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkShouldShowModal = () => {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (!storedData) {
          // First time visitor
          setShowModal(true);
          return;
        }

        const { lastShown, count } = JSON.parse(storedData);
        const now = Date.now();
        const timeSinceLastShown = now - lastShown;

        // Show modal again after cooldown period for returning users
        if (timeSinceLastShown > MODAL_COOLDOWN && count < 3) {
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error checking welcome modal status:', error);
        // On error, show modal to be safe
        setShowModal(true);
      }
    };

    // Small delay to let the page load first
    const timer = setTimeout(checkShouldShowModal, 1500);
    return () => clearTimeout(timer);
  }, []);

  const hideModal = () => {
    setShowModal(false);
    
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      let data = { lastShown: Date.now(), count: 1 };
      
      if (storedData) {
        const existing = JSON.parse(storedData);
        data = {
          lastShown: Date.now(),
          count: (existing.count || 0) + 1
        };
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving welcome modal status:', error);
    }
  };

  return {
    showModal,
    hideModal
  };
};
