// src/components/features/HomeDealershipsSection/HomeDealershipsSection.js
import React, { useState, useEffect, useRef } from 'react';
import { http } from '../../../config/axios.js';
import { useNavigate } from 'react-router-dom';
import { dealerService } from '../../../services/dealerService.js';
import DealershipCard from '../../shared/DealershipCard/DealershipCard.js';
import './HomeDealershipsSection.css';

const HomeDealershipsSection = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  // Number of dealers to show per page
  const DEALERS_PER_PAGE = 10;

  useEffect(() => {
  const fetchDealers = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX: Use the same API call pattern as DealershipsPage
      const response = await http.get('/dealers', {
        params: {
          status: 'active',
          page: currentPage,
          limit: DEALERS_PER_PAGE
        }
      });
      
      console.log('🏠 HomeDealerships API response:', response.data);
      
      // ✅ FIX: Use the same data extraction as DealershipsPage
      if (response.data && response.data.success) {
        const dealersData = response.data.data || [];
        console.log('✅ HomeDealerships dealers found:', dealersData.length);
        setDealers(dealersData);
        
        // Set pagination
        setPagination({
          currentPage: response.data.pagination?.currentPage || currentPage,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.pagination?.total || 0
        });
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        console.warn('⚠️ API returned success:false');
        setDealers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('❌ HomeDealerships error:', error);
      setError('Unable to load dealerships');
      setDealers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  fetchDealers();
}, [currentPage]);

  const handleViewAllDealers = () => {
    navigate('/dealerships');
  };

  const handleDealerAction = (dealer) => {
    navigate(`/dealerships/${dealer._id}`);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setActiveSlide(0); // Reset active slide when changing page
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setActiveSlide(0); // Reset active slide when changing page
    }
  };

  // Handle carousel navigation
  const scrollToNext = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.bcc-dealership-card')?.offsetWidth;
      const gap = 20; // Approximate gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide + 1;
        if (newActiveSlide < dealers.length) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: cardWidth + gap,
            behavior: 'smooth'
          });
        } else if (currentPage < totalPages) {
          // If we're at the end of the current page of dealers, load the next page
          handleNextPage();
        }
      }
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.bcc-dealership-card')?.offsetWidth;
      const gap = 20; // Approximate gap between items
      
      if (cardWidth) {
        const newActiveSlide = activeSlide - 1;
        if (newActiveSlide >= 0) {
          setActiveSlide(newActiveSlide);
          carouselRef.current.scrollBy({
            left: -(cardWidth + gap),
            behavior: 'smooth'
          });
        } else if (currentPage > 1) {
          // If we're at the beginning of the current page, go to previous page
          handlePrevPage();
        }
      }
    }
  };

  if (loading && dealers.length === 0) {
    return (
      <section className="home-dealerships-section">
        <div className="home-dealerships-header">
          <h2>Dealerships</h2>
        </div>
        <div className="home-dealerships-loading">
          <div className="home-dealerships-spinner"></div>
        </div>
      </section>
    );
  }

  if (error && dealers.length === 0) {
    return null; // Don't show section on error to avoid breaking the homepage flow
  }

  // If no dealers found, don't display the section
  if (dealers.length === 0 && !loading) {
    return null;
  }

  return (
    <section className="home-dealerships-section">
      <div className="home-dealerships-header">
        <h2>Dealerships</h2>
        <button 
          className="home-dealerships-view-all"
          onClick={handleViewAllDealers}
        >
          View All
        </button>
      </div>

      <div className="home-dealerships-carousel-container">
        {/* Carousel navigation buttons */}
        <button 
          className={`carousel-nav carousel-prev ${activeSlide === 0 && currentPage === 1 ? 'disabled' : ''}`}
          onClick={scrollToPrev}
          disabled={activeSlide === 0 && currentPage === 1}
          aria-label="Previous dealership"
        >
          &#10094;
        </button>

        <div className="home-dealerships-carousel" ref={carouselRef}>
          {dealers.map((dealer, index) => (
            <div 
              key={dealer._id} 
              className={`carousel-item ${activeSlide === index ? 'active' : ''}`}
            >
              <DealershipCard 
                dealer={dealer}
                onAction={handleDealerAction}
                compact={false
                } // Use compact version for home page
              />
            </div>
          ))}
          
          {loading && (
            <div className="carousel-item carousel-loader">
              <div className="home-dealerships-spinner"></div>
            </div>
          )}
        </div>

        <button 
          className={`carousel-nav carousel-next ${activeSlide === dealers.length - 1 && currentPage === totalPages ? 'disabled' : ''}`}
          onClick={scrollToNext}
          disabled={activeSlide === dealers.length - 1 && currentPage === totalPages}
          aria-label="Next dealership"
        >
          &#10095;
        </button>
      </div>

      {/* Pagination indicators */}
      <div className="carousel-pagination">
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <div className="pagination-dots">
          {dealers.map((_, index) => (
            <span 
              key={index} 
              className={`pagination-dot ${activeSlide === index ? 'active' : ''}`}
              onClick={() => {
                if (carouselRef.current) {
                  const cardWidth = carouselRef.current.querySelector('.bcc-dealership-card')?.offsetWidth;
                  const gap = 20;
                  setActiveSlide(index);
                  carouselRef.current.scrollTo({
                    left: index * (cardWidth + gap),
                    behavior: 'smooth'
                  });
                }
              }}
            >
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeDealershipsSection;