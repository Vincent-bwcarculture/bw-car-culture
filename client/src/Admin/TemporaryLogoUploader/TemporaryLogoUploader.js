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
      formData.append('images', file); // Use 'images' field like your working uploads
      formData.append('folder', 'branding');

      console.log('Uploading logo using working listings pattern...');
      
      // Use the exact same endpoint that works for listings
      const response = await fetch('/images/upload-multiple', {
        method: 'POST',
        body: formData
        // Don't set Content-Type, let browser handle FormData boundary
      });

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

      // Handle response format exactly like working listings uploads
      if (data.success && data.images && Array.isArray(data.images) && data.images.length > 0) {
        const logoData = data.images[0]; // Get first image from array
        setResult({
          success: true,
          url: logoData.url,
          key: logoData.key,
          size: logoData.size
        });
        console.log('✅ Logo uploaded successfully:', logoData.url);
      } else {
        console.error('API returned success but no images array:', data);
        throw new Error(data.message || 'API returned invalid response format');
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
          Upload your BCC logo to AWS S3 using the same endpoint pattern as your working listings uploads.
          This uses the proven `/images/upload-multiple` endpoint.
        </p>
        {!isLoggedIn && (
          <div className="login-warning">
            ✅ <strong>Using proven working pattern</strong> from your listings uploads - no authentication required.
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
