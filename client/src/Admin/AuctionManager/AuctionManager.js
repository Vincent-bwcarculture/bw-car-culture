// src/components/admin/AuctionManager/AuctionManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './../../context/AuthContext.js';
import AddAuctionModal from './../../components/shared/AddAuctionModal/AddAuctionModal.js';
import AuctionsTable from './AuctionsTable.js';
import { auctionService } from "../../services/auctionService.js";
import './AuctionManager.css';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';

const AuctionManager = () => {
  const dispatch = useDispatch();
  
  const [actionLoading, setActionLoading] = useState({
    create: false,
    delete: false,
    id: null
  });

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'newest'
  });
  const { user } = useAuth();

  // Fetch auctions on component mount and filter changes
  useEffect(() => {
    fetchAuctions();
  }, [filters]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      const response = await auctionService.getAuctions(filters);
      setAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load auctions'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuction = async (formData) => {
    setActionLoading({ create: true });
    try {
      // Replace with actual API call
      const response = await auctionService.createAuction(formData);
      setAuctions(prev => [response.data, ...prev]);
      setShowAddModal(false);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Auction created successfully'
      }));
    } catch (error) {
      console.error('Error creating auction:', error);
      handleError(error, 'create auction');
    } finally {
      setActionLoading({ create: false });
    }
  };

  const handleError = (error, action) => {
    dispatch(addNotification({
      type: 'error',
      message: `Failed to ${action}: ${error.message}`
    }));
  };
  
  const handleEditAuction = (auction) => {
    setSelectedAuction(auction);
    setShowAddModal(true);
  };

  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    setActionLoading({ delete: true, id: auctionId });
    try {
      // Replace with actual API call
      await auctionService.deleteAuction(auctionId);
      setAuctions(prev => prev.filter(auction => auction.id !== auctionId));
      
      dispatch(addNotification({
        type: 'success',
        message: 'Auction deleted successfully'
      }));
    } catch (error) {
      console.error('Error deleting auction:', error);
      handleError(error, 'delete auction');
    } finally {
      setActionLoading({ delete: false, id: null });
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="auction-manager">
      <div className="auction-header">
        <h2>Car Auctions</h2>
        <div className="auction-actions">
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search auctions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="ended">Ended</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="sort-filter"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Starting Bid: High to Low</option>
              <option value="price-low">Starting Bid: Low to High</option>
              <option value="end-soon">Ending Soon</option>
              <option value="bids">Most Bids</option>
            </select>
          </div>
          <button 
            className="add-auction-btn"
            onClick={() => {
              setSelectedAuction(null);
              setShowAddModal(true);
            }}
          >
            Add New Auction
          </button>
        </div>
      </div>

      <AuctionsTable 
        auctions={auctions}
        loading={loading}
        onEdit={handleEditAuction}
        onDelete={handleDeleteAuction}
        actionLoading={actionLoading}
      />

      {showAddModal && (
        <AddAuctionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedAuction(null);
          }}
          onSubmit={handleAddAuction}
          initialData={selectedAuction}
          loading={actionLoading.create}
        />
      )}
    </div>
  );
};

export default AuctionManager;