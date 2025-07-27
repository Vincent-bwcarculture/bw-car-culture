import React, { useState } from 'react';
import { 
  AlertCircle, Info, Phone, Building, Smartphone, 
  MessageSquare, Upload, X, Check, Copy, ExternalLink,
  CreditCard, FileText, CheckCircle, Camera, Send
} from 'lucide-react';
import axios from '../../../config/axios.js';
import './ManualPaymentModal.css';

const ManualPaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentInfo,
  onPaymentProofSubmitted 
}) => {
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState({});

  if (!isOpen) return null;

  // Updated payment details with .com domain
  const paymentDetails = {
    fnbPaytocell: '+267 72 573 475',
    fnbAccount: '62918382300',
    orangeMoney: '+267 72 573 475',
    whatsapp: '+26774122453'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload only JPEG, PNG, or PDF files');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setProofOfPayment(file);
      setError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setProofPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess({ ...copySuccess, [field]: true });
      setTimeout(() => {
        setCopySuccess({ ...copySuccess, [field]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Updated to use your existing S3 upload system
  const handleSubmitProof = async () => {
    if (!proofOfPayment) {
      setError('Please upload proof of payment');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setUploadProgress(0);

      // Step 1: Upload file to S3 using your existing endpoint
      const formData = new FormData();
      formData.append('images', proofOfPayment); // Use 'images' as per your existing endpoint
      formData.append('folder', 'payment-proofs'); // Organize in specific folder

      console.log('Uploading proof to S3...');
      setUploadProgress(30);

      // Use your existing multiple upload endpoint
      const uploadResponse = await axios.post('/images/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 70) / progressEvent.total) + 30;
          setUploadProgress(progress);
        }
      });

      if (!uploadResponse.data.success || !uploadResponse.data.urls || uploadResponse.data.urls.length === 0) {
        throw new Error('Failed to upload proof of payment to S3');
      }

      const uploadedFileUrl = uploadResponse.data.urls[0];
      console.log('File uploaded to S3:', uploadedFileUrl);
      setUploadProgress(80);

      // Step 2: Submit payment proof record to database
      const proofData = {
        listingId: paymentInfo.listingId,
        subscriptionTier: paymentInfo.subscriptionTier,
        amount: paymentInfo.amount,
        paymentType: 'manual',
        proofFile: {
          url: uploadedFileUrl,
          filename: proofOfPayment.name,
          size: proofOfPayment.size,
          mimetype: proofOfPayment.type,
          uploadedAt: new Date().toISOString()
        }
      };

      const response = await axios.post('/api/payments/submit-proof', proofData);
      setUploadProgress(100);

      if (response.data.success) {
        setSubmitted(true);
        if (onPaymentProofSubmitted) {
          onPaymentProofSubmitted({
            ...response.data.data,
            fileUrl: uploadedFileUrl
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to submit proof');
      }

    } catch (error) {
      console.error('Error submitting proof:', error);
      setUploadProgress(0);
      
      if (error.response?.status === 413) {
        setError('File too large. Maximum size is 5MB.');
      } else if (error.response?.status === 415) {
        setError('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
      } else {
        setError(error.response?.data?.message || 'Failed to submit proof of payment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    const message = `Hi, I have made a payment for my car listing on BW Car Culture.\n\nListing Details:\n- Amount: P${paymentInfo.amount}\n- Tier: ${paymentInfo.subscriptionTier}\n- Transaction Ref: ${paymentInfo.transactionRef || 'N/A'}\n\nPlease find attached proof of payment.`;
    return `https://wa.me/${paymentDetails.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
  };

  // Updated success state with correct domain
  if (submitted) {
    return (
      <div className="manual-payment-modal-overlay">
        <div className="manual-payment-modal-content">
          <div className="manual-payment-modal-header">
            <div className="manual-payment-success-icon">
              <Check size={24} />
            </div>
            <h2>Proof of Payment Submitted</h2>
            <button 
              className="manual-payment-modal-close"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="manual-payment-modal-body">
            <div className="manual-payment-success-message">
              <CheckCircle size={48} className="success-icon" />
              <h3>Thank you!</h3>
              <p>Your proof of payment has been uploaded to our secure servers and submitted successfully. Our admin team will review and approve your payment within 24 hours.</p>
              
              <div className="manual-payment-next-steps">
                <h4>What happens next?</h4>
                <ul>
                  <li>Admin team reviews your proof of payment</li>
                  <li>Payment is verified and approved</li>
                  <li>Your listing is activated automatically</li>
                  <li>You'll receive a confirmation notification</li>
                </ul>
              </div>

              <div className="manual-payment-contact-info">
                <p>Questions? Contact us on WhatsApp: 
                  <a 
                    href={`https://wa.me/${paymentDetails.whatsapp.replace(/\s+/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="whatsapp-link"
                  >
                    {paymentDetails.whatsapp}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="manual-payment-modal-actions">
            <button 
              className="manual-payment-close-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-payment-modal-overlay">
      <div className="manual-payment-modal-content">
        <div className="manual-payment-modal-header">
          <div className="manual-payment-header-info">
            <AlertCircle size={24} className="development-icon" />
            <div>
              <h2>Payment Required</h2>
              <p>Secure payment gateway integration still under development</p>
            </div>
          </div>
          <button 
            className="manual-payment-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="manual-payment-modal-body">
          {/* Payment Summary */}
          <div className="manual-payment-summary">
            <h3>Payment Summary</h3>
            <div className="payment-details">
              <div className="payment-detail-row">
                <span>Subscription Tier:</span>
                <span className="tier-badge">{paymentInfo.subscriptionTier?.toUpperCase()}</span>
              </div>
              <div className="payment-detail-row">
                <span>Amount:</span>
                <span className="amount">P{paymentInfo.amount}</span>
              </div>
              <div className="payment-detail-row">
                <span>Duration:</span>
                <span>{paymentInfo.duration || 30} Days</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions - Same as before */}
          <div className="manual-payment-instructions">
            <h3>Use below means for payment:</h3>
            
            {/* FNB Paytocell */}
            <div className="payment-method">
              <div className="payment-method-header">
                <Phone size={20} />
                <h4>FNB Paytocell</h4>
              </div>
              <div className="payment-method-details">
                <div className="payment-detail">
                  <span>Number:</span>
                  <div className="copyable-field">
                    <span className="value">{paymentDetails.fnbPaytocell}</span>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.fnbPaytocell, 'paytocell')}
                      className="copy-btn"
                    >
                      {copySuccess.paytocell ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* FNB Account */}
            <div className="payment-method">
              <div className="payment-method-header">
                <Building size={20} />
                <h4>FNB Bank Account</h4>
              </div>
              <div className="payment-method-details">
                <div className="payment-detail">
                  <span>Account Number:</span>
                  <div className="copyable-field">
                    <span className="value">{paymentDetails.fnbAccount}</span>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.fnbAccount, 'account')}
                      className="copy-btn"
                    >
                      {copySuccess.account ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orange Money */}
            <div className="payment-method">
              <div className="payment-method-header">
                <Smartphone size={20} />
                <h4>Orange Money</h4>
              </div>
              <div className="payment-method-details">
                <div className="payment-detail">
                  <span>Number:</span>
                  <div className="copyable-field">
                    <span className="value">{paymentDetails.orangeMoney}</span>
                    <button 
                      onClick={() => copyToClipboard(paymentDetails.orangeMoney, 'orange')}
                      className="copy-btn"
                    >
                      {copySuccess.orange ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Proof Section */}
          <div className="manual-payment-proof-section">
            <h3>Submit Proof of Payment</h3>
            <p>After making payment, upload your proof below. Files are securely stored on AWS S3.</p>

            {/* Upload Method */}
            <div className="proof-upload-section">
              <h4>Upload Proof of Payment</h4>
              <div className="file-upload-area">
                <input 
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="proof-upload"
                  disabled={submitting}
                />
                <label htmlFor="proof-upload" className="file-upload-label">
                  <Upload size={24} />
                  <span>Choose proof of payment file</span>
                  <small>JPEG, PNG, or PDF (max 5MB) - Secure S3 upload</small>
                </label>
              </div>

              {proofOfPayment && (
                <div className="file-preview">
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{proofOfPayment.name}</span>
                    <button 
                      onClick={() => {
                        setProofOfPayment(null);
                        setProofPreview(null);
                      }}
                      className="remove-file-btn"
                      disabled={submitting}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {proofPreview && (
                    <div className="image-preview">
                      <img src={proofPreview} alt="Proof preview" />
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress Bar */}
              {submitting && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {uploadProgress < 30 ? 'Preparing upload...' :
                     uploadProgress < 80 ? 'Uploading to secure servers...' :
                     uploadProgress < 100 ? 'Finalizing submission...' :
                     'Upload complete!'}
                  </span>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            {/* WhatsApp Method */}
            <div className="whatsapp-submission">
              <h4>Alternative: WhatsApp Submission</h4>
              <p>You can also send your proof of payment via WhatsApp:</p>
              <a 
                href={getWhatsAppLink()}
                target="_blank" 
                rel="noopener noreferrer"
                className="whatsapp-btn"
              >
                <MessageSquare size={20} />
                Send via WhatsApp ({paymentDetails.whatsapp})
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Important Note */}
          <div className="manual-payment-note">
            <Info size={20} />
            <div>
              <h4>Important Note</h4>
              <p>Your proof of payment is securely uploaded to our AWS S3 servers. Your listing will be activated once our admin team confirms your payment (usually within 24 hours).</p>
            </div>
          </div>
        </div>

        <div className="manual-payment-modal-actions">
          <button 
            className="manual-payment-cancel-btn"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          {proofOfPayment && (
            <button 
              className="manual-payment-submit-btn"
              onClick={handleSubmitProof}
              disabled={submitting}
            >
              {submitting ? `Uploading... ${uploadProgress}%` : 'Submit Proof'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentModal;
