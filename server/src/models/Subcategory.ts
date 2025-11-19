import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  category: mongoose.Types.ObjectId; // Parent category
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Sub-category name is required'],
    trim: true,
    maxlength: [50, 'Sub-category name cannot exceed 50 characters']
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
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Parent category is required']
  }
}, {
  timestamps: true
});

// Indexes for better performance
// slug already has a unique index via field definition
SubCategorySchema.index({ isActive: 1 });
SubCategorySchema.index({ category: 1 });

// Pre-save middleware to generate slug
SubCategorySchema.pre<ISubCategory>('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

export default mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
