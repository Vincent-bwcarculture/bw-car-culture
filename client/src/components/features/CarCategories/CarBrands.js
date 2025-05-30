// src/components/features/CarCategories/CarBrands.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listingService } from '../../../services/listingService.js';
import './CarBrands.css';

const CarBrands = () => {
  const sliderRef = useRef(null);
  const [showButtons, setShowButtons] = useState({ left: false, right: true });
  const [activeBrand, setActiveBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch brands data from API
  useEffect(() => {
    const fetchBrandsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get listings to build brand data
        const allListings = await listingService.getListings({}, 1, 100);
        const listings = allListings?.listings || [];
        
        if (listings.length === 0) {
          throw new Error('No vehicle listings available');
        }
        
        // Extract all unique brands (makes) from the data
        const uniqueMakes = [...new Set(listings.map(listing => 
          (listing.specifications?.make || listing.make || '').trim()
        ).filter(make => make))];
        
        // Process each make to create brand data
        const brandsData = [];
        
        uniqueMakes.forEach(make => {
          // Get all listings for this make
          const brandListings = listings.filter(listing => {
            const listingMake = (listing.specifications?.make || listing.make || '').trim();
            return listingMake.toLowerCase() === make.toLowerCase();
          });
          
          // Only add brands that have listings
          if (brandListings.length > 0) {
            // Find the most expensive car for this brand to use as featured image
            const sortedByPrice = [...brandListings].sort((a, b) => 
              (b.price || 0) - (a.price || 0)
            );
            
            // Get the most expensive model (for the "featured" label)
            const featuredModel = sortedByPrice[0]?.specifications?.model || 
                                 sortedByPrice[0]?.model || 
                                 'Featured Model';
            
            // Get the most expensive car's image to represent the brand
            let brandImage = null;
            if (sortedByPrice[0]?.images && sortedByPrice[0].images.length > 0) {
              const featuredCarImage = sortedByPrice[0].images[0];
              
              if (typeof featuredCarImage === 'string') {
                brandImage = featuredCarImage;
              } else if (featuredCarImage && typeof featuredCarImage === 'object') {
                brandImage = featuredCarImage.url || featuredCarImage.thumbnail || '';
              }
            }
            
            // Fallback if no image is found
            if (!brandImage) {
              brandImage = '/images/placeholders/car.jpg';
            }
            
            // Calculate price range
            const prices = brandListings.map(item => item.price).filter(Boolean);
            let priceRange = 'P TBD';
            
            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = `P ${minPrice.toLocaleString()} - P ${maxPrice.toLocaleString()}`;
            }
            
            // Add the processed brand
            brandsData.push({
              id: make.toLowerCase().replace(/\s+/g, '-'),
              name: make,
              image: brandImage,
              modelCount: brandListings.length,
              featured: featuredModel,
              priceRange: priceRange,
              filter: make
            });
          }
        });
        
        // Sort brands by number of models (descending)
        brandsData.sort((a, b) => b.modelCount - a.modelCount);
        
        if (brandsData.length === 0) {
          throw new Error('No brands with listings found');
        } else {
          setBrands(brandsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching brands data:', error);
        setError('Failed to load brands. Using defaults.');
        
        // Use default brands as fallback
        setBrands([
          {
            id: 'toyota',
            name: 'Toyota',
            image: '/images/placeholders/car.jpg',
            modelCount: 12,
            featured: 'GR Supra',
            priceRange: 'P 350,000 - P 1,200,000',
            filter: 'Toyota'
          },
          {
            id: 'bmw',
            name: 'BMW',
            image: '/images/placeholders/car.jpg',
            modelCount: 18,
            featured: 'M4 Competition',
            priceRange: 'P 850,000 - P 2,500,000',
            filter: 'BMW'
          },
          {
            id: 'mercedes-benz',
            name: 'Mercedes-Benz',
            image: '/images/placeholders/car.jpg',
            modelCount: 15,
            featured: 'AMG GT',
            priceRange: 'P 900,000 - P 2,800,000',
            filter: 'Mercedes-Benz'
          },
          {
            id: 'audi',
            name: 'Audi',
            image: '/images/placeholders/car.jpg',
            modelCount: 14,
            featured: 'RS e-tron GT',
            priceRange: 'P 750,000 - P 2,300,000',
            filter: 'Audi'
          },
          {
            id: 'ford',
            name: 'Ford',
            image: '/images/placeholders/car.jpg',
            modelCount: 16,
            featured: 'Mustang GT',
            priceRange: 'P 450,000 - P 1,500,000',
            filter: 'Ford'
          }
        ]);
        setLoading(false);
      }
    };
    
    fetchBrandsData();
  }, []);

  // Parse active brand from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const makeParam = searchParams.get('make');
    if (makeParam) {
      setActiveBrand(makeParam);
    }
  }, [location.search]);

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
  }, [brands]);

  const scrollCarousel = (direction) => {
    const scrollAmount = 300;
    if (sliderRef.current) {
      const newScrollPosition = direction === 'left'
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleBrandSelect = (brand) => {
    setActiveBrand(brand.filter);
    
    // Navigate to marketplace with this brand as a filter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('make', brand.filter);
    navigate({
      pathname: '/marketplace',
      search: searchParams.toString()
    });
  };

  // Render a brand's representative vehicle image
  const renderBrandImage = (brand) => {
    if (!brand.image) {
      return (
        <div className="brand-vehicle-placeholder">
          <span>{brand.name}</span>
        </div>
      );
    }

    return (
      <div className="brand-vehicle-image">
        <img 
          src={brand.image} 
          alt={`${brand.name} vehicle`}
          loading="lazy"
          onError={(e) => {
            console.log(`Brand vehicle image failed to load: ${e.target.src}`);
            
            // For S3 URLs or external URLs, go straight to placeholder
            if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
              e.target.src = '/images/placeholders/car.jpg';
            } else {
              // For local files, try a generic fallback first
              if (!e.target.src.includes('placeholders')) {
                e.target.src = '/images/placeholders/car.jpg';
              } else {
                // If even the placeholder fails, replace with text
                const placeholder = document.createElement('div');
                placeholder.className = 'brand-vehicle-placeholder';
                placeholder.innerHTML = `<span>${brand.name}</span>`;
                e.target.parentNode.replaceChild(placeholder, e.target);
              }
            }
          }}
        />
        <div className="brand-overlay">{brand.name}</div>
      </div>
    );
  };

  if (loading && brands.length === 0) {
    return (
      <section className="car-brands-section">
        <h2>Explore by Brand</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading brands...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="car-brands-section">
      <h2>Explore by Brand</h2>
      <div className="brands-container">
        {showButtons.left && (
          <button 
            className="brand-scroll-button brand-scroll-prev" 
            onClick={() => scrollCarousel('left')}
            aria-label="Scroll left"
          >
            ❮
          </button>
        )}
        <div className="brands-wrapper" ref={sliderRef}>
          {brands.map(brand => (
            <div 
              key={brand.id} 
              className={`brand-card ${activeBrand === brand.filter ? 'brand-active' : ''}`}
              onClick={() => handleBrandSelect(brand)}
            >
              <div className="brand-logo">
                {renderBrandImage(brand)}
              </div>
              <div className="brand-info">
                <h3>{brand.name}</h3>
                <div className="brand-stats">
                  <span>{brand.modelCount} models</span>
                  <span className="featured-model">
                    Featured: {brand.featured}
                  </span>
                  <span className="pula-price">{brand.priceRange}</span>
                </div>
                <button className="view-brand-btn">
                  View Vehicles
                </button>
              </div>
              {activeBrand === brand.filter && (
                <div className="brand-selected-badge">Selected</div>
              )}
            </div>
          ))}
        </div>
        {showButtons.right && (
          <button 
            className="brand-scroll-button brand-scroll-next" 
            onClick={() => scrollCarousel('right')}
            aria-label="Scroll right"
          >
            ❯
          </button>
        )}
      </div>
    </section>
  );
};

export default CarBrands;