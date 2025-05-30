// src/components/shared/Confirmation/Confirmation.js
import React, { useEffect, useRef } from 'react';
import './Confirmation.css';

const Confirmation = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  confirmButtonClass = '',
  cancelButtonClass = ''
}) => {
  const modalRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onCancel]);
  
  // Focus on cancel button when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cancelButton = modalRef.current.querySelector('.cancel-button');
      if (cancelButton) {
        cancelButton.focus();
      }
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal" ref={modalRef}>
        <div className="confirmation-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="confirmation-content">
          <p>{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className={`cancel-button ${cancelButtonClass}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-button ${confirmButtonClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
