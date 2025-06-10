// Need to create an API service for listings
// src/services/api.js
// NEW: Call production frontend (which should proxy to backend)
const API_URL = process.env.REACT_APP_API_URL || 'https://bw-car-culture.vercel.app/api';

export const listingAPI = {
  async updateListing(id, data) {
    const response = await fetch(`${API_URL}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};