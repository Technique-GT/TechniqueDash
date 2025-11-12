import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  tags: string[];
  authors: string[];
  featuredMedia: {
    id: string;
    url: string;
    alt?: string;
  };
  isPublished: boolean;
  status?: string; // legacy
  allowComments?: boolean; // legacy
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
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  tags: [{ type: String, required: true }],
  authors: [{ type: String, required: true }],

  // ✅ unified media representation
  featuredMedia: {
    id: { type: String },
    url: { type: String },
    alt: { type: String, default: '' }
  },

  // ✅ legacy support for “featuredImage”
  featuredImage: {
    type: Schema.Types.Mixed,
    required: false
  },

  isPublished: { type: Boolean, default: false },
  status: { type: String, default: 'draft' }, // legacy
  allowComments: { type: Boolean, default: true }, // legacy

  publishedAt: { type: Date },
  slug: { type: String, unique: true, sparse: true },
  views: { type: Number, default: 0 },

  // ✅ legacy support for “viewCount”
  viewCount: { type: Number, default: 0 },

  seoTitle: { type: String, maxlength: 60 },
  seoDescription: { type: String, maxlength: 160 }
}, {
  timestamps: true
});

// ✅ Normalize data before saving
ArticleSchema.pre('save', function (next) {
  // Convert legacy “status” → “isPublished”
  if ((this as any).status === 'published') {
    (this as any).isPublished = true;
  }

  // Convert legacy “viewCount” → “views”
  if ((this as any).viewCount && !(this as any).views) {
    (this as any).views = (this as any).viewCount;
  }

  // Set publishedAt if publishing for first time
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
