// server/models/Notification.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['comment_liked', 'comment_reply', 'new_comment', 'article_liked'],
    required: true
  },
  // Who triggered this notification
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actorName: { type: String, default: 'Someone' },
  // Reference to the article
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', default: null },
  articleTitle: { type: String, default: '' },
  // Reference to the comment
  commentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  // Snippet of the comment/reply text
  preview: { type: String, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
