// server/controllers/notificationController.js
import Notification from '../models/Notification.js';
import asyncHandler from '../middleware/async.js';

/**
 * GET /api/notifications
 * Auth required — get current user's notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: req.user._id, read: false })
  ]);

  res.status(200).json({ success: true, data: notifications, unreadCount });
});

/**
 * PUT /api/notifications/:id/read
 */
export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.status(200).json({ success: true });
});

/**
 * PUT /api/notifications/read-all
 */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.status(200).json({ success: true });
});

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.status(200).json({ success: true });
});
