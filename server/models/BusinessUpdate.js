// server/models/BusinessUpdate.js
import mongoose from 'mongoose';

const businessUpdateSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    businessType: {
      type: String,
      enum: ['dealer', 'service'],
      required: true
    },
    title: { type: String, required: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['update', 'deal', 'announcement', 'event'],
      default: 'update'
    },
    pinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

businessUpdateSchema.index({ businessId: 1, businessType: 1, createdAt: -1 });

const BusinessUpdate = mongoose.model('BusinessUpdate', businessUpdateSchema);
export default BusinessUpdate;
