// src/components/shared/Carousel/Carousel.js
import React, { useState } from 'react';
import './Carousel.css';

export const Carousel = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="carousel">
      <button className="carousel-button prev" onClick={prevSlide}>❮</button>
      <div className="carousel-content">
        {items[currentIndex]}
      </div>
      <button className="carousel-button next" onClick={nextSlide}>❯</button>
    </div>
  );
};