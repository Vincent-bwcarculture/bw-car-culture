// src/components/features/CarCategories/CarCategories.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listingService } from '../../../services/listingService.js';
import './CarCategories.css';

const CarCategories = () => {
  const sliderRef = useRef(null);
  const [showButtons, setShowButtons] = useState({ left: false, right: true });
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories data from the API
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all listings to extract categories
        const allListings = await listingService.getListings({}, 1, 200);
        const listings = allListings?.listings || [];
        
        if (listings.length === 0) {
          throw new Error('No vehicle listings available');
        }
        
        // Extract all unique categories from the data
        // Look in multiple fields where category information might be stored
        const allCategories = listings.map(listing => {
          return listing.category || 
                 listing.specifications?.category || 
                 listing.bodyStyle || 
                 listing.specifications?.bodyStyle || null;
        }).filter(Boolean);
        
        // If we still don't have enough categories, use the default list
        let uniqueCategories = [...new Set(allCategories)];
        
        // If we have no categories from the database, use defaults from schema
        if (uniqueCategories.length < 3) {
          uniqueCategories = [
            'Sedan', 'SUV', 'Sports Car', 'Luxury', 'Electric',
            'Hybrid', 'Truck', 'Van', 'Wagon', 'Convertible', 'Classic'
          ];
        }
        
        // Process each category to create category data
        const categorizedData = [];
        
        uniqueCategories.forEach(categoryName => {
          if (!categoryName) return; // Skip null/empty categories
          
          // Normalize the category name for filtering
          const normalizedCategory = categoryName.toLowerCase().trim();
          
          // Filter listings for this category - use a flexible approach to match category
          const categoryListings = listings.filter(listing => {
            // Check all possible category fields
            const listingCategory = (listing.category || '').toLowerCase().trim();
            const listingType = (listing.type || '').toLowerCase().trim();
            const specCategory = (listing.specifications?.category || '').toLowerCase().trim();
            const bodyStyle = (listing.bodyStyle || '').toLowerCase().trim();
            const specBodyStyle = (listing.specifications?.bodyStyle || '').toLowerCase().trim();
            
            // Match against normalized values
            return listingCategory === normalizedCategory ||
                   listingType === normalizedCategory ||
                   specCategory === normalizedCategory || 
                   bodyStyle === normalizedCategory ||
                   specBodyStyle === normalizedCategory ||
                   // Also check if the category appears in the title
                   (listing.title && listing.title.toLowerCase().includes(normalizedCategory));
          });
          
          // Only add categories that have at least one listing
          if (categoryListings.length > 0) {
            // Find a suitable image from the category listings
            let categoryImage = '/images/placeholders/car.jpg';
            
            // Sort listings by price to find the most expensive car (for best image)
            const sortedByPrice = [...categoryListings].sort((a, b) => 
              (b.price || 0) - (a.price || 0)
            );
            
            // Find a car with images
            const carWithImage = sortedByPrice.find(
              item => item.images && item.images.length > 0
            );
            
            if (carWithImage && carWithImage.images && carWithImage.images.length > 0) {
              // Extract image URL (handle different image object formats)
              const firstImage = carWithImage.images[0];
              
              if (typeof firstImage === 'string') {
                categoryImage = firstImage;
              } else if (firstImage && typeof firstImage === 'object') {
                categoryImage = firstImage.url || firstImage.thumbnail || firstImage.src || '';
              }
              
              // If we still don't have a valid image URL, use placeholder
              if (!categoryImage) {
                categoryImage = '/images/placeholders/car.jpg';
              }
            }
            
            // Calculate price range
            const prices = categoryListings.map(item => item.price).filter(Boolean);
            let priceRange = 'P TBD';
            
            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = `P ${minPrice.toLocaleString()} - P ${maxPrice.toLocaleString()}`;
            }
            
            // Format category title properly
            const formattedTitle = categoryName
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            
            // Add the processed category
            categorizedData.push({
              id: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-'),
              title: formattedTitle,
              image: categoryImage,
              vehicleCount: categoryListings.length,
              priceRange: priceRange,
              filter: categoryName
            });
          }
        });
        
        // Sort categories by number of vehicles (most first)
        categorizedData.sort((a, b) => b.vehicleCount - a.vehicleCount);
        
        // If no categories with listings were found, use default data
        if (categorizedData.length === 0) {
          throw new Error('No categories with listings found');
        } else {
          setCategories(categorizedData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching category data:', error);
        setError('Failed to load categories. Using defaults.');
        
        // Use default categories as fallback
        setCategories([
          {
            id: 'sedans',
            title: "Sedans",
            image: "/images/placeholders/car.jpg",
            vehicleCount: 12,
            priceRange: "P 350,000 - P 850,000",
            filter: "Sedan"
          },
          {
            id: 'suvs',
            title: "SUVs & Crossovers",
            image: "/images/placeholders/car.jpg",
            vehicleCount: 18,
            priceRange: "P 450,000 - P 1,250,000",
            filter: "SUV"
          },
          {
            id: 'sports-cars',
            title: "Sports Cars",
            image: "/images/placeholders/car.jpg",
            vehicleCount: 8,
            priceRange: "P 850,000 - P 3,500,000",
            filter: "Sports Car"
          },
          {
            id: 'luxury',
            title: "Luxury",
            image: "/images/placeholders/car.jpg",
            vehicleCount: 10,
            priceRange: "P 950,000 - P 3,150,000",
            filter: "Luxury"
          }
        ]);
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, []);

  // Parse active category from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [location.search]);

  const scroll = (direction) => {
    const scrollAmount = 330; // card width + gap
    if (sliderRef.current) {
      // Calculate the maximum scroll position
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      
      // Calculate new scroll position
      const newScrollPosition = direction === 'left'
        ? Math.max(0, sliderRef.current.scrollLeft - scrollAmount)
        : Math.min(maxScroll, sliderRef.current.scrollLeft + scrollAmount);
      
      // Smooth scroll to new position
      sliderRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle button visibility
  const handleScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowButtons({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', handleScroll);
      handleScroll();
      // Set up a ResizeObserver to handle window resizing
      const resizeObserver = new ResizeObserver(() => {
        handleScroll();
      });
      resizeObserver.observe(slider);
      return () => {
        slider.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, [categories]); // Re-run when categories change

  // Handle category selection
  const handleCategorySelect = (category) => {
    setActiveCategory(category.filter);
    
    // Navigate to marketplace with this category as a filter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('category', category.filter);
    navigate({
      pathname: '/marketplace',
      search: searchParams.toString()
    });
  };

  if (loading && categories.length === 0) {
    return (
      <section className="car-categories-section">
        <h2>Browse by Vehicle Type</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="car-categories-section">
      <h2>Browse by Vehicle Type</h2>
      <div className="car-categories-container">
        {showButtons.left && (
          <button 
            className="car-scroll-button car-scroll-prev" 
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            ❮
          </button>
        )}
        <div className="car-categories-wrapper" ref={sliderRef}>
          {categories.map(category => (
            <div 
              key={category.id} 
              className={`car-category-card ${activeCategory === category.filter ? 'car-category-active' : ''}`}
              onClick={() => handleCategorySelect(category)}
            >
              <div className="car-category-image">
                <img 
                  src={category.image} 
                  alt={category.title} 
                  loading="lazy"
                  onError={(e) => {
                    console.log(`Category image failed to load: ${e.target.src}`);
                    
                    // For S3 URLs, go straight to placeholder
                    if (e.target.src.includes('amazonaws.com') || e.target.src.includes('https://')) {
                      e.target.src = '/images/placeholders/car.jpg';
                      return;
                    }
                    
                    // For local paths, try one fallback then placeholder
                    if (!e.target.src.includes('/images/placeholder')) {
                      const filename = e.target.src.split('/').pop();
                      
                      // First try uploads path
                      if (filename && !e.target.src.includes('/uploads/')) {
                        e.target.src = `/uploads/listings/${filename}`;
                        e.target.onerror = () => {
                          e.target.src = '/images/placeholders/car.jpg';
                        };
                        return;
                      }
                    }
                    
                    e.target.src = '/images/placeholders/car.jpg';
                  }}
                />
              </div>
              <div className="car-category-content">
                <h3 className="car-category-title">{category.title}</h3>
                <div className="car-category-stats">
                  <span className="vehicle-count">{category.vehicleCount} vehicles available</span>
                  <span className="pula-price">{category.priceRange}</span>
                </div>
                <div className="car-category-actions">
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategorySelect(category);
                    }}
                  >
                    View Vehicles
                  </button>
                </div>
              </div>
              {activeCategory === category.filter && (
                <div className="car-category-selected-badge">Selected</div>
              )}
            </div>
          ))}
        </div>
        {showButtons.right && (
          <button 
            className="car-scroll-button car-scroll-next" 
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            ❯
          </button>
        )}
      </div>
    </section>
  );
};

export default CarCategories;