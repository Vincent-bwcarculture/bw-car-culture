// Need to create an API service for listings
// src/services/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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