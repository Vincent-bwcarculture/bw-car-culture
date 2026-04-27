// server/controllers/businessUpdateController.js
import asyncHandler from 'express-async-handler';
import BusinessUpdate from '../models/BusinessUpdate.js';
import Dealer from '../models/Dealer.js';

// Helper: resolve business document and check ownership
async function resolveOwnership(businessId, businessType, user) {
  if (businessType === 'dealer') {
    const dealer = await Dealer.findById(businessId);
    if (!dealer) return { doc: null, isOwner: false };
    const isOwner = user.role === 'admin' || String(dealer.user) === String(user._id);
    return { doc: dealer, isOwner };
  }
  // future: service providers
  return { doc: null, isOwner: false };
}

// @desc  Get updates for a business
// @route GET /api/updates?businessId=&businessType=&limit=
// @access Public
export const getUpdates = asyncHandler(async (req, res) => {
  const { businessId, businessType, limit = 10 } = req.query;

  if (!businessId || !businessType) {
    return res.status(400).json({ success: false, message: 'businessId and businessType are required' });
  }

  const now = new Date();
  const updates = await BusinessUpdate.find({
    businessId,
    businessType,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
  })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: updates });
});

// @desc  Create a business update
// @route POST /api/updates
// @access Private (owner / admin)
export const createUpdate = asyncHandler(async (req, res) => {
  const { businessId, businessType, title, content, type, pinned, expiresAt } = req.body;

  if (!businessId || !businessType) {
    return res.status(400).json({ success: false, message: 'businessId and businessType are required' });
  }

  const { doc, isOwner } = await resolveOwnership(businessId, businessType, req.user);
  if (!doc) return res.status(404).json({ success: false, message: 'Business not found' });
  if (!isOwner) return res.status(403).json({ success: false, message: 'Not authorised' });

  const update = await BusinessUpdate.create({
    businessId,
    businessType,
    title,
    content,
    type: type || 'update',
    pinned: pinned || false,
    expiresAt: expiresAt || null,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: update });
});

// @desc  Delete a business update
// @route DELETE /api/updates/:id
// @access Private (owner / admin)
export const deleteUpdate = asyncHandler(async (req, res) => {
  const update = await BusinessUpdate.findById(req.params.id);
  if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

  const { isOwner } = await resolveOwnership(update.businessId, update.businessType, req.user);
  if (!isOwner) return res.status(403).json({ success: false, message: 'Not authorised' });

  await update.deleteOne();
  res.json({ success: true, message: 'Update deleted' });
});

// @desc  Toggle pinned status
// @route PUT /api/updates/:id/pin
// @access Private (owner / admin)
export const togglePin = asyncHandler(async (req, res) => {
  const update = await BusinessUpdate.findById(req.params.id);
  if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

  const { isOwner } = await resolveOwnership(update.businessId, update.businessType, req.user);
  if (!isOwner) return res.status(403).json({ success: false, message: 'Not authorised' });

  update.pinned = !update.pinned;
  await update.save();
  res.json({ success: true, data: update });
});
