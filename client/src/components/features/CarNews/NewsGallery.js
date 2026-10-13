import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize, Camera } from 'lucide-react';
import { getGalleryImageUrls, handleNewsImageError } from '../../../utils/newsHelpers.js';
import './NewsGallery.css';

const NewsGallery = ({ images = [], onClose, startIndex = 0 }) => {
  const processedImages = useMemo(() => getGalleryImageUrls({ gallery: images }), [images]);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [fullscreen, setFullscreen] = useState(false);
  const ref = useRef(null), closeRef = useRef(null);
  const index = Math.max(0, Math.min(currentIndex, processedImages.length - 1));
  const previous = () => setCurrentIndex(value => (value - 1 + processedImages.length) % processedImages.length);
  const next = () => setCurrentIndex(value => (value + 1) % processedImages.length);
  useEffect(() => { setCurrentIndex(Math.max(0, Math.min(startIndex, processedImages.length - 1))); }, [startIndex, processedImages.length]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setCurrentIndex(value => (value - 1 + processedImages.length) % processedImages.length); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setCurrentIndex(value => (value + 1) % processedImages.length); }
      if (event.key === 'Tab') {
        const buttons = [...(ref.current?.querySelectorAll('button:not(:disabled)') || [])];
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [onClose, processedImages.length]);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await ref.current?.requestFullscreen?.();
    } catch { /* The gallery remains usable if fullscreen is unavailable. */ }
  };
  if (!processedImages.length) return null;
  return (
    <div className="news-gallery-container" ref={ref} role="dialog" aria-modal="true" aria-label="Article photo gallery">
      <div className="news-gallery-header">
        <div className="news-gallery-title"><Camera size={18} /><span>Gallery {index + 1} / {processedImages.length}</span></div>
        <div className="news-gallery-actions">
          <button type="button" className="news-gallery-fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}><Maximize size={20} /></button>
          <button type="button" ref={closeRef} className="news-gallery-close" onClick={onClose} aria-label="Close gallery"><X size={20} /></button>
        </div>
      </div>
      <div className="news-gallery-main">
        <button type="button" className="news-gallery-nav prev" onClick={previous} aria-label="Previous image" disabled={processedImages.length <= 1}><ChevronLeft size={24} /></button>
        <div className="news-gallery-image-container"><img key={processedImages[index]} src={processedImages[index]} alt={`Gallery image ${index + 1}`} className="news-gallery-image" onError={handleNewsImageError} /></div>
        <button type="button" className="news-gallery-nav next" onClick={next} aria-label="Next image" disabled={processedImages.length <= 1}><ChevronRight size={24} /></button>
      </div>
      {processedImages.length > 1 && <div className="news-gallery-thumbnails">
        {processedImages.map((image, itemIndex) => <button type="button" key={image} className={`gallery-thumbnail ${itemIndex === index ? 'active' : ''}`} aria-label={`View photo ${itemIndex + 1}`} aria-pressed={itemIndex === index} onClick={() => setCurrentIndex(itemIndex)}>
          <img src={image} alt={`Thumbnail ${itemIndex + 1}`} loading="lazy" onError={handleNewsImageError} />
        </button>)}
      </div>}
    </div>
  );
};
export default NewsGallery;
