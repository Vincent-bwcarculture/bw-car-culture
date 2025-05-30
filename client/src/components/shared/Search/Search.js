// Search.js
import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Sample search data - replace with actual API call
    const searchData = [
        {
            id: 1,
            title: "2023 BMW M4 Competition",
            price: 89900,
            image: "/images/f80.jpg",
            details: "503hp, Manual, 1,200 km"
        },
        {
            id: 2,
            title: "2024 Cadillac CT5-V Blackwing",
            price: 98000,
            image: "/images/ct5-v.jpg",
            details: "668hp, Manual, 500 km"
        }
    ];

    const handleSearch = (value) => {
        setQuery(value);
        if (value.length >= 2) {
            // Filter search results
            const filtered = searchData.filter(item =>
                item.title.toLowerCase().includes(value.toLowerCase())
            );
            setResults(filtered);
            setShowResults(true);
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
                {results.map(result => (
                    <div key={result.id} className="search-result-item">
                        <img 
                            src={result.image} 
                            alt={result.title} 
                            className="result-image"
                        />
                        <div className="result-info">
                            <div className="result-title">{result.title}</div>
                            <div className="result-details">{result.details}</div>
                        </div>
                        <div className="result-price">
                            ${result.price.toLocaleString()}
                        </div>
                    </div>
                ))}
                {results.length === 0 && query.length >= 2 && (
                    <div className="search-result-item">
                        <div className="result-info">
                            <div className="result-title">No results found</div>
                            <div className="result-details">
                                Try different keywords or browse categories
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;