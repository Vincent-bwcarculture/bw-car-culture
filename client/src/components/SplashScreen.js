import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinished }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash screen for 3 seconds before fading out
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // Once fade out animation is complete, call onFinished
    const completeTimer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 3500); // 3000ms display + 500ms for fade out animation

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onFinished]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <img 
          src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" 
          alt="BCC Logo" 
          className="splash-logo"
        />
      </div>
      <div className="copyright-text">
        © {new Date().getFullYear()} Bw Car Culture. All rights reserved.
      </div>
    </div>
  );
};

export default SplashScreen;