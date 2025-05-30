// src/components/pages/FeedbackPage/FeedbackPage.js
import React from 'react';
import FeedbackForm from '../../feedback/FeedbackForm.js';
import './FeedbackPage.css';

const FeedbackPage = () => {
  return (
    <div className="feedback-page">
      <div className="feedback-page-header">
        <h1>We Value Your Feedback</h1>
        <p>
          Your feedback helps us improve I3w Car Culture. Whether you have suggestions, 
          spotted an issue, or just want to share your experience, we'd love to hear from you.
        </p>
      </div>
      
      <div className="feedback-content">
        <FeedbackForm />
        
        <div className="other-contact-methods">
          <h3>Other Ways to Reach Us</h3>
          <div className="contact-methods">
            <div className="contact-method">
              <div className="method-icon">✉️</div>
              <div className="method-details">
                <h4>Email Us</h4>
                <p>For direct communication: <a href="mailto:contact@i3wcarculture.com">contact@i3wcarculture.com</a></p>
              </div>
            </div>
            
            <div className="contact-method">
              <div className="method-icon">📱</div>
              <div className="method-details">
                <h4>Social Media</h4>
                <p>Follow us and send messages on social media platforms.</p>
                <div className="social-links">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;