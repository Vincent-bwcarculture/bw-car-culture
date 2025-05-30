import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const categories = [
  {
    id: 'car-news',
    name: 'Car News',
    path: '/news',
    subcategories: [
      { id: 'reviews', name: 'Reviews', path: '/news/reviews' },
      { id: 'releases', name: 'New Releases', path: '/news/releases' },
      { id: 'industry', name: 'Industry News', path: '/news/industry' }
    ]
  },
  {
    id: 'marketplace',
    name: 'Car Sales',
    path: '/marketplace',
    subcategories: [
      { id: 'new', name: 'New Cars', path: '/marketplace/new' },
      { id: 'used', name: 'Used Cars', path: '/marketplace/used' },
      { id: 'deals', name: 'Special Deals', path: '/marketplace/deals' }
    ]
  },
  {
    id: 'parts',
    name: 'Parts Sales',
    path: '/parts',
    subcategories: [
      { id: 'performance', name: 'Performance', path: '/parts/performance' },
      { id: 'accessories', name: 'Accessories', path: '/parts/accessories' },
      { id: 'maintenance', name: 'Maintenance', path: '/parts/maintenance' }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    path: '/services',
    subcategories: [
      { id: 'maintenance', name: 'Maintenance', path: '/services/maintenance' },
      { id: 'repair', name: 'Repair', path: '/services/repair' },
      { id: 'modification', name: 'Modification', path: '/services/modification' }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    path: '/clothing'
  },
  {
    id: 'community',
    name: 'GION',
    path: '/community'
  }
];

const Breadcrumb = ({ paths }) => (
  <div className="breadcrumb-container">
    <ul className="breadcrumb-list">
      <li className="breadcrumb-item">
        <Link to="/">Home</Link>
      </li>
      {paths.map((path, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator">›</span>
          <li className="breadcrumb-item">
            <Link to={path.url}>{path.name}</Link>
          </li>
        </React.Fragment>
      ))}
    </ul>
  </div>
);

const CategoryNav = () => {
  const location = useLocation();
  const [activePath, setActivePath] = useState([]);
  const [touchActiveCategory, setTouchActiveCategory] = useState(null);

  useEffect(() => {
    // Generate breadcrumb paths based on current location
    const generatePaths = () => {
      const paths = location.pathname.split('/').filter(Boolean);
      const breadcrumbs = paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const category = categories.find(cat => cat.path === url) || 
                        categories.find(cat => 
                          cat.subcategories?.some(sub => sub.path === url)
                        );
        
        let name = path.charAt(0).toUpperCase() + path.slice(1);
        if (category) {
          name = category.name;
        }

        return { name, url };
      });

      setActivePath(breadcrumbs);
    };

    generatePaths();
  }, [location]);

  const handleTouchStart = (categoryId) => {
    if (touchActiveCategory === categoryId) {
      setTouchActiveCategory(null);
    } else {
      setTouchActiveCategory(categoryId);
    }
  };

  return (
    <nav className="navigation-container">
      <Breadcrumb paths={activePath} />
      
      <div className="category-nav">
        <ul className="category-list">
          {categories.map((category) => (
            <li 
              key={category.id}
              className={`category-item ${category.subcategories ? 'has-dropdown' : ''} 
                         ${touchActiveCategory === category.id ? 'touch-active' : ''}`}
              onTouchStart={() => handleTouchStart(category.id)}
            >
              <Link
                to={category.path}
                className={`category-link ${location.pathname.startsWith(category.path) ? 'active' : ''}`}
              >
                {category.name}
              </Link>

              {category.subcategories && (
                <div className="dropdown-content">
                  <ul className="dropdown-list">
                    {category.subcategories.map((sub) => (
                      <li key={sub.id} className="dropdown-item">
                        <Link
                          to={sub.path}
                          className={`dropdown-link ${location.pathname === sub.path ? 'active' : ''}`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;