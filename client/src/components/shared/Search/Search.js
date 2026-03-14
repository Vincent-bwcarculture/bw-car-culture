// Search.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { listingService } from '../../../services/listingService.js';
import './Search.css';

const Search = () => {
    const [query, setQuery]           = useState('');
    const [results, setResults]       = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching]   = useState(false);
    const searchRef  = useRef(null);
    const debounceRef = useRef(null);

    const fetchResults = useCallback(async (value) => {
        setSearching(true);
        try {
            const res = await listingService.getListings({ search: value }, 1, 5);
            setResults(res?.listings || []);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearch = (value) => {
        setQuery(value);
        clearTimeout(debounceRef.current);

        if (value.length >= 2) {
            setShowResults(true);
            debounceRef.current = setTimeout(() => fetchResults(value), 300);
        } else {
            setResults([]);
            setShowResults(false);
        }
    };

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="search-container" ref={searchRef}>
            <div className="search-input-wrapper">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search cars, parts, or services..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                />
                <SearchIcon className="search-icon" size={18} />
            </div>

            <div className={`search-results ${showResults ? 'active' : ''}`}>
                {searching ? (
                    <div className="search-result-item">
                        <div className="result-info">
                            <div className="result-title">Searching...</div>
                        </div>
                    </div>
                ) : results.length > 0 ? (
                    results.map(result => {
                        const image = result.images?.[0]?.url || result.images?.[0] || null;
                        const make  = result.specifications?.make || result.make || '';
                        const model = result.specifications?.model || result.model || '';
                        const year  = result.specifications?.year || result.year || '';
                        const title = result.title || `${year} ${make} ${model}`.trim();
                        const price = result.price
                            ? `P${result.price.toLocaleString()}`
                            : null;

                        return (
                            <div key={result._id} className="search-result-item">
                                {image && (
                                    <img src={image} alt={title} className="result-image" />
                                )}
                                <div className="result-info">
                                    <div className="result-title">{title}</div>
                                    {result.specifications?.mileage && (
                                        <div className="result-details">
                                            {result.specifications.mileage.toLocaleString()} km
                                        </div>
                                    )}
                                </div>
                                {price && <div className="result-price">{price}</div>}
                            </div>
                        );
                    })
                ) : query.length >= 2 ? (
                    <div className="search-result-item">
                        <div className="result-info">
                            <div className="result-title">No results found</div>
                            <div className="result-details">
                                Try different keywords or browse categories
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Search;
