// src/utils/privacyCompliance.js
export const checkPrivacyConsent = () => {
  // Check for Do Not Track
  if (navigator.doNotTrack === '1') {
    return false;
  }

  // Check for cookie consent
  const consent = localStorage.getItem('analytics_consent');
  return consent === 'granted';
};

export const requestConsent = () => {
  return new Promise((resolve) => {
    // Show consent banner/modal
    const consentModal = document.createElement('div');
    consentModal.innerHTML = `
      <div class="consent-modal">
        <p>We use analytics to improve your experience. Accept cookies?</p>
        <button onclick="grantConsent()">Accept</button>
        <button onclick="denyConsent()">Decline</button>
      </div>
    `;
    
    window.grantConsent = () => {
      localStorage.setItem('analytics_consent', 'granted');
      document.body.removeChild(consentModal);
      resolve(true);
    };
    
    window.denyConsent = () => {
      localStorage.setItem('analytics_consent', 'denied');
      document.body.removeChild(consentModal);
      resolve(false);
    };
    
    document.body.appendChild(consentModal);
  });
};
