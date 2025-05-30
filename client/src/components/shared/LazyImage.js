// src/components/shared/LazyImage/LazyImage.js
import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();
  const observerRef = useRef();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (imgRef.current) {
            imgRef.current.src = src;
            observerRef.current.unobserve(imgRef.current);
          }
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    if (imgRef.current) {
      // Use a local placeholder image instead of relying on API
      imgRef.current.src = '/images/placeholders/default.jpg';
    }
  };

  return (
    <img
      ref={imgRef}
      className={`lazy-image ${isLoaded ? 'loaded' : ''} ${error ? 'error' : ''} ${className || ''}`}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default LazyImage;