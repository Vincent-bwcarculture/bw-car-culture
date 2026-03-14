// components/GION/pages/GIONFeaturedPage.js
import { ArrowLeft } from 'lucide-react';
import './GIONPages.css';

const GIONFeaturedPage = ({ onBack }) => {
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Featured Services</h2>
        <div className="header-spacer"></div>
      </div>

      <div className="gion-page-content">
        <p className="no-data-message">No featured services available yet.</p>
      </div>
    </div>
  );
};

export default GIONFeaturedPage;
