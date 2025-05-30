// src/components/features/ArticleDetail/ArticleDetail.js
import React, { useState } from 'react';
import { getNewsImageUrl } from '../../../utils/newsImageHelper';
import './ArticleDetail.css';

const ArticleDetail = ({ article }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  // Get the image URL using our helper function
  const getArticleImage = (imgPath) => {
    if (!imgPath) return '/images/placeholders/default.jpg';
    
    // Create a simple article object to use with our helper
    const simpleArticle = { image: imgPath };
    return getNewsImageUrl(simpleArticle);
  };

  return (
    <div className="article-detail">
      <div className="article-content">
        <div className="author-info">
          <img src="/images/kvr.jpg" alt="Author" className="author-image" />
          <div className="author-details">
            <h3>Vincent Katso</h3>
            <p>Car Enthusiast | Journalist</p>
          </div>
        </div>

        <h2>Lamborghini Revuelto breaks surface with a Hybrid V12 putting out a record breaking 1015Nm!</h2>
        
        <div className="article-image">
          <img 
            src={getArticleImage("/images/Revuelto.jpg")} 
            alt="Lamborghini Revuelto" 
            onError={(e) => {
              console.error('Failed to load image:', e.target.src);
              e.target.onerror = null;
              e.target.src = "/images/placeholders/default.jpg";
            }}
          />
        </div>

        <div className="article-text">
          <p>What a sight delight, the latest 2024 V12 Plug-In Hybrid Lamborghini Revuelto!</p>
          
          <p>Stepping up as the Lamborghini Aventador successor, this new Revuelto is such a masterpiece. It's 
          aerospace inspired design looks are alone mind blowing, but even more astonishing is the power figures it comes
          with.</p>
          
          <p>Packed with a 6.5-litre V12 Plug-In Hybrid, with three electric motors, the Revuelto is a 
          complete on-road spaceship with a whooping 1,001 HP (747 kW) driven to all four wheels through a much 
          more enhanced new eight-speed dual-clutch transmission.</p>

          <p>The Revuelto sprints from 0-100km/hr in just 2.5 seconds, and takes less than 7 seconds to reach 
          204km/hr (in comparison, it takes the Buggati Chiron 6.5 seconds to achieve the same benchmark) 
          with a top speed of 349 km/hr!</p>

          <div className={`expandable-content ${isExpanded ? 'expanded' : ''}`}>
            <p>Insane numbers, well complemented by the exterior and interior design. Exterior wise, Lamborghini seem 
            to have combined the best of their world, featuring very aggressive looks with plenty wild angles,
            Y-Shaped running lights, Diablo's floating blade on the rear fenders, Murcialago's inclined front, 
            large side intakes and even more peculiar, is the spherical radar sensors which give the Revuelto 
            such a technologically advanced look.</p>
            
            <p>The Y-Shape design re-occurs a lot more, and even more noticeable is also on the rear taillights,
            which are below the active and aerodynamically adjustable wing. Another peculiar feature is the brake 
            light, which also adds to that technologically advanced look the Revuelto comes with.</p>
            
            <p>Interior wise, it comes with a much more futuristic look, with three digital screens, a 12.3 inch for 
            the driver, 8.4 inch portrait screen in the middle with a floating design below the "alien's head" air 
            vents and a 9.1 inch landscape screen for the passenger that also displays some vital vehicle
            information, for the co-pilot one could say.</p>
          </div>

          <button className="read-more-btn" onClick={toggleReadMore}>
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;