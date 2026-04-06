// server/controllers/commentController.js
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import News from '../models/News.js';
import asyncHandler from '../middleware/async.js';
import { ErrorResponse } from '../utils/errorResponse.js';

// Helper to create a notification safely
const notify = async (data) => {
  try {
    // Don't notify yourself
    if (data.actor && data.recipient && data.actor.toString() === data.recipient.toString()) return;
    if (!data.recipient) return;
    await Notification.create(data);
  } catch (_) {}
};

/**
 * GET /api/comments/:articleId
 * Public — get all comments for an article
 */
export const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ articleId: req.params.articleId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: comments });
});

/**
 * POST /api/comments/:articleId
 * Auth optional — post a comment
 */
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  const article = await News.findById(req.params.articleId).select('title author').lean();
  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  const comment = await Comment.create({
    articleId: req.params.articleId,
    author: req.user?._id || null,
    authorName: req.user?.name || req.body.authorName || 'Anonymous',
    authorAvatar: req.user?.avatar?.url || null,
    text: text.trim()
  });

  // Notify article author if they are a different user
  if (article.author) {
    await notify({
      recipient: article.author,
      type: 'new_comment',
      actor: req.user?._id || null,
      actorName: comment.authorName,
      articleId: article._id,
      articleTitle: article.title,
      commentId: comment._id,
      preview: text.trim().substring(0, 100)
    });
  }

  res.status(201).json({ success: true, data: comment });
});

/**
 * PUT /api/comments/:commentId/like
 * Auth required — toggle like on a comment
 */
export const likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  const userId = req.user._id;
  const alreadyLiked = comment.likes.some(id => id.toString() === userId.toString());

  if (alreadyLiked) {
    comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
  } else {
    comment.likes.push(userId);
    // Notify comment author
    await notify({
      recipient: comment.author,
      type: 'comment_liked',
      actor: userId,
      actorName: req.user.name,
      articleId: comment.articleId,
      commentId: comment._id,
      preview: comment.text.substring(0, 100)
    });
  }

  await comment.save();
  res.status(200).json({ success: true, data: { likes: comment.likes } });
});

/**
 * POST /api/comments/:commentId/reply
 * Auth optional — reply to a comment
 */
export const addReply = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Reply text is required' });
  }

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  const reply = {
    author: req.user?._id || null,
    authorName: req.user?.name || req.body.authorName || 'Anonymous',
    authorAvatar: req.user?.avatar?.url || null,
    text: text.trim(),
    likes: []
  };

  comment.replies.push(reply);
  await comment.save();

  const savedReply = comment.replies[comment.replies.length - 1];

  // Notify the comment author about the reply
  await notify({
    recipient: comment.author,
    type: 'comment_reply',
    actor: req.user?._id || null,
    actorName: reply.authorName,
    articleId: comment.articleId,
    commentId: comment._id,
    preview: text.trim().substring(0, 100)
  });

  res.status(201).json({ success: true, data: savedReply });
});

/**
 * PUT /api/comments/:commentId/reply/:replyId/like
 * Auth required — toggle like on a reply
 */
export const likeReply = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  const reply = comment.replies.id(req.params.replyId);
  if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

  const userId = req.user._id;
  const alreadyLiked = reply.likes.some(id => id.toString() === userId.toString());

  if (alreadyLiked) {
    reply.likes = reply.likes.filter(id => id.toString() !== userId.toString());
  } else {
    reply.likes.push(userId);
  }

  await comment.save();
  res.status(200).json({ success: true, data: { likes: reply.likes } });
});

/**
 * DELETE /api/comments/:commentId
 * Auth required — delete own comment or admin
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  const isOwner = req.user && comment.author && comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await comment.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
