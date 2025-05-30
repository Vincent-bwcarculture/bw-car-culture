// src/utils/dateUtils.js

/**
 * Format a date to display relative time (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted relative time
 */
export const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const pastDate = new Date(date);
    
    // Handle invalid dates
    if (isNaN(pastDate.getTime())) {
      return '';
    }
    
    const secondsDiff = Math.floor((now - pastDate) / 1000);
    
    // Less than a minute
    if (secondsDiff < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (secondsDiff < 3600) {
      const minutes = Math.floor(secondsDiff / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (secondsDiff < 86400) {
      const hours = Math.floor(secondsDiff / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (secondsDiff < 604800) {
      const days = Math.floor(secondsDiff / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than a month
    if (secondsDiff < 2592000) {
      const weeks = Math.floor(secondsDiff / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    if (secondsDiff < 31536000) {
      const months = Math.floor(secondsDiff / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(secondsDiff / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };
  
  /**
   * Format a date to a standard format (e.g., "Jan 1, 2023")
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted date
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    
    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Format a date and time (e.g., "Jan 1, 2023, 12:00 PM")
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted date and time
   */
  export const formatDateTime = (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    
    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };