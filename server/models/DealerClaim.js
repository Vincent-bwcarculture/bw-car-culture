// server/models/DealerClaim.js
import mongoose from 'mongoose';

const dealerClaimSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dealer',
      required: true
    },
    // Snapshot of dealer name at claim time (for display even if dealer is renamed)
    dealerName: { type: String, required: true },

    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    claimantEmail: { type: String },
    claimantName: { type: String },

    reason: { type: String, required: true },
    proofDescription: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: '' }
  },
  { timestamps: true }
);

// Index for fast lookups
dealerClaimSchema.index({ dealer: 1, claimant: 1, status: 1 });
dealerClaimSchema.index({ status: 1, createdAt: -1 });

const DealerClaim = mongoose.model('DealerClaim', dealerClaimSchema);
export default DealerClaim;
