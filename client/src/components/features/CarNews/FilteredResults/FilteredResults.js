import { useState, useEffect } from 'react';
import { newsService } from '../../../../services/newsService.js';

const FilteredResults = ({ filters }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit: 12 };
        if (filters?.category && filters.category !== 'all') params.category = filters.category;
        if (filters?.brand   && filters.brand   !== 'all') params.brand   = filters.brand;
        if (filters?.type    && filters.type    !== 'all') params.type    = filters.type;

        const res = await newsService.getArticles(params);
        if (!cancelled) setResults(res.articles || []);
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResults();
    return () => { cancelled = true; };
  }, [filters?.category, filters?.brand, filters?.type]);

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-results">
        <h3>Could not load articles</h3>
        <p>Please check your connection and try again.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <h3>No articles match your filters</h3>
        <p>Try adjusting your filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="news-grid">
      {results.map(item => (
        <article key={item._id} className="news-card">
          <div className="news-card-image">
            <img src={item.featuredImage?.url || item.featuredImage} alt={item.title} />
          </div>
          <div className="news-card-content">
            <div>
              <h3>{item.title}</h3>
              <p className="news-description">{item.summary || item.excerpt}</p>
            </div>
            <div className="news-meta">
              <div className="author-info">
                <span className="author-name">
                  {typeof item.author === 'object'
                    ? (item.author?.name || item.author?.username)
                    : item.author}
                </span>
              </div>
              <span className="news-date">
                {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
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
