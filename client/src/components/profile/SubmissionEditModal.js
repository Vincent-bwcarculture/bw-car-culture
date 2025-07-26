// Create this new component: client/src/components/profile/SubmissionEditModal.js

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, Save, Clock, CheckCircle } from 'lucide-react';
import UserCarListingForm from './UserCarListingForm.js';
import './SubmissionEditModal.css';

const SubmissionEditModal = ({ 
  submission, 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}) => {
  const [editNote, setEditNote] = useState('');
  const [showEditNote, setShowEditNote] = useState(false);

  useEffect(() => {
    if (submission) {
      // Show edit note for live listings or approved listings
      setShowEditNote(['listing_created', 'approved'].includes(submission.status));
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const handleSubmit = async (updatedListingData) => {
    const editData = {
      listingData: updatedListingData,
      editNote: editNote || 'Submission updated'
    };
    
    await onSave(editData);
  };

  const getEditWarning = () => {
    switch (submission.status) {
      case 'listing_created':
        return {
          type: 'warning',
          icon: AlertCircle,
          title: 'Editing Live Listing',
          message: 'This listing is currently live. Editing will require admin review before changes go live.'
        };
      case 'approved':
        return {
          type: 'warning',
          icon: Clock,
          title: 'Editing Approved Listing',
          message: 'This listing was approved. Editing will require new admin review.'
        };
      case 'rejected':
        return {
          type: 'info',
          icon: Info,
          title: 'Editing Rejected Listing',
          message: 'Make the necessary changes and resubmit for review.'
        };
      case 'pending_review':
        return {
          type: 'info',
          icon: Clock,
          title: 'Editing Pending Listing',
          message: 'You can edit this submission freely while it\'s pending review.'
        };
      default:
        return null;
    }
  };

  const warning = getEditWarning();

  return (
    <div className="sem-modal-overlay">
      <div className="sem-modal">
        <div className="sem-modal-header">
          <div className="sem-header-content">
            <h2>Edit Submission</h2>
            <p className="sem-submission-title">{submission.listingData?.title}</p>
          </div>
          <button 
            className="sem-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Edit Warning */}
        {warning && (
          <div className={`sem-warning sem-warning-${warning.type}`}>
            <warning.icon size={20} />
            <div className="sem-warning-content">
              <h4>{warning.title}</h4>
              <p>{warning.message}</p>
            </div>
          </div>
        )}

        {/* Edit Note Section */}
        {showEditNote && (
          <div className="sem-edit-note-section">
            <label htmlFor="editNote">Edit Note (Optional)</label>
            <textarea
              id="editNote"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Briefly describe what you're changing..."
              rows="2"
              className="sem-edit-note-input"
            />
          </div>
        )}

        <div className="sem-modal-content">
          <UserCarListingForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            initialData={submission.listingData}
            isEditing={true}
            selectedPlan={submission.listingData?.selectedPlan}
            selectedAddons={submission.listingData?.selectedAddons}
            editMode={true}
            submitButtonText={loading ? 'Saving Changes...' : 'Save Changes'}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditModal;
