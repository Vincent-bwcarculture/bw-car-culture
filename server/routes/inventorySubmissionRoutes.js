// server/routes/inventorySubmissionRoutes.js
// User inventory submission flow — mirrors the car listing submission flow.
// Private sellers and dealerships both supported; admin reviews before going live.

import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ── Inline schema (no separate model file needed for now) ──────────────────
const inventorySubmissionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, default: '' },
  userEmail: { type: String, default: '' },

  listingData: {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    category:    { type: String, required: true },
    price:       { type: Number, required: true },
    condition:   { type: String, default: 'Used' },
    quantity:    { type: Number, default: 1 },
    images:      { type: [mongoose.Schema.Types.Mixed], default: [] },
    specifications: { type: Object, default: {} },
    contact: {
      phone:    { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email:    { type: String, default: '' }
    },
    location: {
      city:    { type: String, default: '' },
      country: { type: String, default: 'Botswana' }
    },
    sellerType:  { type: String, enum: ['private', 'dealership'], default: 'private' },
    dealerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null }
  },

  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected', 'listing_created'],
    default: 'pending_review'
  },

  adminReview: {
    action:       { type: String },
    adminNotes:   { type: String },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:   { type: Date },
    listingId:    { type: mongoose.Schema.Types.ObjectId }
  },

  submittedAt: { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
}, { timestamps: false });

// Lazy model registration (avoids OverwriteModelError on hot-reload)
const getModel = () => {
  if (mongoose.models.InventorySubmission) return mongoose.models.InventorySubmission;
  return mongoose.model('InventorySubmission', inventorySubmissionSchema);
};

const getInventoryItemModel = async () => {
  if (mongoose.models.InventoryItem) return mongoose.models.InventoryItem;
  const mod = await import('../models/InventoryItem.js');
  return mod.default;
};

// ── USER ROUTES (require auth) ─────────────────────────────────────────────

// POST /api/inventory-submissions  — create a new submission
router.post('/', protect, async (req, res) => {
  try {
    const InventorySubmission = getModel();
    const { listingData } = req.body;

    if (!listingData?.title || !listingData?.category || !listingData?.price) {
      return res.status(400).json({ success: false, message: 'Title, category and price are required' });
    }

    const submission = await InventorySubmission.create({
      userId:    req.user._id || req.user.id,
      userName:  req.user.name || req.user.email || '',
      userEmail: req.user.email || '',
      listingData,
      submittedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Inventory submission received — pending admin review.',
      data: submission
    });
  } catch (err) {
    console.error('Inventory submission create error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// GET /api/inventory-submissions  — get current user's submissions
router.get('/', protect, async (req, res) => {
  try {
    const InventorySubmission = getModel();
    const userId = req.user._id || req.user.id;
    const submissions = await InventorySubmission.find({ userId })
      .sort({ submittedAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    console.error('Inventory submission fetch error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// PUT /api/inventory-submissions/:id  — edit own pending submission
router.put('/:id', protect, async (req, res) => {
  try {
    const InventorySubmission = getModel();
    const userId = req.user._id || req.user.id;
    const sub = await InventorySubmission.findOne({ _id: req.params.id, userId });
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (sub.status !== 'pending_review') {
      return res.status(400).json({ success: false, message: 'Only pending submissions can be edited' });
    }
    sub.listingData = { ...sub.listingData, ...req.body.listingData };
    sub.updatedAt = new Date();
    await sub.save();
    return res.status(200).json({ success: true, data: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ── ADMIN ROUTES ───────────────────────────────────────────────────────────

// GET /api/inventory-submissions/admin/all  — all submissions
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const InventorySubmission = getModel();
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const submissions = await InventorySubmission.find(filter)
      .sort({ submittedAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// PUT /api/inventory-submissions/admin/:id/review  — approve or reject
router.put('/admin/:id/review', protect, authorize('admin'), async (req, res) => {
  try {
    const InventorySubmission = getModel();
    const { action, adminNotes } = req.body;

    if (!['approve', 'reject', 'restore'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve, reject, or restore' });
    }

    const sub = await InventorySubmission.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    if (action === 'restore') {
      sub.status = 'pending_review';
      sub.adminReview = null;
      sub.updatedAt = new Date();
      await sub.save();
      return res.status(200).json({ success: true, message: 'Submission restored to pending review', data: sub });
    }

    if (action === 'reject') {
      sub.status = 'rejected';
      sub.adminReview = { action, adminNotes, reviewedBy: req.user._id, reviewedAt: new Date() };
      sub.updatedAt = new Date();
      await sub.save();
      return res.status(200).json({ success: true, message: 'Submission rejected', data: sub });
    }

    // APPROVE — create live InventoryItem
    const ld = sub.listingData;
    const InventoryItem = await getInventoryItemModel();

    const newItem = await InventoryItem.create({
      title:       ld.title,
      description: ld.description || '',
      category:    ld.category,
      price:       ld.price,
      condition:   ld.condition || 'Used',
      images:      ld.images || [],
      specifications: ld.specifications || {},
      stock: { quantity: ld.quantity ?? 1 },
      contact:     ld.contact,
      location:    ld.location,
      sellerType:  ld.sellerType || 'private',
      userId:      sub.userId,
      dealerId:    ld.dealerId || null,
      // businessId is not required for private sellers — left null
      businessId:  ld.dealerId || null,
      businessType: ld.sellerType === 'dealership' ? 'dealer' : null,
      status:      'active',
      submissionId: sub._id,
      createdAt:   new Date()
    });

    sub.status = 'listing_created';
    sub.adminReview = { action, adminNotes, reviewedBy: req.user._id, reviewedAt: new Date(), listingId: newItem._id };
    sub.updatedAt = new Date();
    await sub.save();

    return res.status(200).json({
      success: true,
      message: 'Submission approved and listing created',
      data: sub,
      listingId: newItem._id
    });
  } catch (err) {
    console.error('Inventory submission review error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

export default router;
