// server/routes/transitFareRoutes.js
import express from 'express';
import TransitFare from '../models/TransitFare.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../middleware/async.js';

const router = express.Router();

// GET all fares (public) — supports ?origin=&destination=&routeType= filters
router.get('/', asyncHandler(async (req, res) => {
  const query = { active: true };
  if (req.query.origin) query.origin = { $regex: req.query.origin, $options: 'i' };
  if (req.query.destination) query.destination = { $regex: req.query.destination, $options: 'i' };
  if (req.query.routeType) query.routeType = req.query.routeType;

  const fares = await TransitFare.find(query).sort({ origin: 1, destination: 1 });
  res.status(200).json({ success: true, data: fares });
}));

// Admin: GET all (including inactive)
router.get('/all', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const fares = await TransitFare.find().sort({ updatedAt: -1 });
  res.status(200).json({ success: true, data: fares });
}));

// Admin: CREATE
router.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const fare = await TransitFare.create(req.body);
  res.status(201).json({ success: true, data: fare });
}));

// Admin: UPDATE
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const fare = await TransitFare.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  if (!fare) return res.status(404).json({ success: false, message: 'Fare not found' });
  res.status(200).json({ success: true, data: fare });
}));

// Admin: DELETE
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const fare = await TransitFare.findByIdAndDelete(req.params.id);
  if (!fare) return res.status(404).json({ success: false, message: 'Fare not found' });
  res.status(200).json({ success: true, data: {} });
}));

export default router;
