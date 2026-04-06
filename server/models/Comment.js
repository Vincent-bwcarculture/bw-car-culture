// server/models/Comment.js
import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: null },
  text: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: null },
  text: { type: String, required: true, maxlength: 2000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [ReplySchema]
}, { timestamps: true });

CommentSchema.index({ articleId: 1, createdAt: -1 });

export default mongoose.model('Comment', CommentSchema);
