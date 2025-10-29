import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  articleCount: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    maxlength: [50, 'Tag name cannot exceed 50 characters'],
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#6B7280', // Default gray color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  articleCount: {
    type: Number,
    default: 0
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
TagSchema.index({ userId: 1, name: 1 });
TagSchema.index({ slug: 1 });

// Pre-save middleware to generate slug with proper TypeScript typing
TagSchema.pre<ITag>('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

export default mongoose.model<ITag>('Tag', TagSchema);