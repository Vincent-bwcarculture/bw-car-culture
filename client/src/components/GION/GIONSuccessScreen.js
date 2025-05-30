// components/GION/GIONSuccessScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { Check, Award, Share2, BarChart2 } from 'lucide-react';
import './GIONSuccessScreen.css';

// Impact Visualization Component
const ImpactVisualization = ({ category }) => {
  let impactMessage = '';
  
  switch(category) {
    case 'taxi':
    case 'transport':
      impactMessage = `Your review helps improve taxi service quality and safety standards. The Ministry of Transport uses this data to monitor service providers.`;
      break;
    case 'bus':
      impactMessage = `Your feedback helps bus operators improve their service quality. Transit authorities monitor this data to enhance public transportation.`;
      break;
    case 'train':
      impactMessage = `Your review contributes to better train services. Rail authorities use this feedback to identify areas for improvement.`;
      break;
    case 'dealership':
      impactMessage = `Your feedback helps dealerships improve their customer service. Regulatory bodies use this data to ensure compliance.`;
      break;
    default:
      impactMessage = `Your review helps improve transportation services in your community. Thank you for making a difference!`;
  }
  
  return (
    <div className="impact-visualization">
      <div className="impact-icon">
        <BarChart2 size={24} />
      </div>
      <div className="impact-message">
        <p>{impactMessage}</p>
      </div>
      <div className="ministry-badge">
        <span className="ministry-icon">🏛️</span>
        <span className="ministry-text">Ministry of Transport Reporting Program</span>
      </div>
    </div>
  );
};

const GIONSuccessScreen = ({ points = 50, totalPoints = 0, onDismiss, autoDismissTime = 5000, category = 'transport' }) => {
  const [countdown, setCountdown] = useState(Math.floor(autoDismissTime / 1000));
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiRef = useRef(null);
  const fallingStarsRef = useRef(null);
  
  // Create confetti pieces
  useEffect(() => {
    if (!confettiRef.current) return;
    
    const colors = ['#ffd700', '#ffffff', '#5f5fc4', '#ff3300'];
    const confettiPieces = 50;
    
    // Clear previous confetti
    confettiRef.current.innerHTML = '';
    
    // Create confetti pieces
    for (let i = 0; i < confettiPieces; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      
      // Randomize style and animation
      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100 + '%';
      const animationDelay = Math.random() * 2 + 's';
      const animationDuration = Math.random() * 2 + 3 + 's';
      
      // Apply styles
      piece.style.width = `${size}px`;
      piece.style.height = `${size}px`;
      piece.style.backgroundColor = color;
      piece.style.left = left;
      piece.style.animationDelay = animationDelay;
      piece.style.animationDuration = animationDuration;
      piece.style.opacity = Math.random() * 0.7 + 0.3;
      
      // Make some pieces shaped differently
      if (Math.random() > 0.6) {
        piece.style.borderRadius = '0';
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      } else if (Math.random() > 0.3) {
        piece.style.borderRadius = '50%';
      } else {
        piece.style.borderRadius = `${Math.random() * 10 + 5}px`;
      }
      
      confettiRef.current.appendChild(piece);
    }
  }, []);
  
  // Create falling stars
  useEffect(() => {
    if (!fallingStarsRef.current) return;
    
    // Clear previous stars
    fallingStarsRef.current.innerHTML = '';
    
    // Create falling stars
    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'falling-star';
      
      // Randomize position and animation
      const left = Math.random() * 100 + '%';
      const animationDuration = Math.random() * 3 + 2 + 's';
      const animationDelay = Math.random() * 5 + 's';
      const size = Math.random() * 2 + 1;
      
      // Apply styles
      star.style.left = left;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.animation = `falling ${animationDuration} linear ${animationDelay} infinite`;
      
      fallingStarsRef.current.appendChild(star);
    };
    
    // Create 20 stars
    for (let i = 0; i < 20; i++) {
      createStar();
    }
  }, []);
  
  // Auto-dismiss countdown
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissTime);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onDismiss, autoDismissTime]);
  
  // Show confetti for first 3 seconds
  useEffect(() => {
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    return () => clearTimeout(confettiTimer);
  }, []);
  
  // Handle social sharing
  const handleShare = () => {
    // In a real app, this would open a sharing dialog
    if (navigator.share) {
      navigator.share({
        title: 'I just reviewed a service on GION!',
        text: 'I just earned points for reviewing a service on GION, helping improve transportation quality in our community!',
        url: 'https://gion.app',
      })
      .catch(error => console.log('Error sharing', error));
    } else {
      window.open('https://gion.app/share', '_blank');
    }
  };
  
  return (
    <div className="gion-success-screen">
      {/* Background animations */}
      <div className="success-bg-animation"></div>
      <div className="confetti" ref={confettiRef}></div>
      <div className="falling-stars" ref={fallingStarsRef}></div>
      
      <div className="success-icon">
        <Check size={48} color="#fff" strokeWidth={3} />
      </div>
      
      <h3>Thank You!</h3>
      <p>Your feedback helps improve transportation services in your community.</p>
      
      <div className="points-earned">
        <Award size={28} />
        <span className="points-value">+{points}</span>
        <span className="points-label">POINTS EARNED</span>
      </div>
      
      <div className="total-points">
        Total points: <span className="total-value">{totalPoints}</span>
      </div>
      
      {/* Impact Visualization */}
      <ImpactVisualization category={category} />
      
      <button className="share-button" onClick={handleShare}>
        <Share2 size={18} />
        <span>Share Achievement</span>
      </button>
      
      <div className="gion-logo">GION</div>
      
      <div className="dismiss-timer">
        Closing in {countdown}s...
      </div>
      
      <button className="dismiss-button" onClick={onDismiss}>
        Continue
      </button>
      
      <div className="powered-by">Powered by Bw Car Culture</div>
    </div>
  );
};

export default GIONSuccessScreen;