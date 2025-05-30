// src/hooks/useListings.js
import { useState, useEffect, useCallback } from 'react';
import { listingService } from '../services/listingService.js';

export const useListings = (initialFilters = {}) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Fetch listings
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listingService.getListings(
        filters,
        pagination.currentPage
      );

      setListings(response.listings);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        total: response.total
      });
    } catch (err) {
      setError(err.message);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Create listing
  const createListing = async (listingData) => {
    try {
      setLoading(true);
      setError(null);

      const newListing = await listingService.createListing(listingData);
      setListings(prev => [newListing, ...prev]);

      return newListing;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update listing
  const updateListing = async (id, listingData) => {
    try {
      setLoading(true);
      setError(null);

      const updatedListing = await listingService.updateListing(id, listingData);
      setListings(prev => 
        prev.map(listing => 
          listing.id === id ? updatedListing : listing
        )
      );

      return updatedListing;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete listing
  const deleteListing = async (id) => {
    try {
      setLoading(true);
      setError(null);

      await listingService.deleteListing(id);
      setListings(prev => prev.filter(listing => listing.id !== id));

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update listing status
  const updateListingStatus = async (id, status) => {
    try {
      setLoading(true);
      setError(null);

      const updatedListing = await listingService.updateListingStatus(id, status);
      setListings(prev => 
        prev.map(listing => 
          listing.id === id ? updatedListing : listing
        )
      );

      return updatedListing;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filters change
    }));
  };

  // Change page
  const changePage = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Reset state
  const reset = () => {
    setListings([]);
    setFilters(initialFilters);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      total: 0
    });
    setError(null);
  };

  return {
    listings,
    loading,
    error,
    filters,
    pagination,
    createListing,
    updateListing,
    deleteListing,
    updateListingStatus,
    updateFilters,
    changePage,
    reset,
    refresh: fetchListings
  };
};