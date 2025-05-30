// src/utils/imagePathDiagnostics.js
// Fixed version - only run if explicitly enabled

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_IMAGE_DIAGNOSTICS === 'true') {
  const runImagePathDiagnostics = () => {
    console.log('%c📷 Running Image Path Diagnostics', 'background: #222; color: #bada55; padding: 2px 5px; border-radius: 3px;');
    
    // Check for common placeholder paths
    const checkImagePaths = [
      '/images/placeholders/car.jpg',
      '/images/placeholders/default.jpg',
      '/images/default-placeholder.png',
      '/images/placeholders/dealer-avatar.jpg'
    ];
    
    checkImagePaths.forEach(imagePath => {
      const img = new Image();
      img.onload = () => {
        console.log(`%c✅ Image path exists: ${imagePath}`, 'color: green');
      };
      img.onerror = () => {
        console.log(`%c❌ Image path missing: ${imagePath}`, 'color: red; font-weight: bold');
      };
      img.src = imagePath;
    });
  };

  // Run diagnostics on page load
  if (document.readyState === 'complete') {
    runImagePathDiagnostics();
  } else {
    window.addEventListener('load', runImagePathDiagnostics);
  }
}

// Export an empty object to avoid import errors
export default {};