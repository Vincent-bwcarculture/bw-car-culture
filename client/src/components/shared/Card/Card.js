// src/components/shared/Card/Card.js
import React from 'react';
import './Card.css';

export const Card = ({ image, title, description, date, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-image">
        <img src={image} alt={title} />
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        {date && <p className="card-date">{date}</p>}
      </div>
    </div>
  );
};

export default 'Card';