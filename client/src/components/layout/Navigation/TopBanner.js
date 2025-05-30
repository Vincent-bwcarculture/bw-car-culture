// src/components/layout/Navigation/TopBanner.js
import React, { useEffect, useRef } from 'react';
import './TopBanner.css';

const TopBanner = () => {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    const content = contentRef.current;
    
    // Clone the content to create seamless loop
    const clone = content.cloneNode(true);
    scrollContainer.appendChild(clone);

    const animate = () => {
      if (scrollContainer.scrollLeft >= content.offsetWidth) {
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft += 1;
      }
      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <div ref={scrollRef} className="banner-container">
      <div ref={contentRef} className="banner-content">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="banner-item">
            <h3>I3w Car Culture</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopBanner;