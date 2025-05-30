// src/components/admin/InventoryManager/InventoryList.js
import React from 'react';
import './InventoryList.css';

const InventoryList = ({
  items,
  loading,
  totalItems,
  pagination,
  onPageChange,
  onLimitChange,
  onSortChange,
  onEdit,
  onDelete,
  onStatusChange
}) => {

// Add these functions at the beginning of your InventoryList component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedInventoryImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedInventoryImages') || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem('failedInventoryImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

// Add getInventoryImageUrl function
const getInventoryImageUrl = (item) => {
  try {
    // Check if item has images
    if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
      return '/images/placeholders/part.jpg';
    }
    
    // Get first image
    const image = item.images[0];
    let imageUrl = '';
    
    // Handle string format
    if (typeof image === 'string') {
      imageUrl = image;
    } 
    // Handle object format
    else if (image && typeof image === 'object') {
      imageUrl = image.url || image.thumbnail || '';
      
      // Use S3 proxy if we have key but no URL
      if (!imageUrl && image.key) {
        return `/api/images/s3-proxy/${image.key}`;
      }
    }
    
    // If we couldn't extract a URL, use placeholder
    if (!imageUrl) {
      return '/images/placeholders/part.jpg';
    }
    
    // Fix problematic S3 URLs with duplicate paths
    if (imageUrl.includes('/images/images/')) {
      imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    // Check for cached failed images
    if (checkFailedImage(imageUrl)) {
      console.log(`Using cached fallback for previously failed image: ${imageUrl}`);
      return '/images/placeholders/part.jpg';
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error getting inventory image URL:', error);
    return '/images/placeholders/part.jpg';
  }
};

  const handleSort = (field) => {
    // Toggle between ascending and descending
    const isAsc = pagination.sort === field;
    onSortChange(isAsc ? `-${field}` : field);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      onPageChange(newPage);
    }
  };
  
  const handleLimitChange = (e) => {
    onLimitChange(Number(e.target.value));
  };
  
  const handleStatusChange = (itemId, newStatus) => {
    onStatusChange(itemId, newStatus);
  };
  
  // Function to format price with currency symbol
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `P${Number(price).toLocaleString()}`;
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Generate page range for pagination
  const getPageRange = () => {
    const { page, totalPages } = pagination;
    
    // For 5 or fewer total pages, show all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // For more than 5 pages, show a window around current page
    if (page <= 3) {
      // Near the start
      return [1, 2, 3, 4, 5];
    } else if (page >= totalPages - 2) {
      // Near the end
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    } else {
      // Middle
      return [page - 2, page - 1, page, page + 1, page + 2];
    }
  };
  
  // Get stock status
  const getStockStatus = (quantity) => {
    if (quantity === undefined || quantity === null) return 'Unknown';
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };
  
  // Get stock status class
  const getStockStatusClass = (quantity) => {
    if (quantity === undefined || quantity === null) return '';
    if (quantity <= 0) return 'stock-out';
    if (quantity <= 5) return 'stock-low';
    return 'stock-in';
  };
  
  return (
    <div className="inventory-list-container">
      <div className="inventory-list-header">
        <div className="inventory-list-count">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} found
        </div>
        
        <div className="inventory-list-options">
          <div className="inventory-list-limit">
            <label htmlFor="limit-select">Show:</label>
            <select
              id="limit-select"
              value={pagination.limit}
              onChange={handleLimitChange}
              className="inventory-limit-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading && items.length === 0 ? (
        <div className="inventory-list-loading">
          <div className="inventory-list-spinner"></div>
          <p>Loading inventory items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="inventory-list-empty">
          <p>No inventory items found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="inventory-list-table-wrapper">
            <table className="inventory-list-table">
              <thead>
                <tr>
                  <th className="image-cell">Image</th>
                  <th className="title-cell">
                    Title
                    <button className="sort-button" onClick={() => handleSort('title')}>⇅</button>
                  </th>
                  <th className="category-cell">Category</th>
                  <th className="price-cell">
                    Price
                    <button className="sort-button" onClick={() => handleSort('price')}>⇅</button>
                  </th>
                  <th className="stock-cell">
                    Stock
                    <button className="sort-button" onClick={() => handleSort('stock.quantity')}>⇅</button>
                  </th>
                  <th className="business-cell">Business</th>
                  <th className="status-cell">Status</th>
                  <th className="date-cell">
                    Created
                    <button className="sort-button" onClick={() => handleSort('createdAt')}>⇅</button>
                  </th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td className="image-cell">
  {item.images && item.images.length > 0 ? (
    <img 
      src={getInventoryImageUrl(item)} 
      alt={item.title}
      className="inventory-item-image"
      onError={(e) => {
        const originalSrc = e.target.src;
        console.error(`Inventory image failed to load: ${originalSrc}`);
        
        // Mark this image as failed
        markFailedImage(originalSrc);
        
        // For S3 URLs, try the proxy endpoint
        if (originalSrc.includes('amazonaws.com')) {
          // Extract key from S3 URL
          const key = originalSrc.split('.amazonaws.com/').pop();
          if (key) {
            // Normalize the key
            const normalizedKey = key.replace(/images\/images\//g, 'images/');
            e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
            return;
          }
        }
        
        // Try inventory directory if not already a placeholder
        if (!originalSrc.includes('/images/placeholders/')) {
          const filename = originalSrc.split('/').pop();
          if (filename) {
            e.target.src = `/uploads/inventory/${filename}`;
            return;
          }
        }
        
        // Final fallback
        e.target.src = '/images/placeholders/part.jpg';
      }}
    />
  ) : (
    <img 
      src="/images/placeholders/part.jpg" 
      alt="No image"
      className="inventory-item-image"
    />
  )}
</td>
                    <td className="title-cell">
                      <div className="item-title">{item.title}</div>
                      {item.sku && <div className="item-sku">SKU: {item.sku}</div>}
                    </td>
                    <td className="category-cell">{item.category}</td>
                    <td className="price-cell">
                      <div className="item-price">{formatPrice(item.price)}</div>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="item-original-price">{formatPrice(item.originalPrice)}</div>
                      )}
                    </td>
                    <td className="stock-cell">
                      <span className={`stock-badge ${getStockStatusClass(item.stock?.quantity)}`}>
                        {getStockStatus(item.stock?.quantity)}
                      </span>
                      <span className="stock-quantity">{item.stock?.quantity || 0} units</span>
                    </td>
                    <td className="business-cell">
                      {item.business ? (
                        <div className="business-info">
                          <div className="business-name">{item.business.businessName}</div>
                          {item.business.location && (
                            <div className="business-location">{item.business.location.city}</div>
                          )}
                        </div>
                      ) : (
                        <span className="unknown-business">Unknown</span>
                      )}
                    </td>
                    <td className="status-cell">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        className={`status-select ${getStatusBadgeClass(item.status)}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </td>
                    <td className="date-cell">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => onEdit(item)}
                          title="Edit item"
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => onDelete(item._id)}
                          title="Delete item"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          {pagination.totalPages > 1 && (
            <div className="inventory-list-pagination">
              <button
                className="pagination-button prev"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              {pagination.page > 3 && pagination.totalPages > 5 && (
                <>
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                  {pagination.page > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}
              
              {getPageRange().map(pageNum => (
                <button
                  key={pageNum}
                  className={`pagination-button ${pagination.page === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              
              {pagination.page < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(pagination.totalPages)}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
              
              <button
                className="pagination-button next"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryList;