// src/components/features/CarCategories/CarBrands.js
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CarBrands.css';

const CarBrands = () => {
  const sliderRef = useRef(null);
  const [showButtons, setShowButtons] = useState({ left: false, right: true });
  const [activeBrand, setActiveBrand] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dominantColors, setDominantColors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const extractDominantColor = (imgEl, brandId) => {
    try {
      const canvas = document.createElement('canvas');
      const W = 60, H = 30;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      // Sample the bottom 40% of the image where the car body usually is
      const srcY = imgEl.naturalHeight * 0.6;
      const srcH = imgEl.naturalHeight * 0.4;
      ctx.drawImage(imgEl, 0, srcY, imgEl.naturalWidth, srcH, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      // Darken the averaged color so the gradient reads well over text
      const darken = 0.5;
      r = Math.round((r / count) * darken);
      g = Math.round((g / count) * darken);
      b = Math.round((b / count) * darken);
      setDominantColors(prev => ({ ...prev, [brandId]: `${r}, ${g}, ${b}` }));
    } catch {
      // Silently fall back to default black gradient (CORS or tainted canvas)
    }
  };
  
  // Fetch brands data from dedicated aggregation endpoint
  useEffect(() => {
    let cancelled = false;
    const fetchBrandsData = async (attempt = 0) => {
      try {
        setLoading(true);
        setError(null);
        const apiBase = process.env.REACT_APP_API_URL || '/api';
        const res = await fetch(`${apiBase}/listings/brands`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const brandsData = (json.data || []).map(b => ({
          ...b,
          image: b.image || '/images/placeholders/car.jpg'
        }));
        if (cancelled) return;
        if (brandsData.length === 0 && attempt < 2) {
          setTimeout(() => fetchBrandsData(attempt + 1), 1500);
          return;
        }
        setBrands(brandsData);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching brands data:', err);
        if (attempt < 2) {
          setTimeout(() => fetchBrandsData(attempt + 1), 1500);
        } else {
          setError(true);
          setLoading(false);
        }
      }
    };
    fetchBrandsData();
    return () => { cancelled = true; };
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
          onLoad={(e) => extractDominantColor(e.target, brand.id)}
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

  if (error && brands.length === 0) {
    return (
      <section className="car-brands-section">
        <h2>Explore by Brand</h2>
        <p className="no-data-message">Could not load brands. Please check your connection.</p>
      </section>
    );
  }

  if (!loading && brands.length === 0) {
    return null; // No listings yet — hide section entirely
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
              style={dominantColors[brand.id] ? { '--card-dc': dominantColors[brand.id] } : undefined}
            >
              <div className="brand-logo">
                {renderBrandImage(brand)}
              </div>
              <div className="brand-info">
                <h3>{brand.name}</h3>
                <div className="brand-stats">
                  <span className="vehicle-count">{brand.modelCount} {brand.modelCount === 1 ? 'listing' : 'listings'}</span>
                  <span className="pula-price">{brand.priceRange}</span>
                </div>
                <button className="view-brand-btn">
                  Explore →
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