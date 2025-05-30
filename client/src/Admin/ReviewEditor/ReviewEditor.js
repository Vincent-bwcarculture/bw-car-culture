// ReviewEditor.js
import React, { useState, useEffect } from 'react';
import './ReviewEditor.css';

const ReviewEditor = ({ existingReview = null }) => {
  const [review, setReview] = useState({
    title: '',
    subtitle: '',
    author: '',
    publishDate: new Date().toISOString().split('T')[0],
    category: '',
    tags: [],
    featuredImage: null,
    gallery: [],
    specifications: {
      make: '',
      model: '',
      year: '',
      engine: '',
      power: '',
      torque: '',
      transmission: '',
      drivetrain: '',
      acceleration: '',
      topSpeed: '',
      fuelEconomy: ''
    },
    content: {
      introduction: '',
      exterior: '',
      interior: '',
      performance: '',
      handling: '',
      comfort: '',
      technology: '',
      safety: '',
      value: '',
      verdict: ''
    },
    ratings: {
      exterior: 0,
      interior: 0,
      performance: 0,
      comfort: 0,
      technology: 0,
      value: 0,
      overall: 0
    },
    status: 'draft', // draft, published, archived
    metaDescription: '',
    metaKeywords: ''
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if (existingReview) {
      setReview(existingReview);
    }
  }, [existingReview]);

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleSpecificationChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
    setIsDirty(true);
  };

  const handleContentChange = (section, value) => {
    setReview(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: value
      }
    }));
    setIsDirty(true);
  };

  const handleRatingChange = (category, value) => {
    setReview(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value
      }
    }));
    setIsDirty(true);
  };

  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    // Image upload logic would go here
    // For now, we'll just create object URLs
    const imageUrls = files.map(file => URL.createObjectURL(file));
    
    if (type === 'featured') {
      setReview(prev => ({
        ...prev,
        featuredImage: imageUrls[0]
      }));
    } else {
      setReview(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...imageUrls]
      }));
    }
    setIsDirty(true);
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setReview(prev => ({
      ...prev,
      tags
    }));
    setIsDirty(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!review.title) newErrors.title = 'Title is required';
    if (!review.content.introduction) newErrors.introduction = 'Introduction is required';
    if (!review.specifications.make) newErrors.make = 'Make is required';
    if (!review.specifications.model) newErrors.model = 'Model is required';
    if (!review.specifications.year) newErrors.year = 'Year is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status = review.status) => {
    if (!validateForm()) {
      return;
    }

    const reviewData = {
      ...review,
      status,
      lastModified: new Date().toISOString()
    };

    try {
      // API call would go here
      console.log('Saving review:', reviewData);
      setIsDirty(false);
      // Show success message
    } catch (error) {
      console.error('Error saving review:', error);
      // Show error message
    }
  };

  const handlePublish = async () => {
    await handleSave('published');
  };

  return (
    <div className="review-editor">
      <div className="editor-header">
        <h2>{existingReview ? 'Edit Review' : 'New Review'}</h2>
        <div className="header-actions">
          <button 
            className="preview-button"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button 
            className="save-draft-button"
            onClick={() => handleSave('draft')}
            disabled={!isDirty}
          >
            Save Draft
          </button>
          <button 
            className="publish-button"
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      </div>

      {!previewMode ? (
        <div className="editor-content">
          <div className="editor-sidebar">
            <div 
              className={`sidebar-item ${activeSection === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveSection('basic')}
            >
              Basic Information
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveSection('specs')}
            >
              Specifications
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'content' ? 'active' : ''}`}
              onClick={() => setActiveSection('content')}
            >
              Review Content
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveSection('ratings')}
            >
              Ratings
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'media' ? 'active' : ''}`}
              onClick={() => setActiveSection('media')}
            >
              Media
            </div>
            <div 
              className={`sidebar-item ${activeSection === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveSection('seo')}
            >
              SEO
            </div>
          </div>

          <div className="editor-main">
            {/* Basic Information Section */}
            {activeSection === 'basic' && (
              <div className="editor-section">
                <h3>Basic Information</h3>
                {/* Basic info form fields */}
              </div>
            )}

            {/* Specifications Section */}
            {activeSection === 'specs' && (
              <div className="editor-section">
                <h3>Vehicle Specifications</h3>
                {/* Specs form fields */}
              </div>
            )}

            {/* Content Section */}
            {activeSection === 'content' && (
              <div className="editor-section">
                <h3>Review Content</h3>
                {/* Rich text editors for each content section */}
              </div>
            )}

            {/* Ratings Section */}
            {activeSection === 'ratings' && (
              <div className="editor-section">
                <h3>Ratings</h3>
                {/* Rating inputs */}
              </div>
            )}

            {/* Media Section */}
            {activeSection === 'media' && (
              <div className="editor-section">
                <h3>Media Gallery</h3>
                {/* Image upload and management */}
              </div>
            )}

            {/* SEO Section */}
            {activeSection === 'seo' && (
              <div className="editor-section">
                <h3>SEO Settings</h3>
                {/* SEO form fields */}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="review-preview">
          {/* Preview rendering of the review */}
        </div>
      )}
    </div>
  );
};

export default ReviewEditor;