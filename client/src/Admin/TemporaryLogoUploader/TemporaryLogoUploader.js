// client/src/Admin/TemporaryLogoUploader/TemporaryLogoUploader.js
import React, { useState } from 'react';
import './TemporaryLogoUploader.css';

const TemporaryLogoUploader = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (PNG, JPG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError('');
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const uploadLogo = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('images', file); // For multiple upload endpoint
      formData.append('folder', 'branding');

      console.log('Uploading logo to S3 via Vercel API...');
      
      // Try Vercel endpoints in order of most likely to work
      const endpoints = [
        '/api/dealer-image-upload',    // Specific dealer upload from api/index.js
        '/api/images/upload-multiple', // Multiple images endpoint
        '/api/images/upload',          // Single image endpoint  
        '/api/upload-images',          // Alternative multiple pattern
        '/api/upload',                 // Basic upload pattern
        '/api/image-upload',           // Alternative single pattern
        '/api/transport-routes',       // Transport routes that accept images
        '/api/listings',               // Listings endpoint that accepts images
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          
          // Prepare form data based on endpoint
          const endpointFormData = new FormData();
          
          if (endpoint.includes('multiple') || endpoint.includes('upload-images')) {
            endpointFormData.append('images', file);
          } else {
            endpointFormData.append('image', file);
          }
          endpointFormData.append('folder', 'branding');

          response = await fetch(endpoint, {
            method: 'POST',
            body: endpointFormData
          });

          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break; // Success, stop trying other endpoints
          } else {
            console.log(`❌ Failed with ${endpoint}: ${response.status} ${response.statusText}`);
            lastError = `${endpoint}: ${response.status} ${response.statusText}`;
          }
        } catch (endpointError) {
          console.log(`❌ Error with ${endpoint}:`, endpointError.message);
          lastError = `${endpoint}: ${endpointError.message}`;
          continue; // Try next endpoint
        }
      }

      // If all endpoints failed
      if (!response || !response.ok) {
        throw new Error(`All endpoints failed. Last error: ${lastError}`);
      }

      // Check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      // Handle different response formats from Vercel endpoints
      let logoUrl = null;
      let logoKey = null;
      let logoSize = null;

      if (data.success) {
        if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
          // Multiple upload format: { success: true, urls: [...] }
          logoUrl = data.urls[0];
          logoKey = `branding/${Date.now()}-logo`;
          logoSize = file.size;
        } else if (data.data) {
          // Single upload format: { success: true, data: {...} }
          const logoData = Array.isArray(data.data) ? data.data[0] : data.data;
          logoUrl = logoData.url || logoData.imageUrl;
          logoKey = logoData.key || logoData.s3Key;
          logoSize = logoData.size || file.size;
        } else if (data.imageUrl) {
          // Direct URL format: { success: true, imageUrl: "..." }
          logoUrl = data.imageUrl;
          logoKey = `branding/${Date.now()}-logo`;
          logoSize = file.size;
        }

        if (logoUrl) {
          setResult({
            success: true,
            url: logoUrl,
            key: logoKey,
            size: logoSize
          });
          console.log('✅ Logo uploaded successfully:', logoUrl);
        } else {
          throw new Error('No valid URL in response');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard!');
    });
  };

  const resetUploader = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
  };

  return (
    <div className="temp-logo-uploader">
      <div className="uploader-header">
        <h2>🚀 Upload Company Logo to S3</h2>
        <p className="uploader-description">
          Upload your BCC logo to AWS S3 using your live Vercel API endpoints. 
          This will automatically try multiple endpoints to find the working one.
        </p>
        {!isLoggedIn && (
          <div className="login-warning">
            ℹ️ <strong>Note:</strong> Using live Vercel API endpoints. No login required.
          </div>
        )}
      </div>

      {!result && (
        <>
          <div className="upload-section">
            <div 
              className="upload-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                id="logoFile"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />
              
              {!preview ? (
                <div className="dropzone-content">
                  <div className="upload-icon">📁</div>
                  <p>Drag & drop your logo here or</p>
                  <label htmlFor="logoFile" className="upload-button">
                    Choose File
                  </label>
                  <p className="file-hint">PNG, JPG, WebP • Max 5MB</p>
                </div>
              ) : (
                <div className="preview-section">
                  <img src={preview} alt="Logo preview" className="logo-preview" />
                  <div className="file-info">
                    <p><strong>{file.name}</strong></p>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={resetUploader} className="change-file-btn">
                      Change File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {file && !error && (
              <button 
                onClick={uploadLogo} 
                className="upload-btn"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading to S3...
                  </>
                ) : (
                  'Upload to S3'
                )}
              </button>
            )}
          </div>
        </>
      )}

      {result && result.success && (
        <div className="success-section">
          <div className="success-header">
            <h3>✅ Upload Successful!</h3>
            <p>Your logo has been uploaded to AWS S3</p>
          </div>

          <div className="result-details">
            <div className="uploaded-logo">
              <img src={result.url} alt="Uploaded logo" />
            </div>

            <div className="url-section">
              <label>S3 URL:</label>
              <div className="url-container">
                <input 
                  type="text" 
                  value={result.url} 
                  readOnly 
                  className="url-input"
                />
                <button 
                  onClick={() => copyToClipboard(result.url)}
                  className="copy-btn"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="file-details">
              <p><strong>S3 Key:</strong> {result.key}</p>
              <p><strong>Size:</strong> {(result.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="next-steps">
            <h4>📝 Next Steps:</h4>
            <p>Replace the local logo references in these files with the S3 URL above:</p>
            <ul>
              <li><code>client/src/Admin/AdminSidebar.js</code> (line ~7)</li>
              <li><code>client/src/components/SplashScreen.js</code> (line ~27)</li>
              <li><code>client/src/utils/newsHelpers.js</code> (lines 72, 85, 91)</li>
              <li><code>client/src/components/layout/Footer/CompactFooter.js</code> (line ~20)</li>
            </ul>
            <p>Replace <code>"/images/BCC Logo.png"</code> with the S3 URL above.</p>
          </div>

          <button onClick={resetUploader} className="upload-another-btn">
            Upload Another Logo
          </button>
        </div>
      )}
    </div>
  );
};

export default TemporaryLogoUploader;
