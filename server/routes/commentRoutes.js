// server/routes/commentRoutes.js
import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  getComments,
  addComment,
  likeComment,
  addReply,
  likeReply,
  deleteComment
} from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

// GET all comments for an article — public
router.get('/:articleId', getComments);

// POST a new comment — auth optional (guests can comment with name)
router.post('/:articleId', optionalAuth, addComment);

// Like/unlike a comment — auth required
router.put('/:commentId/like', protect, likeComment);

// Reply to a comment — auth optional
router.post('/:commentId/reply', optionalAuth, addReply);

// Like a reply — auth required
router.put('/:commentId/reply/:replyId/like', protect, likeReply);

// Delete a comment — auth required
router.delete('/:commentId', protect, deleteComment);

export default router;
