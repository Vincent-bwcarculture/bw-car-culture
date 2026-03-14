// server/models/MarketPrice.js
import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
      maxlength: 100
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
      maxlength: 100
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1900,
      max: new Date().getFullYear() + 2
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['new', 'used', 'certified'],
      default: 'used'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    mileage: {
      type: Number,
      min: 0,
      default: null
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    recordedDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    source: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // When auto-synced from a listing, this tracks the source listing
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
      index: true
    },
    // Tracks the lifecycle of the source listing (active → sold/archived)
    listingStatus: {
      type: String,
      enum: ['active', 'sold', 'archived', 'manual'],
      default: 'manual'
    },
    soldAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient filtering
marketPriceSchema.index({ make: 1, model: 1, year: 1 });
marketPriceSchema.index({ condition: 1 });
marketPriceSchema.index({ recordedDate: -1 });
marketPriceSchema.index({ price: 1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

export default MarketPrice;
