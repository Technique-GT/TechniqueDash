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
  publishedAt?: Date;
  slug?: string; // ✅ optional now
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    required: true
  }],
  authors: [{
    type: String,
    required: [true, 'At least one author is required']
  }],
  featuredMedia: {
    id: {
      type: String,
      required: [true, 'Featured media ID is required']
    },
    url: {
      type: String,
      required: [true, 'Featured media URL is required']
    },
    alt: {
      type: String,
      default: ''
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  slug: {
    type: String,
    required: false, // ✅ made optional
    unique: true
  },
  views: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  }
}, {
  timestamps: true
});

// Automatically set publishedAt if publishing for the first time
ArticleSchema.pre('save', function (next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
