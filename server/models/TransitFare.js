// server/models/TransitFare.js
import mongoose from 'mongoose';

const TransitFareSchema = new mongoose.Schema({
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  routeType: {
    type: String,
    enum: ['Bus', 'Taxi', 'Shuttle', 'Train', 'Combi', 'Other'],
    default: 'Bus'
  },
  provider: { type: String, trim: true, default: '' },
  standardFare: { type: Number, required: true, min: 0 },
  childFare: { type: Number, default: null },
  seniorFare: { type: Number, default: null },
  studentFare: { type: Number, default: null },
  currency: { type: String, default: 'BWP' },
  notes: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

TransitFareSchema.index({ origin: 1, destination: 1, routeType: 1 });

export default mongoose.model('TransitFare', TransitFareSchema);
