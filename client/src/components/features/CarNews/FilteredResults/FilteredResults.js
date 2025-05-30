import React, { useState, useEffect } from 'react';

const FilteredResults = ({ filters }) => {
  // Sample data - in production this would come from an API
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulate API call with filters
  useEffect(() => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      // Sample filtered data
      const filteredData = [
        {
          id: 1,
          image: '/images/Revuelto.jpg',
          title: 'Lamborghini Revuelto Review',
          author: {
            name: 'Car Culture News Desk',
            avatar: '/images/kvr.jpg'
          },
          date: '2025-01-08',
          category: 'reviews',
          brand: 'lamborghini',
          type: 'sports',
          description: 'The new Lamborghini Revuelto showcases groundbreaking performance...'
        },
        {
          id: 2,
          image: '/images/GTR35.jpg',
          title: '2024 Nissan GT-R Review',
          author: {
            name: 'Car Culture News Desk',
            avatar: '/images/kvr.jpg'
          },
          date: '2025-01-07',
          category: 'reviews',
          brand: 'nissan',
          type: 'sports',
          description: 'Nissan reveals the latest iteration of their legendary GT-R...'
        }
      ];

      // Apply filters
      const filtered = filteredData.filter(item => {
        if (filters.category !== 'all' && item.category !== filters.category) return false;
        if (filters.brand !== 'all' && item.brand !== filters.brand) return false;
        if (filters.type !== 'all' && item.type !== filters.type) return false;
        return true;
      });

      setResults(filtered);
      setLoading(false);
    }, 500);
  }, [filters]);

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <h3>No reviews match your filters</h3>
        <p>Try adjusting your filter criteria</p>
      </div>
    );
  }

  return (
    <div className="news-grid">
      {results.map(item => (
        <article key={item.id} className="news-card">
          <div className="news-card-image">
            <img src={item.image} alt={item.title} />
          </div>
          <div className="news-card-content">
            <div>
              <h3>{item.title}</h3>
              <p className="news-description">{item.description}</p>
            </div>
            <div className="news-meta">
              <div className="author-info">
                <div className="author-avatar">
                  <img src={item.author.avatar} alt={item.author.name} />
                </div>
                <span className="author-name">{item.author.name}</span>
              </div>
              <span className="news-date">
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default FilteredResults;