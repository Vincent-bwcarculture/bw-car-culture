// src/hooks/useDealerships.js
import { useState, useEffect, useCallback } from 'react';
import { dealerService } from '../services/dealerService.js';

/**
 * Custom hook for fetching and managing dealership data
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Dealers data and handler functions
 */
export const useDealerships = (initialFilters = {}) => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Fetch dealers with current filters and pagination
  const fetchDealers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await dealerService.getDealers(filters, pagination.currentPage);
      
      setDealers(result.dealers);
      setPagination({
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total
      });
    } catch (err) {
      setError(err.message || 'Failed to load dealerships');
      console.error('Error fetching dealers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage]);

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  // Update filters and reset to first page
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    
    // Reset to first page
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Change page
  const changePage = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Get a single dealer by ID
  const getDealer = async (id) => {
    try {
      setLoading(true);
      setError(null);
      return await dealerService.getDealer(id);
    } catch (err) {
      setError(err.message || `Failed to load dealership with ID: ${id}`);
      console.error(`Error fetching dealer with ID ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get dealer listings
  const getDealerListings = async (id, page = 1, limit = 10) => {
    try {
      setLoading(true);
      return await dealerService.getDealerListings(id, page, limit);
    } catch (err) {
      console.error(`Error fetching listings for dealer ${id}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    dealers,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    changePage,
    getDealer,
    getDealerListings,
    refresh: fetchDealers
  };
};

export default useDealerships;