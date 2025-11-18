import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  article: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId;
  isApproved: boolean;
  isSpam: boolean;
  isEdited?: boolean;
  likes: number;
  dislikes: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
    index: true
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
CommentSchema.index({ article: 1, isApproved: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ author: 1 });

// Virtual for reply count
CommentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Virtual for status (computed from isApproved and isSpam)
CommentSchema.virtual('status').get(function() {
  if (this.isSpam) return 'spam';
  if (this.isApproved) return 'approved';
  return 'pending';
});

// Ensure virtual fields are serialized
CommentSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IComment>('Comment', CommentSchema);