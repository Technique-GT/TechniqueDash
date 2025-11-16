import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  excerpt: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  authors: mongoose.Types.ObjectId[];
  featuredMedia: {
    id: string;
    url: string;
    alt?: string;
  };
  isPublished: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  status?: string;
  allowComments?: boolean;
  publishedAt?: Date;
  slug?: string;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  excerpt: { type: String, required: true, maxlength: 300 },
  
  // ✅ Changed from String to ObjectId with ref
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    required: true 
  },
  subcategory: { 
    type: Schema.Types.ObjectId, 
    ref: 'SubCategory'
  },
  tags: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Tag',
    required: true 
  }],
  authors: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }],

  // Unified media representation
  featuredMedia: {
    id: { type: String },
    url: { type: String },
    alt: { type: String, default: '' }
  },

  // Legacy support for "featuredImage"
  featuredImage: {
    type: Schema.Types.Mixed,
    required: false
  },

  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isSticky: { type: Boolean, default: false },
  status: { type: String, default: 'draft' },
  allowComments: { type: Boolean, default: true },

  publishedAt: { type: Date },
  slug: { type: String, unique: true, sparse: true },
  views: { type: Number, default: 0 },

  // Legacy support for "viewCount"
  viewCount: { type: Number, default: 0 },

  seoTitle: { type: String, maxlength: 60 },
  seoDescription: { type: String, maxlength: 160 }
}, {
  timestamps: true
});

// Compound indexes for better query performance
ArticleSchema.index({ isPublished: 1, isFeatured: 1, isSticky: -1, publishedAt: -1 });
ArticleSchema.index({ isPublished: 1, isSticky: -1, publishedAt: -1 });
ArticleSchema.index({ category: 1, isPublished: 1 });

// Normalize data before saving
ArticleSchema.pre('save', function (next) {
  // Convert legacy "status" → "isPublished"
  if ((this as any).status === 'published') {
    (this as any).isPublished = true;
  }

  // Convert legacy "viewCount" → "views"
  if ((this as any).viewCount && !(this as any).views) {
    (this as any).views = (this as any).viewCount;
  }

  // Set publishedAt if publishing for first time
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Ensure only published articles can be featured or sticky
  if ((this.isModified('isFeatured') || this.isModified('isSticky')) && !this.isPublished) {
    (this as any).isFeatured = false;
    (this as any).isSticky = false;
  }

  next();
});

export default mongoose.model<IArticle>('Article', ArticleSchema);