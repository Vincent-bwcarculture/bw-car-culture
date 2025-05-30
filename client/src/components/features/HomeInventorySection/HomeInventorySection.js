// src/components/features/HomeInventorySection/HomeInventorySection.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import './HomeInventorySection.css';

const HomeInventorySection = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load featured inventory items on component mount
    loadFeaturedItems();
  }, []);
  
  const loadFeaturedItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get featured items
      const response = await axios.get('/api/inventory', {
        params: {
          featured: true,
          limit: 8,
          sort: '-createdAt'
        }
      });
      
      if (response.data && response.data.success) {
        setFeaturedItems(response.data.data);
      } else {
        // Fallback to latest items if no featured items
        const fallbackResponse = await axios.get('/api/inventory', {
          params: {
            limit: 8,
            sort: '-createdAt'
          }
        });
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          setFeaturedItems(fallbackResponse.data.data);
        } else {
          setError('Failed to load inventory items');
        }
      }
    } catch (error) {
      console.error('Error loading featured inventory items:', error);
      setError('Error loading items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewAll = () => {
    navigate('/inventory');
  };
  
  // Handle item sharing
  const handleShare = (item) => {
    if (!item) return;
    
    try {
      // Try to use the Web Share API if available
      if (navigator.share) {
        const shareData = {
          title: item.title || 'Inventory Item',
          text: `Check out this ${item.title} from I3W Car Culture`,
          url: `${window.location.origin}/inventory/${item._id}`
        };
        
        navigator.share(shareData)
          .catch(err => console.warn('Error sharing:', err));
      } else {
        // Fallback to copy to clipboard
        const url = `${window.location.origin}/inventory/${item._id}`;
        navigator.clipboard.writeText(url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Could not copy link:', err));
      }
    } catch (err) {
      console.error('Share functionality error:', err);
    }
  };
  
  return (
    <section className="home-inventory-section">
      <div className="inventory-section-container">
        <div className="inventory-section-header">
          <div className="section-title-group">
            <h2 className="section-title">Shop Parts & Accessories</h2>
            <p className="section-subtitle">Browse our catalog of quality parts and accessories</p>
          </div>
          <button className="view-all-button" onClick={handleViewAll}>
            View All Inventory
          </button>
        </div>
        
        {loading ? (
          <div className="inventory-loading">
            <div className="inventory-loader"></div>
          </div>
        ) : error ? (
          <div className="inventory-error">
            <p>{error}</p>
            <button onClick={loadFeaturedItems} className="retry-button">
              Try Again
            </button>
          </div>
        ) : featuredItems.length > 0 ? (
          <div className="inventory-grid">
            {featuredItems.map((item) => (
              <div className="inventory-grid-item" key={item._id}>
                <InventoryCard 
                  item={item} 
                  onShare={handleShare}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="inventory-empty">
            <p>No inventory items found</p>
            <Link to="/inventory" className="browse-link">
              Browse All Items
            </Link>
          </div>
        )}
        
        <div className="inventory-section-footer">
          <Link to="/inventory" className="mobile-view-all">
            View All Inventory
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeInventorySection;
