// Enhanced ProcessSection.js - Converted to a carousel
import React, { useState, useRef, useEffect } from 'react';
import './ProcessSection.css';

const ProcessSection = ({ theme = 'dark' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const [showButtons, setShowButtons] = useState({ prev: false, next: true });
  
  const steps = [
    {
      title: 'Photography and Vehicle Assessment',
      details: [
        'Our team conducts a professional photoshoot to capture the car in its best light, highlighting key features and condition.',
        'A thorough assessment ensures all relevant details (mileage, history, and unique selling points) are accurately recorded.'
      ],
      icon: ''
    },
    {
      title: 'Listing and Uploading',
      details: [
        'The car\'s profile, including photos, descriptions, and technical specifications, is carefully crafted to appeal to potential buyers.',
        'The listing is uploaded to the Bw Car Culture website, ensuring it stands out with a clean, attractive presentation optimized for mobile and desktop users.'
      ],
      icon: ''
    },
    {
      title: 'Marketing and Promotion',
      details: [
        'The vehicle is marketed across our platforms, including social media, email campaigns, and targeted ads, leveraging our vast audience of car enthusiasts and buyers.',
        'Optional add-ons like featured listings or priority promotions are available to boost visibility further, ensuring faster sales and maximum exposure.'
      ],
      icon: ''
    },
    {
      title: 'Customer Support',
      details: [
        'Our team manages buyer inquiries and coordinates viewings, handling the communication between interested parties and sellers.',
        'We provide guidance throughout the selling process, ensuring both parties have a smooth, trustworthy experience.'
      ],
      icon: ''
    }
  ];

  // Check if carousel needs navigation buttons
  useEffect(() => {
    const checkScrollable = () => {
      if (carouselRef.current) {
        const { scrollWidth, clientWidth } = carouselRef.current;
        const canScrollLeft = carouselRef.current.scrollLeft > 0;
        const canScrollRight = carouselRef.current.scrollLeft < scrollWidth - clientWidth - 10;
        
        setShowButtons({
          prev: canScrollLeft,
          next: canScrollRight
        });
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollable);
      // Initialize check
      checkScrollable();
      
      // Set up observation for changes in carousel size
      const resizeObserver = new ResizeObserver(checkScrollable);
      resizeObserver.observe(carousel);
      
      return () => {
        carousel.removeEventListener('scroll', checkScrollable);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Handle carousel navigation
  const handleSlideChange = (direction) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.process-step')?.offsetWidth || 300;
      const gap = 20; // Adjust based on your CSS gap value
      const scrollAmount = cardWidth + gap;
      
      if (direction === 'prev') {
        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className={`process-section ${theme}`}>
      <h2 className="process-title">How Bw Car Culture Works</h2>
      
      <div className="process-carousel-container">
        {showButtons.prev && (
          <button 
            className="process-nav-button prev-button"
            onClick={() => handleSlideChange('prev')}
            aria-label="Previous step"
          >
            ❮
          </button>
        )}
        
        <div className="process-steps-carousel" ref={carouselRef}>
          {steps.map((step, index) => (
            <div key={index} className="process-step">
              <div className="step-header">
                <span className="step-icon">{step.icon}</span>
                <span className="step-number">{index + 1}</span>
                <h3 className="step-title">{step.title}</h3>
              </div>
              <div className="step-details">
                {step.details.map((detail, detailIndex) => (
                  <p key={detailIndex} className="detail-text">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {showButtons.next && (
          <button 
            className="process-nav-button next-button"
            onClick={() => handleSlideChange('next')}
            aria-label="Next step"
          >
            ❯
          </button>
        )}
      </div>
      
      {/* Mobile indicator dots */}
      <div className="process-indicators">
        {steps.map((_, index) => (
          <span 
            key={index} 
            className={`process-indicator-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => {
              if (carouselRef.current) {
                const cardWidth = carouselRef.current.querySelector('.process-step')?.offsetWidth || 300;
                const gap = 20;
                carouselRef.current.scrollTo({
                  left: index * (cardWidth + gap),
                  behavior: 'smooth'
                });
              }
            }}
          />
        ))}
      </div>
      
      <div className="process-footer">
        <p className="process-note">
          This process ensures a <strong>seamless and professional experience</strong> for 
          sellers while connecting them with the right buyers efficiently!
        </p>
      </div>
    </section>
  );
};

export default ProcessSection;